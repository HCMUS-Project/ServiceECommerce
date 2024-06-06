import { Controller } from '@nestjs/common';
import { GrpcMethod, MessagePattern, Payload } from '@nestjs/microservices';
import { VoucherService } from './voucher.service';
import {
    ICheckVoucherByCodeRequest,
    ICheckVoucherByCodeResponse,
    ICreateVoucherRequest,
    ICreateVoucherResponse,
    IDeleteVoucherResponse,
    IFindAllVouchersRequest,
    IFindAllVouchersResponse,
    IFindVoucherByIdRequest,
    IFindVoucherByIdResponse,
    IUpdateVoucherRequest,
    IUpdateVoucherResponse,
} from './interface/voucher.interface';
import { IDeleteProductRequest } from '../product/interface/product.interface';

@Controller()
export class VoucherController {
    constructor(private readonly voucherService: VoucherService) {}

    @GrpcMethod('VoucherService', 'CreateVoucher')
    async create(data: ICreateVoucherRequest): Promise<ICreateVoucherResponse> {
        return await this.voucherService.create(data);
    }

    @GrpcMethod('VoucherService', 'FindAllVouchers')
    async findAll(data: IFindAllVouchersRequest): Promise<IFindAllVouchersResponse> {
        return await this.voucherService.findAll(data);
    }

    @GrpcMethod('VoucherService', 'FindVoucherById')
    async findById(data: IFindVoucherByIdRequest): Promise<IFindVoucherByIdResponse> {
        return await this.voucherService.findById(data);
    }

    @GrpcMethod('VoucherService', 'UpdateVoucher')
    async updateVoucher(data: IUpdateVoucherRequest): Promise<IUpdateVoucherResponse> {
        return await this.voucherService.updateVoucher(data);
    }

    @GrpcMethod('VoucherService', 'DeleteVoucher')
    async deleteVoucher(data: IDeleteProductRequest): Promise<IDeleteVoucherResponse> {
        return await this.voucherService.deleteVoucher(data);
    }

    @GrpcMethod('VoucherService', 'CheckVoucherByCode')
    async findVoucherByCode(
        data: ICheckVoucherByCodeRequest,
    ): Promise<ICheckVoucherByCodeResponse> {
        return await this.voucherService.findVoucherByCode(data);
    }
}
