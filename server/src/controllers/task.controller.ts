import db from "../model";
import format from "pg-format";
import { Request, Response } from "express";

const getAllTasks = (req: Request, res: Response) => {
    if (!req.isAuthenticated() || !req.session.passport?.user) 
        res.status(403).json({
            status: "forbidden", msg: "unable to access resource as an unatheticated user"
        }); 
    else {
        db.query("SELECT * FROM task WHERE user_id = $1 ORDER BY task_order ->> 'today';", [req.session.passport.user])
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

const addTask = (req: Request, res: Response) => {
    const userId = req.session.passport?.user;
    if (!req.isAuthenticated() || !userId) 
        res.status(403).json({
            status: "forbidden", msg: "unable to access resource as an unatheticated user"
        });
    else {
        const json_val: { [key: string]: unknown } = {}
        const taskCreationOrder = req.body.category.order || 0
        json_val[req.body.category.name] = taskCreationOrder

        const affectedParsed = req.body.category.affected.map((item: string, indx: number) => `(${item},'${taskCreationOrder+indx+1}')`).join(",")

        const sql = format(
            `UPDATE task SET task_order = jsonb_set(CAST(task_order as jsonb), '{%s}', tmp.t_order::jsonb, true)
            FROM
            (VALUES %s) AS tmp (id, t_order)
            WHERE user_id = $1 AND task.id = tmp.id;`,
            req.body.category.name,
            affectedParsed
        )

        console.log(sql)

        db.query(
            sql,
            [
                userId
            ]
        )
            .then(() => db.query(
                    `INSERT INTO task(name, completed, user_id, duedate, details, subject_id, parent_id, tags, task_order) 
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning *;`, 
                    [
                        req.body.name, 
                        req.body.completed,
                        userId,
                        req.body.duedate,
                        req.body.details || null,
                        null,
                        null,
                        null,
                        json_val,
                    ]
                )
                    .then(result => res.status(201).json({
                        status: "success",
                        msg: "task created",
                        results: result.rows.length,
                        tasks: result.rows
                    })))
            .catch(err => {
                console.log(err)
                res.status(500).json({ status: "Db error", msg: "unable to insert task" })
            })
    }
}

const updateTask = (req: Request, res: Response) => {
    const userId = req.session.passport?.user;
    if (!req.isAuthenticated() || !userId) 
        res.status(403).json({
            status: "forbidden", msg: "unable to access resource as an unatheticated user"
        });
    
    else {

    }
}

module.exports = {
    getAllTasks,
    addTask,
    updateTask
}