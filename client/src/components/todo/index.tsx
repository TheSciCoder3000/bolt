import { CategoryState, SocketAddTask, useSocketIo } from 'hooks/socket';
import React, { useEffect, useState } from 'react'
import { useLoaderData, useOutletContext, useParams } from 'react-router-dom'
import TodoList from './TodoList';


interface TodoContainerProps {

}

type SavingStates = "saving" | "failed" | "saved"

const TodoContainer: React.FC<TodoContainerProps> = () => {
    const { todoSec } = useParams();
    const category = useLoaderData() as CategoryState[]
    const [saving, setSaving] = useState<SavingStates>("saved");
    const socket = useSocketIo();

    const [ModalData, setModalData] = useOutletContext<ReturnType<typeof useState<{ method: string, data: { name: string, date: string } } | null>>>()
    useEffect(() => {
        if (!ModalData || !todoSec) return
        setModalData(null)
        const socketAdd: SocketAddTask = {
            task_order: null,
            duedate: ModalData.data.date, 
            preData: { name: ModalData.data.name, completed: false },
            category: {
                operator: "=",
                isCompleted: false,
                date: ModalData.data.date
            },
            isCompleted: false
        }
        socket?.emit("create-task", socketAdd)
    }, [socket, ModalData, setModalData, todoSec])    

    

    return (
        <div className="flex-auto h-full overflow-y-auto">
            <div className="p-10">
                <div className="mb-12">
                    <h1 className="text-6xl tracking-wide">{(todoSec?.charAt(0).toUpperCase()) + (todoSec?.slice(1) || "")}</h1>
                </div>
                {saving}
                <hr className="mb-3"/>

                <div className="mt-7 space-y-2">
                    {socket && category && category.map(cat => (
                        <TodoList
                            key={`${cat.date}-${cat.isCompleted.toString()}`}
                            socket={socket}
                            category={cat}
                            displayHeaders={todoSec ? !['today', 'tomorrow'].includes(todoSec) : false}
                            onSaving={setSaving} />
                    ))}
                </div>
            </div>
        </div>
    )
}

export default TodoContainer