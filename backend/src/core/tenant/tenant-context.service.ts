import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

interface TenantContext {
  clinicId: string | null;
  isSuperAdmin: boolean;
}

@Injectable()
export class TenantContextService {
  private readonly als = new AsyncLocalStorage<TenantContext>();

  run<T>(context: TenantContext, callback: () => T): T {
    return this.als.run(context, callback);
  }

  getClinicId(): string | null {
    return this.als.getStore()?.clinicId ?? null;
  }

  isSuperAdmin(): boolean {
    return this.als.getStore()?.isSuperAdmin ?? false;
  }

  hasContext(): boolean {
    return this.als.getStore() !== undefined;
  }
}
