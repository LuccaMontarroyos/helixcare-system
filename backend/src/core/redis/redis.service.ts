import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redisClient: Redis;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.redisClient = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
    });

    this.redisClient.on('error', (err) => {
      console.error('Falha na conexão com o Redis:', err.message);
    });
  }

  onModuleDestroy() {
    this.redisClient.quit();
  }

  async get(key: string): Promise<string | null> {
    return await this.redisClient.get(key);
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.redisClient.set(key, value, 'EX', ttlSeconds);
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  async incrementAndExpire(key: string, ttlSeconds: number): Promise<number> {
  
    const count = await this.redisClient.incr(key);
  
    if (count === 1) {
      await this.redisClient.expire(key, ttlSeconds);
    }
    
    return count;
  }
}