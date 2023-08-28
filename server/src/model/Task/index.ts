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
import User from "../User";
import Subject from "../Subject";

@Entity('task')
@Check("(task_order IS NOT NULL AND completed_order IS NULL) OR (task_order IS NULL AND completed_order IS NOT NULL)")
export default class Task extends BaseEntity {
    @PrimaryGeneratedColumn("increment", {
        type: "bigint"
    })
    id: string;

    @Column({ type: "varchar", length: 100, nullable: false})
    name: string;

    @Column({ type: "timestamptz", nullable: false, default: () => "CURRENT_TIMESTAMP"})
    createdat: string;

    @Column({ type: "text", nullable: true })
    details: string | null;

    @ManyToOne(
        () => Task,
        task => task.tasks,
        { nullable: true }
    )
    @JoinColumn({ name: "parent_id" })
    parent: Task | null

    @OneToMany(
        () => Task,
        task => task.parent
    )
    tasks: Task[]

    @ManyToOne(
        () => User,
        user => user.tasks,
        { nullable: false }
    )
    @JoinColumn({ name: "user_id" })
    user: User

    @ManyToOne(
        () => Subject,
        subj => subj.tasks,
        { nullable: true }
    )
    @JoinColumn({ name: "subject_id" })
    subject: Subject | null;

    @Column({ type: "date", nullable: false })
    duedate: string;

    @Column({ type: "timestamp", nullable: true })
    duetime: string | null;

    @Column({ type: "int", nullable: true })
    task_order: number | null;

    @Column({ type: "int", nullable: true })
    completed_order: number | null;

    @Column({ type: "boolean", nullable: false, default: false })
    completed: boolean;
}