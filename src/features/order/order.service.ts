import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { ProductService } from '../product/product.service';
import { VoucherService } from '../voucher/voucher.service';
import {
    ICancelOrderRequest,
    ICancelOrderResponse,
    ICreateOrderRequest,
    ICreateOrderResponse,
    IGetOrderRequest,
    IGetOrderResponse,
    IListOrdersForTenantRequest,
    IListOrdersRequest,
    IListOrdersResponse,
    IUpdateStageOrderRequest,
    IUpdateStageOrderResponse,
} from './interface/order.interface';
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

@Injectable()
export class OrderService {
    constructor(
        private prismaService: PrismaService,
        private ProductService: ProductService,
        private VoucherService: VoucherService,
    ) {}

    async create(createOrderDto: ICreateOrderRequest): Promise<ICreateOrderResponse> {
        try {
            // Check product quantity
            for (let i = 0; i < createOrderDto.productsId.length; i++) {
                const product = await this.ProductService.findOneById({
                    id: createOrderDto.productsId[i],
                    domain: createOrderDto.domain,
                });
                if (product.quantity < createOrderDto.quantities[i]) {
                    throw new GrpcResourceExhaustedException('PRODUCT_OUT_OF_STOCK');
                }
                if (product === null) {
                    throw new GrpcResourceExhaustedException('PRODUCT_NOT_FOUND');
                }
            }

            // Calculate total price
            const total_price = await this.calculateTotalPrice(
                createOrderDto.productsId,
                createOrderDto.quantities,
            );

            let price_after_voucher = total_price;
            let discount_value = 0;

            // Check voucher
            let voucher_applied = null;
            if (createOrderDto.voucherId !== undefined) {
                voucher_applied = await this.VoucherService.findById({
                    id: createOrderDto.voucherId,
                    domain: createOrderDto.domain,
                });
                if (voucher_applied !== null) {
                    if (new Date(voucher_applied.voucher.expireAt) < new Date()) {
                        throw new GrpcResourceExhaustedException('VOUCHER_EXPIRED');
                    }
                } else {
                    throw new GrpcItemNotFoundException('VOUCHER_NOT_FOUND');
                }
                voucher_applied = voucher_applied.voucher;
                if (total_price < Number(voucher_applied.min_app_value)) {
                    throw new GrpcResourceExhaustedException('VOUCHER_MIN_APP_VALUE');
                } else {
                    discount_value = (total_price * Number(voucher_applied.discount_percent)) / 100;
                    if (discount_value > total_price) {
                        price_after_voucher = 0;
                    }
                    if (discount_value > Number(voucher_applied.max_discount)) {
                        discount_value = Number(voucher_applied.max_discount);
                        price_after_voucher = total_price - Number(voucher_applied.max_discount);
                    } else {
                        price_after_voucher = total_price - discount_value;
                    }
                }
            }

            // Create order
            const order = await this.prismaService.order.create({
                data: {
                    domain: createOrderDto.user.domain,
                    user: createOrderDto.user.email,
                    stage: 'pending',
                    orderItems: {
                        create: createOrderDto.productsId.map((productId, index) => ({
                            product: { connect: { id: productId } },
                            quantity: createOrderDto.quantities[index],
                        })),
                    },
                    total_price: total_price,
                    phone: createOrderDto.phone,
                    address: createOrderDto.address,
                    voucher_id: createOrderDto.voucherId ? createOrderDto.voucherId : null,
                    voucher_discount: discount_value,
                    price_after_voucher: price_after_voucher,
                },
                include: {
                    orderItems: true,
                },
            });

            // Update product quantity
            for (let i = 0; i < order.orderItems.length; i++) {
                await this.prismaService.product.update({
                    where: {
                        id: order.orderItems[i].product_id,
                    },
                    data: {
                        quantity: { decrement: order.orderItems[i].quantity },
                        sold: { increment: order.orderItems[i].quantity },
                    },
                });
            }

            //TODO: Update cart

            return {
                orderId: order.id,
            };
        } catch (error) {
            throw error;
        }
    }

    async calculateTotalPrice(productIds: string[], quantities: number[]): Promise<number> {
        try {
            // Create a variable to store the total price
            let totalPrice: number = 0;

            // Loop through all products
            for (let i = 0; i < productIds.length; i++) {
                // Get the price of the product
                const price = await this.ProductService.getPriceOfProduct(productIds[i]);

                // Calculate the total price
                totalPrice = Number(totalPrice) + Number(price) * quantities[i];
            }

            return totalPrice;
        } catch (error) {
            throw new Error('Failed to calculate total price. Please try again.');
        }
    }

