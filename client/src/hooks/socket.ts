import { connect } from 'socket.io-client';
import { useEffect, useState } from "react"

export const useSocketIo = () => {
    const [socket, setSocket] = useState<ReturnType<typeof connect> | null>(null)
    useEffect(() => {
        const s = connect("http://localhost:3005", {
            withCredentials: true
        })
        setSocket(s)
        return () => {
            s.disconnect()
        }
    }, [])

    return socket
}

export const useSocketOn = (
    socket: ReturnType<typeof connect> | null, 
    event: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handler: (...args: any[]) => void
) => {
    
    useEffect(() => {
        if (!socket) return

        socket.on(event, handler)

        return () => {
            socket.off(event, handler)
        }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket, event, handler])
}
