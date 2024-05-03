import { Controller } from '@nestjs/common';
import { OrderService } from './order.service';
import { GrpcMethod } from '@nestjs/microservices';
import {
    ICancelOrderRequest,
    ICancelOrderResponse,
    ICreateOrderRequest,
    ICreateOrderResponse,
    IGetOrderRequest,
    IGetOrderResponse,
    IListOrdersRequest,
    IListOrdersResponse,
    IUpdateStageOrderRequest,
    IUpdateStageOrderResponse,
} from './interface/order.interface';
import { ICreateCartResponse } from '../cart/interface/cart.interface';

@Controller()
export class OrderController {
    constructor(private readonly orderService: OrderService) {}

    @GrpcMethod('OrderService', 'CreateOrder')
    async create(data: ICreateOrderRequest): Promise<ICreateOrderResponse> {
        return await this.orderService.create(data);
    }

    @GrpcMethod('OrderService', 'GetOrder')
    async get(data: IGetOrderRequest): Promise<IGetOrderResponse> {
        return await this.orderService.findOne(data);
    }

    @GrpcMethod('OrderService', 'ListOrders')
    async listOrders(data: IListOrdersRequest): Promise<IListOrdersResponse> {
        return await this.orderService.findAllOrdersOfUser(data);
    }

    @GrpcMethod('OrderService', 'UpdateStageOrder')
    async updateStageOrder(data: IUpdateStageOrderRequest): Promise<IUpdateStageOrderResponse> {
        return await this.orderService.updateOrderStage(data);
    }

    @GrpcMethod('OrderService', 'CancelOrder')
    async cancelOrder(data: ICancelOrderRequest): Promise<ICancelOrderResponse> {
        return await this.orderService.cancelOrder(data);
    }
}
