import { useEffect, useRef, useState } from "react"
import TaskItem from "./TaskItem"
import { taskState } from "store/task.slice";
import { useParams } from "react-router-dom";
import { getDateFromString } from "util";
import { useSocketIo, useSocketOn } from "hooks/socket";

interface todoTask {
  id: string;
  name: string;
  completed: boolean;
}

type SavingStates = "saving" | "failed" | "saved"
type FocusInputType = HTMLInputElement | null

function TodoList() {
  const [tasks, setTasks] = useState<todoTask[]>([])
  const [saving, setSaving] = useState<SavingStates>("saved")
  const [focusIndx, setFocusIndx] = useState<number|null>(null)
  const focusInput = useRef<FocusInputType[]>([])
  const { todoSec } = useParams()
  
  // Socket.io hooks
  const receiveTaskHanlder = (data: taskState[], taskId?: string, taskIndx?: number) => {
    setTasks(data.map(item => ({ id: item.id, name: item.name, completed: item.completed })))
    if (taskId && taskIndx) {
      setSaving("saved")
      setFocusIndx(taskIndx)
    }
  }

  const socket = useSocketIo()
  useSocketOn(socket, "receive-tasks", receiveTaskHanlder)

  useEffect(() => {
    if (!todoSec) return
    socket?.emit("fetch-tasks", todoSec, getDateFromString(todoSec))
  }, [socket, todoSec])

  useEffect(() => {
    if (focusIndx === null) return
    focusInput.current[focusIndx]?.focus()
    setFocusIndx(null) 
  }, [focusIndx])


  // inserts an empty task item
  const addTaskCreation = (id: string) => {
    setSaving("saving")
    if (!todoSec) return 
    const affected = tasks.reduce((prev, current, indx) => {
      if (id === current.id) {
        const task_order = {} as {[key: string]: number}
        if (todoSec) task_order[todoSec] = indx + 1 || 0
        return {...prev, found: true, task_order}
      }
      else if (prev.found) return {...prev, arr: [...prev.arr, current.id]}
      return prev
    }, {found: false, arr: [] as string[], task_order: {} as {[key:string]: number}})
    const date = new Date()

    socket?.emit("create-task", {
      affected: affected.arr, 
      duedate: date.toISOString().split("T")[0], 
      task_order: affected.task_order,
      category: todoSec,
      preData: null,
      dateRange: getDateFromString(todoSec)
    })
  }

  const deleteTaskEvent = (taskId: string) => {
    setSaving("saving")
    if (!todoSec) return
    const affected = tasks.reduce((prev, current, indx) => {
      if (taskId === current.id) {
        const task_order = {} as {[key: string]: number}
        if (todoSec) task_order[todoSec] = indx + 1 || 0
        return {...prev, found: true, task_order}
      }
      else if (prev.found) return {...prev, arr: [...prev.arr, current.id]}
      return prev
    }, {found: false, arr: [] as string[], task_order: {} as {[key:string]: number}})

    socket?.emit("delete-task", {
      category: todoSec,
      id: taskId,
      task_order: affected.task_order,
      affected: affected.arr,
      dateRange: getDateFromString(todoSec)
    })
  }

  const onTaskItemValChange = (newData: {name: string, completed: boolean}, item_pos: number) => {
    setTasks(state => state.map((item, indx) => {
      if (item_pos === indx) {
        return {...item, ...newData}
      }
      return item;
    }))
  }

  const onTaskAloneValueChange = (newData: {name: string, completed: boolean}) => {
    const date = new Date()
    const task_order = {} as {[key: string]: number}
    if (todoSec) task_order[todoSec] = 0
    // console.log(newData)
    socket?.emit("create-task", {
      affected: [],
      duedate: date.toISOString().split("T")[0],
      task_order,
      category: todoSec,
      preData: newData
    })
  }

  const updateEvent = (taskId: string, taskName: string, taskCompleted: boolean) => {
    socket?.emit("update-task", {
      id: taskId,
      name: taskName,
      completed: taskCompleted
    })
  }

  const changeFocusEvent = (pos: number) => {
    console.log(pos < 0 || pos > (tasks.length-1))
    if (pos < 0 || pos > (tasks.length-1)) return
    setFocusIndx(pos)
  }

  return (
    <div className="flex-auto">
      <div className="p-10">
        <div className="mb-12">
          <h1 className="text-6xl tracking-wide">Today</h1>
        </div>
        {saving}
        <hr className="mb-3"/>
        <div className="space-y-3">
          {tasks.map((task, indx) => (
            <TaskItem 
              key={task.id} 
              id={task.id}
              ref={refEl => focusInput.current[indx] = refEl}
              name={task.name}
              completed={task.completed}
              insertTaskCreation={() => {
                addTaskCreation(task.id)
              }}
              onUpdate={updateEvent}
              focusOnItem={(amnt: number) => changeFocusEvent(indx+amnt)}
              onChange={newData => onTaskItemValChange(newData, indx)}
              onDelete={() => deleteTaskEvent(task.id)} />
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