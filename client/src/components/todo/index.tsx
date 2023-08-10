import { CategoryState, SocketAddTask, useSocketIo } from 'hooks/socket';
import React, { useEffect, useState } from 'react'
import { useLoaderData, useOutletContext, useParams } from 'react-router-dom'
import TodoList from './TodoList';
// import TaskItemContextMenu from 'components/modal/TaskItemContextMenu';

// const initialContextMenuState = {
//     show: false,
//     x: 0,
//     y: 0,
//     id: null as string | null,
//     completed: false
// }

interface TodoContainerProps {

}

type SavingStates = "saving" | "failed" | "saved"

const TodoContainer: React.FC<TodoContainerProps> = () => {
    const { todoSec } = useParams();
    const category = useLoaderData() as CategoryState[]
    const [saving, setSaving] = useState<SavingStates>("saved");
    // const [contextMenu, setContextMenu] = useState(initialContextMenuState);
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

    // const closeContextMenu = () => {
    //     setContextMenu(initialContextMenuState)
    // }
    
    // const updateFromContext = (data: null | DataFromContext | CbFromContext) => {
    //     if (contextMenu.id === null) return
    //     const taskData = tasks.find(item => item.id === contextMenu.id);
    //     const taskIndx = tasks.findIndex(item => item.id === contextMenu.id)
    //     if (!taskData || taskIndx === -1) return
    
    //     if (data === null) {
    //       deleteTaskEvent(
    //         contextMenu.id,
    //         taskIndx,
    //         category.date
    //       )
    //     } else {
    //       const parsedData = typeof data === "function" ? 
    //         data({ name: taskData.name, completed: taskData.completed }) : data;
    //       updateEvent(
    //         contextMenu.id,
    //         parsedData.name,
    //         parsedData.completed
    //       )
    //       setTasks(state => state.map(item => {
    //         if (item.id === contextMenu.id) return {...item, name: parsedData.name, completed: parsedData.completed}
    //         return item
    //       }))
    //     }
    // }

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
            {/* {contextMenu.show && <TaskItemContextMenu completed={contextMenu.completed} updateTask={updateFromContext} x={contextMenu.x} y={contextMenu.y} closeContextMenu={closeContextMenu} />} */}
        </div>
    )
}

export default TodoContainer