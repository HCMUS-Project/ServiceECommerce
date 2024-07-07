import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import {
    ICheckVoucherByCodeRequest,
    ICheckVoucherByCodeResponse,
    ICreateVoucherRequest,
    ICreateVoucherResponse,
    IDeleteVoucherRequest,
    IDeleteVoucherResponse,
    IFindAllVouchersByTenantRequest,
    IFindAllVouchersRequest,
    IFindAllVouchersResponse,
    IFindVoucherByIdRequest,
    IFindVoucherByIdResponse,
    IUpdateVoucherRequest,
    IUpdateVoucherResponse,
    IVoucherResponse,
} from './interface/voucher.interface';
import { getEnumKeyByEnumValue } from 'src/util/convert_enum/get_key_enum';
import { GrpcAlreadyExistsException, GrpcPermissionDeniedException } from 'nestjs-grpc-exceptions';
import { Role } from 'src/proto_build/auth/user_token_pb';
import { Voucher } from 'src/proto_build/e_commerce/voucher_pb';
import { GrpcItemNotFoundException } from 'src/common/exceptions/exceptions';

@Injectable()
export class VoucherService {
    constructor(private prismaService: PrismaService) {}

    async create(dataRequest: ICreateVoucherRequest): Promise<ICreateVoucherResponse> {
        const { user, ...data } = dataRequest;
        console.log(dataRequest);
        // check role of user
        if (user.role.toString() !== getEnumKeyByEnumValue(Role, Role.TENANT)) {
            throw new GrpcPermissionDeniedException('PERMISSION_DENIED');
        }
        try {
            // check if category name already exists
            if (
                await this.prismaService.voucher.findFirst({
                    where: { voucher_code: data.voucherCode, domain: user.domain },
                })
            ) {
                throw new GrpcAlreadyExistsException('VOUCHER_ALREADY_EXIST');
            }
            const startDate = data.startAt ? new Date(data.startAt) : new Date();
            // create voucher
            const newVoucher = await this.prismaService.voucher.create({
                data: {
                    domain: user.domain,
                    voucher_name: data.voucherName,
                    voucher_code: data.voucherCode,
                    max_discount: data.maxDiscount,
                    min_app_value: data.minAppValue,
                    discount_percent: data.discountPercent,
                    expire_at: new Date(data.expireAt),
                    start_at: startDate,
                },
            });

            return {
                voucher: {
                    ...newVoucher,
                    voucherName: newVoucher.voucher_name,
                    voucherCode: newVoucher.voucher_code,
                    maxDiscount: Number(newVoucher.max_discount),
                    minAppValue: Number(newVoucher.min_app_value),
                    discountPercent: Number(newVoucher.discount_percent),
                    expireAt: newVoucher.expire_at.toString(),
                    createdAt: newVoucher.created_at.toString(),
                    updatedAt: newVoucher.updated_at.toString(),
                    deletedAt: newVoucher.deleted_at ? newVoucher.deleted_at.toString() : null,
                    startAt: newVoucher.start_at.toString(),
                },
                // expireAt: newVoucher.expire_at
            } as IVoucherResponse;
        } catch (error) {
            throw error;
        }
    }

    async findAll(data: IFindAllVouchersRequest): Promise<IFindAllVouchersResponse> {
        try {
            // find all vouchers by domain
            const vouchers = await this.prismaService.voucher.findMany({
                where: {
                    domain: data.domain,
                    expire_at: {
                        gte: new Date(),
                    },
                    start_at: {
                        lte: new Date(),
                    },
                    deleted_at: null,
                },
            });

            return {
                vouchers: vouchers.map(
                    voucher =>
                        ({
                            ...voucher,
                            voucherName: voucher.voucher_name,
                            voucherCode: voucher.voucher_code,
                            maxDiscount: Number(voucher.max_discount),
                            minAppValue: Number(voucher.min_app_value),
                            discountPercent: Number(voucher.discount_percent),
                            expireAt: voucher.expire_at.toString(),
                            createdAt: voucher.created_at.toString(),
                            updatedAt: voucher.updated_at.toString(),
                            deletedAt: voucher.deleted_at ? voucher.deleted_at.toString() : null,
                            startAt: voucher.start_at,
                        }) as IVoucherResponse,
                ),
            };
        } catch (error) {
            throw error;
        }
    }

