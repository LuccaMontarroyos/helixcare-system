import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisLockService {
  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

  async acquireLock(resourceId: string, ownerId: string, ttlMs: number = 900000): Promise<boolean> {
    const key = `lock:medical_record:${resourceId}`;
    const result = await this.redisClient.set(key, ownerId, 'PX', ttlMs, 'NX');
    return result === 'OK';
  }

  async releaseLock(resourceId: string, ownerId: string): Promise<boolean> {
    const key = `lock:medical_record:${resourceId}`;
    const script = `
      local current = redis.call("get", KEYS[1])
      if current == ARGV[1] or current == false then
        redis.call("del", KEYS[1])
        return 1
      else
        return 0
      end
    `;
    const result = await this.redisClient.eval(script, 1, key, ownerId);
    return result === 1;
  }

  async getLockOwner(resourceId: string): Promise<string | null> {
    const key = `lock:medical_record:${resourceId}`;
    return await this.redisClient.get(key);
  }
}