import React, { useEffect, useRef, useState } from 'react'
import Modal from "./index"
import { useHotkeys } from 'react-hotkeys-hook'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css";
import { toPgDateString } from 'util';

interface AddModalProps {
    onExit: () => void
    onSubmit: (state: { method: string, data: unknown } | null) => void
}

const AddTaskModal: React.FC<AddModalProps> = ({ onExit, onSubmit }) => {
    useHotkeys("esc", onExit)
    const taskInput = useRef<HTMLInputElement>(null)
    const [quickTaskName, setQuickTaskName] = useState("")
    const [startDate, setStartDate] = useState<Date | null>(new Date());

    useEffect(() => {
        taskInput.current?.focus();
    }, [taskInput])

    const quickTaskCreationHandler = () => {
        if (quickTaskName != "" && startDate) {
            onSubmit({method: "create", data: { name: quickTaskName, date: toPgDateString(startDate) }})
            onExit()
        }
    }

    return (
        <Modal>
            <div className='absolute w-full top-5 left-0 right-0 flex justify-center'>
                <div className='px-10 rounded-md shadow-md py-10 h-22 bg-gray-50 space-y-3'>
                    <div className='flex justify-between'>
                        <h4 className='font-bold'>Quick Task</h4>
                        <button className='' onClick={onExit}>X</button>
                    </div>
                    <div className='border border-gray-300 overflow-hidden rounded-md'>
                        <input 
                            ref={taskInput} 
                            onChange={e => setQuickTaskName(e.target.value)} 
                            value={quickTaskName} 
                            className='w-80 outline-none px-2 py-1.5 text-sm border-r border-gray-300' type="text" />
                        {/* <button className='text-sm px-4 hover:bg-gray-100'>Schedule</button> */}
                        <DatePicker selected={startDate} onChange={date => setStartDate(date)} showTimeSelect />
                    </div>
                    <div className='flex justify-between pr-2'>
                        <button 
                            className='px-2 py-2 text-xs text-white bg-green-500 hover:bg-green-500/80 rounded-md disabled:bg-green-300 disabled:hover:cursor-not-allowed'
                            onClick={quickTaskCreationHandler} 
                            disabled={quickTaskName === "" || startDate === null} >
                                Add Task
                            </button>
                        <div>
                            <button>test</button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    )
}

export default AddTaskModal