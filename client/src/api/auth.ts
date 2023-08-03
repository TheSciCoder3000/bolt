import axios from "axios";

export async function loginUser(username: string, password: string) {
    return axios({
        method: "post",
        data: {
            username,
            password
        },
        withCredentials: true,
        url: "http://localhost:3005/api/login"
    })
}

export async function testTasks() {
    return axios({
        method: "get",
        withCredentials: true,
        url: "http://localhost:3005/api/tasks"
    })
}

export async function registerUser(username: string, password: string) {
    return axios({
        method: "post",
        data: {
            username,
            password
        },
        withCredentials: true,
        url: "http://localhost:3005/api/register"
    })
}

export async function logoutUser() {
    return axios({
        method: "post",
        withCredentials: true,
        url: "http://localhost:3005/api/logout"
    })
}

interface UserResponse {
    user: {
        id: string;
        tags: string[] | null;
        username: string;
        email: string | null;
    }

}
export async function fetchUserApi() {
    return await axios<UserResponse>({
        method: "post",
        withCredentials: true,
        url: "http://localhost:3005/api/user"
    })
    .then((result) => result.data.user)
    .catch((err) => {
        console.log(err)
        return null
    })
}