    async findOne(data: IGetOrderRequest): Promise<IGetOrderResponse> {
        try {
            const order = await this.prismaService.order.findUnique({
                where: {
                    id: data.orderId,
                    domain: data.user.domain,
                },
                include: {
                    orderItems: true,
                },
            });

            if (!order) throw new GrpcItemNotFoundException('ORDER_NOT_FOUND');

            return {
                orderId: order.id,
                address: order.address,
                phone: order.phone,
                voucherId: order.voucher_id,
                stage: order.stage,
                products: order.orderItems.map(item => ({
                    productId: item.product_id,
                    quantity: item.quantity,
                })),
            };
        } catch (error) {
            throw error;
        }
    }

    async findAllOrdersOfUser(data: IListOrdersRequest): Promise<IListOrdersResponse> {
        try {
            let filter = {};
            if (data.stage) filter = { stage: data.stage };

            const orders = await this.prismaService.order.findMany({
                where: {
                    user: data.user.email,
                    domain: data.user.domain,
                    ...filter,
                },
                include: {
                    orderItems: true,
                },
            });
            return {
                orders: orders.map(order => ({
                    orderId: order.id,
                    address: order.address,
                    phone: order.phone,
                    voucherId: order.voucher_id,
                    stage: order.stage,
                    products: order.orderItems.map(item => ({
                        productId: item.product_id,
                        quantity: item.quantity,
                    })),
                })),
            };
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async findAllOrdersOfTenant(data: IListOrdersForTenantRequest): Promise<IListOrdersResponse> {
        try {
            console.log(data);
            let filter = {};
            if (data.stage) filter = { stage: data.stage };

            const orders = await this.prismaService.order.findMany({
                where: {
                    domain: data.user.domain,
                    ...filter,
                },
                include: {
                    orderItems: true,
                },
            });
            return {
                orders: orders.map(order => ({
                    orderId: order.id,
                    address: order.address,
                    phone: order.phone,
                    voucherId: order.voucher_id,
                    stage: order.stage,
                    products: order.orderItems.map(item => ({
                        productId: item.product_id,
                        quantity: item.quantity,
                    })),
                })),
            };
        } catch (error) {
            throw new Error(error.message);
        }
    }


    async updateOrderStage(data: IUpdateStageOrderRequest): Promise<IUpdateStageOrderResponse> {
        // Check if stage is valid
        if (
            data.stage !== 'pending' &&
            data.stage !== 'shipping' &&
            data.stage !== 'completed' &&
            data.stage !== 'cancelled'
        )
            throw new GrpcInvalidArgumentException('INVALID_ARGUMENT');

        // Check user role
        if (data.user.role.toString() !== getEnumKeyByEnumValue(Role, Role.TENANT)) {
            throw new GrpcPermissionDeniedException('PERMISSION_DENIED');
        }

        try {
            // Check if order exists
            if (
                (await this.prismaService.order.count({
                    where: { id: data.orderId, domain: data.user.domain },
                })) === 0
            )
                throw new GrpcItemNotFoundException('ORDER_NOT_FOUND');

            // Update order stage
            const order = await this.prismaService.order.update({
                where: {
                    id: data.orderId,
                    domain: data.user.domain,
                },
                data: {
                    stage: data.stage,
                },
            });

            return {
                orderId: order.id,
                stage: order.stage,
            };
        } catch (error) {
            throw error;
        }
    }

    async cancelOrder(data: ICancelOrderRequest): Promise<ICancelOrderResponse> {
        try {
            // Check if order exists
            const order = await this.prismaService.order.findUnique({
                where: {
                    id: data.id,
                    domain: data.user.domain,
                },
                include: {
                    orderItems: true,
                },
            });
            if (!order) throw new GrpcItemNotFoundException('ORDER_NOT_FOUND');
            if (order.stage === 'cancelled')
                throw new GrpcResourceExhaustedException('ORDER_CANCELLED');

            // Check if user is the owner of the order
            if (data.user.role.toString() === getEnumKeyByEnumValue(Role, Role.USER)) {
                // cancel order with user
                // check if order is in pending stage
                if (order.stage !== 'pending')
                    throw new GrpcResourceExhaustedException('CANNOT_CANCEL_ORDER');
            } else if (data.user.role.toString() === getEnumKeyByEnumValue(Role, Role.TENANT)) {
                // cancel order with tenant
            } else throw new GrpcPermissionDeniedException('PERMISSION_DENIED');

            // update order stage
            await this.prismaService.order.update({
                where: {
                    id: data.id,
                },
                data: {
                    stage: 'cancelled',
                },
            });

            // update product quantity
            for (let i = 0; i < order.orderItems.length; i++) {
                await this.prismaService.product.update({
                    where: {
                        id: order.orderItems[i].product_id,
                    },
                    data: {
                        quantity: {
                            increment: order.orderItems[i].quantity,
                        },
                    },
                });
            }

            return {
                result: 'success',
            };
        } catch (error) {
            throw error;
        }
    }
}
