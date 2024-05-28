import { Controller } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { GrpcMethod } from '@nestjs/microservices';
import {
    IAddProductQuantityRequest,
    IAddProductQuantityResponse,
    IFindAllInventoryFormRequest,
    IFindAllInventoryFormResponse,
    IUpdateInventoryFormRequest,
    IInventoryFormResponse,
    IDeleteInventoryFormRequest,
    IDeleteInventoryFormResponse,
    ITransactionProduct,
    IUpdateInventoryFormResponse,
} from './interface/inventory.interface';

@Controller()
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) {}

    @GrpcMethod('InventoryService', 'AddProductQuantity')
    async create(data: IAddProductQuantityRequest): Promise<IAddProductQuantityResponse> {
        return await this.inventoryService.create(data);
    }

    @GrpcMethod('InventoryService', 'findAllInventoryForm')
    async findAll(data: IFindAllInventoryFormRequest): Promise<IFindAllInventoryFormResponse> {
        return await this.inventoryService.findAll(data);
    }

    @GrpcMethod('InventoryService', 'updateInventoryForm')
    async update(data: IUpdateInventoryFormRequest): Promise<IUpdateInventoryFormResponse> {
        return await this.inventoryService.update(data);
    }

    @GrpcMethod('InventoryService', 'deleteInventoryForm')
    async delete(data: IDeleteInventoryFormRequest): Promise<IDeleteInventoryFormResponse> {
        return await this.inventoryService.delete(data);
    }
}
