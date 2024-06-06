import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import mongoose from 'mongoose';
import { ConfigsModule } from 'src/configs/config.module';
import Logger, { LoggerKey } from 'src/core/logger/interfaces/logger.interface';
import { MongoService } from '../services/mongo.service';

@Global()
@Module({
    imports: [ConfigsModule],
    providers: [
        {
            provide: 'DATABASE_CONNECTION',
            useFactory: async (
                configModule: ConfigService<ConfigsModule>,
                logger: Logger,
            ): Promise<typeof mongoose> => {
                const mongoService = new MongoService(configModule, logger);
                return await mongoService.connect();
            },
            inject: [ConfigService, LoggerKey],
        },
    ],
    exports: ['DATABASE_CONNECTION'],
})
export class DatabaseModule {}
