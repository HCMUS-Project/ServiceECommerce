import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import {
    ICreateReviewRequest,
    ICreateReviewResponse,
    IDeleteReviewRequest,
    IDeleteReviewResponse,
    IFindAllReviewRequest,
    IFindAllReviewResponse,
    IUpdateReviewRequest,
    IUpdateReviewResponse,
} from './interface/review.interface';
import { getEnumKeyByEnumValue } from 'src/util/convert_enum/get_key_enum';
import { Role } from 'src/proto_build/auth/user_token_pb';
import {
    GrpcInvalidArgumentException,
    GrpcPermissionDeniedException,
} from 'nestjs-grpc-exceptions';
import { ProductService } from '../product/product.service';

@Injectable()
export class ReviewService {
    constructor(private prismaService: PrismaService) {}

    async create(dataRequest: ICreateReviewRequest): Promise<ICreateReviewResponse> {
        const { user, ...dataCreate } = dataRequest;

        // check role of user
        if (user.role.toString() === getEnumKeyByEnumValue(Role, Role.ADMIN)) {
            throw new GrpcPermissionDeniedException('PERMISSION_DENIED');
        }

        try {
            // Check if user has purchased the product
            if (
                user.role.toString() === Role.USER.toString() &&
                !(await this.checkUserPurchase(user.email, user.domain, dataCreate.productId))
            ) {
                throw new GrpcInvalidArgumentException('USER_HAS_NOT_PURCHASED_PRODUCT');
            }

            const reviewConditions = {
                domain: user.domain,
                product_id: dataCreate.productId,
                user: user.email,
            };

            const reviewExists = await this.prismaService.review.findFirst({
                where: reviewConditions,
            });

            let review = null;
            // Check if review exists then update review else create review
            if (reviewExists !== null) {
                // Update review
                review = await this.prismaService.review.update({
                    where: {
                        id: reviewExists.id,
                    },
                    data: {
                        rating: dataCreate.rating,
                        review: dataCreate.review,
                    },
                });
            } else {
                // Create review
                review = await this.prismaService.review.create({
                    data: {
                        ...reviewConditions,
                        rating: dataCreate.rating,
                        review: dataCreate.review,
                    },
                });
            }

            return {
                review: {
                    ...review,
                    productId: review.product_id,
                    createdAt: review.created_at.toISOString(),
                    updatedAt: review.updated_at.toISOString(),
                },
            };
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async checkUserPurchase(user: string, domain: string, productId: string) {
        try {
            // Check if user has purchased the product
            const orderWithProduct = await this.prismaService.order.findFirst({
                where: {
                    user: user,
                    domain: domain,
                    orderItems: {
                        some: {
                            product_id: productId,
                        },
                    },
                },
            });

            return orderWithProduct !== null;
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async findAll(data: IFindAllReviewRequest): Promise<IFindAllReviewResponse> {
        const page = data.page | 1;
        const pageSize = data.pageSize | 10;

        try {
            const reviews = await this.prismaService.review.findMany({
                where: {
                    product_id: data.productId,
                    domain: data.user.domain,
                },
                orderBy: { created_at: 'desc' },
                take: pageSize,
                skip: (page - 1) * pageSize,
            });

            const total = await this.prismaService.review.count({
                where: {
                    product_id: data.productId,
                    domain: data.user.domain,
                },
            });

            const totalPages = Math.ceil(total / pageSize);

            return {
                reviews: reviews.map(review => {
                    return {
                        id: review.id,
                        type: review.type,
                        domain: review.domain,
                        productId: review.product_id,
                        user: review.user,
                        rating: Number(review.rating),
                        review: review.review,
                        createdAt: review.created_at.toISOString(),
                        updatedAt: review.updated_at.toISOString(),
                    };
                }),
                totalPages: totalPages,
                page: page,
                pageSize: pageSize,
            };
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async update(data: IUpdateReviewRequest): Promise<IUpdateReviewResponse> {
        const { user, ...dataUpdate } = data;

        if (user.role.toString() !== getEnumKeyByEnumValue(Role, Role.USER)) {
            throw new GrpcPermissionDeniedException('PERMISSION_DENIED');
        }

        try {
            // check if review exists
            if (
                !(await this.prismaService.review.findFirst({
                    where: { id: dataUpdate.id, user: user.email, domain: user.domain },
                }))
            ) {
                throw new GrpcInvalidArgumentException('REVIEW_NOT_FOUND');
            }

            // check if user has purchased the product
            const reviewUpdate = await this.prismaService.review.update({
                where: {
                    id: dataUpdate.id,
                },
                data: {
                    rating: dataUpdate.rating,
                    review: dataUpdate.review,
                },
            });

            return {
                review: {
                    ...reviewUpdate,
                    createdAt: reviewUpdate.created_at.toISOString(),
                    updatedAt: reviewUpdate.updated_at.toISOString(),
                    productId: reviewUpdate.product_id,
                    rating: Number(reviewUpdate.rating),
                },
            };
        } catch (error) {
            throw error;
        }
    }

    async remove(data: IDeleteReviewRequest): Promise<IDeleteReviewResponse> {
        const { user, id } = data;
        if (user.role.toString() !== getEnumKeyByEnumValue(Role, Role.USER)) {
            throw new GrpcPermissionDeniedException('PERMISSION_DENIED');
        }

        try {
            // check if review exists
            if (
                !(await this.prismaService.review.findFirst({
                    where: { id: id, user: user.email, domain: user.domain },
                }))
            ) {
                throw new GrpcInvalidArgumentException('REVIEW_NOT_FOUND');
            }

            await this.prismaService.review.delete({
                where: {
                    id: id,
                },
            });

            return { result: 'success' };
        } catch (error) {
            throw error;
        }
    }
}
