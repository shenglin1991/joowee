import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
} from 'typeorm';

@Entity('people')
export class Person {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ default: 'active' })
    status: string;

    @Column({ default: 0 })
    count: number;

    @CreateDateColumn()
    createdAt: Date;
}
