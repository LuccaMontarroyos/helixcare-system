import { Table, Column, Model, DataType, ForeignKey, BelongsTo, CreatedAt, UpdatedAt, DeletedAt } from 'sequelize-typescript';
import { Patient } from '../../patients/entities/patient.entity';
import { User } from '../../users/entities/user.entity';
import { ExamStatusEnum } from '../enums/exam-status.enum';

@Table({
  tableName: 'exams',
  underscored: true,
  timestamps: true,
  paranoid: true,
})
export class Exam extends Model<Exam> {
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

  @BelongsTo(() => User, 'doctor_id')
  declare doctor: User;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true })
  declare lab_technician_id: string;

  @BelongsTo(() => User, 'lab_technician_id')
  declare lab_technician: User;

  @Column({ type: DataType.STRING(150), allowNull: false })
  declare exam_type: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare observations: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare result_text: string;

  @Column({ 
    type: DataType.STRING(20), 
    allowNull: false,
    defaultValue: ExamStatusEnum.REQUESTED 
  })
  declare status: ExamStatusEnum;

  @Column({ type: DataType.STRING(500), allowNull: true })
  declare result_file_url: string;

  @CreatedAt
  declare created_at: Date;

  @UpdatedAt
  declare updated_at: Date;

  @DeletedAt
  declare deleted_at: Date;
}