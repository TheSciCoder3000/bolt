const db = require("../model");
const format = require("pg-format");

// helper function
const prefectchTaskData = (dbClient, userId, dateRange) => {
    const sql= dateRange.length > 1 ?
        "SELECT * FROM task WHERE user_id = $1 AND duedate BETWEEN $2 AND $3 ORDER BY task_order;" :
        "SELECT * FROM task WHERE user_id = $1 AND duedate = $2 ORDER BY task_order;"
    
    return dbClient.query(sql, [userId, ...dateRange]).then(result => result.rows.map(item => ({ ...item, task_order: parseInt(item.task_order) })))
}

// ========================= Sockets ========================= 
const fetchSocketTask = (socket) => async (dateRange) => {
    const taskData = await prefectchTaskData(
        db, 
        socket.request.session.passport.user,
        dateRange
    )
        .catch(err => console.log(err));
    socket.emit("receive-tasks", taskData);
}

const createSocketTask = (socket) => async (data) => {
    const userId = socket.request.session.passport.user
    const client = await db.getClient();

    const affectedParsed = data.affected.map((item, indx) => `(${item},${data.task_order+indx+1})`).join(",")
    console.log(data)

    try {
        await client.query("BEGIN");
        const taskId = await client.query(
            `INSERT INTO task(name, completed, user_id, duedate, details, subject_id, parent_id, tags, task_order) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning id;`, 
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
                `UPDATE task SET task_order = t_order
                FROM
                (VALUES %s) AS tmp (id, t_order)
                WHERE user_id = $1 AND task.id = tmp.id;`,
                affectedParsed
            )
    
            await client.query(sql, [userId])
        }

        await client.query("COMMIT")

        const taskData = await prefectchTaskData(client, userId, data.dateRange)
        socket.emit("receive-tasks", taskData, taskId, data.task_order);
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
    const affectedParsed = data.affected.map((item, indx) => `(${item},${data.task_order+indx-1})`).join(",")

    try {
        await client.query("BEGIN");

        await client.query("DELETE FROM task WHERE id = $1 AND user_id = $2;", [data.id, userId])

        if (data.affected.length > 0) {
            const sql = format(
                `UPDATE task SET task_order = t_order
                FROM
                (VALUES %s) AS tmp (id, t_order)
                WHERE user_id = $1 AND task.id = tmp.id;`,
                affectedParsed
            )
            await client.query(sql, [userId])
        }

        await client.query("COMMIT")

        const taskData = await prefectchTaskData(client, userId, data.dateRange)

        socket.emit("receive-tasks", taskData, data.id, data.task_order-1);
    } catch (e) {
        await client.query("ROLLBACK")
        console.log("delete task error")
        console.log(e)
        throw e
    } finally {
        client.release()
    }
}

const updateSocketTask = (socket) => async (data) => {
    const userId = socket.request.session.passport.user
    const client = await db.getClient();

    try {
        await client.query("BEGIN");

        await client.query(
            "UPDATE task SET name = $1, completed = $2 WHERE user_id = $3 AND id = $4;",
            [data.name, data.completed, userId, data.id]
        )

        await client.query("COMMIT")

    } catch (e) {
        await client.query("ROLLBACK");
        console.log("udpate task error");
        console.log(e);
    } finally {
        client.release();
    }
}

module.exports = (io, socket) => {
    socket.on('fetch-tasks', fetchSocketTask(socket));
    socket.on("create-task", createSocketTask(socket));
    socket.on("delete-task", deleteSocketTask(socket));
    socket.on("update-task", updateSocketTask(socket));
}