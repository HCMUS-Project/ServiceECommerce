import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { PrismaModule } from 'src/core/prisma/prisma.module';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { VoucherService } from '../voucher/voucher.service';
import { ProductService } from '../product/product.service';
import { ProductModule } from '../product/product.module';
import { VoucherModule } from '../voucher/voucher.module';

@Module({
    imports: [PrismaModule, VoucherModule, ProductModule],
    controllers: [OrderController],
    providers: [OrderService, PrismaService],
})
export class OrderModule {}
