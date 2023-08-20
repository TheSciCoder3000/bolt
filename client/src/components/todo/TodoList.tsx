import React, { useEffect, useRef, useState } from "react"
import TaskItem from "./TaskItem"
import { taskState } from "store/task.slice";
import { useParams } from "react-router-dom";
import { dateToString } from "util";
import { CategoryState, SocketAddTask, SocketDeleteTask, SocketUpdateTask, useSocketOn } from "hooks/socket";
import { Socket } from "socket.io-client";
import TaskItemContextMenu, { CbFromContext, DataFromContext } from 'components/modal/TaskItemContextMenu';

const initialContextMenuState = {
    show: false,
    x: 0,
    y: 0,
    id: null as string | null,
    completed: false
}

interface todoTask {
  id: string;
  name: string;
  completed: boolean;
  duedate: string;
}

type SavingStates = "saving" | "failed" | "saved"
type FocusInputType = { [key: string]: HTMLInputElement | null }

interface TodoListProps {
  category: CategoryState;
  displayHeaders: boolean;
  socket: Socket;
  onSaving: React.Dispatch<React.SetStateAction<SavingStates>>;
}
const TodoList: React.FC<TodoListProps> = ({ category, displayHeaders, socket, onSaving }) => {
  const { todoSec } = useParams();
  const [tasks, setTasks] = useState<todoTask[]>([])
  const [focusIndx, setFocusIndx] = useState<string|null>(null)
  const focusInput = useRef<FocusInputType>({})
  const [contextMenu, setContextMenu] = useState(initialContextMenuState);


  const receiveTaskHanlder = (data: taskState[], taskId?: string) => {
    setTasks(data.map(item => ({
        id: item.id, 
        name: item.name, 
        completed: item.completed, 
        duedate: item.duedate,
        task_order: item.task_order,
        completed_order: item.completed_order
    })));
    if (taskId) {
        onSaving("saved")
        setFocusIndx(taskId)
    }
  }
  useSocketOn(socket, `receive-tasks-${category.date}-${category.isCompleted.toString()}`, receiveTaskHanlder);

  useEffect(() => {
    if (!todoSec) return
    socket?.emit("fetch-tasks", {
      ...category,
      date: category.date
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, todoSec])

  useEffect(() => {
    if (focusIndx === null) return
    focusInput.current[focusIndx]?.focus()
    setFocusIndx(null) 
  }, [focusIndx])

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
          category.date
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


  // inserts an empty task item
  const addTaskCreation = (taskIndx: number, addDate: string) => {
    onSaving("saving")
    if (!todoSec) return

    const socketData: SocketAddTask = {
      duedate: addDate, 
      task_order: taskIndx + 1,
      preData: null,
      isCompleted: category.isCompleted,
      category
    }
    console.log("add task activated", socketData)

    socket?.emit("create-task", socketData)
  }

  const deleteTaskEvent = (taskId: string, taskIndx: number, deleteDate: string) => {
    onSaving("saving")
    if (!todoSec) return
    const taskDelete: SocketDeleteTask = {
      id: taskId,
      duedate: deleteDate,
      task_order: taskIndx + 1,
      category
    }
    socket?.emit("delete-task", taskDelete)
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
    const task_order = 0
    // console.log(newData)
    const taskCreate: SocketAddTask = {
      duedate: category.date,
      task_order,
      category,
      preData: newData,
      isCompleted: category.isCompleted
    }
    socket?.emit("create-task", taskCreate)
  }

  const updateEvent = (taskId: string, taskName: string, taskCompleted: boolean) => {
    socket?.emit("update-task", {
      id: taskId,
      name: taskName,
      completed: taskCompleted,
      category
    } as SocketUpdateTask)
  }

  const changeFocusEvent = (pos: number, taskArr: todoTask[]) => {
    console.log(pos < 0 || pos > (tasks.length-1))
    if (pos < 0 || pos > (tasks.length-1)) return
    setFocusIndx(taskArr[pos].id)
  }

  const contextMenuHandler = (e: React.MouseEvent<HTMLElement, MouseEvent>, id: string, completed: boolean) => {
    e.preventDefault();
    console.log(id, completed)

    setContextMenu({ show: true, x: e.pageX, y: e.pageY, id, completed })
  }

  return (
    <>
      <div>
        {displayHeaders && tasks.length !== 0 && (
          <h4 className="text-xs font-bold text-gray-400/70 tracking-wide">{dateToString(new Date(category.date))}</h4>
        )}
        {category.isCompleted && todoSec !== "completed" && tasks.length !== 0 && (
          <h4 className="mt-20 text-xs font-bold text-gray-400/70 tracking-wide">Completed</h4>
        )}
        <div className="mt-1 space-y-1">
          {tasks.filter(task => task.completed === category.isCompleted).map((task, indx, taskArr) => (
            <TaskItem 
              key={task.id} 
              id={task.id}
              ref={refEl => focusInput.current[task.id] = refEl}
              name={task.name}
              completed={task.completed}
              insertTaskCreation={() => {
                addTaskCreation(indx, category.date)
              }}
              onUpdate={updateEvent}
              focusOnItem={(amnt: number) => changeFocusEvent(indx+amnt, taskArr)}
              onChange={newData => onTaskItemValChange(newData, task.id)}
              onContextMenu={e => contextMenuHandler(e, task.id, task.completed)}
              onDelete={() => deleteTaskEvent(task.id, indx, category.date)} />
          ))}
        </div>
      </div>
      {!category.isCompleted && tasks.length === 0 && ['today', 'tomorrow'].includes(todoSec as string) && (
        <TaskItem id="create-task-initial" name="" completed={false} onChange={newData => onTaskAloneValueChange(newData)} />
      )}
      {contextMenu.show && <TaskItemContextMenu completed={contextMenu.completed} updateTask={updateFromContext} x={contextMenu.x} y={contextMenu.y} closeContextMenu={closeContextMenu} />}

    </>
  )
}

export default TodoList