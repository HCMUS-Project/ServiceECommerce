import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import {
    ICreateCategoryRequest,
    ICreateCategoryResponse,
    IFindAllCategoriesResponse,
    IRemoveCategoryRequest,
    IRemoveCategoryResponse,
    IUpdateCategoryRequest,
    IUpdateCategoryResponse,
} from './interface/category.interface';
import { GrpcPermissionDeniedException } from 'nestjs-grpc-exceptions';
import { GrpcItemNotFoundException } from 'src/common/exceptions/exceptions';
import { Role } from 'src/proto_build/auth/user_token_pb';
import * as _ from 'lodash';
import { getEnumKeyByEnumValue } from 'src/util/convert_enum/get_key_enum';

@Injectable()
export class CategoryService {
    constructor(private prismaService: PrismaService) {}

    async create(dataRequest: ICreateCategoryRequest): Promise<ICreateCategoryResponse> {
        const { user, ...data } = dataRequest;

        // check role of user
        if (user.role.toString() !== getEnumKeyByEnumValue(Role, Role.TENANT)) {
            throw new GrpcPermissionDeniedException('PERMISSION_DENIED');
        }
        try {
            // check if category name already exists
            if (
                await this.prismaService.category.findFirst({
                    where: { name: data.name, domain: user.domain },
                })
            ) {
                throw new GrpcItemNotFoundException('CATEGORY_ALREADY_EXISTS');
            }

            // create category
            const newCategory = await this.prismaService.category.create({
                data: {
                    name: data.name,
                    domain: user.domain,
                    description: data.description,
                },
            });

            return {
                id: newCategory.id,
                name: newCategory.name,
            };
        } catch (error) {
            throw error;
        }
    }

    async findAll(domain: string): Promise<IFindAllCategoriesResponse> {
        try {
            // find all categories by domain
            const categories = await this.prismaService.category.findMany({
                where: { domain },
            });

            return {
                categoriesList: categories.map(category => ({
                    id: category.id,
                    name: category.name,
                    description: category.description,
                    domain: category.domain,
                    createdAt: category.created_at.getTime(),
                })),
            };
        } catch (error) {
            throw error;
        }
    }

    async findOne(id: string, domain: string) {
        try {
            // find category by id and domain
            const category = await this.prismaService.category.findFirst({
                where: { id, domain },
            });

            // check if category not exists
            if (!category) {
                throw new GrpcItemNotFoundException('CATEGORY_NOT_FOUND');
            }

            return {
                id: category.id,
                name: category.name,
                description: category.description,
                domain: category.domain,
                createdAt: category.created_at.getTime(),
            };
        } catch (error) {
            throw error;
        }
    }

    async update(data: IUpdateCategoryRequest): Promise<IUpdateCategoryResponse> {
        const { user, ...dataUpdate } = data;
        // check role of user
        if (user.role.toString() !== getEnumKeyByEnumValue(Role, Role.TENANT)) {
            throw new GrpcPermissionDeniedException('PERMISSION_DENIED');
        }
        try {
            // update category
            const updatedCategory = await this.prismaService.category.update({
                where: { id: dataUpdate.id, domain: user.domain },
                data: {
                    name: dataUpdate.name,
                    description: dataUpdate.description,
                },
            });

            // check if category not exists
            if (!updatedCategory) {
                throw new GrpcItemNotFoundException('CATEGORY_NOT_FOUND');
            }

            return {
                id: updatedCategory.id,
                name: updatedCategory.name,
            };
        } catch (error) {
            throw error;
        }
    }

    async remove(data: IRemoveCategoryRequest): Promise<IRemoveCategoryResponse> {
        const { user, id } = data;

        // check role of user
        if (user.role.toString() !== getEnumKeyByEnumValue(Role, Role.TENANT)) {
            throw new GrpcPermissionDeniedException('PERMISSION_DENIED');
        }

        try {
            // delete category by id and domain
            const deletedCategory = await this.prismaService.category.delete({
                where: { id, domain: user.domain },
            });

            // check if category not exists
            if (!deletedCategory) {
                throw new GrpcItemNotFoundException('CATEGORY_NOT_FOUND');
            }

            return {
                result: 'success',
            };
        } catch (error) {
            throw error;
        }
    }
}