    async findAllVouchersByTenant(
        data: IFindAllVouchersByTenantRequest,
    ): Promise<IFindAllVouchersResponse> {
        try {
            // find all vouchers by domain
            const vouchers = await this.prismaService.voucher.findMany({
                where: {
                    domain: data.user.domain,
                    deleted_at: null,
                },
            });

            return {
                vouchers: vouchers.map(
                    voucher =>
                        ({
                            ...voucher,
                            voucherName: voucher.voucher_name,
                            voucherCode: voucher.voucher_code,
                            maxDiscount: Number(voucher.max_discount),
                            minAppValue: Number(voucher.min_app_value),
                            discountPercent: Number(voucher.discount_percent),
                            expireAt: voucher.expire_at.toString(),
                            createdAt: voucher.created_at.toString(),
                            updatedAt: voucher.updated_at.toString(),
                            deletedAt: voucher.deleted_at ? voucher.deleted_at.toString() : null,
                            startAt: voucher.start_at,
                        }) as IVoucherResponse,
                ),
            };
        } catch (error) {
            throw error;
        }
    }

    async findById(data: IFindVoucherByIdRequest): Promise<IFindVoucherByIdResponse> {
        const { domain, id } = data;
        try {
            // find voucher by id and domain
            const voucher = await this.prismaService.voucher.findFirst({
                where: { id: id, domain: domain, deleted_at: null },
            });

            // check if voucher not exists
            if (!voucher) {
                throw new GrpcItemNotFoundException('VOUCHER_NOT_FOUND');
            }

            return {
                voucher: {
                    ...voucher,
                    voucherName: voucher.voucher_name,
                    voucherCode: voucher.voucher_code,
                    maxDiscount: Number(voucher.max_discount),
                    minAppValue: Number(voucher.min_app_value),
                    discountPercent: Number(voucher.discount_percent),
                    expireAt: voucher.expire_at.toString(),
                    createdAt: voucher.created_at.toString(),
                    updatedAt: voucher.updated_at.toString(),
                    deletedAt: voucher.deleted_at ? voucher.deleted_at.toString() : null,
                    startAt: voucher.start_at.toString(),
                },
                // expireAt: newVoucher.expire_at
            } as IVoucherResponse;
        } catch (error) {
            throw error;
        }
    }

    async updateVoucher(data: IUpdateVoucherRequest): Promise<IUpdateVoucherResponse> {
        const { user, ...dataUpdate } = data;
        // console.log(dataUpdate);
        // check role of user
        if (user.role.toString() !== getEnumKeyByEnumValue(Role, Role.TENANT)) {
            throw new GrpcPermissionDeniedException('PERMISSION_DENIED');
        }
        try {
            // Find the voucher first
            const voucher = await this.prismaService.voucher.findUnique({
                where: { id: dataUpdate.id, domain: user.domain },
            });

            // If the voucher does not exist, throw an error
            if (!voucher) {
                throw new GrpcItemNotFoundException('VOUCHER_NOT_FOUND');
            }

            // If the voucher exists, perform the update
            const updatedVoucher = await this.prismaService.voucher.update({
                where: { id: dataUpdate.id, domain: user.domain },
                data: {
                    voucher_name: dataUpdate.voucherName,
                    voucher_code: dataUpdate.voucherCode,
                    max_discount: dataUpdate.maxDiscount,
                    min_app_value: dataUpdate.minAppValue,
                    discount_percent: dataUpdate.discountPercent,
                    expire_at: new Date(dataUpdate.expireAt),
                },
            });

            return {
                voucher: {
                    ...updatedVoucher,
                    voucherName: updatedVoucher.voucher_name,
                    voucherCode: updatedVoucher.voucher_code,
                    maxDiscount: Number(updatedVoucher.max_discount),
                    minAppValue: Number(updatedVoucher.min_app_value),
                    discountPercent: Number(updatedVoucher.discount_percent),
                    expireAt: updatedVoucher.expire_at.toString(),
                    createdAt: updatedVoucher.created_at.toString(),
                    updatedAt: updatedVoucher.updated_at.toString(),
                    deletedAt: updatedVoucher.deleted_at
                        ? updatedVoucher.deleted_at.toString()
                        : null,
                    startAt: updatedVoucher.start_at.toString(),
                },
                // expireAt: newVoucher.expire_at
            } as IVoucherResponse;
        } catch (error) {
            throw error;
        }
    }

