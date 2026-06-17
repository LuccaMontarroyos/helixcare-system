import { Injectable, OnModuleInit } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { TenantContextService } from './tenant-context.service';
import { TENANT_SCOPED_TABLES } from './tenant-scoped-tables';

@Injectable()
export class TenantHooksService implements OnModuleInit {
  constructor(
    private readonly sequelize: Sequelize,
    private readonly tenantContext: TenantContextService,
  ) {}

  onModuleInit() {
    this.registerHooks();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private tableName(options: any): string | null {
    const name = options?.model?.tableName;
    return typeof name === 'string' ? name : null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private isScoped(options: any): boolean {
    const name = this.tableName(options);
    return name !== null && TENANT_SCOPED_TABLES.has(name);
  }

  private activeClinicId(): string | null {
    if (this.tenantContext.isSuperAdmin()) return null;
    return this.tenantContext.getClinicId();
  }

  private registerHooks() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.sequelize.addHook('beforeFind', 'tenantBeforeFind', (options: any) => {
      if (!this.isScoped(options)) return;
      const clinicId = this.activeClinicId();
      if (!clinicId) return;
      options.where = { ...(options.where ?? {}), clinic_id: clinicId };
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.sequelize.addHook('beforeCreate', 'tenantBeforeCreate', (instance: any, options: any) => {
      const name = this.tableName(options) ?? (instance.constructor as { tableName?: string })?.tableName;
      if (!name || !TENANT_SCOPED_TABLES.has(name)) return;
      if (this.tenantContext.isSuperAdmin()) return;
      const clinicId = this.tenantContext.getClinicId();
      if (clinicId && !instance.clinic_id) instance.clinic_id = clinicId;
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.sequelize.addHook('beforeBulkCreate', 'tenantBeforeBulkCreate', (instances: any[], options: any) => {
      if (!this.isScoped(options)) return;
      if (this.tenantContext.isSuperAdmin()) return;
      const clinicId = this.tenantContext.getClinicId();
      if (!clinicId) return;
      for (const inst of instances) {
        if (!inst.clinic_id) inst.clinic_id = clinicId;
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.sequelize.addHook('beforeBulkUpdate', 'tenantBeforeBulkUpdate', (options: any) => {
      if (!this.isScoped(options)) return;
      const clinicId = this.activeClinicId();
      if (!clinicId) return;
      options.where = { ...(options.where ?? {}), clinic_id: clinicId };
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.sequelize.addHook('beforeBulkDestroy', 'tenantBeforeBulkDestroy', (options: any) => {
      if (!this.isScoped(options)) return;
      const clinicId = this.activeClinicId();
      if (!clinicId) return;
      options.where = { ...(options.where ?? {}), clinic_id: clinicId };
    });
  }
}
