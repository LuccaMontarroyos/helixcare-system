import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantContextService } from './tenant-context.service';
import { RoleEnum } from 'src/modules/roles/enums/roles.enum';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private readonly tenantContext: TenantContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return next.handle();
    }

    const isSuperAdmin = user.role === RoleEnum.SUPER_ADMIN;
    const clinicId: string | null = isSuperAdmin ? null : (user.clinicId ?? null);

    return new Observable((subscriber) => {
      this.tenantContext.run({ clinicId, isSuperAdmin }, () => {
        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}
