import { useEffect, useState } from "react"
import TaskItem from "./TaskItem"
import { addTask, fetchTasks } from "api/task";
import { IncTaskState } from "store/task.slice";
import { v4 as uuidv4 } from 'uuid';

interface todoTask {
  id: string;
  name: string;
  completed: boolean;
}

type SavingStates = "saving" | "failed" | "saved"


function TodoList() {
  // const _tasks: todoTask[] = [
  //   {
  //     id: "0",
  //     name: "testing",
  //     completed: false
  //   },
  //   {
  //     id: "0",
  //     name: "testing",
  //     completed: false
  //   },
  // ]
  const [tasks, setTasks] = useState<todoTask[]>([])
  const [saving, setSaving] = useState<SavingStates>("saved")

  const getTasks = () => {
    fetchTasks().then(data => {
      const parsedData: todoTask[] = 
        data.map(item => ({ id: item.id, name: item.name, completed: item.completed }))

      setTasks(parsedData)
    })
  }
  useEffect(getTasks, [])


  // inserts an empty task item
  const addTaskCreation = (id: string) => setTasks(state => {
    return state
      // .filter(todoVal => !todoVal.id.startsWith("create-task"))
      .reduce((prev, current) => {
        if (id === current.id) return [...prev, current, {
          id: `create-task-${uuidv4()}`, 
          name: "", 
          completed: false 
        }]
        return [...prev, current]
      }, [] as typeof state)
  })

  const addTaskEvent = async (data: IncTaskState, order: number | null) => {
    setSaving("saving")
    console.log("sending get request")
    console.log({data})

    const affected = order != null ? tasks.reduce((prev, current, indx) => {
      if (order === indx) return {...prev, found: true}
      else if (prev.found) return {...prev, arr: [...prev.arr, current.id]}
      return prev
    }, {found: false, arr: [] as string[]}) : null

    console.log({affected})
    return addTask(data, {name: "today", order, affected: affected?.arr || []})
      .then(() => {
        getTasks()
        setSaving("saved")
      })
      .catch(err => console.log(err))
    // send post request to create task
    // on success: change id to a the id generated from the server
    // on error: reattempt 5 times
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
              name={task.name}
              task_order={indx}
              completed={task.completed}
              insertTaskCreation={() => addTaskCreation(task.id)}
              onAddTask={addTaskEvent} />
          ))}
          {tasks.length === 0 && (
            <TaskItem id="create-task-initial" name="" completed={false} task_order={null} onAddTask={addTaskEvent} />
          )}
        </div>
      </div>
    </div>
  )
}

export default TodoList