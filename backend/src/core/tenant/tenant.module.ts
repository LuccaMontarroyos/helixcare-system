import { Global, Module } from '@nestjs/common';
import { TenantContextService } from './tenant-context.service';
import { TenantHooksService } from './tenant-hooks.service';
import { TenantInterceptor } from './tenant.interceptor';

@Global()
@Module({
  providers: [TenantContextService, TenantHooksService, TenantInterceptor],
  exports: [TenantContextService, TenantInterceptor],
})
export class TenantModule {}
