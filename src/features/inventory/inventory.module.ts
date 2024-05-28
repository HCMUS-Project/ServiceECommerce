import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { PrismaModule } from 'src/core/prisma/prisma.module';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { ProductModule } from '../product/product.module';

@Module({
    imports: [PrismaModule, ProductModule],
    controllers: [InventoryController],
    providers: [InventoryService, PrismaService],
})
export class InventoryModule {}
