import { PoolClient } from 'pg';
import format from "pg-format";

interface AddTask {
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
export async function addTaskDb(client: PoolClient, userId: string, data: AddTask, order_string: "task_order" | "completed_order", pos: number | null) {
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
        format(`INSERT INTO task(name, completed, user_id, duedate, details, subject_id, parent_id, tags, %s) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning *;`, order_string), 
        [
            data.name, 
            data.completed,
            userId,
            data.duedate,
            null,
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