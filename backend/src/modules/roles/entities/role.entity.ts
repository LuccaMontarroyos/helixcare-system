import { Table, Column, Model, DataType, CreatedAt, UpdatedAt, DeletedAt, HasMany } from 'sequelize-typescript';
import { User } from 'src/modules/users/entities/user.entity';

@Table({
  tableName: 'roles',
  underscored: true,
  timestamps: true,
  paranoid: true,
})
export class Role extends Model<Role> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
    allowNull: false,
  })
  declare id: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    unique: true,
  })
  name: string;

  @HasMany(() => User)
  users: User[];

  @CreatedAt
  declare created_at: Date;

  @UpdatedAt
  declare updated_at: Date;

  @DeletedAt
  declare deleted_at: Date;
}