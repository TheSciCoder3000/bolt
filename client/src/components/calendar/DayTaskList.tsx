import { fetchTasksByMonth } from 'api/task';
import React, { LegacyRef, useEffect } from 'react'
import { useOverflowDetector } from 'react-detectable-overflow';

type TaskListT = Awaited<ReturnType<typeof fetchTasksByMonth>>
interface DayTaskListProps {
    tasks: TaskListT;
}
const DayTaskList: React.FC<DayTaskListProps> = ({ tasks }) => {
    const { ref, overflow } = useOverflowDetector({});

    useEffect(() => {
        console.log(overflow)
    }, [overflow])

    return (
        <div ref={ref as LegacyRef<HTMLDivElement>} className='relative h-full space-y-1 overflow-hidden'>
            {tasks.map(task => (
                <div className='bg-black text-white text-xs truncate px-2 py-1' key={task.id}>{task.name}</div>
            ))}
            {overflow && <button className='absolute left-0 right-0 bottom-0 bg-white'>
                More {">"}
            </button>}
        </div>
    )
}

export default DayTaskList