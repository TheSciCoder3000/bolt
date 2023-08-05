const TaskSocket = require("./task.socket");

/**
 * @typedef {import("../server").Server} Server
 */
/**
 * 
 * @param {Server} io 
 */
module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log(`new connection ${socket.id}`);
    
        const session = socket.request.session;
        console.log(`saving sid ${socket.id} in session ${session.id}\n`);
        session.socketId = socket.id;
        session.save();

        TaskSocket(io, socket)
    });
}