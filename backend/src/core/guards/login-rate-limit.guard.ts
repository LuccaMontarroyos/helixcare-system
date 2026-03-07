import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { RedisService } from '../../core/redis/redis.service';

@Injectable()
export class LoginRateLimitGuard implements CanActivate {
  private readonly MAX_ATTEMPTS = 5;
  private readonly WINDOW_SECONDS = 60;

  constructor(private redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    const ip = request.headers['x-forwarded-for'] || request.socket.remoteAddress;
    
    const redisKey = `rate-limit:login:${ip}`;

    const currentAttempts = await this.redisService.incrementAndExpire(redisKey, this.WINDOW_SECONDS);

    if (currentAttempts > this.MAX_ATTEMPTS) {
      console.warn(`BLOQUEIO DE SEGURANÇA: Múltiplas tentativas de login do IP ${ip}`);
      
      throw new HttpException(
        'Muitas tentativas de login. Por favor, aguarde 1 minuto antes de tentar novamente.',
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    return true;
  }
}