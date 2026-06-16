import { TenantContextService } from './tenant-context.service';

describe('TenantContextService', () => {
  let service: TenantContextService;

  beforeEach(() => {
    service = new TenantContextService();
  });

  it('returns null clinicId and false isSuperAdmin outside any context', () => {
    expect(service.getClinicId()).toBeNull();
    expect(service.isSuperAdmin()).toBe(false);
    expect(service.hasContext()).toBe(false);
  });

  it('exposes clinicId inside run()', async () => {
    await service.run({ clinicId: 'clinic-abc', isSuperAdmin: false }, async () => {
      expect(service.getClinicId()).toBe('clinic-abc');
      expect(service.isSuperAdmin()).toBe(false);
      expect(service.hasContext()).toBe(true);
    });
  });

  it('exposes isSuperAdmin=true and null clinicId for SUPER_ADMIN context', async () => {
    await service.run({ clinicId: null, isSuperAdmin: true }, async () => {
      expect(service.getClinicId()).toBeNull();
      expect(service.isSuperAdmin()).toBe(true);
    });
  });

  it('isolates concurrent contexts via AsyncLocalStorage', async () => {
    const results: Array<string | null> = [];

    await Promise.all([
      service.run({ clinicId: 'clinic-1', isSuperAdmin: false }, async () => {
        await new Promise((r) => setTimeout(r, 10));
        results.push(service.getClinicId());
      }),
      service.run({ clinicId: 'clinic-2', isSuperAdmin: false }, async () => {
        await new Promise((r) => setTimeout(r, 5));
        results.push(service.getClinicId());
      }),
    ]);

    expect(results).toContain('clinic-1');
    expect(results).toContain('clinic-2');
  });

  it('returns null after the run() callback completes', async () => {
    await service.run({ clinicId: 'clinic-abc', isSuperAdmin: false }, async () => {
      expect(service.getClinicId()).toBe('clinic-abc');
    });
    expect(service.getClinicId()).toBeNull();
  });
});
