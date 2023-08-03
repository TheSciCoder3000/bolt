import React, { useState } from 'react'
import { IncTaskState } from 'store/task.slice';

interface TaskItemProps {
    id: string;
    name: string;
    completed: boolean;
    insertTaskCreation?: () => void
    onAddTask?: (data: IncTaskState, order: number | null) => Promise<void>
    task_order: number | null
}

const TaskItem: React.FC<TaskItemProps> = ({ id, name, completed, insertTaskCreation, onAddTask, task_order }) => {
    const [checked, setChecked] = useState(completed)
    const [taskName, setTaskName] = useState(name)
    const [updateReq, setUpdateReq] = useState(false)

    const checkMutation = () => {
        if (id.startsWith("create-task") && onAddTask && taskName != "" && !updateReq) {
            setUpdateReq(true)
            console.log("adding task event")
            const date = new Date()
            onAddTask(
                { id, name: taskName, completed: checked, duedate: date.toISOString().split("T")[0]  },
                task_order
            )
                .then(() => setUpdateReq(false))
            return
        }

        const checkDiff = checked != completed;
        const nameDiff = taskName != name;

        if (checkDiff && nameDiff && !updateReq) {
            // update completed
            console.log("updating completed")
        }
    }

    // add task on enter key pressed
    const onEnterKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key == "Enter" && insertTaskCreation) insertTaskCreation()
    }

    return (
        <div className='flex px-3 py-2.5 hover:bg-gray-100/20 rounded-md items-center space-x-3'>
            <input
                className={`
                    border appearance-none h-6 w-6 hover:cursor-pointer 
                    checked:bg-gray-500 rounded-full peer
                `}
                type="checkbox" 
                checked={checked}
                onClick={() => {
                    setChecked(state => !state)
                    checkMutation()
                }} />
            <div className='peer-checked:text-gray-400/70 flex-auto flex'>
                <input 
                    value={taskName}
                    onChange={e => {
                        const newText = e.target.value;
                        if (newText.length <= 100) setTaskName(newText)
                    }}
                    placeholder={id.startsWith("create-task") ? "enter task name here" : "" }
                    onBlur={checkMutation}
                    onKeyDown={onEnterKey} 
                    type="text" 
                    className='outline-none bg-transparent flex-auto' />
            </div>
        </div>
    )
}

export default TaskItem