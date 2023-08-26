import axios from "axios";
import { taskState } from "store/task.slice";
import { z } from "zod";

// TODO: replace with .env configuration
const hostname = "http://localhost:3005"

// ============================ Constraints ============================
const TasksByConstraint = z.object({
    id: z.string(),
    name: z.string(),
    duedate: z.string(),
    completed: z.boolean()
}).array()

export async function fetchTasks() {
    return axios({
        method: "get",
        withCredentials: true,
        url: `${hostname}/api/task`
    })
    .then(result => result.data.tasks)
    .catch(() => [] as taskState[])
}

export async function fetchTasksByMonth(year: number, month: number) {
    return axios({
        method: "get",
        withCredentials: true,
        url: `${hostname}/api/task/month/${year}-${month}`
    }).then(res => TasksByConstraint.parse(res.data.tasks))
}

export async function addTask(data: { name: string, date: string }) {
    return axios({
        method: "post",
        data: {
            ...data,
        },
        withCredentials: true,
        url: `${hostname}/api/task`
    })
}

export async function updateTask(id: string, name: string, completed: boolean) {
    return axios({
        method: "put",
        data: {
            name,
            completed
        },
        withCredentials: true,
        url: `${hostname}/api/task/${id}`
    }).then(res => res.data)
}

export async function deleteTask(id: string) {
    return axios({
        method: "delete",
        withCredentials: true,
        url: `${hostname}/api/task/${id}`
    }).then(res => res.data)
}

export async function fetchOverdueCategories(date: string) {
    return axios({
        method: "post",
        data: { date },
        withCredentials: true,
        url: `${hostname}/api/task/overdue`
    }).then(res => res.data.category)
}

export async function fetchCompletedCategories(date: string) {
    return axios({
        method: "post",
        data: { date },
        withCredentials: true,
        url: `${hostname}/api/task/completed`
    }).then(res => res.data.category)
}