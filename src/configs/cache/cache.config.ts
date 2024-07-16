/**
 * @fileoverview cache.config - Configuration for redis database
 */

export default () => ({
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    redisHost: process.env.REDIS_HOST || 'localhost',
    redisPort: process.env.REDIS_PORT || 6379,
    redisPass: process.env.REDIS_PASS || '',
    redisDb: process.env.REDIS_DB || 0,
    redisUser: process.env.REDIS_USER || '',
    redisPrefix: process.env.REDIS_PREFIX || 'bullmq',
});
