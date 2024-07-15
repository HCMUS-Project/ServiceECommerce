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
            host: configService.get('REDIS_HOST') || 'localhost',
            port: configService.get('REDIS_PORT') || 6379,
            password: configService.get('REDIS_PASS') || '',
            db: configService.get('REDIS_DB') || 0,
            user: configService.get('REDIS_USER') || '',
        } as ConnectionOptions,
        prefix: configService.get('REDIS_PREFIX') || 'bullmq',
    };
}

export { getConfig };
