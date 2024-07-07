import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {BrevoMailerService} from './brevo.service';

@Module({
  imports: [ConfigModule],
  providers: [BrevoMailerService],
  exports: [BrevoMailerService],
})
export class BrevoMailerModule {}
