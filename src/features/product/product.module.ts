import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { PrismaModule } from 'src/core/prisma/prisma.module';
import { SupabaseService } from 'src/util/supabase/supabase.service';

@Module({
    imports: [PrismaModule],
    controllers: [ProductController],
    providers: [ProductService, SupabaseService],
    exports: [ProductService],
})
export class ProductModule {}
