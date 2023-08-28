import "reflect-metadata";
import { DataSource, EntityManager } from 'typeorm'
import User from "./User.model"
import Task from "./Task.model"
import Subject from "./Subject.model"
import { Session } from "./Session.model"

const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.PGHOST,
    port: parseInt(process.env.PGPORT || "5432"),
    username: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    entities: [User, Task, Subject, Session],
    synchronize: true,
    // logging: false,
})

export default AppDataSource;

export const UserRepository = AppDataSource.getRepository(User);

export const TaskRepository = AppDataSource.getRepository(Task);

export const SubjectRepository = AppDataSource.getRepository(Subject);

export const PgTransaction = async (cb: (entityManager: EntityManager) => Promise<unknown>) => AppDataSource.transaction(cb)