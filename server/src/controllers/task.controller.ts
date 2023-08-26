import db from "../model";
import { Request, Response } from "express";
import { z } from "zod";
import { addTaskDb, deleteTaskDb, updateTaskDb } from "../model/task.db";

const getAllTasks = (req: Request, res: Response) => {
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
            await client.query("BEGIN");
            const data = UpdateTaskConstraint.parse(req.body);

            await updateTaskDb(client, userId, taskId, data);

            await client.query("COMMIT");
            res.status(200).json({ msg: "task updated" })
            
        } catch (e) {
            client.query("ROLLBACK");
            console.log(e);
            res.status(500).json({ msg: "db error" })
        } finally {
            client.release();
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
                date.setUTCHours(0);
                date.setUTCMinutes(0);
                date.setUTCSeconds(0);
                date.setUTCMilliseconds(0);
                return { operator: "=", isCompleted: false, date: date.toJSON() }
            }))
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
                date.setUTCHours(0);
                date.setUTCMinutes(0);
                date.setUTCSeconds(0);
                date.setUTCMilliseconds(0);
                return { operator: "=", isCompleted: true, date: date.toJSON() }
            }))
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

            const removedTask = await deleteTaskDb(client, userId, taskId);

            await client.query("COMMIT");
            res.status(200).json({ msg: "task deleted", task: removedTask })
        } catch (e) {
            res.status(500).json({ msg: "db error" })
        } finally {
            client.release()
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
            const result = await db.query(
                `SELECT id, name, duedate, completed 
                FROM task 
                WHERE user_id = $1 AND EXTRACT(MONTH FROM duedate) = $2 AND EXTRACT(YEAR FROM duedate) = $3
                ORDER BY completed, task_order, completed_order;`, 
                [userId, month, year]
            )

            res.status(200).json({
                status: "success",
                msg: "task found",
                results: result.rows.length,
                tasks: result.rows
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