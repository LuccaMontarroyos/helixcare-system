import { Table, Column, Model, DataType, ForeignKey, BelongsTo, CreatedAt } from 'sequelize-typescript';
import { MedicalRecord } from './medical-record.entity';
import type { SocialHistory } from './medical-record.entity';

@Table({
  tableName: 'medical_record_histories',
  underscored: true,
  timestamps: false,
})
export class MedicalRecordHistory extends Model<MedicalRecordHistory> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => MedicalRecord)
  @Column({ type: DataType.UUID, allowNull: false })
  declare medical_record_id: string;

  @BelongsTo(() => MedicalRecord)
  declare medicalRecord: MedicalRecord;

  @Column({ type: DataType.UUID, allowNull: false })
  declare editor_id: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare old_anamnesis: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  declare old_diagnosis: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare old_prescription: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  declare old_social_history: SocialHistory;

  @CreatedAt
  @Column({ field: 'edited_at' })
  declare edited_at: Date;
}