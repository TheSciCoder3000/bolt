import { Server } from "socket.io";
import { SessionSocket } from ".";
import { z } from "zod";
import { addTaskDb, deleteTaskDb, updateTaskDb } from "../model/Task.model/helper";
import { EntityManager } from "typeorm";
import Task from "../model/Task.model";
import { PgTransaction } from "../model/setup";


const FetchDataConstraint = z.object({
    operator: z.union([z.literal("="), z.literal("<"), z.literal(">")]),
    isCompleted: z.boolean(),
    date: z.string()
})
type Category = z.infer<typeof FetchDataConstraint>

// helper function
const prefectchTaskData = (dbClient: EntityManager, userId: string, category: Category) => {
    return dbClient.getRepository(Task)
        .find({
            where: {
                user: {id: userId},
                duedate: category.date,
                completed: category.isCompleted
            },
            order: {
                duedate: "ASC",
                duetime: "ASC",
                task_order: "ASC",
                completed_order: "ASC"
            }
        })

}

// ========================= Sockets ========================= 

/**
 * returns a `listener` function for fetching tasks
 * @param {Socket} socket
 */
const fetchSocketTask = (socket: SessionSocket) => async (category: unknown) => {
    try {
        const parsedCategory = FetchDataConstraint.parse(category)
        await PgTransaction(async (entityManager) => {
            const taskData = await prefectchTaskData(
                entityManager, 
                socket.request.session.passport.user,
                parsedCategory
            )
            socket.emit(`receive-tasks-${parsedCategory.date}-${parsedCategory.isCompleted.toString()}`, taskData);
        })
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

    await PgTransaction(async entityManager => {
        const data = SocketAddDataConstraint.parse(unknownData);
        const order_string = data.isCompleted ? "completed_order" : "task_order"

        const { id: taskId } = await addTaskDb(
            entityManager,
            userId,
            {
                name: data.preData?.name || "",
                duedate: data.duedate,
                completed: data.isCompleted ? true : (data.preData?.completed || false)
            },
            order_string,
            data.task_order
        )

        const taskData = await prefectchTaskData(entityManager, userId, data.category)
        socket.emit(`receive-tasks-${data.category.date}-${data.category.isCompleted.toString()}`, taskData, taskId);
    }).catch(e => {
        console.log("Insert task error")
        console.log(e)
    })
}

const deleteSocketTask = (socket: SessionSocket) => async (unkownData: unknown) => {
    const userId = socket.request.session.passport.user;

    await PgTransaction(async entityManager => {
        const data = SocketDeleteDataConstraint.parse(unkownData);
        await deleteTaskDb(entityManager, userId, data.id);

        const taskData = await prefectchTaskData(entityManager, userId, data.category)
        socket.emit(`receive-tasks-${data.category.date}-${data.category.isCompleted.toString()}`, taskData, data.id);
    }).catch(e => {
        console.log("delete task error")
        console.log(e)
    })
}

const updateSocketTask = (socket: SessionSocket) => async (unknownData: unknown) => {
    const userId = socket.request.session.passport.user;

    await PgTransaction(async entityManager => {
        const data = SocketUpdateConstraint.parse(unknownData);
        const pastData = await updateTaskDb(
            entityManager, 
            userId, 
            data.id, 
            { name: data.name, completed: data.completed, duedate: data.category.date}
        )

        if (pastData.completed != data.completed) {
            const taskData1 = await prefectchTaskData(entityManager, userId, { ...data.category, isCompleted: data.completed })
            socket.emit(`receive-tasks-${data.category.date}-${data.completed.toString()}`, taskData1);

            const taskData2 = await prefectchTaskData(entityManager, userId, data.category)
            socket.emit(`receive-tasks-${data.category.date}-${data.category.isCompleted.toString()}`, taskData2);
        }
    }).catch(e => {
        console.log("udpate task error");
        console.log(e);
    })
}

export default (io: Server, socket: SessionSocket) => {
    socket.on('fetch-tasks', fetchSocketTask(socket));
    socket.on("create-task", createSocketTask(socket));
    socket.on("delete-task", deleteSocketTask(socket));
    socket.on("update-task", updateSocketTask(socket));
}