import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { MockRedisService } from './mock-redis.service';

const useMock = process.env.MOCK_DB === 'true';

const redisProvider = {
  provide: RedisService,
  useClass: useMock ? MockRedisService : RedisService,
};

@Global()
@Module({
  providers: [redisProvider],
  exports: [RedisService],
})
export class RedisModule {}
