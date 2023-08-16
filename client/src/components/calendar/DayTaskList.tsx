import { fetchTasksByMonth } from 'api/task';
import React from 'react'

type TaskListT = Awaited<ReturnType<typeof fetchTasksByMonth>>
interface DayTaskListProps {
    tasks: TaskListT;
}
const DayTaskList: React.FC<DayTaskListProps> = ({ tasks }) => {
    return (
        <div className='space-y-1 '>
            {tasks.map(task => (
                <div className='bg-black text-white text-xs truncate px-2 py-1' key={task.id}>{task.name}</div>
            ))}
        </div>
    )
}

export default DayTaskList