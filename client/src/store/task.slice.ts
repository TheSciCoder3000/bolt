export interface taskState extends IncTaskState {
    details: string;
    tags: string[] | null;
    createdat: string;
    parent_id: number | null;
    subject_id: number | null;
    user_id: string;
}

export interface IncTaskState {
    id: string;
    name: string;
    duedate: string;
    task_order?: JSON;
    completed: boolean;
}

// TODO: update payload
// interface UpdatedData {
//     name?: string;
//     parent_id?: number;

// }

export interface taskActions {
    fetchTasks: () => void
    // getTask: (id: string) => void;
    // updateTask: (id: string, updatedData: UpdatedData) => void;
}