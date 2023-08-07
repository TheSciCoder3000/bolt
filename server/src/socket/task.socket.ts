import { PoolClient, Pool } from "pg";
import db from "../model";
import format from "pg-format";
import { Server } from "socket.io";
import { SessionSocket } from ".";
import { z } from "zod";

// helper function
const prefectchTaskData = (dbClient: typeof db | PoolClient, userId: string, dateRange: string[]) => {
    const sql = dateRange.length > 1 ?
        "SELECT * FROM task WHERE user_id = $1 AND completed = false AND duedate BETWEEN $2 AND $3 ORDER BY duedate, duetime, task_order;" :
        "SELECT * FROM task WHERE user_id = $1 AND duedate < $2 AND completed = false ORDER BY duedate, duetime, task_order;"
    
    return dbClient.query(sql, [userId, ...dateRange]).then(result => result.rows.map(item => ({ ...item, task_order: parseInt(item.task_order) })))
}

// ========================= Sockets ========================= 

/**
 * returns a `listener` function for fetching tasks
 * @param {Socket} socket
 */
const fetchSocketTask = (socket: SessionSocket) => async (dateRange: unknown) => {
    try {
        const DateRangeConstraint = z.string().array();
        const parsedDateRange = DateRangeConstraint.parse(dateRange)
        const taskData = await prefectchTaskData(
            db, 
            socket.request.session.passport.user,
            parsedDateRange
        )
            .catch(err => console.log(err));
        socket.emit("receive-tasks", taskData);
    } catch (e) {
        console.error(e);
    }
}



const fetchSocketCompleteTask = (socket: SessionSocket) => async () => {
    const userId = socket.request.session.passport.user
    const tasks = await db.query(
        "SELECT * FROM task WHERE user_id = $1 AND completed = true ORDER BY completed_order;",
        [userId]
    ).then(res => res.rows)

    socket.emit("receive-tasks", tasks);

}


interface SampleData {
    task_order: number;
    duedate: string;
    affected: string[];
    preData: null | { name: string, completed: boolean };
    dateRange: string[];
    id: string;
    name: string;
    completed: boolean;
}

const BasicTaskConstraint = z.object({
    name: z.string(),
    completed: z.boolean()
})

const SocketAddDataConstraint = z.object({
    task_order: z.number().nullable(),                      // task target position
    duedate: z.string(),                                    // date the task is assigned
    preData: BasicTaskConstraint.nullable().optional(),     // data when task is created
    dateRange: z.string().array(),                          // used to filter the task after the operation finishes
})


const SocketDeleteDataConstraint = z.object({
    id: z.string(),
    completed: z.boolean(),
    duedate: z.string(),                                    // date the task is assigned
    task_order: z.number(),                                 // task position
    dateRange: z.string().array(),                          // used to filter the task after the operation finishes
})

const SocketUpdateConstraint = z.object({
    id: z.string(),
    name: z.string(),
    completed: z.boolean(),
})


const createSocketTask = (socket: SessionSocket) => async (unknownData: unknown) => {
    console.log("add task activated")
    const userId = socket.request.session.passport.user
    const client = await db.getClient();

    
    try {
        await client.query("BEGIN");

        const data = SocketAddDataConstraint.parse(unknownData);
        console.log(data)

        const order_string = (data.preData && data.preData.completed) || data.dateRange[0] === "completed" ? 
            "completed_order" : "task_order"
        if (data.task_order != null) {
            const sql = format(
                `UPDATE task SET %s = %s + 1 
                    WHERE user_id = $1 AND 
                          %s >= $2 AND
                          duedate = $3;`, 
                order_string, 
                order_string,
                order_string
            );
            await client.query(sql, [userId, data.task_order, `${data.duedate} 00:00:00.000000+00`])
        }

        const task_orderFormat = format("SELECT MAX(%s) as max FROM task WHERE user_id = $1 AND duedate = $2;", order_string)
        const task_order = data.task_order || 
            await client.query(task_orderFormat, [userId, `${data.duedate} 00:00:00.000000+00`])
                .then(res => res.rows[0].max === null ? 0 : (res.rows[0].max + 1));

        const taskId = await client.query(
            format(`INSERT INTO task(name, completed, user_id, duedate, details, subject_id, parent_id, tags, %s) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning id;`, order_string), 
            [
                data.preData?.name || "", 
                data.dateRange[0] === "completed" ? true : (data.preData?.completed || false),
                userId,
                `${data.duedate} 00:00:00.000000+00`,
                null,
                null,
                null,
                null,
                task_order,
            ]
        ).then(res => res.rows[0].id)

        


        await client.query("COMMIT")

        const taskData = data.dateRange[0] != "completed" ? await prefectchTaskData(client, userId, data.dateRange) :
                            await client.query("SELECT * FROM task WHERE user_id = $1 AND completed = true ORDER BY completed_order;", [userId])
                                .then(res => res.rows)
        socket.emit("receive-tasks", taskData, taskId);
    } catch (e) {
        await client.query("ROLLBACK");
        console.log("Insert task error")
        console.log(e)
    } finally {
        client.release();
    }
}


