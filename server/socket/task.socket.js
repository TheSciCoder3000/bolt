const db = require("../model");
const format = require("pg-format");

const fetchSocketTask = (socket) => async (category) => {
    const sql = format(
        "SELECT * FROM task WHERE user_id = $1 ORDER BY task_order ->> '%s';",
        category
    )
    const taskData = await db.query(
        sql, 
        [socket.request.session.passport.user]
    )
        .then(result => result.rows)
        .catch(() => res.status(500).json({ status: "Db error", msg: "unable to fetch tasks" }));
    socket.emit("receive-tasks", taskData);
}

const createSocketTask = (socket) => async () => {
    const client = await db.getClient();

    try {

    } catch (e) {
        await client.query("ROLLBACK");
        throw e
    } finally {
        client.release();
    }
}



module.exports = (io, socket) => {
    socket.on('fetch-tasks', fetchSocketTask(socket));
    socket.on("create-tasks", createSocketTask(socket))
}