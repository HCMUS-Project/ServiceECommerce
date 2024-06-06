import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        MailerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                transport: {
                    host: configService.get<string>('mailHost'),
                    port: configService.get<number>('mailPort'),
                    auth: {
                        user: configService.get<string>('mailUser'),
                        pass: configService.get<string>('mailPassword'),
                    },
                },
                defaults: {
                    from: configService.get<string>('mailFrom'),
                },
            }),
        }),
    ],
})
export class NodeMailerModule {}
