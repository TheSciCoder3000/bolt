import React from 'react'
import { CalendarView } from 'routes/CalendarRoute'
import { classNames } from 'util';

interface SidebarProps {
    view: CalendarView;
    onViewChange: (view: CalendarView) => void
}
const CalendarSidebar: React.FC<SidebarProps> = ({ view, onViewChange }) => {
  return (
    <div className='w-80 border-r shadow p-6'>
        <div className='flex'>
            <button onClick={() => onViewChange("month")} className={classNames(
                "text-sm py-1 flex-1 border-y-2",
                'border-l-2 rounded-l-md',
                view === "month" && "bg-green-500 text-white border-green-500" 
                )}>Month</button>
            <button onClick={() => onViewChange("week")} className={classNames(
                "text-sm py-1 flex-1 border-y-2",
                'border-x-2',
                view === "week" && "bg-green-500 text-white border-green-500" 
                )}>Week</button>
            <button onClick={() => onViewChange("day")} className={classNames(
                "text-sm py-1 flex-1 border-y-2",
                'border-r-2 rounded-r-md',
                view === "day" && "bg-green-500 text-white border-green-500"
                )}>Day</button>
        </div>
    </div>
  )
}

export default CalendarSidebar