import { useEffect, useState } from "react"
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
import { useIsInViewport } from "hooks/calendar";
import DayTaskList from "./DayTaskList";

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
  onDateSelect?: (date: string) => void
}

const CalendarContainer: React.FC<CalendarContainerProps> = ({ onDateSelect }) => {
  const today = startOfToday();
  const [selectedDate, setSelectedDate] = useState(format(today, "MMM-dd-yyyy"));
  const [currentMonth, setCurrentMonth] = useState(format(today, "MMM-yyyy"));
  const firstDayCurrentMonth = parse(currentMonth, "MMM-yyyy", new Date());
  const { activeDateElement, isInView } = useIsInViewport();

  const switchMonth = (amnt: number) => {
    const firstDayNextMonth = add(firstDayCurrentMonth, {months: amnt})
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"))
  }

  const days = eachDayOfInterval({
    start: startOfWeek(firstDayCurrentMonth),
    end: endOfWeek(endOfMonth(firstDayCurrentMonth))
  });

  // run onDateSelect event
  useEffect(() => {
    onDateSelect && onDateSelect(selectedDate);
  }, [selectedDate, onDateSelect])

  useEffect(() => {
    console.log(activeDateElement.current)
    if (!isInView) {
      activeDateElement.current?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    }
  }, [isInView, activeDateElement, selectedDate])

  const goToToday = () => {
    setSelectedDate(format(today, "MMM-dd-yyyy"))
    setCurrentMonth(format(today, "MMM-yyyy"))
  }

  const goToDate = (date: Date) => {
    setSelectedDate(format(date, "MMM-dd-yyyy"));
    if (!isSameMonth(date, firstDayCurrentMonth)) {
      setCurrentMonth(format(date, "MMM-yyyy"));
    }
  }

  return (
    <div className="h-full overflow-auto flex flex-col overflow-x-hidden">
      <div className="box-border p-8 flex justify-between px-5">
        <div>
          <h1 className="text-3xl">{format(firstDayCurrentMonth, "MMMM yyyy")}</h1>
        </div>
        <div className="flex h-full justify-center items-center space-x-10">
          {(!isSameDay(today, parse(selectedDate, "MMM-dd-yyyy", new Date())) || !isSameMonth(today, parse(currentMonth, "MMM-yyyy", new Date()))) && (
            <button onClick={goToToday} className="border-2 font-semibold py-1 px-4 text-xs rounded-md text-green-500 border-green-500 hover:bg-green-500 hover:text-white">Go to Today</button>
          )}
          <div className="h-full flex justify-center items-center space-x-7 pr-5">
            <button className="text-3xl hover:text-gray-400" onClick={() => switchMonth(-1)}>{"<"}</button>
            <button className="text-3xl hover:text-gray-400" onClick={() => switchMonth(1)}>{">"}</button>
          </div>
        </div>
      </div>

      {/* Calendar Main */}
      <div className="flex-auto">
        {/* Calendar Header */}
        <div className="grid grid-cols-7 leading-6 text-center border-y-2">
          {daysHeader.map(day => <div key={day}>{day}</div>)}
        </div>

        {/* Calendar Body */}
        <div className="grid grid-cols-7 h-full">
          {days.map((day, daysIndx) => (
            <div key={day.toString()} className={classNames(
              "bg-white border-y gap-0 aspect-square overflow-hidden h-full",
              "border-x space-y-6",
              daysIndx === 0 && colStartClasses[getDay(day)],
              !isSameMonth(firstDayCurrentMonth, day) ? "text-gray-400/50" : "text-gray-600",
            )}>
              <button 
                ref={isSameDay(day, parse(selectedDate, "MMM-dd-yyyy", new Date())) ? 
                  activeDateElement : null} 
                onClick={() => goToDate(day)} 
                className={classNames(
                "aspect-square w-8",
                "outline-none ml-3 mt-3",
                isSameDay(day, parse(selectedDate, "MMM-dd-yyyy", new Date())) ? 
                  "text-white bg-red-500 rounded-full" :
                  isToday(day) && "text-green-600 font-semibold" 
              )}>{format(day, 'd')}</button>

              <DayTaskList dateString={format(day, "yyyy-MM-dd")} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CalendarContainer