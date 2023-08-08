import React, { forwardRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';


interface TaskItemProps {
    id: string;
    name: string;
    completed: boolean;
    insertTaskCreation?: () => void; // event trigger to add a task item below the instance
    onChange: (newData: {name: string, completed: boolean}) => void;
    onDelete?: () => void;
    onUpdate?: (id: string, name: string, completed: boolean) => void;
    focusOnItem?: (amnt: number) => void
}

const TaskItem = forwardRef<HTMLInputElement, TaskItemProps>(({ id, name, completed, insertTaskCreation, onChange, onDelete, onUpdate, focusOnItem }, ref) => {
    // add task on enter key pressed and delete on delete key
    const onKeydown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (onUpdate) onUpdate(id, name, completed);
        if (e.key == "ArrowUp" && focusOnItem) focusOnItem(-1)
        if (e.key == "ArrowDown" && focusOnItem) focusOnItem(1)
        if (e.key == "Enter" && insertTaskCreation) insertTaskCreation()
        if ((e.key === "Delete" || (name === "" && e.key === "Backspace")) && onDelete) onDelete();
    }

    const onItemBlur = () => {
        if (name === "" && onDelete) onDelete();
        else if (onUpdate) onUpdate(id, name, completed);
    }

    return (
        <div className='group flex px-3 py-2.5 hover:bg-gray-100/30 rounded-md items-center space-x-3'>
            <input
                className={`
                    border appearance-none h-6 w-6 hover:cursor-pointer 
                    checked:bg-gray-500 rounded-full peer border-gray-500/40
                `}
                type="checkbox" 
                checked={completed}
                onClick={() => {
                    onChange({name: name, completed: !completed})
                    if (onUpdate) onUpdate(id, name, !completed);
                }} />
            <div className='peer-checked:text-gray-400/70 flex-auto flex'>
                <input 
                    value={name}
                    ref={ref}
                    onChange={e => onChange({
                        name: e.target.value,
                        completed
                    })}
                    placeholder={id.startsWith("create-task") ? "enter task name here" : "" }
                    onKeyDown={onKeydown} 
                    onBlur={onItemBlur}
                    type="text" 
                    className='outline-none bg-transparent flex-auto' />
                <button className='px-2 hover:bg-gray-400/20 rounded-sm hidden group-hover:block'>
                    <FontAwesomeIcon icon={faEllipsisVertical} />
                </button>
            </div>
        </div>
    )
})

export default TaskItem