import React from 'react'

interface TaskItemProps {
    id: string;
    name: string;
    completed: boolean;
    insertTaskCreation?: () => void // event trigger to add a task item below the instance
    onChange: (newData: {name: string, completed: boolean}) => void
    onDelete?: () => void
}

const TaskItem: React.FC<TaskItemProps> = ({ id, name, completed, insertTaskCreation, onChange, onDelete }) => {
    // add task on enter key pressed and delete on delete key
    const onKeydown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key == "Enter" && insertTaskCreation) insertTaskCreation()
        if ((e.key === "Delete" || (name === "" && e.key === "Backspace")) && onDelete) onDelete();
    }

    return (
        <div className='flex px-3 py-2.5 hover:bg-gray-100/20 rounded-md items-center space-x-3'>
            <input
                className={`
                    border appearance-none h-6 w-6 hover:cursor-pointer 
                    checked:bg-gray-500 rounded-full peer
                `}
                type="checkbox" 
                checked={completed}
                onClick={() => onChange({
                    name: name,
                    completed: !completed
                })} />
            <div className='peer-checked:text-gray-400/70 flex-auto flex'>
                <input 
                    value={name}
                    onChange={e => onChange({
                        name: e.target.value,
                        completed
                    })}
                    placeholder={id.startsWith("create-task") ? "enter task name here" : "" }
                    onKeyDown={onKeydown} 
                    type="text" 
                    className='outline-none bg-transparent flex-auto' />
            </div>
        </div>
    )
}

export default TaskItem