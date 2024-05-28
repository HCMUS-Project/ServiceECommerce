import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { ProductService } from '../product/product.service';
import { VoucherService } from '../voucher/voucher.service';
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
import {
    GrpcInvalidArgumentException,
    GrpcItemNotFoundException,
} from 'src/common/exceptions/exceptions';
import { getEnumKeyByEnumValue } from 'src/util/convert_enum/get_key_enum';
import {
    GrpcPermissionDeniedException,
    GrpcResourceExhaustedException,
} from 'nestjs-grpc-exceptions';
import { Role } from 'src/proto_build/auth/user_token_pb';
import { find } from 'rxjs';

@Injectable()
export class InventoryService {
    constructor(
        private prismaService: PrismaService,
        private ProductService: ProductService,
    ) {}

    async create(createFormDto: IAddProductQuantityRequest): Promise<IAddProductQuantityResponse> {
        try {
            // Loop through all products
            for (let i = 0; i < createFormDto.products.length; i++) {
                // Check if product exists
                const product = await this.ProductService.findOneById({
                    id: createFormDto.products[i].productId,
                    domain: createFormDto.user.domain,
                });
                if (!product) throw new GrpcItemNotFoundException('PRODUCT_NOT_FOUND');

                if (createFormDto.type === 'import') {
                    // Update product quantity
                    await this.prismaService.product.update({
                        where: {
                            id: createFormDto.products[i].productId,
                        },
                        data: {
                            quantity: {
                                increment: createFormDto.products[i].quantity,
                            },
                        },
                    });
                }
                else if (createFormDto.type === 'export') {
                    //check if product quantity is enough
                    if (product.quantity < createFormDto.products[i].quantity) {
                        throw new GrpcResourceExhaustedException('PRODUCT_QUANTITY_NOT_ENOUGH');
                    }

                    // Update product quantity
                    await this.prismaService.product.update({
                        where: {
                            id: createFormDto.products[i].productId,
                        },
                        data: {
                            quantity: {
                                decrement: createFormDto.products[i].quantity,
                            },
                        },
                    });
                }
            }
            // Update product quantity
            const createInventoryForm = await this.prismaService.inventory.create({
                data: {
                    domain: createFormDto.user.domain,
                    description: createFormDto.description,
                    type: createFormDto.type,
                    products: {
                        create: createFormDto.products.map(product => ({
                            product_id: product.productId,
                            quantity: product.quantity,
                        })),
                    },
                },
                include: {
                    products: true,
                },
            });
            console.log(createInventoryForm);
            return {
                id: createInventoryForm.id,
                products: createInventoryForm.products.map(product => ({
                    productId: product.product_id,
                    quantity: product.quantity,
                })),
                description: createInventoryForm.description,
                type: createInventoryForm.type,
                domain: createInventoryForm.domain,
            };            
        } catch (error) {
            throw error;
        }
    }

    async findAll(findAllFormDto: IFindAllInventoryFormRequest): Promise<IFindAllInventoryFormResponse> {
        try {
            const inventoryForms = await this.prismaService.inventory.findMany({
                where: {
                    domain: findAllFormDto.user.domain,
                    type: findAllFormDto.type,
                },
                include: {
                    products: true,
                },
            });

            return {
                inventoryformList: inventoryForms.map(form => ({
                    id: form.id,
                    productsList: form.products.map(product => ({
                        productId: product.product_id,
                        quantity: product.quantity,
                    })),
                    description: form.description,
                    type: form.type,
                    domain: form.domain,
                })),
                inventoryForm: inventoryForms.map(form => ({
                    id: form.id,
                    products: form.products.map(product => ({
                        productId: product.product_id,
                        quantity: product.quantity,
                    })),
                    description: form.description,
                    type: form.type,
                    domain: form.domain,
                })),
            };

        } catch (error) {
            throw error;
        }
    }

