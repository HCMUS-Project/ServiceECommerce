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
import { PaymentGrpcService } from '../services/payment_service/payment_grpc.service';

@Module({
    imports: [PrismaModule, VoucherModule, ProductModule, NodeMailerModule, ClientsModule],
    controllers: [OrderController],
    providers: [
        OrderService,
        PrismaService,
        PaymentGrpcService,
        {
            provide: 'GRPC_TENANT_PAYMENT',
            useFactory: (configService: ConfigService) => {
                return ClientProxyFactory.create({
                    transport: Transport.GRPC,
                    options: {
                        package: ['payment'],
                        protoPath: join(__dirname, '../../../src/proto/main.proto'),
                        url: configService.get<string>('PAYMENT_SERVICE_URL'),
                        loader: {
                            enums: String,
                            objects: true,
                            arrays: true,
                            includeDirs: [join(__dirname, '../../../src/proto/')],
                        },
                    },
                });
            },
            inject: [ConfigService],
        },
    ],
})
export class OrderModule {}
