import { PoolClient, Pool } from "pg";
import db from "../model";
import format from "pg-format";
import { Server } from "socket.io";
import { SessionSocket } from ".";
import { z } from "zod";


const FetchDataConstraint = z.object({
    operator: z.union([z.literal("="), z.literal("<"), z.literal(">")]),
    isCompleted: z.boolean(),
    date: z.string()
})
type Category = z.infer<typeof FetchDataConstraint>

// helper function
const prefectchTaskData = (dbClient: typeof db | PoolClient, userId: string, category: Category) => {
    const sql =  format(
        "SELECT * FROM task WHERE user_id = $1 AND duedate %s $2 AND completed = $3 ORDER BY duedate, duetime, task_order, completed_order;",
        category.operator

    )
    
    return dbClient.query(sql, [userId, category.date, category.isCompleted]).then(result => result.rows.map(item => ({ ...item, task_order: parseInt(item.task_order) })))
}

// ========================= Sockets ========================= 

/**
 * returns a `listener` function for fetching tasks
 * @param {Socket} socket
 */
const fetchSocketTask = (socket: SessionSocket) => async (category: unknown) => {
    try {
        const parsedCategory = FetchDataConstraint.parse(category)
        const taskData = await prefectchTaskData(
            db, 
            socket.request.session.passport.user,
            parsedCategory
        )
            .catch(err => console.log(err));
        console.log(taskData)
        socket.emit(`receive-tasks-${parsedCategory.date}-${parsedCategory.isCompleted.toString()}`, taskData);
    } catch (e) {
        console.log("\n\nfetch error")
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

const BasicTaskConstraint = z.object({
    name: z.string(),
    completed: z.boolean()
})

const SocketAddDataConstraint = z.object({
    task_order: z.number().nullable(),                      // task target position
    duedate: z.coerce.date(),                                    // date the task is assigned
    preData: BasicTaskConstraint.nullable().optional(),     // data when task is created
    category: FetchDataConstraint,                          // used to filter the task after the operation finishes
    isCompleted: z.boolean()
})


const SocketDeleteDataConstraint = z.object({
    id: z.string(),
    duedate: z.coerce.date(),                                    // date the task is assigned
    task_order: z.number(),                                 // task position
    category: FetchDataConstraint
})

const SocketUpdateConstraint = z.object({
    id: z.string(),
    name: z.string(),
    completed: z.boolean(),
    category: FetchDataConstraint
})


const createSocketTask = (socket: SessionSocket) => async (unknownData: unknown) => {
    const userId = socket.request.session.passport.user
    const client = await db.getClient();

    
    try {
        await client.query("BEGIN");

        const data = SocketAddDataConstraint.parse(unknownData);
        console.log(data)

        const order_string = data.isCompleted ? "completed_order" : "task_order"
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
            await client.query(sql, [userId, data.task_order, data.duedate])
        }

        const task_orderFormat = format("SELECT MAX(%s) as max FROM task WHERE user_id = $1 AND duedate = $2;", order_string)
        const task_order = data.task_order || 
            await client.query(task_orderFormat, [userId, data.duedate])
                .then(res => res.rows[0].max === null ? 0 : (res.rows[0].max + 1));

        const taskId = await client.query(
            format(`INSERT INTO task(name, completed, user_id, duedate, details, subject_id, parent_id, tags, %s) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning id;`, order_string), 
            [
                data.preData?.name || "", 
                data.isCompleted ? true : (data.preData?.completed || false),
                userId,
                data.duedate,
                null,
                null,
                null,
                null,
                task_order,
            ]
        ).then(res => res.rows[0].id)

        


        await client.query("COMMIT")

        const taskData = await prefectchTaskData(client, userId, data.category)
        socket.emit(`receive-tasks-${data.category.date}-${data.category.isCompleted.toString()}`, taskData, taskId);
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

        const order_string = data.category.isCompleted ? "completed_order" : "task_order"
        const sql = format(
            `UPDATE task SET %s = %s - 1 
                WHERE user_id = $1 AND 
                      %s >= $2 AND
                      duedate = $3;`, 
            order_string, 
            order_string,
            order_string
        );
        await client.query(sql, [userId, data.task_order, data.duedate])

        await client.query("COMMIT")

        const taskData = await prefectchTaskData(client, userId, data.category)

        socket.emit(`receive-tasks-${data.category.date}-${data.category.isCompleted.toString()}`, taskData, data.id);
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

        // fetch task past data
        const pastData = await client.query(
            "SELECT * FROM task WHERE user_id = $1 AND id = $2;",
            [userId, data.id]
        ).then(res => res.rows[0])

        // if toggle task completed
        if (pastData.completed != data.completed) {
            // get the last value of task_order/completed_order
            const { max_order, completed_order } = await client.query(
                "SELECT MAX(task_order) as max_order, MAX(completed_order) as max_completed FROM task WHERE user_id = $1 AND duedate = $2;",
                [userId, pastData.duedate]
            ).then(res => ({
                max_order: res.rows[0].max_order === null ? 0 : res.rows[0].max_order + 1,
                completed_order: res.rows[0].max_completed === null ? 0 : res.rows[0].max_completed + 1
            }));

            // create an update order sql string
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
                          duedate = $3 returning id, name, duedate, task_order, completed_order;`, 
                order_string, 
                order_string,
                order_string
            );
            await client.query(sqlUpdate, [userId, pastData[order_string], data.category.date])
                .then(res => console.log(res.rows))
            
        } else {
            await client.query(
                "UPDATE task SET name = $1, completed = $2 WHERE user_id = $3 AND id = $4;",
                [data.name, data.completed, userId, data.id]
            )
        }

        await client.query("COMMIT")

        if (pastData.completed != data.completed) {
            const taskData1 = await prefectchTaskData(client, userId, { ...data.category, isCompleted: data.completed })
            socket.emit(`receive-tasks-${data.category.date}-${data.completed.toString()}`, taskData1);

            const taskData2 = await prefectchTaskData(client, userId, data.category)
            socket.emit(`receive-tasks-${data.category.date}-${data.category.isCompleted.toString()}`, taskData2);
        }

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