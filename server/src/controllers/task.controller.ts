import db from "../model";
import format from "pg-format";
import { Request, Response } from "express";
import { z } from "zod";
import { addTaskDb } from "../model/task.db";

const getAllTasks = (req: Request, res: Response) => {
    console.log("running all tasks")
    if (!req.isAuthenticated() || !req.session.passport?.user) 
        res.status(403).json({
            status: "forbidden", msg: "unable to access resource as an unatheticated user"
        }); 
    else {
        db.query("SELECT * FROM task WHERE user_id = $1 ORDER BY duedate, task_order, completed_order;", [req.session.passport.user])
            .then(result => res.status(200).json({
                status: "success",
                msg: "tasks found",
                results: result.rows.length,
                tasks: result.rows
            }))
            .catch(() => res.status(500).json({ status: "Db error", msg: "unable to fetch tasks" }))
    }
}

const getTask = (req: Request, res: Response) => {
    console.log("getting one task")
    const userId = req.session.passport?.user;
    if (!req.isAuthenticated() || !userId) 
        res.status(403).json({
            status: "forbidden", msg: "unable to access resource as an unatheticated user"
        });
    else {
        db.query("SELECT * FROM task WHERE user_id = $1 AND id = $2;", [userId, req.params.id])
            .then(result => res.status(200).json({
                status: "success",
                msg: "task found",
                results: result.rows.length,
                tasks: result.rows
            }))
            .catch(() => res.status(500).json({ status: "Db error", msg: "unable to fetch tasks" }))
    }
}

const AddTaskConstraint = z.object({
    name: z.string(),
    date: z.string(),
})
const addTask = async (req: Request, res: Response) => {
    const userId = req.session.passport?.user;
    if (!req.isAuthenticated() || !userId) 
        res.status(403).json({
            status: "forbidden", msg: "unable to access resource as an unatheticated user"
        });
    else {
        const client = await db.getClient();

        try {
            await client.query("BEGIN");
            const data = AddTaskConstraint.parse(req.body);

            // set order string to task_order by default
            const order_string = "task_order"

            await addTaskDb(
                client,
                userId,
                {
                    name: data.name,
                    completed: false,
                    duedate: data.date
                },
                order_string,
                null
            )

            await client.query("COMMIT")
            res.status(203).json({ msg: "task successfully added" })
        } catch (e) {
            await client.query("ROLLBACK");
            console.log("Insert task error")
            console.log(e)
            res.status(500).json({ msg: "db error" })
        } finally {
            client.release();
        }
    }
}

const UpdateTaskConstraint = z.object({ name: z.string(), completed: z.boolean() })
const updateTask = async (req: Request, res: Response) => {
    const userId = req.session.passport?.user;
    const client = await db.getClient();
    const taskId = req.params.id;
    if (!req.isAuthenticated() || !userId) 
        res.status(403).json({
            status: "forbidden", msg: "unable to access resource as an unatheticated user"
        });
    else {
        try {
            const data = UpdateTaskConstraint.parse(req.body);

            const pastData = await client.query(
                "SELECT * FROM task WHERE user_id = $1 AND id = $2;",
                [userId, taskId]
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
                await client.query(sqlUpdate, [userId, pastData[order_string], pastData.duedate])
                
            } else {
                await client.query(
                    "UPDATE task SET name = $1, completed = $2 WHERE user_id = $3 AND id = $4;",
                    [data.name, data.completed, userId, taskId]
                )
            }
            res.status(200).json({ msg: "task updated" })
            
        } catch (e) {
            client.query("ROLLBACK");
            console.log(e);
            res.status(500).json({ msg: "db error" })
        }
    }
}

const FetchBodyConstraint = z.object({
    date: z.coerce.date()
})

const fetchAllOverdueCategories = async (req: Request, res: Response) => {
    const userId = req.session.passport?.user;
    if (!req.isAuthenticated() || !userId) 
        res.status(403).json({
            status: "forbidden", msg: "unable to access resource as an unatheticated user"
        });
    
    else {
        try {
            
            const data = FetchBodyConstraint.parse(req.body)
            const duedates = await db.query(
                "SELECT DISTINCT duedate FROM task WHERE user_id = $1 AND duedate < $2 AND completed = false ORDER BY duedate;", 
                [userId, data.date]
            ).then(res => res.rows.map(item => {
                const date = new Date(item.duedate);
                console.log(date)
                date.setUTCHours(0);
                date.setUTCMinutes(0);
                date.setUTCSeconds(0);
                date.setUTCMilliseconds(0);
                return { operator: "=", isCompleted: false, date: date.toJSON() }
            }))
            console.log(duedates)
            res.status(200).json({ count: duedates.length, category: duedates })
        } catch (e) {
            console.log(e)
            res.status(500).json({ msg: "error" })
        }
    }
}

