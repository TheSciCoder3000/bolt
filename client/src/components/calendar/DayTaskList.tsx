import { deleteTask, fetchTasksByMonth } from 'api/task';
import TaskItemContextMenu, { CbFromContext, DataFromContext } from 'components/modal/TaskItemContextMenu';
import React, { LegacyRef, useEffect, useState } from 'react'
import { useOverflowDetector } from 'react-detectable-overflow';

type TaskListT = Awaited<ReturnType<typeof fetchTasksByMonth>>;
const initialContextMenuState = {
    show: false,
    x: 0,
    y: 0,
    id: null as string | null,
    completed: false
}

interface DayTaskListProps {
    tasks: TaskListT;
    refreshTasks: () => void;

}
const DayTaskList: React.FC<DayTaskListProps> = ({ tasks, refreshTasks }) => {
    const { ref, overflow } = useOverflowDetector({});
    const [contextMenu, setContextMenu] = useState(initialContextMenuState);


    useEffect(() => {
        console.log(overflow)
    }, [overflow])

    const contextMenuHandler = (e: React.MouseEvent<HTMLElement, MouseEvent>, id: string, completed: boolean) => {
        e.preventDefault();
        console.log(id, completed)
    
        setContextMenu({ show: true, x: e.pageX, y: e.pageY, id, completed })
    }

    const updateFromContext = (data: null | DataFromContext | CbFromContext) => {
        if (contextMenu.id === null) return
        const taskData = tasks.find(item => item.id === contextMenu.id);
        const taskIndx = tasks.findIndex(item => item.id === contextMenu.id)
        if (!taskData || taskIndx === -1) return
        console.log(data)
        if (data === null) {
          deleteTask(taskData.id).then(refreshTasks)
        } else {
          // update task
        }
    }

    const closeContextMenu = () => setContextMenu(initialContextMenuState);

    return (
        <div ref={ref as LegacyRef<HTMLDivElement>} className='relative h-full space-y-1 overflow-hidden'>
            {tasks.map(task => (
                <div 
                    onContextMenu={e => contextMenuHandler(e, task.id, task.completed)} 
                    className='bg-black text-white text-xs truncate px-2 py-1' 
                    key={task.id}>
                        {task.name}
                </div>
            ))}
            {overflow && <button className='absolute left-0 right-0 bottom-0 bg-white'>
                More {">"}
            </button>}
            {contextMenu.show && (
                <TaskItemContextMenu 
                    completed={contextMenu.completed} 
                    updateTask={updateFromContext} 
                    x={contextMenu.x} y={contextMenu.y} 
                    closeContextMenu={closeContextMenu}
                    filter={["edit"]} />
            )}

        </div>
    )
}

export default DayTaskList