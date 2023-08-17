import { addTask, fetchTasksByMonth } from "api/task"
import CalendarContainer from "components/calendar"
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
    <div className="w-full">
      <CalendarContainer 
        onMonthChange={date => setCurrentMonth(format(date, "MMM-yyyy"))}
        tasks={tasks} />
    </div>
  )
}

export default CalendarRoute