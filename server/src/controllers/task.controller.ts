import { Request, Response } from "express";
import { z } from "zod";
import { addTaskDb, deleteTaskDb, updateTaskDb } from "../model/task.db";
import { PgTransaction, TaskRepository } from "../model/setup";

const getAllTasks = (req: Request, res: Response) => {
    if (!req.isAuthenticated() || !req.session.passport?.user) 
        res.status(403).json({
            status: "forbidden", msg: "unable to access resource as an unatheticated user"
        }); 
    else {
        TaskRepository
            .createQueryBuilder("task")
            .where("task.user_id = :id", { id: req.session.passport.user })
            .getMany()
            .then(tasks => res.status(200).json({
                status: "success",
                msg: "tasks found",
                results: tasks.length,
                tasks: tasks
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
        TaskRepository
            .createQueryBuilder("task")
            .where("task.id = :taskId", {taskId: req.params.id})
            .where("task.user_id = :userId", {userId: userId})
            .getOne()
            .then(result => res.status(200).json({
                status: "success",
                msg: "tasks found",
                results: result ? 1 : 0,
                tasks: [result]
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
        PgTransaction(async (entityManager) => {
            const data = AddTaskConstraint.parse(req.body);
            const order_string = "task_order";
            await addTaskDb(
                entityManager,
                userId,
                {
                    name: data.name,
                    completed: false,
                    duedate: data.date
                },
                order_string,
                null
            )
            res.status(203).json({ msg: "task successfully added" })
        })
        .catch(e => {
            console.log("Insert task error")
            console.log(e)
            res.status(500).json({ msg: "db error" })
        })
    }
}

const UpdateTaskConstraint = z.object({ name: z.string(), completed: z.boolean() })
const updateTask = async (req: Request, res: Response) => {
    const userId = req.session.passport?.user;
    const taskId = req.params.id;
    if (!req.isAuthenticated() || !userId) 
        res.status(403).json({
            status: "forbidden", msg: "unable to access resource as an unatheticated user"
        });
    else {
        PgTransaction(async (entityManager) => {
            const data = UpdateTaskConstraint.parse(req.body);
            await updateTaskDb(entityManager, userId, taskId, data);
            res.status(203).json({ msg: "task successfully updated" })
        })
        .catch(e => {
            console.log("update task error")
            console.log(e)
            res.status(500).json({ msg: "db error" })
        })
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
            const duedates = await TaskRepository
                .createQueryBuilder("task")
                .where(
                    "user_id = :userId AND duedate < :duedate AND completed = :completed",
                    { userId, duedate: data.date, completed: false }
                )
                .getMany()
                .then(res => res.map(item => {
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
            
            const duedates = await TaskRepository
                .createQueryBuilder("task")
                .distinctOn(["task.duedate"])
                .where(
                    "user_id = :userId AND completed = :completed",
                    {
                        userId,
                        duedate: data.date,
                        completed: true
                    }
                )
                .getMany()
                .then(res => res.map(item => {
                    console.log(item)
                    const date = new Date(item.duedate);
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
        TaskRepository
            .createQueryBuilder("task")
            .where("user_id = :userId AND duedate = :duedate", {userId, duedate: req.params.dateString})
            .getMany()
            .then(result => res.status(200).json({
                status: "success",
                msg: "task found",
                results: result.length,
                tasks: result
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
    if (!req.isAuthenticated() || !userId) 
        res.status(403).json({
            status: "forbidden", msg: "unable to access resource as an unatheticated user"
        });
    else {
        PgTransaction(async (entityManager) => {
            const removedTask = await deleteTaskDb(entityManager, userId, taskId);
            res.status(200).json({ msg: "task deleted", task: removedTask })
        })
        .catch(e => {
            console.log("delete task error")
            console.log(e)
            res.status(500).json({ msg: "db error" })
        })
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
            const result = await TaskRepository
                .createQueryBuilder("task")
                .where(
                    "user_id = :userId AND EXTRACT(MONTH FROM duedate) = :month AND EXTRACT(YEAR FROM duedate) = :year", 
                    {userId, month, year}
                )
                .orderBy("task.completed")
                .addOrderBy("task.task_order")
                .addOrderBy("task.completed_order")
                .getMany()

            res.status(200).json({
                status: "success",
                msg: "task found",
                results: result.length,
                tasks: result
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