const fetchAllCompletedCategories = async (req: Request, res: Response) => {
    const userId = req.session.passport?.user;
    if (!req.isAuthenticated() || !userId) 
        res.status(403).json({
            status: "forbidden", msg: "unable to access resource as an unatheticated user"
        });
    
    else {
        try {
            
            const data = FetchBodyConstraint.parse(req.body)
            const duedates = await db.query(
                "SELECT DISTINCT duedate FROM task WHERE user_id = $1 AND duedate < $2 AND completed = true ORDER BY duedate;", 
                [userId, data.date]
            ).then(res => res.rows.map(item => {
                const date = new Date(item.duedate);
                console.log(date)
                date.setUTCHours(0);
                date.setUTCMinutes(0);
                date.setUTCSeconds(0);
                date.setUTCMilliseconds(0);
                return { operator: "=", isCompleted: true, date: date.toJSON() }
            }))
            console.log(duedates)
            res.status(200).json({ count: duedates.length, category: duedates })
        } catch (e) {
            console.log(e)
            res.status(500).json({ msg: "error" })
        }
    }
}

const fetchTaskByDate = async (req: Request, res: Response) => {
    const userId = req.session.passport?.user;
    if (!req.isAuthenticated() || !userId) 
        res.status(403).json({
            status: "forbidden", msg: "unable to access resource as an unatheticated user"
        });
    else {
        console.log(req.params.dateString)
        db.query("SELECT id, name, duedate, completed FROM task WHERE user_id = $1 AND duedate = $2;", [userId, req.params.dateString])
            .then(result => res.status(200).json({
                status: "success",
                msg: "task found",
                results: result.rows.length,
                tasks: result.rows
            }))
            .catch((err) => {
                res.status(500).json({ status: "Db error", msg: "unable to fetch tasks" })
                console.log(err)
            })
    }
}

const deleteTask = async (req: Request, res: Response) => {
    console.log("working")
    const userId = req.session.passport?.user;
    const taskId = req.params.id;
    const client = await db.getClient();
    if (!req.isAuthenticated() || !userId) 
        res.status(403).json({
            status: "forbidden", msg: "unable to access resource as an unatheticated user"
        });
    else {
        try {
            await client.query("BEGIN");

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
            await client.query(sql, [userId, removedTask.completed ? removedTask.completed_order : removedTask.task_order, removedTask.duedate])

            await client.query("COMMIT");
            res.status(200).json({ msg: "task deleted", task: removedTask })
        } catch (e) {
            res.status(500).json({ msg: "db error" })
        }
    }
}

const YearMonthConstraint = z.coerce.number().array().min(2).max(2).nonempty();
const fetchTaskByMonth = async (req: Request, res: Response) => {
    const userId = req.session.passport?.user;
    if (!req.isAuthenticated() || !userId) 
        res.status(403).json({
            status: "forbidden", msg: "unable to access resource as an unatheticated user"
        });
    else {
        try {
            const [year, month] = YearMonthConstraint.parse(req.params.yearMonth.split("-"))
            db.query(
                `SELECT id, name, duedate, completed 
                FROM task 
                WHERE user_id = $1 AND EXTRACT(MONTH FROM duedate) = $2 AND EXTRACT(YEAR FROM duedate) = $3
                ORDER BY completed, task_order, completed_order;`, 
                [userId, month, year]
            )
                .then(result => res.status(200).json({
                    status: "success",
                    msg: "task found",
                    results: result.rows.length,
                    tasks: result.rows
                }))
                .catch((err) => {
                    res.status(500).json({ status: "Db error", msg: "unable to fetch tasks" })
                    console.log(err)
                })

        } catch (e) {
            res.status(500).json({ status: "Db error", msg: "unable to fetch tasks" })
            console.log(e)
        }
    }
}
export default {
    getAllTasks,
    addTask,
    updateTask,
    fetchAllOverdueCategories,
    fetchAllCompletedCategories,
    fetchTaskByDate,
    fetchTaskByMonth,
    deleteTask,
    getTask
}