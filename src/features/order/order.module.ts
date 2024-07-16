import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { PrismaModule } from 'src/core/prisma/prisma.module';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { ProductModule } from '../product/product.module';
import { VoucherModule } from '../voucher/voucher.module';
import { NodeMailerModule } from 'src/util/node_mailer/node_mailer.module';
import { ClientProxyFactory, ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { PaymentGrpcService } from '../external_services/payment_service/payment_grpc.service';
import { BrevoMailerModule } from 'src/util/brevo_mailer/brevo.module';
import { ProfileUserService } from '../external_services/profileUsers/profile.service';
import { FindTenantProfileService } from '../external_services/tenant_profile/tenant_profile.service';
import { ExternalServiceModule } from '../external_services/external.module';
import { BullModule } from '@nestjs/bullmq';
import queueRegisterConfigs from 'src/core/queue/configs/registerQueue.config';

@Module({
    imports: [
        PrismaModule,
        VoucherModule,
        ProductModule,
        NodeMailerModule,
        ClientsModule,
        BrevoMailerModule,
        ExternalServiceModule,
        BullModule.registerQueue(queueRegisterConfigs.e_commerce),
    ],
    controllers: [OrderController],
    providers: [
        OrderService,
        PrismaService,
        PaymentGrpcService,
        ProfileUserService,
        FindTenantProfileService,
    ],
})
export class OrderModule {}
