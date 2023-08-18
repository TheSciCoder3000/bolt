import { addTask, fetchTasksByMonth } from "api/task"
import MonthlyCalendar from "components/calendar/MonthlyCalendar"
import { format, parse, startOfToday } from "date-fns"
import { useEffect, useState } from "react"
import { useOutletContext } from "react-router-dom"

const CalendarRoute = () => {
  const [tasks, setTasks] = useState<Awaited<ReturnType<typeof fetchTasksByMonth>>>([])
  const [currentMonth, setCurrentMonth] = useState(format(startOfToday(), "MMM-yyyy"));
  const [ModalData, setModalData] = useOutletContext<ReturnType<typeof useState<{ method: string, data: { name: string, date: string } } | null>>>()

  useEffect(() => {
    if (ModalData) {
      if (ModalData.method === "create") addTask(ModalData.data)
      setModalData(null)
    } else {
      const monthDate = parse(currentMonth, "MMM-yyyy", new Date());
      fetchTasksByMonth(monthDate.getFullYear(), monthDate.getMonth() + 1)
        .then(setTasks)
    }

  }, [currentMonth, ModalData, setModalData])

  return (
    <div className="relative w-full">
      <MonthlyCalendar 
        onMonthChange={date => setCurrentMonth(format(date, "MMM-yyyy"))}
        tasks={tasks} />
      <button 
        className='
        aspect-square rounded-full fixed bg-green-500 p-3 text-xs font-bold
        right-10 bottom-4 text-white'>
        Monthly
      </button>
    </div>
  )
}

export default CalendarRoute