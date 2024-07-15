import { SharedBullConfigurationFactory } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { QueueOptions } from 'bullmq';
import { getConfig } from '../configs/queue.config';
import { ConfigService } from '@nestjs/config';

@Injectable()
/**
 * Represents a provider for the queue configuration.
 */
export class QueueProvider implements SharedBullConfigurationFactory {
    constructor(private configService: ConfigService) {}

    createSharedConfiguration(): QueueOptions {
        return getConfig(this.configService);
    }
}
