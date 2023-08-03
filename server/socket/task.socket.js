const db = require("../model");
const format = require("pg-format");

// helper function
const prefectchTaskData = (dbClient, userId, category) => {
    const sql = format(
        "SELECT * FROM task WHERE user_id = $1 ORDER BY task_order ->> '%s';",
        category
    )
    return dbClient.query(sql, [userId]).then(result => result.rows)
}

// ========================= Sockets ========================= 
const fetchSocketTask = (socket) => async (category) => {
    const taskData = await prefectchTaskData(
        db, 
        socket.request.session.passport.user,
        category
    )
        .catch(() => res.status(500).json({ status: "Db error", msg: "unable to fetch tasks" }));
    socket.emit("receive-tasks", taskData);
}

const createSocketTask = (socket) => async (data) => {
    const userId = socket.request.session.passport.user
    const client = await db.getClient();

    const affectedParsed = data.affected.map((item, indx) => `(${item},'${data.task_order[data.category]+indx+1}')`).join(",")

    try {
        await client.query("BEGIN");
        await client.query(
            `INSERT INTO task(name, completed, user_id, duedate, details, subject_id, parent_id, tags, task_order) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning *;`, 
            [
                data.preData?.name || "", 
                data.preData?.completed || false,
                userId,
                data.duedate,
                null,
                null,
                null,
                null,
                data.task_order,
            ]
        )

        if (data.affected.length > 0) {
            const sql = format(
                `UPDATE task SET task_order = jsonb_set(CAST(task_order as jsonb), '{%s}', tmp.t_order::jsonb, true)
                FROM
                (VALUES %s) AS tmp (id, t_order)
                WHERE user_id = $1 AND task.id = tmp.id;`,
                data.category,
                affectedParsed
            )
    
            await client.query(sql, [userId])
        }

        await client.query("COMMIT")

        const taskData = await prefectchTaskData(client, userId, data.category)
        socket.emit("receive-tasks", taskData);
    } catch (e) {
        await client.query("ROLLBACK");
        console.log("Insert task error")
        console.log(e)
    } finally {
        client.release();
    }
}

const deleteSocketTask = (socket) => async (data) => {
    const userId = socket.request.session.passport.user
    const client = await db.getClient();
    const affectedParsed = data.affected.map((item, indx) => `(${item},'${data.task_order[data.category]+indx-1}')`).join(",")

    try {
        await client.query("BEGIN");

        await client.query("DELETE FROM task WHERE id = $1 AND user_id = $2", [data.id, userId])

        if (data.affected.length > 0) {
            const sql = format(
                `UPDATE task SET task_order = jsonb_set(CAST(task_order as jsonb), '{%s}', tmp.t_order::jsonb, true)
                FROM
                (VALUES %s) AS tmp (id, t_order)
                WHERE user_id = $1 AND task.id = tmp.id;`,
                data.category,
                affectedParsed
            )
            await client.query(sql, [userId])
        }

        await client.query("COMMIT")

        const taskData = await prefectchTaskData(client, userId, data.category)

        socket.emit("receive-tasks", taskData);
    } catch (e) {
        await client.query("ROLLBACK")
        console.log(e)
        throw e
    } finally {
        client.release()
    }
}



module.exports = (io, socket) => {
    socket.on('fetch-tasks', fetchSocketTask(socket));
    socket.on("create-task", createSocketTask(socket));
    socket.on("delete-task", deleteSocketTask(socket))
}