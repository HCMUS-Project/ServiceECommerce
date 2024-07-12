import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { ProductService } from '../product/product.service';
import { VoucherService } from '../voucher/voucher.service';
import {
    ICancelOrderRequest,
    ICancelOrderResponse,
    ICreateOrderRequest,
    ICreateOrderResponse,
    IGetAllOrderValueRequest,
    IGetAllOrderValueResponse,
    IGetOrderRequest,
    IGetOrderResponse,
    IGetOrdersReportOfListUsersRequest,
    IGetOrdersReportOfListUsersResponse,
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
    GrpcUnauthenticatedException,
} from 'nestjs-grpc-exceptions';
import { Role } from 'src/proto_build/auth/user_token_pb';
import { MailerService } from '@nestjs-modules/mailer';
import { OrderType } from 'src/proto_build/e_commerce/order_pb';
import { ICreatePaymentUrlRequest } from '../external_services/payment_service/payment_grpc.interface';
import { ConfigService } from '@nestjs/config';
import { PaymentGrpcService } from '../external_services/payment_service/payment_grpc.service';
import { BrevoMailerService, SmtpParams } from 'src/util/brevo_mailer/brevo.service';
import { ProfileUserService } from '../external_services/profileUsers/profile.service';
import { TenantProfileService } from '../external_services/tenant_profile/tenant_profile.interface';
import { FindTenantProfileByTenantIdRequest } from 'src/proto_build/service/tenantprofile_pb';
import { FindTenantProfileService } from '../external_services/tenant_profile/tenant_profile.service';

@Injectable()
export class OrderService {
    constructor(
        private prismaService: PrismaService,
        private ProductService: ProductService,
        private VoucherService: VoucherService,
        private readonly mailerService: MailerService,
        private readonly configService: ConfigService,
        private readonly paymentGrpcService: PaymentGrpcService,
        private readonly profileGrpcService: ProfileUserService,
        private readonly findTenantProfileService: FindTenantProfileService,
        private readonly brevoMailerService: BrevoMailerService,
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
            const cart = await this.prismaService.cart.findUnique({
                where: {
                    unique_cart_domain_user_id: {
                        user: createOrderDto.user.email,
                        domain: createOrderDto.user.domain,
                    },
                },
                include: {
                    cartItems: {
                        include: {
                            product: true,
                        },
                    },
                },
            });

            // Call payment service to create payment url
            const dataCreatePaymentUrl: ICreatePaymentUrlRequest = {
                amount: price_after_voucher,
                description: 'Payment for order',
                orderBookingId: [],
                orderProductsId: [order.id],
                paymentMethodId: createOrderDto.paymentMethod,
                // vnpReturnUrl: this.configService.get('vnpayCallback'),
                vnpReturnUrl: createOrderDto.paymentCallbackUrl,
                user: createOrderDto.user,
            };
            const url = await this.paymentGrpcService.createPaymentUrl(dataCreatePaymentUrl);

            // Update product quantity and cartItems
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
                // await this.prismaService.cartItem.delete({
                //     where: {
                //         cart_id_product_id: {
                //             product_id: order.orderItems[i].product_id,
                //             cart_id: cart.id,
                //         },
                //     },
                // });
            }

            // Create order response

