import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { PrismaModule } from 'src/core/prisma/prisma.module';
import { ProductService } from '../product/product.service';
import { SupabaseService } from 'src/util/supabase/supabase.service';

@Module({
    imports: [PrismaModule],
    controllers: [CartController],
    providers: [CartService, ProductService, SupabaseService],
})
export class CartModule {}
