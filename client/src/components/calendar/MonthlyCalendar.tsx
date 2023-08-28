import React, { forwardRef, useEffect, useMemo, useRef, useState } from "react"
import {
  add, 
  eachDayOfInterval, 
  endOfMonth, 
  endOfWeek, 
  format, 
  getDay, 
  isSameDay, 
  isSameMonth, 
  isToday, 
  parse, 
  startOfToday, 
  startOfWeek 
} from "date-fns";
import DayTaskList from "./DayTaskList";
import { fetchTasksByMonth } from "api/task";
import { FilterKeyT } from "routes/CalendarRoute";

// const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const daysHeader = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const colStartClasses = [
  '',
  'col-start-2',
  'col-start-3',
  'col-start-4',
  'col-start-5',
  'col-start-6',
  'col-start-7',
]

const classNames = (...classes: (string | boolean)[]) => classes.filter(Boolean).join(" ");

interface CalendarContainerProps {
  onDateSelect?: (date: Date) => void;
  onMonthChange?: (date: Date) => void;
  tasks: Awaited<ReturnType<typeof fetchTasksByMonth>>;
  refreshTasks: () => void;
  filterKey: FilterKeyT
}
interface Days {
  date: Date;
  tasks: {
    id: string;
    name: string;
    duedate: string;
    completed: boolean;
  }[];
}

const MonthlyCalendar: React.FC<CalendarContainerProps> = ({ onDateSelect, tasks, refreshTasks, filterKey, onMonthChange }) => {
  const today = startOfToday();
  const [selectedDate, setSelectedDate] = useState(format(today, "MMM-dd-yyyy"));
  const [currentMonth, setCurrentMonth] = useState(format(today, "MMM-yyyy"));
  const firstDayCurrentMonth = parse(currentMonth, "MMM-yyyy", new Date());
  const activeDateElement = useRef<HTMLButtonElement>(null);

  const switchMonth = (amnt: number) => {
    const firstDayNextMonth = add(firstDayCurrentMonth, {months: amnt})
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"))
    onMonthChange && onMonthChange(firstDayNextMonth)
  }

  const days: Days[] = useMemo(() => {
    const dates = eachDayOfInterval({
      start: startOfWeek(firstDayCurrentMonth),
      end: endOfWeek(endOfMonth(firstDayCurrentMonth))
    }).map(date => ({ date, tasks: [] as typeof tasks }));

    return tasks
    .filter(item => {
      switch (filterKey) {
        case "all":
          return true;
        case "completed":
          return item.completed
        case "unfinished":
          return !item.completed
        default:
          return true;
      }
    }).reduce((total, current) => total.map((item) => {
      if (isSameDay(parse(current.duedate, "yyyy-MM-dd", new Date()), item.date)) {
        return {...item, tasks: [...item.tasks, current]}
      }
      return item
    }), dates)
  }, [firstDayCurrentMonth, tasks, filterKey])

  // run onDateSelect event
  useEffect(() => {
    onDateSelect && onDateSelect(parse(selectedDate, "MMM-dd-yyyy", new Date()));
  }, [selectedDate, onDateSelect])

  useEffect(() => {
    activeDateElement.current?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
  }, [activeDateElement, selectedDate])

  const goToToday = () => {
    setSelectedDate(format(today, "MMM-dd-yyyy"))
    if (!isSameMonth(today, firstDayCurrentMonth)) {
      setCurrentMonth(format(today, "MMM-yyyy"));
    }
  }

  const goToDate = (date: Date) => {
    setSelectedDate(format(date, "MMM-dd-yyyy"));
    if (!isSameMonth(date, firstDayCurrentMonth)) {
      setCurrentMonth(format(date, "MMM-yyyy"));
    }
  }

  return (
    <div className="relative h-full overflow-auto flex flex-col flex-1 overflow-x-hidden py-12 select-none">
      <div className="box-border flex justify-between px-5 mb-5">
        <div>
          <h1 className="text-3xl">{format(firstDayCurrentMonth, "MMMM yyyy")}</h1>
        </div>
        <div className="flex h-full justify-center items-center space-x-10">
          {(!isSameDay(today, parse(selectedDate, "MMM-dd-yyyy", new Date())) || !isSameMonth(today, parse(currentMonth, "MMM-yyyy", new Date()))) && (
            <button onClick={goToToday} className="border-2 font-semibold py-1 px-4 text-xs rounded-md text-green-500 border-green-500 hover:bg-green-500 hover:text-white">Go to Today</button>
          )}
          <div className="h-full flex justify-center items-center space-x-7 pr-5">
            <button className="text-3xl hover:text-gray-400 outline-none" onClick={() => switchMonth(-1)}>{"<"}</button>
            <button className="text-3xl hover:text-gray-400 outline-none" onClick={() => switchMonth(1)}>{">"}</button>
          </div>
        </div>
      </div>

      {/* Calendar Main */}
      <div className="flex-auto p-5">
        {/* Calendar Header */}
        <div className="grid grid-cols-7 leading-6 text-center border-2">
          {daysHeader.map(day => <div key={day}>{day}</div>)}
        </div>

        {/* Calendar Body */}
        <div className="grid grid-cols-7 h-full">
          {days.map((day, daysIndx) => (
            <DateCell 
              key={daysIndx} 
              ref={activeDateElement}
              day={day}
              selectedDate={selectedDate}
              goToDate={goToDate}
              refreshTasks={refreshTasks}
              className={classNames(
                "bg-white border-y overflow-hidden w-full",
                "border-x space-y-6",
                daysIndx === 0 && colStartClasses[getDay(day.date)],
                !isSameMonth(firstDayCurrentMonth, day.date) ? "text-gray-400/50" : "text-gray-600",
              )} />
          ))}
        </div>
      </div>
    </div>
  )
}

interface DateCellProps {
  day: Days;
  selectedDate: string;
  goToDate: (date: Date) => void;
  refreshTasks: () => void;
  className?: string;
}
const DateCell = forwardRef<HTMLButtonElement, DateCellProps>(({ day, className, selectedDate, goToDate, refreshTasks }, activeDateElement) => {
  const cont = useRef<HTMLDivElement>(null);
  const [cellWidth, setCellWidth] = useState<number | null>(null);

  useEffect(() => {
    const handler = () => {
      setCellWidth(cont.current?.offsetWidth || 0);
    }
    window.addEventListener("resize", handler)
    handler();

    return () => {
      window.removeEventListener("resize", handler)
    }
  }, [])
  return (
    <div ref={cont} className={className || ""} style={{
      minHeight: cellWidth || 0
    }}>
      <div>
        <button 
          ref={isSameDay(day.date, parse(selectedDate, "MMM-dd-yyyy", new Date())) ? 
            activeDateElement : null} 
          onClick={() => goToDate(day.date)} 
          className={classNames(
            "aspect-square w-8",
            "outline-none ml-1.5 mt-2",
            isSameDay(day.date, parse(selectedDate, "MMM-dd-yyyy", new Date())) ? 
              "text-white bg-red-500 rounded-full" :
              isToday(day.date) && "text-green-600 font-semibold" 
          )}>{format(day.date, 'd')}</button>
      </div>

      <DayTaskList refreshTasks={refreshTasks} tasks={day.tasks} />
    </div>
  )
})

export default MonthlyCalendar