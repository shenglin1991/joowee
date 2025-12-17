import {
    Entity,
    Column,
    PrimaryColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Person } from './person.entity';

@Entity('daily_presenter')
export class Daily {
    @PrimaryColumn()
    id: string = 'current'; // Toujours 'current' pour avoir un seul enregistrement

    @Column({ nullable: true })
    selectedPersonId: string;

    @ManyToOne(() => Person, { nullable: true })
    @JoinColumn({ name: 'selectedPersonId' })
    selectedPerson: Person;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
