import React, { useRef } from 'react'
import Modal from '.'
import { useContextMenu } from 'hooks/todo';


interface TaskItemContextMenuProps {
    x: number;
    y: number;
    completed: boolean;
    closeContextMenu: () => void;
    updateTask?: (data: DataFromContext | null | CbFromContext) => void;
    filter?: ("edit" | "toggle" | "delete")[]
}

export interface DataFromContext {
    name: string;
    completed: boolean;
}
export type CbFromContext = (state: DataFromContext) => DataFromContext


const TaskItemContextMenu: React.FC<TaskItemContextMenuProps> = ({ x, y, completed, closeContextMenu, updateTask, filter }) => {
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
            id: "edit",
            name: "Edit",
            data: undefined
        },
        {
            id: "toggle",
            name: completed ? "Mark Unfinished" : "Mark Finished",
            data: (state: DataFromContext) => ({ ...state, completed: !completed })
        },
        {
            id: "delete",
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
                {ContextMenuOptions.filter(item => filter ? !filter.includes(item.id as ("edit" | "toggle" | "delete")) : true).map((opt, indx) => (
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