import { immer } from "zustand/middleware/immer";
import { create } from "zustand";
import { taskActions, taskState } from "./task.slice";
import { TUserActions, UserState } from "./user.slice";
import { fetchUserApi } from "api/auth";
import { fetchTasks } from "api/task";

interface State {
    tasks: taskState[]
    user: UserState | null;
}

type Action = taskActions & TUserActions;

// type Get<T, K, F> = K extends keyof T ? T[K] : F;
// type setState = Get<Mutate<StoreApi<T>, Mis>, 'setState', never>

export const useStore = create(immer<State & Action>((set) => ({
    tasks: [],
    user: null,
    fetchUser: async () => {
        return await fetchUserApi()
            .then(user => {
                set(() => ({ user: user }));
                return user;
            })

    },

    fetchTasks: () => set(async () => {
        const tasks = await fetchTasks()
        console.log(tasks)
        return { tasks: tasks }
    })
})))