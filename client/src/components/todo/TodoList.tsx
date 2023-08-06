import { useEffect, useRef, useState } from "react"
import TaskItem from "./TaskItem"
import { taskState } from "store/task.slice";
import { useOutletContext, useParams } from "react-router-dom";
import { dateToString, getDateFromString } from "util";
import { useSocketIo, useSocketOn } from "hooks/socket";

interface todoTask {
  id: string;
  name: string;
  completed: boolean;
  duedate: string;
}

type SavingStates = "saving" | "failed" | "saved"
type FocusInputType = { [key: string]: HTMLInputElement | null }

function TodoList() {
  const [category, setCategory] = useState<string[]>([])
  const [tasks, setTasks] = useState<todoTask[]>([])
  const [saving, setSaving] = useState<SavingStates>("saved")
  const [focusIndx, setFocusIndx] = useState<string|null>(null)
  const focusInput = useRef<FocusInputType>({})
  const { todoSec } = useParams()
  const [ModalData, setModalData] = useOutletContext<ReturnType<typeof useState<{ method: string, data: { name: string, date: Date } } | null>>>()
  
  // Socket.io hooks
  const receiveTaskHanlder = (data: taskState[], taskId?: string) => {
    setCategory(data.reduce((total, current) => {
      if (!total.includes(current.duedate)) return [...total, current.duedate]
      return total
    }, [] as string[]))
    setTasks(data.map(item => ({ id: item.id, name: item.name, completed: item.completed, duedate: item.duedate })));
    if (taskId) {
      setSaving("saved")
      setFocusIndx(taskId)
    }
  }

  const socket = useSocketIo()
  useSocketOn(socket, "receive-tasks", receiveTaskHanlder)

  useEffect(() => {
    if (!todoSec) return
    socket?.emit("fetch-tasks", getDateFromString(todoSec))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, todoSec])

  useEffect(() => {
    if (!ModalData || !todoSec) return
    setModalData(null)
    socket?.emit("create-task", {
      affected: [], 
      duedate: ModalData.data.date.toISOString().split("T")[0], 
      task_order: null,
      category: todoSec,
      preData: { name: ModalData.data.name, completed: false },
      dateRange: getDateFromString(todoSec)
    })
  }, [socket, ModalData, setModalData, todoSec])

  useEffect(() => {
    if (focusIndx === null) return
    focusInput.current[focusIndx]?.focus()
    setFocusIndx(null) 
  }, [focusIndx])


  // inserts an empty task item
  const addTaskCreation = (id: string, taskIndx: number, addDate: string) => {
    setSaving("saving")
    if (!todoSec) return 
    const affected = tasks.reduce((prev, current) => {
      if (id === current.id) {
        const task_order = taskIndx + 1;
        return {...prev, found: true, task_order}
      }
      else if (prev.found && current.duedate.startsWith(addDate)) return {...prev, arr: [...prev.arr, current.id]}
      return prev
    }, {found: false, arr: [] as string[], task_order: 0})
    console.log("affected ", affected)

    socket?.emit("create-task", {
      affected: affected.arr, 
      duedate: addDate, 
      task_order: affected.task_order,
      category: todoSec,
      preData: null,
      dateRange: getDateFromString(todoSec)
    })
  }

  const deleteTaskEvent = (taskId: string, taskIndx: number, deleteDate: string) => {
    setSaving("saving")
    if (!todoSec) return
    const affected = tasks.reduce((prev, current) => {
      if (taskId === current.id) {
        const task_order = taskIndx + 1
        return {...prev, found: true, task_order}
      }
      else if (prev.found && current.duedate.startsWith(deleteDate)) return {...prev, arr: [...prev.arr, current.id]}
      return prev
    }, {found: false, arr: [] as string[], task_order: 0})

    socket?.emit("delete-task", {
      category: todoSec,
      id: taskId,
      task_order: affected.task_order,
      affected: affected.arr,
      dateRange: getDateFromString(todoSec)
    })
  }

  const onTaskItemValChange = (newData: {name: string, completed: boolean}, itemId: string) => {
    setTasks(state => state.map((item) => {
      if (itemId === item.id) {
        return {...item, ...newData}
      }
      return item;
    }))
  }

  const onTaskAloneValueChange = (newData: {name: string, completed: boolean}) => {
    if (!todoSec) return
    const date = new Date()
    const task_order = 0
    // console.log(newData)
    socket?.emit("create-task", {
      affected: [],
      duedate: date.toISOString().split("T")[0],
      task_order,
      category: todoSec,
      preData: newData,
      dateRange: getDateFromString(todoSec)
    })
  }

  const updateEvent = (taskId: string, taskName: string, taskCompleted: boolean) => {
    socket?.emit("update-task", {
      id: taskId,
      name: taskName,
      completed: taskCompleted
    })
  }

  const changeFocusEvent = (pos: number, taskArr: todoTask[]) => {
    console.log(pos < 0 || pos > (tasks.length-1))
    if (pos < 0 || pos > (tasks.length-1)) return
    setFocusIndx(taskArr[pos].id)
  }

  return (
    <div className="flex-auto h-full overflow-scroll">
      <div className="p-10">
        <div className="mb-12">
          <h1 className="text-6xl tracking-wide">{(todoSec?.charAt(0).toUpperCase()) + (todoSec?.slice(1) || "")}</h1>
        </div>
        {saving}

        <hr className="mb-3"/>

        <div className="mt-7 space-y-2">
          {category.map(cat => (
            <div>
              {todoSec && !['today', 'tomorrow'].includes(todoSec) && (
                <h4 className="text-xs font-bold text-gray-400/70 tracking-wide">{dateToString(cat.split("T")[0])}</h4>
              )}
              <div className="mt-1 space-y-1">
                {tasks.filter(task => cat === task.duedate).map((task, indx, taskArr) => (
                  <TaskItem 
                    key={task.id} 
                    id={task.id}
                    ref={refEl => focusInput.current[task.id] = refEl}
                    name={task.name}
                    completed={task.completed}
                    insertTaskCreation={() => {
                      addTaskCreation(task.id, indx, cat.split("T")[0])
                    }}
                    onUpdate={updateEvent}
                    focusOnItem={(amnt: number) => changeFocusEvent(indx+amnt, taskArr)}
                    onChange={newData => onTaskItemValChange(newData, task.id)}
                    onDelete={() => deleteTaskEvent(task.id, indx, cat.split("T")[0])} />
                ))}
              </div>
            </div>
          ))}
          {tasks.length === 0 && (
            <TaskItem id="create-task-initial" name="" completed={false} onChange={newData => onTaskAloneValueChange(newData)} />
          )}
        </div>

      </div>
    </div>
  )
}

export default TodoList