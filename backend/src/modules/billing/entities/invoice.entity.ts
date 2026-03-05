import { Table, Column, Model, DataType, ForeignKey, BelongsTo, CreatedAt, UpdatedAt, DeletedAt } from 'sequelize-typescript';
import { Patient } from '../../patients/entities/patient.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Exam } from '../../exams/entities/exam.entity';
import { InvoiceStatusEnum } from '../enums/invoice-status.enum';
import { PaymentMethodEnum } from '../enums/payment-method.enum';

@Table({
  tableName: 'invoices',
  underscored: true,
  timestamps: true,
  paranoid: true,
})
export class Invoice extends Model<Invoice> {
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

  @ForeignKey(() => Appointment)
  @Column({ type: DataType.UUID, allowNull: true })
  declare appointment_id: string;

  @BelongsTo(() => Appointment)
  declare appointment: Appointment;

  @ForeignKey(() => Exam)
  @Column({ type: DataType.UUID, allowNull: true })
  declare exam_id: string;

  @BelongsTo(() => Exam)
  declare exam: Exam;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare amount: number;

  @Column({ type: DataType.STRING(50), allowNull: false })
  declare payment_method: PaymentMethodEnum;

  @Column({ 
    type: DataType.STRING(50), 
    allowNull: false,
    defaultValue: InvoiceStatusEnum.PENDING 
  })
  declare status: InvoiceStatusEnum;

  @Column({ type: DataType.DATE, allowNull: false })
  declare due_date: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  declare paid_at: Date;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare notes: string;

  @CreatedAt
  declare created_at: Date;

  @UpdatedAt
  declare updated_at: Date;

  @DeletedAt
  declare deleted_at: Date;
}