            return {
                orderId: order.id,
                paymentUrl: url.paymentUrl,
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
                    orderItems: {
                        include: {
                            product: {
                                select: {
                                    images: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!order) throw new GrpcItemNotFoundException('ORDER_NOT_FOUND');

            return {
                orderId: order.id,
                address: order.address,
                phone: order.phone,
                voucherId: order.voucher_id,
                stage: order.stage,
                orderTime: String(order.created_at),
                totalPrice: Number(order.total_price),
                products: order.orderItems.map(item => ({
                    productId: item.product_id,
                    quantity: item.quantity,
                    images: item.product.images,
                })),
                user: order.user,
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
                    orderItems: {
                        include: {
                            product: {
                                select: {
                                    images: true,
                                },
                            },
                        },
                    },
                },
            });
            return {
                orders: orders.map(order => ({
                    orderId: order.id,
                    address: order.address,
                    phone: order.phone,
                    voucherId: order.voucher_id,
                    stage: order.stage,
                    orderTime: String(order.created_at),
                    totalPrice: Number(order.total_price),
                    products: order.orderItems.map(item => ({
                        productId: item.product_id,
                        quantity: item.quantity,
                        images: item.product.images,
                    })),
                    user: order.user,
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
                    orderItems: {
                        include: {
                            product: {
                                select: {
                                    images: true,
                                },
                            },
                        },
                    },
                },
            });
            return {
                orders: orders.map(order => ({
                    orderId: order.id,
                    address: order.address,
                    phone: order.phone,
                    voucherId: order.voucher_id,
                    stage: order.stage,
                    orderTime: String(order.created_at),
                    totalPrice: Number(order.total_price),
                    products: order.orderItems.map(item => ({
                        productId: item.product_id,
                        quantity: item.quantity,
                        images: item.product.images,
                    })),
                    user: order.user,
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
            console.log(data);
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

            if (order.stage !== 'pending')
                throw new GrpcResourceExhaustedException('CANNOT_CANCEL_ORDER');

            // Check if user is the owner of the order
            if (
                !(
                    data.user.role.toString() === getEnumKeyByEnumValue(Role, Role.USER) ||
                    data.user.role.toString() === getEnumKeyByEnumValue(Role, Role.TENANT)
                )
            ) {
                throw new GrpcPermissionDeniedException('PERMISSION_DENIED');
            }

            // update order stage
            const updated_order = await this.prismaService.order.update({
                where: {
                    id: data.id,
                },
                data: {
                    note_cancel: data.noteCancel,
                    stage: 'cancelled',
                },
                select: {
                    orderItems: {
                        select: {
                            product: {
                                select: {
                                    name: true,
                                    images: true,
                                    description: true,
                                    price: true,
                                },
                            },
                            quantity: true,
                        },
                    },
                    user: true,
                    id: true,
                    created_at: true,
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

            // await this.mailerService.sendMail({
            //     to: data.user.email,
            //     subject: 'Your order has been cancelled',
            //     text: `Order ${data.id} has been cancelled`,
            // });

            if (data.user.role.toString() === getEnumKeyByEnumValue(Role, Role.TENANT)) {
                const profiles = await this.profileGrpcService.getAllUserProfile({
                    user: data.user,
                });
                const profileNameCancel = profiles.users.find(user => user.email === order.user);
                const tenantProfile = (
                    await this.findTenantProfileService.findTenantProfileByTenantId({
                        domain: data.user.domain,
                        tenantId: undefined,
                    })
                ).tenantProfile;
                const to = [
                    {
                        email: order.user,
                        name: profileNameCancel.name,
                    },
                ];
                const templateId = 4;
                const linkDesktop = 'https://saas-30shine.vercel.app';
                const linkMobile = 'https://nvukhoi.id.vn/result';
                const params = {
                    email: updated_order.user,
                    type: 'Order',
                    name: profileNameCancel.name,
                    domain: data.user.domain,
                    id: updated_order.id,
                    date: updated_order.created_at.toISOString(),
                    noteCancel: data.noteCancel,
                    logolink: tenantProfile.logo,
                    descriptionTenant: tenantProfile.description,
                    trackOrderLinkDesktop: `${linkDesktop}/user-info/order`,
                    trackOrderLinkMobile: `${linkMobile}`,
                    continueShoppingLinkDesktop: `${linkDesktop}`,
                    continueShoppingLinkMobile: `${linkMobile},`,
                    items: updated_order.orderItems.map(orderItem => ({
                        name: orderItem.product.name,
                        price: Number(orderItem.product.price),
                        img: orderItem.product.images[0],
                        quantityOrder: orderItem.quantity,
                        description: orderItem.product.description,
                    })),
                } as SmtpParams;
                const sendMailResponse = await this.brevoMailerService.sendTransactionalEmail(
                    to,
                    templateId,
                    params,
                );
            }

            return {
                result: 'success',
            };
        } catch (error) {
            throw error;
        }
    }

    async getAllOrderValue(data: IGetAllOrderValueRequest): Promise<IGetAllOrderValueResponse> {
        try {
            const orders = await this.prismaService.order.findMany({
                where: {
                    domain: data.user.domain,
                    stage: 'completed',
                },
                select: {
                    total_price: true,
                    created_at: true,
                },
            });

            let totalOrders = 0;
            let totalValue = 0;
            const orderReports = [];
            // console.log(data)
            // if (data.type === 'week')
            // check type of data
            if (data.type.toString() === getEnumKeyByEnumValue(OrderType, OrderType.WEEK)) {
                const ordersByWeek: { [key: string]: { totalOrder: number; totalValue: number } } =
                    {};

                orders.forEach(order => {
                    if (this.isSameWeek(order.created_at, new Date())) {
                        // console.log(order);
                        const weekNumber = this.getDayOfWeek(new Date(order.created_at));
                        // console.log(weekNumber);
                        if (ordersByWeek[weekNumber]) {
                            ordersByWeek[weekNumber].totalOrder += 1;
                            ordersByWeek[weekNumber].totalValue += Number(order.total_price);
                        } else {
                            ordersByWeek[weekNumber] = {
                                totalOrder: 1,
                                totalValue: Number(order.total_price),
                            };
                        }
                        totalOrders += 1;
                        totalValue += Number(order.total_price);
                    }
                });
                for (const [week, report] of Object.entries(ordersByWeek)) {
                    orderReports.push({
                        type: week,
                        totalOrder: report.totalOrder,
                        totalValue: report.totalValue,
                    });
                }
            } else if (data.type.toString() === getEnumKeyByEnumValue(OrderType, OrderType.YEAR)) {
                // if (data.type === 'year')
                const ordersByWeek: { [key: string]: { totalOrder: number; totalValue: number } } =
                    {};

                orders.forEach(order => {
                    if (order.created_at.getUTCFullYear() === new Date().getUTCFullYear()) {
                        // console.log(order);
                        const weekNumber = this.getMonth(new Date(order.created_at));
                        // console.log(weekNumber);
                        if (ordersByWeek[weekNumber]) {
                            ordersByWeek[weekNumber].totalOrder += 1;
                            ordersByWeek[weekNumber].totalValue += Number(order.total_price);
                        } else {
                            ordersByWeek[weekNumber] = {
                                totalOrder: 1,
                                totalValue: Number(order.total_price),
                            };
                        }
                        totalOrders += 1;
                        totalValue += Number(order.total_price);
                    }
                });

                for (const [week, report] of Object.entries(ordersByWeek)) {
                    orderReports.push({
                        type: week,
                        totalOrder: report.totalOrder,
                        totalValue: report.totalValue,
                    });
                }
            } else if (data.type.toString() === getEnumKeyByEnumValue(OrderType, OrderType.MONTH)) {
                // if (data.type === 'year')
                const ordersByWeekInMonth: {
                    [key: string]: { totalOrder: number; totalValue: number };
                } = {};

                orders.forEach(order => {
                    // console.log(order.created_at.getUTCMonth() , new Date().getMonth())
                    if (
                        order.created_at.getUTCMonth() === new Date().getMonth() &&
                        order.created_at.getUTCFullYear() === new Date().getUTCFullYear()
                    ) {
                        // console.log('haha');
                        const weekNumberInMonth = this.getWeekOfMonth(new Date(order.created_at));
                        // console.log(weekNumberInMonth);
                        if (ordersByWeekInMonth[weekNumberInMonth]) {
                            ordersByWeekInMonth[weekNumberInMonth].totalOrder += 1;
                            ordersByWeekInMonth[weekNumberInMonth].totalValue += Number(
                                order.total_price,
                            );
                        } else {
                            ordersByWeekInMonth[weekNumberInMonth] = {
                                totalOrder: 1,
                                totalValue: Number(order.total_price),
                            };
                        }
                        totalOrders += 1;
                        totalValue += Number(order.total_price);
                    }
                });

                for (const [week, report] of Object.entries(ordersByWeekInMonth)) {
                    orderReports.push({
                        type: week,
                        totalBookings: report.totalOrder,
                        totalValue: report.totalValue,
                    });
                }
            }

            return {
                report: orderReports,
                total: totalOrders,
                value: totalValue,
            };
        } catch (error) {
            throw error;
        }
    }

    isSameWeek(date1: Date, date2: Date): boolean {
        // Get the start of the week (Monday) for the first date
        const startOfWeek1 = new Date(date1);
        startOfWeek1.setDate(date1.getDate() - date1.getDay() + (date1.getDay() === 0 ? -6 : 1));

        // Get the start of the week (Monday) for the second date
        const startOfWeek2 = new Date(date2);
        startOfWeek2.setDate(date2.getDate() - date2.getDay() + (date2.getDay() === 0 ? -6 : 1));

        // Compare the start of the week dates
        return (
            startOfWeek1.getFullYear() === startOfWeek2.getFullYear() &&
            startOfWeek1.getMonth() === startOfWeek2.getMonth() &&
            startOfWeek1.getDate() === startOfWeek2.getDate()
        );
    }

    /**
     * Returns the week number of the given date within its month.
     *
     * @param date - The date for which to calculate the week number.
     * @returns The week number in the format "WEEK_X", where X is the week number.
     */
    getWeekOfMonth(date: Date): string {
        // Get the first day of the month
        const firstDayOfMonth = new Date(date.getFullYear(), date.getUTCMonth(), 1);
        // Get the day of the week for the first day of the month (0 is Sunday, 6 is Saturday)
        let firstDayOfWeek = firstDayOfMonth.getDay();

        // Adjust to make Monday the first day of the week
        // If the first day is Sunday (0), set it to 7 for easier calculations
        if (firstDayOfWeek === 0) {
            firstDayOfWeek = 7;
        }

        // Calculate the adjusted date for Monday start week
        // console.log(date.getUTCDate() + firstDayOfWeek);
        const adjustedDate = date.getUTCDate() + firstDayOfWeek - 2;
        const weekNumber = Math.floor(adjustedDate / 7) + 1;

        return `WEEK_${weekNumber}`;
    }

    getDayOfWeek(date: Date): string {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[date.getUTCDay()];
    }

    getMonth(date: Date): string {
        const months = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
        ];
        return months[date.getUTCMonth()];
    }

    async getOrdersReportOfListUsers(
        data: IGetOrdersReportOfListUsersRequest,
    ): Promise<IGetOrdersReportOfListUsersResponse> {
        const { user, ...listUsers } = data;
        // console.log(data);
        if (user.role.toString() !== getEnumKeyByEnumValue(Role, Role.TENANT)) {
            throw new GrpcUnauthenticatedException('PERMISSION_DENIED');
        }

        if (user.domain === '') throw new GrpcUnauthenticatedException('DOMAIN_IS_EMPTY');

        try {
            const orders = await this.prismaService.order.groupBy({
                by: ['user'],
                where: {
                    AND: [
                        {
                            stage: 'completed',
                        },
                        {
                            user: {
                                in: listUsers.emails,
                            },
                        },
                        {
                            orderItems: {
                                every: {
                                    product: {
                                        domain: user.domain,
                                    },
                                },
                            },
                        },
                    ],
                },
                _count: {
                    id: true,
                },
            });
            // console.log(orders);

            return {
                reportOrders: orders.map(order => ({
                    email: order.user,
                    totalOrder: order._count.id,
                })),
            };
        } catch (error) {
            throw error;
        }
    }
}
