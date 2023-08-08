import React, { useRef } from 'react'
import Modal from '.'
import { useContextMenu } from 'hooks/todo';
import { CbFromContext, DataFromContext } from 'components/todo/TodoList';


interface TaskItemContextMenuProps {
    x: number;
    y: number;
    completed: boolean;
    closeContextMenu: () => void;
    updateTask?: (data: DataFromContext | null | CbFromContext) => void
}


const TaskItemContextMenu: React.FC<TaskItemContextMenuProps> = ({ x, y, completed, closeContextMenu, updateTask }) => {
    const contextRef = useRef<HTMLDivElement>(null)
    useContextMenu(contextRef, closeContextMenu)

    const getModalX = () => {
        const threshold = 135;
        if (window.innerWidth >= x + threshold) {
            return x
        }
        return x - threshold
    }

    const ContextMenuOptions = [
        {
            name: "Edit",
            data: undefined
        },
        {
            name: completed ? "Mark Unfinished" : "Mark Finished",
            data: (state: DataFromContext) => ({ ...state, completed: !completed })
        },
        {
            name: "Delete",
            data: null
        },
    ]
    return (
        <Modal>
            <div 
                ref={contextRef} 
                style={{ top: `${y}px`, left: `${getModalX()}px` }}
                className='absolute bg-gray-50 border rounded-md  shadow-md' >
                {ContextMenuOptions.map((opt, indx) => (
                    <button 
                        key={indx} 
                        className='px-3 py-1.5 flex justify-start hover:bg-gray-200/60 w-full'
                        onClick={opt.data === undefined ? undefined : () => {
                            updateTask && updateTask(opt.data)
                            closeContextMenu()
                        }} >
                        {opt.name}
                    </button>
                ))}
            </div>
        </Modal>
    )
}

export default TaskItemContextMenu