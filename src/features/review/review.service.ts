import { Inject, Injectable } from '@nestjs/common';
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
import { Decimal, DefaultArgs } from '@prisma/client/runtime/library';
// import { PrismaClient, Prisma } from '@prisma/client';
import Logger, { LoggerKey } from 'src/core/logger/interfaces/logger.interface';

@Injectable()
export class ReviewService {
    constructor(
        @Inject(LoggerKey) private logger: Logger,

        private prismaService: PrismaService,
    ) {}

    async create(dataRequest: ICreateReviewRequest): Promise<ICreateReviewResponse> {
        const { user, ...dataCreate } = dataRequest;

        // check role of user
        if (user.role.toString() === getEnumKeyByEnumValue(Role, Role.ADMIN)) {
            throw new GrpcPermissionDeniedException('PERMISSION_DENIED');
        }

        try {
            return await this.prismaService.$transaction(async (transaction) => {
                // Check if user has purchased the product
                const hasPurchased = await this.checkUserPurchase(
                    user.email,
                    user.domain,
                    dataCreate.productId,
                    transaction,
                );
                // this.prismaService.;
                // console.log(hasPurchased)
                if (
                    user.role.toString() === getEnumKeyByEnumValue(Role, Role.USER) &&
                    !hasPurchased
                ) {
                    throw new GrpcInvalidArgumentException('USER_HAS_NOT_PURCHASED_PRODUCT');
                }

                const reviewConditions = {
                    domain: user.domain,
                    product_id: dataCreate.productId,
                    user: user.email,
                };

                const reviewExists = await transaction.review.findFirst({
                    where: reviewConditions,
                });

                let review = null;
                if (reviewExists !== null) {
                    review = await transaction.review.update({
                        where: {
                            id: reviewExists.id,
                        },
                        data: {
                            rating: dataCreate.rating,
                            review: dataCreate.review,
                        },
                    });
                    await this.updateProductRating(
                        dataCreate.productId,
                        dataCreate.rating,
                        reviewExists.rating,
                        transaction,
                    );
                } else {
                    review = await transaction.review.create({
                        data: {
                            ...reviewConditions,
                            rating: dataCreate.rating,
                            review: dataCreate.review,
                        },
                    });
                    await this.updateProductRating(
                        dataCreate.productId,
                        dataCreate.rating,
                        null,
                        transaction,
                        true,
                    );
                }

                return {
                    review: {
                        ...review,
                        productId: review.product_id,
                        createdAt: review.created_at.toISOString(),
                        updatedAt: review.updated_at.toISOString(),
                    },
                };
            });
        } catch (error) {
            throw error;
        }
    }

    async updateProductRating(
        productId: string,
        newRating: number,
        oldRating: Decimal,
        transaction,
        isNewReview = false,
    ) {
        const currentProduct = await transaction.product.findUnique({
            where: { id: productId },
        });

        let decimalRating = new Decimal(newRating);
        let updatedRating = null;

        if (isNewReview) {
            updatedRating = currentProduct.rating
                .mul(currentProduct.number_rating)
                .plus(decimalRating)
                .dividedBy(currentProduct.number_rating + 1);
        } else {
            updatedRating = currentProduct.rating
                .mul(currentProduct.number_rating)
                .minus(new Decimal(oldRating))
                .plus(decimalRating)
                .dividedBy(currentProduct.number_rating);
        }

        await transaction.product.update({
            where: { id: productId },
            data: {
                rating: updatedRating.toNumber(),
                number_rating: isNewReview ? { increment: 1 } : {increment: 0},
            },
        });
    }

    async checkUserPurchase(user: string, domain: string, productId: string, transaction) {
        const orderWithProduct = await transaction.order.findFirst({
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
    }

    async findAll(data: IFindAllReviewRequest): Promise<IFindAllReviewResponse> {
        const page = data.page | 1;
        const pageSize = data.pageSize | 10;

        try {
            const reviews = await this.prismaService.review.findMany({
                where: {
                    product_id: data.productId,
                    domain: data.domain,
                },
                orderBy: { created_at: 'desc' },
                take: pageSize,
                skip: (page - 1) * pageSize,
            });

            const total = await this.prismaService.review.count({
                where: {
                    product_id: data.productId,
                    domain: data.domain,
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
            throw error;
        }
    }

    async update(data: IUpdateReviewRequest): Promise<IUpdateReviewResponse> {
        const { user, ...dataUpdate } = data;

        if (user.role.toString() !== getEnumKeyByEnumValue(Role, Role.USER)) {
            throw new GrpcPermissionDeniedException('PERMISSION_DENIED');
        }

        try {
            return await this.prismaService.$transaction(async transaction => {
                // Check if review exists
                const oldReview = await transaction.review.findFirst({
                    where: { id: dataUpdate.id, user: user.email, domain: user.domain },
                });
                if (!oldReview) {
                    throw new GrpcInvalidArgumentException('REVIEW_NOT_FOUND');
                }

                // Update the review
                const reviewUpdate = await transaction.review.update({
                    where: {
                        id: dataUpdate.id,
                    },
                    data: {
                        rating: dataUpdate.rating,
                        review: dataUpdate.review,
                    },
                });

                // Update product rating, handling the case where it is not a new review
                await this.updateProductRating(
                    oldReview.product_id,
                    dataUpdate.rating,
                    oldReview.rating,
                    transaction,
                );

                return {
                    review: {
                        ...reviewUpdate,
                        createdAt: reviewUpdate.created_at.toISOString(),
                        updatedAt: reviewUpdate.updated_at.toISOString(),
                        productId: reviewUpdate.product_id,
                        rating: Number(reviewUpdate.rating),
                    },
                };
            }); 
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
            const oldReview = await this.prismaService.review.findFirst({
                where: { id: id, user: user.email, domain: user.domain },
            });
            if (!oldReview) {
                throw new GrpcInvalidArgumentException('REVIEW_NOT_FOUND');
            }

            // Fetch the current product data
            const currentProduct = await this.prismaService.product.findUnique({
                where: { id: oldReview.product_id },
            });

            // Calculate the new rating
            const newRating = currentProduct.rating
                .mul(currentProduct.number_rating)
                .minus(oldReview.rating)
                .dividedBy(currentProduct.number_rating - 1);

            // Update the product
            const updatedProduct = await this.prismaService.product.update({
                where: { id: oldReview.product_id },
                data: {
                    rating: newRating.toNumber(),
                    number_rating: {
                        decrement: 1,
                    },
                },
            });

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
