import React, { useEffect, useState } from 'react'
import { CalendarView, FilterKeyT } from 'routes/CalendarRoute'
import { classNames } from 'util';

interface SidebarProps {
    view: CalendarView;
    onViewChange: (view: CalendarView) => void
    onStatusChange: (status: FilterKeyT) => void
}
const CalendarSidebar: React.FC<SidebarProps> = ({ view, onViewChange, onStatusChange }) => {
  return (
    <div className='w-80 border-r shadow p-6 overflow-auto'>
        <div className='flex mb-8'>
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

        <div>
            <SidebarDropdown 
                name="Status" 
                items={["all", "unfinished", "completed"]} 
                toggleable={false}
                onSelect={(select) => onStatusChange(select[0] as FilterKeyT)} />
        </div>
    </div>
  )
}

interface DropdownProps {
    name: string;
    items: string[];
    onSelect?: (value: string[]) => void;
    toggleable?: boolean;
    multi?: boolean;
}
const SidebarDropdown: React.FC<DropdownProps> = ({ name, items, onSelect, toggleable = true, multi = false }) => {
    const [selectValue, setSelectValue] = useState([items[0]]);
    const [show, setShow] = useState(false);

    useEffect(() => {
        onSelect && onSelect(selectValue)
    }, [selectValue, onSelect])

    const onOptonsSelect = (value: string, add: boolean) => {
        if (!multi) {
            setSelectValue([value])
            setShow(false)
        }
        else setSelectValue(state => {
            if (add) return [...state, value];
            return state.filter(item => item != value)
        })
    }
    return (
        <div className='space-y-2'>
            <div className='pr-3 w-full flex justify-between'>
                <h5>{name}:</h5>
                <h5 className='text-gray-400/80'>{selectValue.length > 1 ? "Custom" : selectValue[0]}</h5>
            </div>
            {(show || !toggleable) && <div className='pl-5 space-y-1'>
                {items.map((item, indx) => (
                    <div key={indx}>
                        <input checked={selectValue.includes(item)} className='mr-2' onChange={(e) => onOptonsSelect(item, e.target.checked)} type="checkbox" />
                        <span>{item as string}</span>
                    </div>
                ))}
            </div>}
        </div>
    )
}

export default CalendarSidebar