    async deleteVoucher(data: IDeleteVoucherRequest): Promise<IDeleteVoucherResponse> {
        const { user, id } = data;

        // check role of user
        if (user.role.toString() !== getEnumKeyByEnumValue(Role, Role.TENANT)) {
            throw new GrpcPermissionDeniedException('PERMISSION_DENIED');
        }

        try {
            // find the voucher first
            const voucher = await this.prismaService.voucher.findUnique({
                where: { id: id, domain: user.domain, deleted_at: null },
            });

            // if the voucher does not exist, throw an error
            if (!voucher) {
                throw new GrpcItemNotFoundException('VOUCHER_NOT_FOUND');
            }

            // delete voucher by id and domain
            const deletedVoucher = await this.prismaService.voucher.update({
                where: { id, domain: user.domain, deleted_at: null },
                data: {
                    deleted_at: new Date(),
                },
            });

            return {
                voucher: {
                    ...deletedVoucher,
                    voucherName: deletedVoucher.voucher_name,
                    voucherCode: deletedVoucher.voucher_code,
                    maxDiscount: Number(deletedVoucher.max_discount),
                    minAppValue: Number(deletedVoucher.min_app_value),
                    discountPercent: Number(deletedVoucher.discount_percent),
                    expireAt: deletedVoucher.expire_at.toString(),
                    createdAt: deletedVoucher.created_at.toString(),
                    updatedAt: deletedVoucher.updated_at.toString(),
                    deletedAt: deletedVoucher.deleted_at
                        ? deletedVoucher.deleted_at.toString()
                        : null,
                    startAt: deletedVoucher.start_at.toString(),
                },
                // expireAt: newVoucher.expire_at
            } as IVoucherResponse;
        } catch (error) {
            throw error;
        }
    }
    async findVoucherByCode(
        data: ICheckVoucherByCodeRequest,
    ): Promise<ICheckVoucherByCodeResponse> {
        const { domain, code } = data;
        try {
            // find voucher by id and domain
            const voucher = await this.prismaService.voucher.findFirst({
                where: { voucher_code: code, domain: domain, deleted_at: null },
            });

            // check if voucher not exists
            if (!voucher) {
                throw new GrpcItemNotFoundException('VOUCHER_NOT_FOUND');
            }

            return {
                voucher: {
                    ...voucher,
                    voucherName: voucher.voucher_name,
                    voucherCode: voucher.voucher_code,
                    maxDiscount: Number(voucher.max_discount),
                    minAppValue: Number(voucher.min_app_value),
                    discountPercent: Number(voucher.discount_percent),
                    expireAt: voucher.expire_at.toString(),
                    createdAt: voucher.created_at.toString(),
                    updatedAt: voucher.updated_at.toString(),
                    deletedAt: voucher.deleted_at ? voucher.deleted_at.toString() : null,
                    startAt: voucher.start_at.toString(),
                },
                // expireAt: newVoucher.expire_at
            } as IVoucherResponse;
        } catch (error) {
            throw error;
        }
    }
}
