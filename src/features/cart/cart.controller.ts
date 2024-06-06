import { Controller } from '@nestjs/common';
import { GrpcMethod, MessagePattern, Payload } from '@nestjs/microservices';
import { CartService } from './cart.service';
import {
    ICreateCartResponse,
    IAddItemsToCartRequest,
    IDeleteCartRequest,
    IDeleteCartResponse,
    IFindAllCartsByUserIdRequest,
    IFindAllCartsByUserIdResponse,
    IFindCartByIdRequest,
    IFindCartByIdResponse,
    IUpdateCartRequest,
    IUpdateCartResponse,
} from './interface/cart.interface';

@Controller()
export class CartController {
    constructor(private readonly cartService: CartService) {}

    @GrpcMethod('CartService', 'AddItemsToCart')
    async addItemsToCart(data: IAddItemsToCartRequest): Promise<ICreateCartResponse> {
        return await this.cartService.addItemsToCart(data);
    }

    @GrpcMethod('CartService', 'FindAllCartsByUserId')
    async findAllCarts(data: IFindAllCartsByUserIdRequest): Promise<IFindAllCartsByUserIdResponse> {
        return await this.cartService.findAllCarts(data);
    }

    @GrpcMethod('CartService', 'FindCartById')
    async findCartById(data: IFindCartByIdRequest): Promise<IFindCartByIdResponse> {
        return await this.cartService.findCartById(data);
    }

    @GrpcMethod('CartService', 'UpdateCart')
    async updateCart(data: IUpdateCartRequest): Promise<IUpdateCartResponse> {
        return await this.cartService.updateCart(data);
    }

    @GrpcMethod('CartService', 'DeleteCart')
    async deleteCart(data: IDeleteCartRequest): Promise<IDeleteCartResponse> {
        return await this.cartService.deleteCart(data);
    }
}
