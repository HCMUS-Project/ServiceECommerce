import { Global, Inject, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import Logger, { LoggerBaseKey, LoggerKey } from '../interfaces/logger.interface';
import WinstonLogger, { WinstonLoggerTransportsKey } from 'src/util/winston/winstonLogger';
import LoggerService from '../services/logger.service';
import NestjsLoggerServiceAdapter from './logger.adapter';
import { ServiceConfig } from 'src/configs/service/service.config';
import * as morgan from 'morgan';
import ConsoleTransport from 'src/util/winston/consoleTransport';

@Global()
@Module({
    imports: [],
    controllers: [],
    providers: [
        // Logger base
        {
            provide: LoggerBaseKey,
            useClass: WinstonLogger,
        },
        // Logger service
        {
            provide: LoggerKey,
            useClass: LoggerService,
        },
        // Adapter for the logger
        {
            provide: NestjsLoggerServiceAdapter,
            useFactory: (logger: Logger) => new NestjsLoggerServiceAdapter(logger),
            inject: [LoggerKey],
        },
        {
            provide: WinstonLoggerTransportsKey,
            useFactory: (configService: ServiceConfig) => {
                const transports = [];

                // add console transport
                transports.push(ConsoleTransport.createColorize());

                // TODO: Add file transport
                // transports.push(FileTransport.create());

                // if (configService.isProduction) {
                //     if (configService.slackWebhookUrl) {
                //         transports.push(SlackTransport.create(configService.slackWebhookUrl));
                //     }
                // }

                return transports;
            },
            inject: [ServiceConfig],
        },
    ],
    exports: [LoggerKey, NestjsLoggerServiceAdapter],
})
export class LoggerModule implements NestModule {
    public constructor(
        @Inject(LoggerKey) private logger: Logger,
        private configService: ServiceConfig,
    ) {}

    // Configure the middleware
    public configure(consumer: MiddlewareConsumer): void {
        consumer
            .apply(
                morgan(this.configService.isProduction ? 'combined' : 'dev', {
                    stream: {
                        write: (message: string) => {
                            this.logger.debug(message, {
                                sourceClass: 'RequestLogger',
                            });
                        },
                    },
                }),
            )
            .forRoutes('*');
    }
}
