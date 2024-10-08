import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import {
    ICategory,
    ICreateProductRequest,
    ICreateProductResponse,
    IDeleteProductRequest,
    IDeleteProductResponse,
    IFindAllProductsRequest,
    IFindAllProductsResponse,
    IFindBestSellerProductsRequest,
    IFindBestSellerProductsResponse,
    IFindProductByIdRequest,
    IFindProductByIdResponse,
    IFindRecommendedProductsResponse,
    IIncreaseProductViewRequest,
    IIncreaseProductViewResponse,
    IProductResponse,
    ISearchProductsRequest,
    ISearchProductsResponse,
    IUpdateProductRequest,
    IUpdateProductResponse,
} from './interface/product.interface';
import { getEnumKeyByEnumValue } from 'src/util/convert_enum/get_key_enum';
import { Role } from 'src/proto_build/auth/user_token_pb';
import { GrpcAlreadyExistsException, GrpcPermissionDeniedException } from 'nestjs-grpc-exceptions';
import { GrpcItemNotFoundException } from 'src/common/exceptions/exceptions';
import { SupabaseService } from 'src/util/supabase/supabase.service';
import { ProductCategory } from 'src/proto_build/e_commerce/productCategory_pb';
import { Prisma } from '@prisma/client';
import { filter } from 'rxjs';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ProductService {
    constructor(
        private prismaService: PrismaService,
        private supabaseService: SupabaseService,
    ) {}

    async create(dataRequest: ICreateProductRequest): Promise<ICreateProductResponse> {
        const { user, ...data } = dataRequest;
        // check role of user
        if (user.role.toString() !== getEnumKeyByEnumValue(Role, Role.TENANT)) {
            throw new GrpcPermissionDeniedException('PERMISSION_DENIED');
        }
        try {
            // check if product name already exists
            if (
                await this.prismaService.product.findFirst({
                    where: { name: data.name, domain: user.domain },
                })
            ) {
                throw new GrpcAlreadyExistsException('PRODUCT_ALREADY_EXISTS');
            }

            // create image
            const imageLink = await this.supabaseService.uploadImageAndGetLink(data.images);
            
            // check category exists
            const categories = await this.prismaService.category.findMany({
                where: {
                    id: {
                        in: data.categories,
                    },
                },
            });
            if (categories.length !== data.categories.length) {
                throw new GrpcItemNotFoundException('CATEGORY_NOT_FOUND');
            }

            // create product
            const newProduct = await this.prismaService.product.create({
                data: {
                    domain: user.domain,
                    name: data.name,
                    price: data.price,
                    quantity: data.quantity,
                    tenant_id: user.email,
                    description: data.description,
                    images: imageLink,
                    views: data.views,
                    rating: data.rating,
                    number_rating: data.numberRating,
                    sold: data.sold,
                },
            });

            // Tạo mới các bản ghi trong bảng ProductCategory
            const productCategories = [];
            const categoriesNameId = [];
            for (const categoryId of data.categories) {
                const category = await this.prismaService.category.findUnique({
                    where: {
                        id: categoryId,
                    },
                    select: {
                        id: true,
                        name: true,
                    },
                });

                // Tạo mới một bản ghi trong bảng ProductCategory với trường name lấy từ category
                const productCategory = this.prismaService.productCategory.create({
                    data: {
                        productId: newProduct.id,
                        categoryId: categoryId,
                        name: category.name,
                    },
                });
                // console.log(productCategory)
                productCategories.push(productCategory);
                categoriesNameId.push({
                    id: category.id,
                    name: category.name,
                } as ICategory);
            }
            await this.prismaService.$transaction(productCategories);

            return {
                ...newProduct,
                id: newProduct.id,
                tenantId: newProduct.tenant_id,
                numberRating: newProduct.number_rating,
                price: Number(newProduct.price),
                rating: Number(newProduct.rating),
                createdAt: newProduct.created_at.toISOString(),
                updatedAt: newProduct.updated_at.toISOString(),
                deletedAt: newProduct.deleted_at ? newProduct.deleted_at.toISOString() : null,
                categories: categoriesNameId,
            } as ICreateProductResponse;
        } catch (error) {
            throw error;
        }
    }

    async findAll(data: IFindAllProductsRequest): Promise<IFindAllProductsResponse> {
        try {
            // Find all products by domain
            const products = await this.prismaService.product.findMany({
                where: { domain: data.domain, deleted_at: null },
                include: {
                    categories: {
                        select: {
                            categoryId: true,
                        },
                    },
                },
            });
    
            // Extract unique categoryIds from products
            const categoryIds = [
                ...new Set(
                    products.flatMap(product => product.categories.map(category => category.categoryId))
                ),
            ];
    
            // Find category names by categoryIds
            const categories = await this.prismaService.category.findMany({
                where: { id: { in: categoryIds } },
                select: {
                    id: true,
                    name: true,
                },
            });
    
            // Create a map of categoryId to category name
            const categoryMap = categories.reduce((map, category) => {
                map[category.id] = category.name;
                return map;
            }, {});
    
            return {
                products: products.map(product => ({
                    ...product,
                    tenantId: product.tenant_id,
                    numberRating: product.number_rating,
                    price: Number(product.price),
                    rating: Number(product.rating),
                    createdAt: product.created_at.toISOString(),
                    updatedAt: product.updated_at.toISOString(),
                    deletedAt: product.deleted_at ? product.deleted_at.toISOString() : null,
                    categories: product.categories.map(category => ({
                        id: category.categoryId,
                        name: categoryMap[category.categoryId],
                    })),
                })),
            };
        } catch (error) {
            throw error;
        }
    }
    

    async findOneById(data: IFindProductByIdRequest): Promise<IFindProductByIdResponse> {
        try {
            // Find product by id and domain
            const product = await this.prismaService.product.findUnique({
                where: {
                    id: data.id,
                    domain: data.domain,
                    deleted_at: null,
                },
                include: {
                    categories: {
                        select: {
                            categoryId: true,
                        },
                    },
                },
            });
    
            // Check if product does not exist
            if (!product) {
                throw new GrpcItemNotFoundException('PRODUCT_NOT_FOUND');
            }
    
            // Extract unique categoryIds from product
            const categoryIds = product.categories.map(category => category.categoryId);
    
            // Find category names by categoryIds
            const categories = await this.prismaService.category.findMany({
                where: { id: { in: categoryIds } },
                select: {
                    id: true,
                    name: true,
                },
            });
    
            // Create a map of categoryId to category name
            const categoryMap = categories.reduce((map, category) => {
                map[category.id] = category.name;
                return map;
            }, {});
    
            return {
                ...product,
                tenantId: product.tenant_id,
                numberRating: product.number_rating,
                price: Number(product.price),
                rating: Number(product.rating),
                createdAt: product.created_at.toISOString(),
                updatedAt: product.updated_at.toISOString(),
                deletedAt: product.deleted_at ? product.deleted_at.toISOString() : null,
                categories: product.categories.map(category => ({
                    id: category.categoryId,
                    name: categoryMap[category.categoryId],
                })),
            };
        } catch (error) {
            throw error;
        }
    }

    async findBestSeller(data: IFindBestSellerProductsRequest): Promise<IFindBestSellerProductsResponse> {
        try{
            const products = await this.prismaService.product.findMany({
                where: {
                    domain: data.domain,
                    deleted_at: null,
                },
                take: 5,
                orderBy: {
                    sold: 'desc',
                },
                include: {
                    categories: {
                        select: {
                            categoryId: true,
                        },
                    },
                },
            });

            // Extract unique categoryIds from products
            const categoryIds = [
                ...new Set(
                    products.flatMap(product => product.categories.map(category => category.categoryId))
                ),
            ];
    
            // Find category names by categoryIds
            const categories = await this.prismaService.category.findMany({
                where: { id: { in: categoryIds } },
                select: {
                    id: true,
                    name: true,
                },
            });
    
            // Create a map of categoryId to category name
            const categoryMap = categories.reduce((map, category) => {
                map[category.id] = category.name;
                return map;
            }, {});
    
            return {
                products: products.map(product => ({
                    ...product,
                    tenantId: product.tenant_id,
                    numberRating: product.number_rating,
                    price: Number(product.price),
                    rating: Number(product.rating),
                    createdAt: product.created_at.toISOString(),
                    updatedAt: product.updated_at.toISOString(),
                    deletedAt: product.deleted_at ? product.deleted_at.toISOString() : null,
                    categories: product.categories.map(category => ({
                        id: category.categoryId,
                        name: categoryMap[category.categoryId],
                    })),
                })),
            };
        }
        catch (error){
            throw error;
        }
    }

    async findRecommended(data: IFindBestSellerProductsRequest): Promise<IFindRecommendedProductsResponse> {
        try{
            const products = await this.prismaService.product.findMany({
                where: {
                    domain: data.domain,
                    deleted_at: null,
                },
                take: 5,
                orderBy: {
                    rating: 'desc',
                },
                include: {
                    categories: {
                        select: {
                            categoryId: true,
                        },
                    },
                },
            });

            // Extract unique categoryIds from products
            const categoryIds = [
                ...new Set(
                    products.flatMap(product => product.categories.map(category => category.categoryId))
                ),
            ];
    
            // Find category names by categoryIds
            const categories = await this.prismaService.category.findMany({
                where: { id: { in: categoryIds } },
                select: {
                    id: true,
                    name: true,
                },
            });
    
            // Create a map of categoryId to category name
            const categoryMap = categories.reduce((map, category) => {
                map[category.id] = category.name;
                return map;
            }, {});
    
            return {
                products: products.map(product => ({
                    ...product,
                    tenantId: product.tenant_id,
                    numberRating: product.number_rating,
                    price: Number(product.price),
                    rating: Number(product.rating),
                    createdAt: product.created_at.toISOString(),
                    updatedAt: product.updated_at.toISOString(),
                    deletedAt: product.deleted_at ? product.deleted_at.toISOString() : null,
                    categories: product.categories.map(category => ({
                        id: category.categoryId,
                        name: categoryMap[category.categoryId],
                    })),
                })),
            };
        }
        catch (error){
            throw error;
        }
    }

    async update(data: IUpdateProductRequest): Promise<IUpdateProductResponse> {
        const { user, id, categories, ...dataUpdate } = data;

        // check role of user
        if (user.role.toString() !== getEnumKeyByEnumValue(Role, Role.TENANT)) {
            throw new GrpcPermissionDeniedException('PERMISSION_DENIED');
        }

        try {
            if (Array.isArray(dataUpdate.images)) {
                const imageLink = await this.supabaseService.uploadImageAndGetLink(
                    dataUpdate.images,
                );
                dataUpdate.images = imageLink;
            }

            // dataUpdate.updated_at = new Date();
            // dataUpdate.category_id = undefined;

            const updatedProduct = await this.prismaService.product.update({
                where: { id: id, domain: user.domain },
                data: {
                    ...dataUpdate,
                },
            });

            if (categories !== undefined) {
                const currentProductCategories = await this.prismaService.productCategory.findMany({
                    where: {
                        productId: id,
                    },
                    select: {
                        categoryId: true,
                    },
                });

                const currentCategoryIds = currentProductCategories.map(
                    category => category.categoryId,
                );

                // Loop through the new category list from the incoming data
                await Promise.all(
                    categories.map(async categoryId => {
                        // If categoryId does not exist in the current category list, create a new one
                        if (!currentCategoryIds.includes(categoryId)) {
                            await this.prismaService.productCategory.create({
                                data: {
                                    productId: id,
                                    categoryId: categoryId,
                                },
                            });
                        }
                    }),
                );

                // Determine and delete categories not sent
                const categoriesToDelete = currentCategoryIds.filter(
                    categoryId => !categories.includes(categoryId),
                );
                await Promise.all(
                    categoriesToDelete.map(async categoryId => {
                        await this.prismaService.productCategory.deleteMany({
                            where: {
                                AND: [
                                    {
                                        productId: id,
                                    },
                                    {
                                        categoryId: categoryId,
                                    },
                                ],
                            },
                        });
                    }),
                );
            }

            const newProduct = await this.prismaService.product.findUnique({
                where: { id: id, domain: user.domain },
                include: {
                    categories: {
                        select: {
                            categoryId: true,
                            name: true,
                        },
                    },
                },
            });

            return {
                ...newProduct,
                tenantId: newProduct.tenant_id,
                numberRating: newProduct.number_rating,
                price: Number(newProduct.price),
                rating: Number(newProduct.rating),
                createdAt: newProduct.created_at.toISOString(),
                updatedAt: newProduct.updated_at.toISOString(),
                deletedAt: newProduct.deleted_at ? updatedProduct.deleted_at.toISOString() : null,
                categories: newProduct.categories.map(category => ({
                    id: category.categoryId,
                    name: category.name,
                })),
            } as IUpdateProductResponse;
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                throw new GrpcItemNotFoundException('PRODUCT_NOT_FOUND');
            } else {
                // If it's not a known Prisma error, rethrow the error
                throw error;
            }
        }
    }

    async remove(data: IDeleteProductRequest): Promise<IDeleteProductResponse> {
        const { user, id } = data;

        // check role of user
        if (user.role.toString() !== getEnumKeyByEnumValue(Role, Role.TENANT)) {
            throw new GrpcPermissionDeniedException('PERMISSION_DENIED');
        }

        try {
            // find the product first
            const product = await this.prismaService.product.findUnique({
                where: { id: id, domain: user.domain, deleted_at: null },
            });

            // if the product does not exist, throw an error
            if (!product) {
                throw new GrpcItemNotFoundException('PRODUCT_NOT_FOUND');
            }

            // delete product by id and domain
            const deletedProduct = await this.prismaService.product.update({
                where: { id, domain: user.domain },
                data:{
                    deleted_at: new Date(),
                },
                include: {
                    categories: {
                        select: {
                            categoryId: true,
                            name: true,
                        },
                    },
                },
            });

            // check if product not exists
            if (!deletedProduct) {
                throw new GrpcItemNotFoundException('PRODUCT_NOT_FOUND');
            }

            return {
                ...deletedProduct,
                tenantId: deletedProduct.tenant_id,
                numberRating: deletedProduct.number_rating,
                price: Number(deletedProduct.price),
                rating: Number(deletedProduct.rating),
                createdAt: deletedProduct.created_at.toISOString(),
                updatedAt: deletedProduct.updated_at.toISOString(),
                deletedAt: deletedProduct.deleted_at
                    ? deletedProduct.deleted_at.toISOString()
                    : null,
                categories: deletedProduct.categories.map(category => ({
                    id: category.categoryId,
                    name: category.name,
                })),
            };
        } catch (error) {
            throw error;
        }
    }

    async searchWithFilters(data: ISearchProductsRequest): Promise<ISearchProductsResponse> {
        const { domain, ...filters } = data;

        let productsQuery = await this.prismaService.product.findMany({
            where: {
                domain: domain,
                deleted_at: null,
            },
            include: {
                categories: true, // Include categories
            },
        });

        // Apply filters if any
        if (filters.name) {
            productsQuery = productsQuery.filter(product => product.name.toLowerCase().includes(filters.name.toLowerCase()));
        }

        if (filters.category) {
            // Split the category string into an array of categories
            const categories = filters.category.split(',').map(category => category.trim());
        
            // Get the list of categoryIds from the database
            const categoryIds = await this.prismaService.category.findMany({
                where: {
                    name: {
                        in: categories,
                    },
                },
                select: {
                    id: true,
                },
            });
        
            if (categoryIds.length > 0) {
                // Get list of productIds from ProductCategory table
                const productIds = await this.prismaService.productCategory.findMany({
                    where: {
                        categoryId: {
                            in: categoryIds.map(category => category.id),
                        },
                    },
                    select: {
                        productId: true,
                    },
                });
        
                // Filter out productIds present in productsQuery
                const validProductIds = productIds
                    .map(pc => pc.productId)
                    .filter(productId => productsQuery.some(product => product.id === productId));
        
                // Get products with productIds in validProductIds list
                productsQuery = await this.prismaService.product.findMany({
                    where: {
                        id: {
                            in: validProductIds,
                        },
                    },
                    include: {
                        categories: true, // Include categories
                    },
                });
            }
        }
        

        if (filters.minPrice) {
            productsQuery = productsQuery.filter(
                product => Number(product.price) >= Number(filters.minPrice),
            );
        }
        if (filters.maxPrice) {
            productsQuery = productsQuery.filter(
                product => Number(product.price) <= Number(filters.maxPrice),
            );
        }

        if (filters.rating) {
            productsQuery = productsQuery.filter(
                product => Number(product.rating) >= filters.rating,
            );
        }

        // Return the result
        return {
            products: productsQuery.map(product => ({
                ...product,
                tenantId: product.tenant_id,
                numberRating: product.number_rating,
                price: Number(product.price),
                rating: Number(product.rating),
                createdAt: product.created_at.toISOString(),
                updatedAt: product.updated_at.toISOString(),
                deletedAt: product.deleted_at ? product.deleted_at.toISOString() : null,
                categories: product.categories.map(cateogry => ({
                    id: cateogry.categoryId,
                    name: cateogry.name,
                })),
            })),
        };
    }

    async increaseView(data: IIncreaseProductViewRequest): Promise<IIncreaseProductViewResponse> {
        const { user, id } = data;

        // // check role of user
        // if (user.role.toString() !== getEnumKeyByEnumValue(Role, Role.TENANT)) {
        //     throw new GrpcPermissionDeniedException('PERMISSION_DENIED');
        // }

        try {
            // find the product first
            const product = await this.prismaService.product.findUnique({
                where: { id: id, domain: user.domain, deleted_at: null },
            });

            // if the product does not exist, throw an error
            if (!product) {
                throw new GrpcItemNotFoundException('PRODUCT_NOT_FOUND');
            }

            // update product by id and domain in incresea view
            const newProduct = await this.prismaService.product.update({
                where: { id, domain: user.domain },
                data: {
                    views: {
                        increment: 1,
                    },
                },
                include: {
                    categories: {
                        select: {
                            categoryId: true,
                            name: true,
                        },
                    },
                },
            });

            // check if product not exists
            if (!newProduct) {
                throw new GrpcItemNotFoundException('PRODUCT_NOT_FOUND');
            }

            return {
                ...newProduct,
                tenantId: newProduct.tenant_id,
                numberRating: newProduct.number_rating,
                price: Number(newProduct.price),
                rating: Number(newProduct.rating),
                createdAt: newProduct.created_at.toISOString(),
                updatedAt: newProduct.updated_at.toISOString(),
                deletedAt: newProduct.deleted_at ? newProduct.deleted_at.toISOString() : null,
                categories: newProduct.categories.map(category => ({
                    id: category.categoryId,
                    name: category.name,
                })),
            };
        } catch (error) {
            throw error;
        }
    }


    async getPriceOfProduct(productId: string): Promise<Decimal> {
        try {
            const product = await this.prismaService.product.findUnique({
                where: {
                    id: productId,
                },
            });

            return product.price;
        } catch (error) {
            throw new Error('Failed to get price of product. Please try again.');
        }
    }
}
