
export interface UserState {
    id: string;
    username: string;
    tags: string[] | null;
    email: string | null;
}

export interface TUserActions {
    fetchUser: () => Promise<UserState | null>;
}