const deleteSocketTask = (socket: SessionSocket) => async (unkownData: unknown) => {
    const userId = socket.request.session.passport.user
    const client = await db.getClient();

    try {
        await client.query("BEGIN");

        const data = SocketDeleteDataConstraint.parse(unkownData);

        await client.query("DELETE FROM task WHERE id = $1 AND user_id = $2;", [data.id, userId])

        const order_string = data.completed ? "completed_order" : "task_order"
        const sql = format(
            `UPDATE task SET %s = %s - 1 
                WHERE user_id = $1 AND 
                      %s >= $2 AND
                      duedate = $3;`, 
            order_string, 
            order_string,
            order_string
        );
        await client.query(sql, [userId, data.task_order, `${data.duedate} 00:00:00.000000+00`])

        await client.query("COMMIT")

        const taskData = !data.completed ? await prefectchTaskData(client, userId, data.dateRange) :
                            await client.query("SELECT * FROM task WHERE user_id = $1 AND completed = true ORDER BY completed_order;", [userId])
                                .then(res => res.rows)

        socket.emit("receive-tasks", taskData, data.id, data.task_order-1);
    } catch (e) {
        await client.query("ROLLBACK")
        console.log("delete task error")
        console.log(e)
        throw e
    } finally {
        client.release()
    }
}

const updateSocketTask = (socket: SessionSocket) => async (unknownData: unknown) => {
    const userId = socket.request.session.passport.user
    const client = await db.getClient();

    try {
        await client.query("BEGIN");
        const data = SocketUpdateConstraint.parse(unknownData);

        const pastData = await client.query(
            "SELECT * FROM task WHERE user_id = $1 AND id = $2;",
            [userId, data.id]
        ).then(res => res.rows[0])

        if (pastData.completed != data.completed) {
            const { max_order, completed_order } = await client.query(
                "SELECT MAX(task_order) as max_order, MAX(completed_order) as max_completed FROM task WHERE user_id = $1 AND duedate = $2;",
                [userId, pastData.duedate]
            ).then(res => ({
                max_order: res.rows[0].max_order === null ? 0 : res.rows[0].max_order + 1,
                completed_order: res.rows[0].max_completed === null ? 0 : res.rows[0].max_completed + 1
            }));

            const dataOrder = data.completed ? format(", task_order = NULL, completed_order = %s", completed_order) :
                                format(", task_order = %s, completed_order = NULL", max_order);

            const sql = format(
                "UPDATE task SET name = $1, completed = $2%s WHERE user_id = $3 AND id = $4;",
                dataOrder
            )
            await client.query(sql, [data.name, data.completed, userId, data.id]);

            const order_string = data.completed ? "task_order" : "completed_order";

            const sqlUpdate = format(
                `UPDATE task SET %s = %s - 1
                    WHERE user_id = $1 AND 
                          %s >= $2 AND
                          duedate = $3;`, 
                order_string, 
                order_string,
                order_string
            );
            await client.query(sqlUpdate, [userId, pastData[order_string], `${pastData.duedate.toISOString().split("T")[0]} 00:00:00+00`])
            
        } else {
            await client.query(
                "UPDATE task SET name = $1, completed = $2 WHERE user_id = $3 AND id = $4;",
                [data.name, data.completed, userId, data.id]
            )
        }

        await client.query("COMMIT")

    } catch (e) {
        await client.query("ROLLBACK");
        console.log("udpate task error");
        console.log(e);
    } finally {
        client.release();
    }
}

export default (io: Server, socket: SessionSocket) => {
    socket.on('fetch-tasks', fetchSocketTask(socket));
    socket.on('fetch-completed-tasks', fetchSocketCompleteTask(socket));
    socket.on("create-task", createSocketTask(socket));
    socket.on("delete-task", deleteSocketTask(socket));
    socket.on("update-task", updateSocketTask(socket));
}