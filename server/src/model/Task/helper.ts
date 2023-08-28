import { EntityManager, MoreThanOrEqual } from 'typeorm';
import { Pool, PoolClient } from 'pg';
import format from "pg-format";
import Task from '.';
import User from '../User';

type MakeOptional<Type, Key extends keyof Type> = Omit<Type, Key> & Partial<Pick<Type, Key>>;
interface TaskData {
    name: string;
    duedate: string;
    completed: boolean;
}
// test
/**
 * 
 * @param client PoolClient from pg pool
 * @param userId authenticated user's id
 * @param data task data containing the name, duedate and completed
 * @param order_string which column will be filled in the db
 * @param pos use an int value to specify the position otherwise set as null to append to the end of the list
 */
export async function addTaskDb(client: EntityManager, userId: string, data: TaskData, order_string: "task_order" | "completed_order", pos: number | null) {
    // check data.completed and order_string if correct
    if (data.completed && order_string !== "completed_order") throw new Error("Invalid data.complete or order_string values")

    // create repo
    const taskRepo = client.getRepository(Task);
    const user = await client.getRepository(User).findOne({ where: { id: userId }})

    if (!user) throw new Error("user not found")

    // update the tasks of positions greater than the pos provided by the client
    if (pos !== null) {
        // const sql = format(
        //     `UPDATE task SET %s = %s + 1 
        //         WHERE user_id = $1 AND 
        //               %s >= $2 AND
        //               duedate = $3;`, 
        //     order_string, 
        //     order_string,
        //     order_string
        // );
        // await client.query(sql, [userId, pos, data.duedate])

        // typeORM counterpart
        await taskRepo
            .increment(
                {
                    user: { id: user.id },
                    ...(order_string === "task_order" && { task_order: MoreThanOrEqual(pos) }),
                    ...(order_string === "completed_order" && { completed_order: MoreThanOrEqual(pos) }),
                    duedate: data.duedate
                },
                order_string,
                1
            )
    // else update the pos if null
    } else {
        // const task_orderFormat = format("SELECT MAX(%s) as max FROM task WHERE user_id = $1 AND duedate = $2;", order_string)
        // pos = await client.query(task_orderFormat, [userId, data.duedate])
        //         .then(res => {
        //             console.log(res)
        //             return res[0].max === null ? 0 : (res[0].max + 1)
        //         }) as number;

        pos = await taskRepo
                .createQueryBuilder("task")
                .select((order_string == "task_order" ? "MAX(task_order)" : "MAX(completed_order)"), "max")
                .where("user_id = :userId", { userId })
                .andWhere("duedate = :duedate", { duedate: data.duedate })
                .getRawOne()
                .then(res => res.max === null ? 0 : res.max + 1) as number;
    }

    // insert the task to the database
    // const taskData = await client.query(
    //     format(`INSERT INTO task(name, completed, user_id, duedate, details, subject_id, parent_id, %s) 
    //         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) returning *;`, order_string), 
    //     [
    //         data.name, 
    //         data.completed,
    //         userId,
    //         data.duedate,
    //         null,
    //         null,
    //         null,
    //         pos,
    //     ]
    // ).then(res => res[0])

    const taskData = await taskRepo
        .insert({
            name: data.name,
            completed: data.completed,
            user: user,
            duedate: data.duedate,
            details: null,
            subject: null,
            parent: null,
            ...(order_string === "task_order" && { task_order: pos }),
            ...(order_string === "completed_order" && { completed_order: pos }),
        })
    

    return {
        id: taskData.identifiers[0].id as string
    }
}

/**
 * 
 * @param client PoolClient form pg pool
 * @param userId authenticated user's id
 * @param taskId id of the task to be updated
 * @param data task data containing the name, duedate and completed
 */
