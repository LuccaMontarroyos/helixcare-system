import { Table, Column, Model, DataType, CreatedAt, UpdatedAt, DeletedAt } from 'sequelize-typescript';

@Table({
  tableName: 'patients',
  underscored: true,
  timestamps: true,
  paranoid: true,
})
export class Patient extends Model<Patient> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({ type: DataType.STRING(150), allowNull: false })
  name: string;

  @Column({ type: DataType.STRING(11), allowNull: false, unique: true })
  cpf: string;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  birth_date: string;

  @Column({ type: DataType.STRING(20), allowNull: true })
  gender: string;

  @Column({ type: DataType.STRING(3), allowNull: true })
  blood_type: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  allergies: string;

  @Column({ type: DataType.JSONB, allowNull: false })
  contact_info: any;

  @Column({ type: DataType.JSONB, allowNull: true })
  address: any;

  @CreatedAt
  declare created_at: Date;

  @UpdatedAt
  declare updated_at: Date;

  @DeletedAt
  declare deleted_at: Date;
}