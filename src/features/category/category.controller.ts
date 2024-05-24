import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CategoryService } from './category.service';
import {
    ICreateCategoryRequest,
    ICreateCategoryResponse,
    IFindAllCategoriesRequest,
    IFindAllCategoriesResponse,
    IFindOneCategoryRequest,
    IFindOneCategoryResponse,
    IRemoveCategoryRequest,
    IRemoveCategoryResponse,
    IUpdateCategoryRequest,
    IUpdateCategoryResponse,
} from './interface/category.interface';
import { GrpcMethod } from '@nestjs/microservices';

@Controller()
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {}

    @GrpcMethod('CategoryService', 'CreateCategory')
    async create(data: ICreateCategoryRequest): Promise<ICreateCategoryResponse> {
        return await this.categoryService.create(data);
    }

    @GrpcMethod('CategoryService', 'FindAllCategories')
    async findAll(data: IFindAllCategoriesRequest): Promise<any> {
        return await this.categoryService.findAll(data.domain);
    }

    @GrpcMethod('CategoryService', 'FindOneCategory')
    async findOne(data: IFindOneCategoryRequest): Promise<IFindOneCategoryResponse> {
        return await this.categoryService.findOne(data.id, data.domain);
    }

    @GrpcMethod('CategoryService', 'UpdateCategory')
    async update(data: IUpdateCategoryRequest): Promise<IUpdateCategoryResponse> {
        return await this.categoryService.update(data);
    }

    @GrpcMethod('CategoryService', 'RemoveCategory')
    async remove(data: IRemoveCategoryRequest): Promise<IRemoveCategoryResponse> {
        return this.categoryService.remove(data);
    }
}
