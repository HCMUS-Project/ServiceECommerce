/**
 * Config to manage the cache - Redis, using the cache-manager-redis-store package
 * */

import { CacheModuleAsyncOptions } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-store';

export const RedisOptions: CacheModuleAsyncOptions = {
    isGlobal: true,
    imports: [ConfigModule],
    useFactory: async (configService: ConfigService) => {
        const store = await redisStore({
            username: configService.get<string>('redisUser'),
            password: configService.get<string>('redisPass'),
            database: configService.get<number>('redisDb'),
            socket: {
                host: configService.get('redisHost'),
                port: configService.get('redisPort'),
            },
        });
        return {
            store: () => store,
        };
    },
    inject: [ConfigService],
};
