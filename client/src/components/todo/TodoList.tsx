import { useEffect, useRef, useState } from "react"
import TaskItem from "./TaskItem"
import { taskState } from "store/task.slice";
import { useOutletContext, useParams } from "react-router-dom";
import { dateToString, getDateFromString } from "util";
import { useSocketIo, useSocketOn } from "hooks/socket";
import TaskItemContextMenu from "components/modal/TaskItemContextMenu";

interface todoTask {
  id: string;
  name: string;
  completed: boolean;
  duedate: string;
}

interface SocketAddTask {
  task_order: number | null;
  duedate: string;
  dateRange: string[];
  preData?: {
      name: string;
      completed: boolean;
  } | null;
}

interface SocketDeleteTask {
  completed: boolean;
  task_order: number;
  duedate: string;
  dateRange: string[];
  id: string;
}

interface SocketUpdateTask {
  name: string;
  completed: boolean;
  id: string;
}

type SavingStates = "saving" | "failed" | "saved"
type FocusInputType = { [key: string]: HTMLInputElement | null }

export interface DataFromContext {
  name: string;
  completed: boolean;
}
export type CbFromContext = (state: DataFromContext) => DataFromContext


const initialContextMenuState = {
  show: false,
  x: 0,
  y: 0,
  id: null as string | null,
  completed: false
}

function TodoList() {
  const [category, setCategory] = useState<string[]>([])
  const [tasks, setTasks] = useState<todoTask[]>([])
  const [saving, setSaving] = useState<SavingStates>("saved")
  const [focusIndx, setFocusIndx] = useState<string|null>(null)
  const focusInput = useRef<FocusInputType>({})
  const { todoSec } = useParams()
  const [ModalData, setModalData] = useOutletContext<ReturnType<typeof useState<{ method: string, data: { name: string, date: Date } } | null>>>()
  const [contextMenu, setContextMenu] = useState(initialContextMenuState)

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
    else if (todoSec === "completed") socket?.emit("fetch-completed-tasks")
    else socket?.emit("fetch-tasks", getDateFromString(todoSec))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, todoSec])

  useEffect(() => {
    if (!ModalData || !todoSec || todoSec === "completed") return
    setModalData(null)
    socket?.emit("create-task", {
      task_order: null,
      duedate: ModalData.data.date.toISOString().split("T")[0], 
      preData: { name: ModalData.data.name, completed: false },
      dateRange: getDateFromString(todoSec)
    } as SocketAddTask)
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

    const socketData: SocketAddTask = {
      duedate: addDate, 
      task_order: affected.task_order,
      preData: null,
      dateRange: todoSec === "completed" ? [todoSec] : getDateFromString(todoSec)
    }
    console.log("add task activated", socketData)

    socket?.emit("create-task", socketData)
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
      id: taskId,
      completed: tasks.find(item => item.id === taskId ? item : null)?.completed,
      duedate: deleteDate.split("T")[0],
      task_order: affected.task_order,
      dateRange: todoSec === "completed" ? [todoSec] : getDateFromString(todoSec)
    } as SocketDeleteTask)
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
    } as SocketAddTask)
  }

  const updateEvent = (taskId: string, taskName: string, taskCompleted: boolean) => {
    socket?.emit("update-task", {
      id: taskId,
      name: taskName,
      completed: taskCompleted
    } as SocketUpdateTask)
  }

  const changeFocusEvent = (pos: number, taskArr: todoTask[]) => {
    console.log(pos < 0 || pos > (tasks.length-1))
    if (pos < 0 || pos > (tasks.length-1)) return
    setFocusIndx(taskArr[pos].id)
  }

  const contextMenuHandler = (e: React.MouseEvent<HTMLElement, MouseEvent>, id: string, completed: boolean) => {
    e.preventDefault();
    console.log(id)

    setContextMenu({ show: true, x: e.pageX, y: e.pageY, id, completed })
  }

  const closeContextMenu = () => {
    setContextMenu(initialContextMenuState)
  }

  const updateFromContext = (data: null | DataFromContext | CbFromContext) => {
    if (contextMenu.id === null) return
    const taskData = tasks.find(item => item.id === contextMenu.id);
    const taskIndx = tasks.findIndex(item => item.id === contextMenu.id)
    if (!taskData || taskIndx === -1) return

    if (data === null) {
      deleteTaskEvent(
        contextMenu.id,
        taskIndx,
        taskData.duedate.split("T")[0]
      )
    } else {
      const parsedData = typeof data === "function" ? 
        data({ name: taskData.name, completed: taskData.completed }) : data;
      updateEvent(
        contextMenu.id,
        parsedData.name,
        parsedData.completed
      )
      setTasks(state => state.map(item => {
        if (item.id === contextMenu.id) return {...item, name: parsedData.name, completed: parsedData.completed}
        return item
      }))
    }
  }

  return (
    <div className="flex-auto h-full overflow-y-auto">
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
                    onContextMenu={e => contextMenuHandler(e, task.id, task.completed)}
                    onDelete={() => deleteTaskEvent(task.id, indx, cat.split("T")[0])} />
                ))}
              </div>
            </div>
          ))}
          {tasks.length === 0 && ['today', 'tomorrow'].includes(todoSec as string) && (
            <TaskItem id="create-task-initial" name="" completed={false} onChange={newData => onTaskAloneValueChange(newData)} />
          )}
        </div>
        {contextMenu.show && <TaskItemContextMenu completed={contextMenu.completed} updateTask={updateFromContext} x={contextMenu.x} y={contextMenu.y} closeContextMenu={closeContextMenu} />}
      </div>
    </div>
  )
}

export default TodoList