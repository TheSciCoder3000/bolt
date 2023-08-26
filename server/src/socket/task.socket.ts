import { PoolClient, Pool } from "pg";
import db from "../model";
import format from "pg-format";
import { Server } from "socket.io";
import { SessionSocket } from ".";
import { z } from "zod";
import { addTaskDb, deleteTaskDb, updateTaskDb } from "../model/task.db";


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
        socket.emit(`receive-tasks-${parsedCategory.date}-${parsedCategory.isCompleted.toString()}`, taskData);
    } catch (e) {
        console.log("\n\nfetch error")
        console.error(e);
    }
}

const BasicTaskConstraint = z.object({
    name: z.string(),
    completed: z.boolean()
})

const SocketAddDataConstraint = z.object({
    task_order: z.number().nullable(),                      // task target position
    duedate: z.string(),                                    // date the task is assigned
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

        // choose what order to update
        const order_string = data.isCompleted ? "completed_order" : "task_order"

        const { id: taskId } = await addTaskDb(
            client,
            userId,
            {
                name: data.preData?.name || "",
                duedate: data.duedate,
                completed: data.isCompleted ? true : (data.preData?.completed || false)
            },
            order_string,
            data.task_order
        )
        
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

        await deleteTaskDb(client, userId, data.id)

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

        const pastData = await updateTaskDb(
            client, 
            userId, 
            data.id, 
            { name: data.name, completed: data.completed, duedate: data.category.date}
        )

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
    socket.on("create-task", createSocketTask(socket));
    socket.on("delete-task", deleteSocketTask(socket));
    socket.on("update-task", updateSocketTask(socket));
}