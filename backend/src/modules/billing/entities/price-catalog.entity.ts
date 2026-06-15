import {
    Table, Column, Model, DataType,
    CreatedAt, UpdatedAt, DeletedAt,
  } from 'sequelize-typescript';
  
  @Table({
    tableName: 'price_catalog',
    underscored: true,
    timestamps: true,
    paranoid: true,
  })
  export class PriceCatalog extends Model<PriceCatalog> {
  
    @Column({
      type: DataType.UUID,
      defaultValue: DataType.UUIDV4,
      primaryKey: true,
    })
    declare id: string;
  
    @Column({ type: DataType.STRING(20), allowNull: false })
    declare service_kind: 'APPOINTMENT' | 'EXAM';
  
    @Column({ type: DataType.STRING(120), allowNull: false })
    declare service_code: string;
  
    @Column({ type: DataType.STRING(180), allowNull: false })
    declare display_name: string;
  
    @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
    declare base_price: number;
  
    @Column({ type: DataType.DECIMAL(10, 2), allowNull: true })
    declare market_price_min: number | null;
  
    @Column({ type: DataType.DECIMAL(10, 2), allowNull: true })
    declare market_price_max: number | null;
  
    @Column({ type: DataType.STRING(50), allowNull: false, defaultValue: 'PIX' })
    declare default_payment_method: string;
  
    @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
    declare due_days: number;
  
    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
    declare is_active: boolean;
  
    @CreatedAt declare created_at: Date;
    @UpdatedAt declare updated_at: Date;
    @DeletedAt declare deleted_at: Date;
  }