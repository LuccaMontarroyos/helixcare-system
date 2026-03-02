import { Table, Column, Model, DataType, CreatedAt, UpdatedAt, DeletedAt, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Patient } from '../../patients/entities/patient.entity';
import { User } from '../../users/entities/user.entity';

export interface SocialHistory {
  is_smoker: boolean;
  consumes_alcohol: boolean;
  notes?: string;
}

@Table({
  tableName: 'medical_records',
  underscored: true,
  timestamps: true,
  paranoid: true,
})
export class MedicalRecord extends Model<MedicalRecord> {
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

  @Column({ type: DataType.TEXT, allowNull: false })
  anamnesis: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  diagnosis: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  prescription: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  social_history: SocialHistory;

  @CreatedAt
  declare created_at: Date;

  @UpdatedAt
  declare updated_at: Date;

  @DeletedAt
  declare deleted_at: Date;
}