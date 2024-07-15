import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { QueueProvider } from '../providers/queue.provider';

@Module({
    imports: [BullModule.forRootAsync({ useClass: QueueProvider })],
})
export class QueueModule {}
