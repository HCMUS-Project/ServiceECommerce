import { Controller } from '@nestjs/common';
import { GrpcMethod, MessagePattern, Payload } from '@nestjs/microservices';
import { ProductService } from './product.service';
import {
    IAddProductQuantityRequest,
    IAddProductQuantityResponse,
    ICreateProductRequest,
    ICreateProductResponse,
    IDeleteProductRequest,
    IDeleteProductResponse,
    IFindAllProductsRequest,
    IFindAllProductsResponse,
    IFindProductByIdRequest,
    IFindProductByIdResponse,
    IIncreaseProductViewRequest,
    IIncreaseProductViewResponse,
    IProductResponse,
    ISearchProductsRequest,
    ISearchProductsResponse,
    IUpdateProductRequest,
    IUpdateProductResponse,
} from './interface/product.interface';

@Controller()
export class ProductController {
    constructor(private readonly productService: ProductService) {}

    @GrpcMethod('ProductService', 'CreateProduct')
    async create(data: ICreateProductRequest): Promise<ICreateProductResponse> {
        return await this.productService.create(data);
    }

    @GrpcMethod('ProductService', 'FindAllProducts')
    async findAll(data: IFindAllProductsRequest): Promise<IFindAllProductsResponse> {
        return await this.productService.findAll(data);
    }

    @GrpcMethod('ProductService', 'FindProductById')
    async findOneById(data: IFindProductByIdRequest): Promise<IFindProductByIdResponse> {
        return await this.productService.findOneById(data);
    }

    @GrpcMethod('ProductService', 'UpdateProduct')
    async update(data: IUpdateProductRequest): Promise<IUpdateProductResponse> {
        return await this.productService.update(data);
    }

    @GrpcMethod('ProductService', 'DeleteProduct')
    async remove(data: IDeleteProductRequest): Promise<IDeleteProductResponse> {
        return await this.productService.remove(data);
    }

    @GrpcMethod('ProductService', 'SearchProducts')
    async search(data: ISearchProductsRequest): Promise<ISearchProductsResponse> {
        const { ...dataSearch } = data;

        const entries = Object.entries(dataSearch);
        const activeFilters: { [key: string]: string | number } = Object.fromEntries(entries);

        if (Object.keys(activeFilters).length === 0) {
            console.log('find all');
            return await this.productService.findAll({ domain: dataSearch.domain });
        }
        return await this.productService.searchWithFilters(data);
    }

    @GrpcMethod('ProductService', 'IncreaseProductView')
    async increaseView(data: IIncreaseProductViewRequest): Promise<IIncreaseProductViewResponse> {
        return await this.productService.increaseView(data);
    }

    @GrpcMethod('ProductService', 'AddProductQuantity')
    async addQuantity(data: IAddProductQuantityRequest): Promise<IFindAllProductsResponse> {
        return await this.productService.addQuantity(data);
    }
}
