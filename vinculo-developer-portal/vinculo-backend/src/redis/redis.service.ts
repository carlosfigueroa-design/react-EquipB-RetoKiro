import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis, { RedisOptions } from 'ioredis';

function getRedisConfig(): RedisOptions | string {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    return redisUrl;
  }
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  };
}

@Injectable()
export class RedisService
  extends Redis
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger: Logger;

  constructor() {
    super(getRedisConfig() as RedisOptions);
    this.logger = new Logger(RedisService.name);
  }

  async onModuleInit(): Promise<void> {
    this.logger.log('Connecting to Redis...');

    // ioredis connects lazily; verify the connection is alive
    if (this.status === 'ready') {
      this.logger.log('Redis connection established');
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const onReady = (): void => {
        this.off('error', onError);
        this.logger.log('Redis connection established');
        resolve();
      };

      const onError = (err: Error): void => {
        this.off('ready', onReady);
        this.logger.error(`Redis connection failed: ${err.message}`);
        reject(err);
      };

      this.once('ready', onReady);
      this.once('error', onError);
    });
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Disconnecting from Redis...');
    await this.quit();
    this.logger.log('Redis connection closed');
  }
}
