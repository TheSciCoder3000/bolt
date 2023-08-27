import {
    Entity, 
    Column, 
    BaseEntity, 
    PrimaryGeneratedColumn, 
    ManyToOne,
    OneToMany,
    Check,
    JoinColumn
} from "typeorm";
import { User } from "./User.model";
import { Subject } from "./Subject.model";

@Entity('task')
@Check("(task_order IS NOT NULL AND completed_order IS NULL) OR (task_order IS NULL AND completed_order IS NOT NULL)")
export class Task extends BaseEntity {
    @PrimaryGeneratedColumn("increment", {
        type: "bigint"
    })
    id: string;

    @Column({ type: "varchar", length: 100, nullable: false})
    name: string;

    @Column({ type: "timestamptz", nullable: false, default: () => "CURRENT_TIMESTAMP"})
    createdat: string;

    @Column({ type: "text", nullable: true })
    details: string;

    @ManyToOne(
        type => Task,
        task => task.tasks
    )
    parent: Task[]

    @OneToMany(
        type => Task,
        task => task.parent
    )
    @JoinColumn({ name: "parent_id" })
    tasks: Task

    @ManyToOne(
        type => User,
        user => user.tasks
    )
    @JoinColumn({ name: "user_id" })
    user: User

    @ManyToOne(
        type => Subject,
        subj => subj.tasks
    )
    subject: Subject;

    @Column({ type: "date", nullable: false })
    duedate: string[];

    @Column({ type: "timestamp", nullable: true })
    duetime: string[];

    @Column({ type: "int", nullable: true })
    task_order: number;

    @Column({ type: "int", nullable: true })
    completed_order: number;

    @Column({ type: "boolean", nullable: false, default: false })
    completed: boolean;
}