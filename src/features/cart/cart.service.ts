import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import {
    ICartItem, 
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
import { getEnumKeyByEnumValue } from 'src/util/convert_enum/get_key_enum';
import { Role } from 'src/proto_build/auth/user_token_pb';
import {
    GrpcAlreadyExistsException,
    GrpcInvalidArgumentException,
    GrpcPermissionDeniedException,
} from 'nestjs-grpc-exceptions';
import { ProductService } from '../product/product.service';

import { GrpcItemNotFoundException } from 'src/common/exceptions/exceptions';

@Injectable()
export class CartService {
    constructor(
        private prismaService: PrismaService,
        private productService: ProductService,
    ) {}

    async calculateTotalPrice(cartItems: ICartItem[]): Promise<number> {
        try {
            let totalPrice: number = 0;

            // loop through all cart items
            for (let i = 0; i < cartItems.length; i++) {
                // find product by id
                const product = await this.prismaService.product.findUnique({
                    where: {
                        id: cartItems[i].productId,
                    },
                });

                // calculate total price
                totalPrice = Number(totalPrice) + Number(product.price) * cartItems[i].quantity;
            }

            return totalPrice;
        } catch (error) {
            throw new Error('Failed to calculate total price. Please try again.');
        }
    }

    async addItemsToCart(dataRequest: IAddItemsToCartRequest): Promise<ICreateCartResponse> {
        const { user, cartItem } = dataRequest;
        // check role of user
        if (user.role.toString() !== getEnumKeyByEnumValue(Role, Role.USER)) {
            throw new GrpcPermissionDeniedException('PERMISSION_DENIED');
        }
        try {
            // Check quantities of product have to be greater than quantity of product database
            const product = await this.productService.findOneById({
                user: user,
                id: cartItem.productId,
            });
            if (product.quantity < cartItem.quantity) {
                throw new GrpcInvalidArgumentException('PRODUCT_NOT_ENOUGH');
            }

            const cartExists = await this.prismaService.cart.findFirst({
                where: {
                    domain: user.domain,
                    user: user.email,
                },
            });

            // Check if cart already exists
            if (cartExists !== null) {
                // if cart exists, add items to cart
                const cartItemExists = await this.prismaService.cartItem.findFirst({
                    where: {
                        cart_id: cartExists.id,
                        product_id: cartItem.productId,
                    },
                });

                if (cartItemExists) {
                    const updatedCartItem = await this.prismaService.cartItem.update({
                        where: {
                            id: cartItemExists.id,
                        },
                        data: {
                            quantity: cartItemExists.quantity + cartItem.quantity,  
                        },
                    });
                }
                else {
                    // if product not exists in cart, create new cart item
                    const createdCartItem = await this.prismaService.cartItem.create({
                        data: {
                            cart_id: cartExists.id,
                            product_id: cartItem.productId,
                            quantity: cartItem.quantity,
                        },
                    });
                }
            }
            else{
                // if cart not exists, create new cart
                const createdCart = await this.prismaService.cart.create({
                    data: {
                        domain: user.domain,
                        user: user.email,
                        cartItems: {
                            create: [
                                {
                                    product_id: cartItem.productId,
                                    quantity: cartItem.quantity,
                                },
                            ],
                        },
                    },
                    include: {
                        cartItems: true,
                    },
                });
            }
            const cart = await this.prismaService.cart.findFirst({
                where: {
                    domain: user.domain,
                    user: user.email,
                },
                include: {
                    cartItems: {
                        select: {
                            product_id: true,
                            quantity: true,
                        },
                    },
                },
            });
            return {
                cart: {
                    ...cart,
                    id: cart.id,
                    cartItems: cart.cartItems.map(cartItem => ({
                        ...cartItem,
                        productId: cartItem.product_id,
                    })),
                    createdAt: cart.created_at.toISOString(),
                    updatedAt: cart.updated_at.toISOString(),
                    deletedAt: cart.deleted_at ? cart.deleted_at.toISOString() : null,
                },
            };
        } catch (error) {
            throw error;
        }
    }

    async findAllCarts(data: IFindAllCartsByUserIdRequest): Promise<IFindAllCartsByUserIdResponse> {
        try {
            // find all carts by domain and id
            const carts = await this.prismaService.cart.findMany({
                where: { domain: data.user.domain, user: data.user.email },
                include: {
                    cartItems: {
                        select: {
                            product_id: true,
                            quantity: true,
                        },
                    },
                },
            });

            if (carts.length == 0) {
                throw new GrpcItemNotFoundException('CART_NOT_FOUND');
            }

            return {
                carts: carts.map(cart => ({
                    ...cart,
                    id: cart.id,
                    cartItems: cart.cartItems.map(cartItem => ({
                        ...cartItem,
                        productId: cartItem.product_id,
                    })),
                    createdAt: cart.created_at.toISOString(),
                    updatedAt: cart.updated_at.toISOString(),
                    deletedAt: cart.deleted_at ? cart.deleted_at.toISOString() : null,
                })),
            };
        } catch (error) {
            throw error;
        }
    }

    async findCartById(data: IFindCartByIdRequest): Promise<IFindCartByIdResponse> {
        const { user } = data;
        try {
            // find cart by id and domain
            const cart = await this.prismaService.cart.findUnique({
                where: {
                    unique_cart_domain_user_id: {
                        user: user.email,
                        domain: user.domain,
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

            // check if cart not exists
            if (!cart) {
                throw new GrpcItemNotFoundException('CART_NOT_FOUND');
            }

            return {
                cart: {
                    ...cart,
                    id: cart.id,
                    cartItems: cart.cartItems.map(cartItem => ({
                        ...cartItem,
                        productId: cartItem.product_id,
                    })),
                    createdAt: cart.created_at.toISOString(),
                    updatedAt: cart.updated_at.toISOString(),
                    deletedAt: cart.deleted_at ? cart.deleted_at.toISOString() : null,
                },
            };
        } catch (error) {
            throw error;
        }
    }

    async updateCart(data: IUpdateCartRequest): Promise<IUpdateCartResponse> {
        const { user, id, cartItems } = data;
        // check role of user
        if (user.role.toString() !== getEnumKeyByEnumValue(Role, Role.USER)) {
            throw new GrpcPermissionDeniedException('PERMISSION_DENIED');
        }
        try {
            const product = await this.productService.findOneById({
                user: user,
                id: cartItems.productId,
            });
            if (product.quantity < cartItems.quantity) {
                throw new GrpcInvalidArgumentException('PRODUCT_NOT_ENOUGH: ' + product.name);
            }

            if (cartItems.quantity === 0) {
                const deleteCartItem = await this.prismaService.cartItem.delete({
                    where: {
                        id: cartItems.productId,
                        cart_id: id,
                    },
                });
            }
            else{
                const cartItemExists = await this.prismaService.cartItem.findFirst({
                    where: {
                        cart_id: id,
                        product_id: cartItems.productId,
                    },
                });
                if (!cartItemExists) {
                    throw new GrpcItemNotFoundException('CART_ITEM_NOT_FOUND');
                }
                else{
                    const updatedCartItem = await this.prismaService.cartItem.update({
                        where: {
                            id: cartItemExists.id,
                        },
                        data: {
                            quantity: cartItems.quantity,
                        },
                    });
                }
            }

            const updatedCart = await this.prismaService.cart.findUnique({
                where: {
                    id: id,
                },
                include: {
                    cartItems: {
                        select: {
                            product_id: true,
                            quantity: true,
                        },
                    },
                },
            });


            return {
                cart: {
                    ...updatedCart,
                    id: updatedCart.id,
                    cartItems: updatedCart.cartItems.map(cartItem => ({
                        ...cartItem,
                        productId: cartItem.product_id,
                    })),
                    createdAt: updatedCart.created_at.toISOString(),
                    updatedAt: updatedCart.updated_at.toISOString(),
                    deletedAt: updatedCart.deleted_at ? updatedCart.deleted_at.toISOString() : null,
                },
            };
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async deleteCart(data: IDeleteCartRequest): Promise<IDeleteCartResponse> {
        const { user, id } = data;
        try {
            // find cart by id
            const cart = await this.prismaService.cart.findUnique({
                where: {
                    id,
                },
            });

            // check if cart not exists
            if (!cart) {
                throw new GrpcItemNotFoundException('CART_NOT_FOUND');
            }

            const deleteCart = await this.prismaService.cart.delete({
                where: {
                    id: id,
                },
                include: {
                    cartItems: {
                        select: {
                            product_id: true,
                            quantity: true,
                        },
                    },
                },
            });

            return {
                cart: {
                    ...deleteCart,
                    id: deleteCart.id,
                    cartItems: deleteCart.cartItems.map(cartItem => ({
                        ...cartItem,
                        productId: cartItem.product_id,
                    })),
                    createdAt: deleteCart.created_at.toISOString(),
                    updatedAt: deleteCart.updated_at.toISOString(),
                    deletedAt: deleteCart.deleted_at ? deleteCart.deleted_at.toISOString() : null,
                },
            };
        } catch (error) {
            throw error;
        }
    }
}
