import { Table, Column, Model, DataType, ForeignKey, BelongsTo, CreatedAt, UpdatedAt, DeletedAt, AllowNull } from 'sequelize-typescript';
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
  declare patient: Patient;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare doctor_id: string;

  @BelongsTo(() => User)
  declare doctor: User;

  @Column({ type: DataType.DATE, allowNull: false })
  declare appointment_date: Date;

  @Column({ 
    type: DataType.STRING(20), 
    allowNull: false,
    defaultValue: AppointmentStatusEnum.SCHEDULED 
  })
  declare status: AppointmentStatusEnum;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare notes: string;

  @Column({ type: DataType.UUID,
  allowNull: true })
  declare rescheduled_from_id: string;

  @CreatedAt
  declare created_at: Date;

  @UpdatedAt
  declare updated_at: Date;

  @DeletedAt
  declare deleted_at: Date;
}