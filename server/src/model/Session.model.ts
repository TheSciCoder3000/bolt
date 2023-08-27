import { Entity, Column, BaseEntity, PrimaryColumn, Index } from "typeorm";

@Entity('session')
export class Session extends BaseEntity {
    @PrimaryColumn({ collation: "default" })
    sid: string;

    @Column({ type: "json", nullable: false})
    sess: string;

    @Index("IDX_session_expire")
    @Column({ type: "timestamp", nullable: false })
    expire: string
}