    async update(updateFormDto: IUpdateInventoryFormRequest): Promise<IUpdateInventoryFormResponse> {
        try {
            const inventoryForm = await this.prismaService.inventory.findUnique({
                where: {
                    id: updateFormDto.id,
                },
                include: {
                    products: true,
                },
            });

            if (!inventoryForm) throw new GrpcItemNotFoundException('INVENTORY_FORM_NOT_FOUND');

            // Check if user has permission to update
            if (inventoryForm.domain !== updateFormDto.user.domain) {
                throw new GrpcPermissionDeniedException('PERMISSION_DENIED');
            }

            // Loop through all products
            for (let i = 0; i < updateFormDto.products.length; i++) {
                // Check if product exists
                const product = await this.ProductService.findOneById({
                    id: updateFormDto.products[i].productId,
                    domain: updateFormDto.user.domain,
                });
                if (!product) throw new GrpcItemNotFoundException('PRODUCT_NOT_FOUND');

                if (inventoryForm.type === 'export') {
                    //check if product quantity is enough
                    const changeQuantity = updateFormDto.products[i].quantity - inventoryForm.products[i].quantity;
                    if (product.quantity < changeQuantity) {
                        throw new GrpcResourceExhaustedException('PRODUCT_QUANTITY_NOT_ENOUGH');
                    }
                    else {
                        // Update product quantity
                        await this.prismaService.product.update({
                            where: {
                                id: updateFormDto.products[i].productId,
                            },
                            data: {
                                quantity: {
                                    decrement: changeQuantity,
                                },
                            },
                        });
                    }
                }
                else if (inventoryForm.type === 'import') {
                    // Update product quantity
                    const changeQuantity = updateFormDto.products[i].quantity - inventoryForm.products[i].quantity;
                    if (product.quantity < changeQuantity*-1) {
                        throw new GrpcResourceExhaustedException('PRODUCT_QUANTITY_NOT_ENOUGH');
                    }
                    else {
                        // Update product quantity
                        await this.prismaService.product.update({
                            where: {
                                id: updateFormDto.products[i].productId,
                            },
                            data: {
                                quantity: {
                                    increment: changeQuantity,
                                },
                            },
                        });
                    }
                }
                const transactionExist = await this.prismaService.transactionDetails.findFirst({
                    where: {
                        product_id: updateFormDto.products[i].productId,
                        inventory_id: updateFormDto.id,
                    },
                });
                // Update product quantity
                const updateTransaction = await this.prismaService.transactionDetails.update({
                    where: {
                        id: transactionExist.id,
                    },
                    data: {
                        quantity: updateFormDto.products[i].quantity,
                    },
                });
            }

            // Update inventory form
            const updateInventoryForm = await this.prismaService.inventory.update({
                where: {
                    id: updateFormDto.id,
                },
                data: {
                    description: updateFormDto.description,
                },
                include: {
                    products: true,
                },
            });

            return {
                id: updateInventoryForm.id,
                products: updateInventoryForm.products.map(product => ({
                    productId: product.product_id,
                    quantity: product.quantity,
                })),
                description: updateInventoryForm.description,
                type: updateInventoryForm.type,
                domain: updateInventoryForm.domain,
            };
        } catch (error) {
            throw error;
        }

    }

    async delete(deleteFormDto: IDeleteInventoryFormRequest): Promise<IDeleteInventoryFormResponse> {
        try {
            const inventoryForm = await this.prismaService.inventory.findUnique({
                where: {
                    id: deleteFormDto.id,
                },
                include: {
                    products: true,
                },
            });

            if (!inventoryForm) throw new GrpcItemNotFoundException('INVENTORY_FORM_NOT_FOUND');

            // Check if user has permission to delete
            if (inventoryForm.domain !== deleteFormDto.user.domain) {
                throw new GrpcPermissionDeniedException('PERMISSION_DENIED');
            }

            // Delete inventory form
            await this.prismaService.inventory.delete({
                where: {
                    id: deleteFormDto.id,
                },
            });
            console.log(inventoryForm);

            return {
                id: inventoryForm.id,
                products: inventoryForm.products.map(product => ({
                    productId: product.product_id,
                    quantity: product.quantity,
                })),
                description: inventoryForm.description,
                type: inventoryForm.type,
                domain: inventoryForm.domain,
            };
        } catch (error) {
            throw error;
        }
    }
}
