import { Pool, PoolClient } from 'pg';
import format from "pg-format";

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
export async function addTaskDb(client: PoolClient, userId: string, data: TaskData, order_string: "task_order" | "completed_order", pos: number | null) {
    // check data.completed and order_string if correct
    if (data.completed && order_string !== "completed_order") throw new Error("Invalid data.complete or order_string values")

    // update the tasks of positions greater than the pos provided by the client
    if (pos !== null) {
        const sql = format(
            `UPDATE task SET %s = %s + 1 
                WHERE user_id = $1 AND 
                      %s >= $2 AND
                      duedate = $3;`, 
            order_string, 
            order_string,
            order_string
        );
        await client.query(sql, [userId, pos, data.duedate])
    // else update the pos if null
    } else {
        const task_orderFormat = format("SELECT MAX(%s) as max FROM task WHERE user_id = $1 AND duedate = $2;", order_string)
        pos = await client.query(task_orderFormat, [userId, data.duedate])
                .then(res => res.rows[0].max === null ? 0 : (res.rows[0].max + 1)) as number;
    }

    // insert the task to the database
    const taskData = await client.query(
        format(`INSERT INTO task(name, completed, user_id, duedate, details, subject_id, parent_id, %s) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) returning *;`, order_string), 
        [
            data.name, 
            data.completed,
            userId,
            data.duedate,
            null,
            null,
            null,
            pos,
        ]
    ).then(res => res.rows[0])

    return {
        id: taskData.id as string
    }
}

/**
 * 
 * @param client PoolClient form pg pool
 * @param userId authenticated user's id
 * @param taskId id of the task to be updated
 * @param data task data containing the name, duedate and completed
 */
export async function updateTaskDb(client: PoolClient, userId: string, taskId: string, data: MakeOptional<TaskData, "duedate">) {
    const pastData = await client.query(
        "SELECT * FROM task WHERE user_id = $1 AND id = $2;",
        [userId, taskId]
    ).then(res => res.rows[0])

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
        await client.query(sql, [data.name, data.completed, userId, taskId]);

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
        await client.query(sqlUpdate, [userId, pastData[order_string], data.duedate])
        
    } else {
        await client.query(
            "UPDATE task SET name = $1, completed = $2 WHERE user_id = $3 AND id = $4;",
            [data.name, data.completed, userId, taskId]
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
export async function deleteTaskDb(client: PoolClient, userId: string, taskId: string) {
    const removedTask = await client.query("DELETE FROM task WHERE id = $1 AND user_id = $2 returning *;", [taskId, userId])
        .then(res => res.rows[0]);

    const order_string = removedTask.completed ? "completed_order" : "task_order"
    const sql = format(
        `UPDATE task SET %s = %s - 1 
            WHERE user_id = $1 AND 
                %s >= $2 AND
                duedate = $3;`, 
        order_string, 
        order_string,
        order_string
    );
    await client.query(sql, [
        userId, removedTask.completed ? removedTask.completed_order : removedTask.task_order, 
        removedTask.duedate
    ])
    
    return removedTask as {
        id: string
        name: string;
        duedate: string;
        completed: boolean;
    }
}