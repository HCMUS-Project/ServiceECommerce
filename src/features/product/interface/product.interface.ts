import {
    Category,
    CreateProductRequest,
    DeleteProductRequest,
    FindAllProductsRequest,
    FindAllProductsResponse,
    FindProductByIdRequest,
    ProductResponse,
    SearchProductsRequest,
    UpdateProductRequest,
} from 'src/proto_build/e_commerce/product_pb';

export interface ICategory extends Category.AsObject {}

export interface IProductResponse
    extends Omit<ProductResponse.AsObject, 'imagesList' | 'categoriesList'> {
    images: string[];
    categories: ICategory[];
}

export interface ICreateProductRequest
    extends Omit<CreateProductRequest.AsObject, 'imagesList' | 'categoriesList'> {
    images: string[];
    categories: string[];
}
export interface ICreateProductResponse extends IProductResponse {}

export interface IFindAllProductsRequest extends FindAllProductsRequest.AsObject {}
export interface IFindAllProductsResponse
    extends Omit<FindAllProductsResponse.AsObject, 'productsList'> {
    products: IProductResponse[];
}

export interface IFindProductByIdRequest extends FindProductByIdRequest.AsObject{}
export interface IFindProductByIdResponse extends IProductResponse{}

export interface IUpdateProductRequest extends Omit<UpdateProductRequest.AsObject, 'imagesList' | 'categoriesList'> {
    images: string[];
    categories: string[];
}
export interface IUpdateProductResponse extends IProductResponse{}

export interface IDeleteProductRequest extends DeleteProductRequest.AsObject{}
export interface IDeleteProductResponse extends IProductResponse{}

export interface ISearchProductsRequest extends SearchProductsRequest.AsObject{}

export interface ISearchProductsResponse extends IFindAllProductsResponse{}