import { Entity, Column, BaseEntity, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import Task from "../Task.model";

@Entity('bolt_user')
export default class User extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", length: 25, nullable: false})
    username: string;

    @Column({ type: "varchar", length: 25, nullable: true })
    email: string | null;

    @Column({ type: "text", nullable: false })
    password: string;

    @OneToMany(
        type => Task,
        task => task.user
    )
    tasks: Task[];
}