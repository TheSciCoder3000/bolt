import { Server, Socket } from "socket.io";
import { SessionData } from "express-session"
import { IncomingMessage } from "http";
import TaskSocket from "./task.socket";

declare module 'express-session' {
    interface SessionData {
        id: string;
        socketId: string;
        save: () => void
    }
};

interface SessionIncomingMessage extends IncomingMessage {
    session: SessionData
};

export interface SessionSocket extends Socket {
    request: SessionIncomingMessage
};


const SocketListener = (io: Server) => {
    io.on('connection', (defaultSocket) => {
        const socket = <SessionSocket> defaultSocket
        console.log(`new connection ${socket.id}`);
    
        const session = socket.request.session;
        console.log(`saving sid ${socket.id} in session ${session.id}\n`);
        session.socketId = socket.id;
        session.save();

        TaskSocket(io, socket)
    });
}

export default SocketListener;