import { fetchTaskByDate } from 'api/task';
import React, { useEffect, useState } from 'react'

type TaskListT = Awaited<ReturnType<typeof fetchTaskByDate>>
interface DayTaskListProps {
    dateString: string;
}
const DayTaskList: React.FC<DayTaskListProps> = ({ dateString }) => {
    const [taskList, setTaskList] = useState<TaskListT>([] as TaskListT);

    useEffect(() => {
        fetchTaskByDate(dateString).then(setTaskList)
    }, [dateString])
    return (
        <div className='space-y-1 '>
            {taskList.map(task => (
                <div className='bg-black text-white text-xs truncate px-2 py-1' key={task.id}>{task.name}</div>
            ))}
        </div>
    )
}

export default DayTaskList