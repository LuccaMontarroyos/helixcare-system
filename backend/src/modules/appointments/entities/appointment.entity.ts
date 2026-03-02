import { Table, Column, Model, DataType, ForeignKey, BelongsTo, CreatedAt, UpdatedAt, DeletedAt } from 'sequelize-typescript';
import { Patient } from '../../patients/entities/patient.entity';
import { User } from '../../users/entities/user.entity';
import { AppointmentStatusEnum } from '../enums/appointment-status.enum';

@Table({
  tableName: 'appointments',
  underscored: true,
  timestamps: true,
  paranoid: true,
})
export class Appointment extends Model<Appointment> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Patient)
  @Column({ type: DataType.UUID, allowNull: false })
  declare patient_id: string;

  @BelongsTo(() => Patient)
  patient: Patient;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare doctor_id: string;

  @BelongsTo(() => User)
  doctor: User;

  @Column({ type: DataType.DATE, allowNull: false })
  appointment_date: Date;

  @Column({ 
    type: DataType.STRING(20), 
    allowNull: false,
    defaultValue: AppointmentStatusEnum.SCHEDULED 
  })
  status: AppointmentStatusEnum;

  @Column({ type: DataType.TEXT, allowNull: true })
  notes: string;

  @CreatedAt
  declare created_at: Date;

  @UpdatedAt
  declare updated_at: Date;

  @DeletedAt
  declare deleted_at: Date;
}