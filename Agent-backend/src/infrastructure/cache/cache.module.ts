import { Module } from '@nestjs/common';
import { CACHE_PORT } from '../../common/tokens';
import { AppConfigModule } from '../../config/app-config.module';
import { AppConfigService } from '../../config/app-config.service';
import { MemoryCacheAdapter } from './memory-cache.adapter';
import { RedisCacheAdapter } from './redis-cache.adapter';

@Module({
  imports: [AppConfigModule],
  providers: [
    MemoryCacheAdapter,
    RedisCacheAdapter,
    {
      provide: CACHE_PORT,
      inject: [AppConfigService, MemoryCacheAdapter, RedisCacheAdapter],
      useFactory: (config: AppConfigService, memory: MemoryCacheAdapter, redis: RedisCacheAdapter) => {
        return config.value.cache.driver === 'redis' ? redis : memory;
      },
    },
  ],
  exports: [CACHE_PORT],
})
export class CacheModule {}
