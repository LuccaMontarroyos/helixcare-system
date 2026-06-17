import { TenantHooksService } from './tenant-hooks.service';
import { TenantContextService } from './tenant-context.service';
import { TENANT_SCOPED_TABLES } from './tenant-scoped-tables';

function makeSequelizeMock() {
  const hooks: Record<string, ((...args: unknown[]) => void)[]> = {};
  return {
    addHook: jest.fn((event: string, _name: string, fn: (...args: unknown[]) => void) => {
      hooks[event] = hooks[event] ?? [];
      hooks[event].push(fn);
    }),
    triggerHook: (event: string, ...args: unknown[]) => {
      for (const fn of hooks[event] ?? []) fn(...args);
    },
  };
}

describe('TenantHooksService', () => {
  let context: TenantContextService;
  let sequelize: ReturnType<typeof makeSequelizeMock>;
  let service: TenantHooksService;

  beforeEach(() => {
    context = new TenantContextService();
    sequelize = makeSequelizeMock();
    service = new TenantHooksService(sequelize as any, context);
    service.onModuleInit();
  });

  describe('beforeFind', () => {
    it('injects clinic_id into where for a scoped model', async () => {
      await context.run({ clinicId: 'clinic-xyz', isSuperAdmin: false }, async () => {
        const options: any = { model: { tableName: 'patients' }, where: {} };
        sequelize.triggerHook('beforeFind', options);
        expect(options.where.clinic_id).toBe('clinic-xyz');
      });
    });

    it('does NOT inject clinic_id for a non-scoped model (roles)', async () => {
      await context.run({ clinicId: 'clinic-xyz', isSuperAdmin: false }, async () => {
        const options: any = { model: { tableName: 'roles' }, where: {} };
        sequelize.triggerHook('beforeFind', options);
        expect(options.where.clinic_id).toBeUndefined();
      });
    });

    it('does NOT inject clinic_id for SUPER_ADMIN', async () => {
      await context.run({ clinicId: null, isSuperAdmin: true }, async () => {
        const options: any = { model: { tableName: 'patients' }, where: {} };
        sequelize.triggerHook('beforeFind', options);
        expect(options.where.clinic_id).toBeUndefined();
      });
    });

    it('does NOT inject clinic_id when there is no context (system path)', () => {
      const options: any = { model: { tableName: 'patients' }, where: {} };
      sequelize.triggerHook('beforeFind', options);
      expect(options.where.clinic_id).toBeUndefined();
    });

    it('creates the where object when it is missing', async () => {
      await context.run({ clinicId: 'clinic-abc', isSuperAdmin: false }, async () => {
        const options: any = { model: { tableName: 'users' } };
        sequelize.triggerHook('beforeFind', options);
        expect(options.where).toEqual({ clinic_id: 'clinic-abc' });
      });
    });
  });

  describe('beforeCreate', () => {
    it('stamps clinic_id onto a new instance', async () => {
      await context.run({ clinicId: 'clinic-abc', isSuperAdmin: false }, async () => {
        const instance: any = {};
        const options: any = { model: { tableName: 'patients' } };
        sequelize.triggerHook('beforeCreate', instance, options);
        expect(instance.clinic_id).toBe('clinic-abc');
      });
    });

    it('does not overwrite an already-set clinic_id', async () => {
      await context.run({ clinicId: 'clinic-abc', isSuperAdmin: false }, async () => {
        const instance: any = { clinic_id: 'already-set' };
        const options: any = { model: { tableName: 'patients' } };
        sequelize.triggerHook('beforeCreate', instance, options);
        expect(instance.clinic_id).toBe('already-set');
      });
    });

    it('does not stamp for SUPER_ADMIN', async () => {
      await context.run({ clinicId: null, isSuperAdmin: true }, async () => {
        const instance: any = {};
        const options: any = { model: { tableName: 'patients' } };
        sequelize.triggerHook('beforeCreate', instance, options);
        expect(instance.clinic_id).toBeUndefined();
      });
    });

    it('does not stamp for non-scoped models', async () => {
      await context.run({ clinicId: 'clinic-abc', isSuperAdmin: false }, async () => {
        const instance: any = {};
        const options: any = { model: { tableName: 'roles' } };
        sequelize.triggerHook('beforeCreate', instance, options);
        expect(instance.clinic_id).toBeUndefined();
      });
    });
  });

  describe('beforeBulkUpdate / beforeBulkDestroy', () => {
    it('injects clinic_id into bulkUpdate where', async () => {
      await context.run({ clinicId: 'clinic-abc', isSuperAdmin: false }, async () => {
        const options: any = { model: { tableName: 'appointments' }, where: {} };
        sequelize.triggerHook('beforeBulkUpdate', options);
        expect(options.where.clinic_id).toBe('clinic-abc');
      });
    });

    it('injects clinic_id into bulkDestroy where', async () => {
      await context.run({ clinicId: 'clinic-abc', isSuperAdmin: false }, async () => {
        const options: any = { model: { tableName: 'invoices' }, where: {} };
        sequelize.triggerHook('beforeBulkDestroy', options);
        expect(options.where.clinic_id).toBe('clinic-abc');
      });
    });
  });

  it('TENANT_SCOPED_TABLES contains all expected tables', () => {
    const expected = [
      'patients', 'users', 'appointments', 'medical_records',
      'medical_record_histories', 'exams', 'invoices', 'price_catalog',
    ];
    for (const t of expected) {
      expect(TENANT_SCOPED_TABLES.has(t)).toBe(true);
    }
  });
});
