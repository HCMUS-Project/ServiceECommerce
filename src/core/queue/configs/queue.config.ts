import { ConfigService } from '@nestjs/config';
import { ConnectionOptions, QueueOptions } from 'bullmq';

/**
 * Retrieves the configuration options for the queue.
 * @param configService - The configuration service used to retrieve the values.
 * @returns The configuration options for the queue.
 */
function getConfig(configService: ConfigService) {
    return {
        connection: {
            host: configService.get('redisHost') || 'localhost',
            port: configService.get('redisPort') || 6379,
            password: configService.get('redisPass') || '',
            db: configService.get('redisDb') || 0,
            user: configService.get('redisUser') || '',
        } as ConnectionOptions,
        prefix: configService.get('redisPrefix') || 'bullmq',
    };
}

export { getConfig };
