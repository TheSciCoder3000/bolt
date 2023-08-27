import { addTask, fetchTasksByMonth } from "api/task"
import CalendarSidebar from "components/calendar/CalendarSidebar"
import MonthlyCalendar from "components/calendar/MonthlyCalendar"
import { format, parse, startOfToday } from "date-fns"
import { useCallback, useEffect, useState } from "react"
import { useOutletContext } from "react-router-dom"

export type FilterKeyT = "all" | "completed" | "unfinished"
export type CalendarView = "month" | "week" | "day";
const CalendarRoute = () => {
  const [tasks, setTasks] = useState<Awaited<ReturnType<typeof fetchTasksByMonth>>>([])
  const [currentMonth, setCurrentMonth] = useState(format(startOfToday(), "MMM-yyyy"));
  const [ModalData, setModalData] = useOutletContext<ReturnType<typeof useState<{ method: string, data: { name: string, date: string } } | null>>>()
  const [view, setView] = useState<CalendarView>("month")
  const [filterKey, setFilterKey] = useState<FilterKeyT>("all")

  const refreshTasks = useCallback(() => {
    const monthDate = parse(currentMonth, "MMM-yyyy", new Date());
    fetchTasksByMonth(monthDate.getFullYear(), monthDate.getMonth() + 1)
      .then(setTasks)
  }, [currentMonth])

  // useEffect for modalData
  useEffect(() => {
    if (ModalData) {
      if (ModalData.method === "create") addTask(ModalData.data).then(refreshTasks)
      setModalData(null)
    } else refreshTasks()

  }, [currentMonth, ModalData, setModalData, refreshTasks])

  return (
    <div className="relative w-full flex">
      <CalendarSidebar view={view} onViewChange={setView} onStatusChange={setFilterKey} />
      <MonthlyCalendar
        refreshTasks={refreshTasks}
        onMonthChange={date => setCurrentMonth(format(date, "MMM-yyyy"))}
        tasks={tasks}
        filterKey={filterKey} />
    </div>
  )
}

export default CalendarRoute