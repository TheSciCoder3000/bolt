import { Entity, Column, BaseEntity, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import Task from "../Task.model";

@Entity('subject')
export default class Subject extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", length: 25, nullable: false})
    name: string;

    @OneToMany(
        type => Task,
        task => task.subject
    )
    tasks: Task[]
}