export async function updateTaskDb(client: EntityManager, userId: string, taskId: string, data: MakeOptional<TaskData, "duedate">) {
    // const pastData = await client.query(
    //     "SELECT * FROM task WHERE user_id = $1 AND id = $2;",
    //     [userId, taskId]
    // ).then(res => res.rows[0])

    const taskRepo = client.getRepository(Task);

    const pastData = await taskRepo.findOne({ where: { user: {id: userId}, id: taskId } });

    if (!pastData) throw new Error("task cannot be found")

    if (pastData.completed != data.completed) {
        // get the last value of task_order/completed_order
        // const { max_order, completed_order } = await client.query(
        //     "SELECT MAX(task_order) as max_order, MAX(completed_order) as max_completed FROM task WHERE user_id = $1 AND duedate = $2;",
        //     [userId, pastData.duedate]
        // ).then(res => ({
        //     max_order: res.rows[0].max_order === null ? 0 : res.rows[0].max_order + 1,
        //     completed_order: res.rows[0].max_completed === null ? 0 : res.rows[0].max_completed + 1
        // }));

        const { max_order, completed_order } = await taskRepo
            .createQueryBuilder("task")
            .select("MAX(task_order)", "max_order")
            .addSelect("MAX(completed_order)", "max_completed")
            .where("user_id = :userId", { userId })
            .andWhere("duedate = :duedate", { duedate: pastData.duedate })
            .getRawOne()
            .then(res => ({
                max_order: res.max_order === null ? 0 : res.max_order + 1,
                completed_order: res.max_completed === null ? 0 : res.max_completed + 1
            }));

        // create an update order sql string
        // const dataOrder = data.completed ? format(", task_order = NULL, completed_order = %s", completed_order) :
        //                     format(", task_order = %s, completed_order = NULL", max_order);

        // const sql = format(
        //     "UPDATE task SET name = $1, completed = $2%s WHERE user_id = $3 AND id = $4;",
        //     dataOrder
        // )
        // await client.query(sql, [data.name, data.completed, userId, taskId]);

        await taskRepo.update(
            {
                user: { id: userId },
                id: taskId
            },
            {
                name: data.name,
                completed: data.completed,
                task_order: data.completed ? null : max_order,
                completed_order: data.completed ? completed_order : null
            }
        )

        const order_string = data.completed ? "task_order" : "completed_order";

        // const sqlUpdate = format(
        //     `UPDATE task SET %s = %s - 1
        //         WHERE user_id = $1 AND 
        //               %s >= $2 AND
        //               duedate = $3 returning id, name, duedate, task_order, completed_order;`, 
        //     order_string, 
        //     order_string,
        //     order_string
        // );
        // await client.query(sqlUpdate, [userId, pastData[order_string], data.duedate])
        await taskRepo
            .decrement(
                {
                    user: { id: userId },
                    ...(pastData.task_order && { task_order: MoreThanOrEqual(pastData.task_order) }),
                    ...(pastData.completed_order && { completed_order: MoreThanOrEqual(pastData.completed_order) }),
                    duedate: data.duedate
                },
                order_string,
                1
            )
        
    } else {
        // await client.query(
        //     "UPDATE task SET name = $1, completed = $2 WHERE user_id = $3 AND id = $4;",
        //     [data.name, data.completed, userId, taskId]
        // )

        taskRepo.update(
            { user: {id: userId}, id: taskId },
            {
                name: data.name,
                completed: data.completed
            }
        )
    }

    // TODO: update with global interface or type
    return pastData as {
        id: string
        name: string;
        duedate: string;
        completed: boolean;
    }
}

/**
 * 
 * @param client PoolClient form pg pool
 * @param userId authenticated user's id
 * @param taskId id of the task to be deleted
 * @returns 
 */
export async function deleteTaskDb(client: EntityManager, userId: string, taskId: string) {
    // const removedTask = await client.query("DELETE FROM task WHERE id = $1 AND user_id = $2 returning *;", [taskId, userId])
    //     .then(res => res.rows[0]);

    const taskRepo = await client.getRepository(Task);
    const removedTask = await taskRepo.findOne({ where: { id: taskId, user: { id: userId } } })

    if (!removedTask) throw new Error("task cannot be found")
    await taskRepo.remove(removedTask);

    const order_string = removedTask.completed ? "completed_order" : "task_order"
    // const sql = format(
    //     `UPDATE task SET %s = %s - 1 
    //         WHERE user_id = $1 AND 
    //             %s >= $2 AND
    //             duedate = $3;`, 
    //     order_string, 
    //     order_string,
    //     order_string
    // );
    // await client.query(sql, [
    //     userId, removedTask.completed ? removedTask.completed_order : removedTask.task_order, 
    //     removedTask.duedate
    // ])
    await taskRepo
        .decrement(
            {
                user: { id: userId },
                ...(removedTask.task_order && { task_order: MoreThanOrEqual(removedTask.task_order) }),
                ...(removedTask.completed_order && { completed_order: MoreThanOrEqual(removedTask.completed_order) }),
                duedate: removedTask.duedate
            },
            order_string,
            1
        )
    
    return removedTask as {
        id: string
        name: string;
        duedate: string;
        completed: boolean;
    }
}