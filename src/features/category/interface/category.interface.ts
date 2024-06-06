import {
    CreateCategoryRequest,
    CreateCategoryResponse,
    FindAllCategoriesRequest,
    FindAllCategoriesResponse,
    FindOneCategoryRequest,
    FindOneCategoryResponse,
    RemoveCategoryRequest,
    RemoveCategoryResponse,
    UpdateCategoryRequest,
    UpdateCategoryResponse,
} from 'src/proto_build/e_commerce/category_pb';

export interface ICreateCategoryRequest extends CreateCategoryRequest.AsObject {}
export interface ICreateCategoryResponse extends CreateCategoryResponse.AsObject {}

export interface IFindOneCategoryRequest extends FindOneCategoryRequest.AsObject {}
export interface IFindOneCategoryResponse extends FindOneCategoryResponse.AsObject {}

export interface IFindAllCategoriesRequest extends FindAllCategoriesRequest.AsObject {}
export interface IFindAllCategoriesResponse
    extends Omit<FindAllCategoriesResponse.AsObject, 'categoriesList'> {
    categories: FindOneCategoryResponse.AsObject[];
}

export interface IUpdateCategoryRequest extends UpdateCategoryRequest.AsObject {}
export interface IUpdateCategoryResponse extends UpdateCategoryResponse.AsObject {}

export interface IRemoveCategoryRequest extends RemoveCategoryRequest.AsObject {}
export interface IRemoveCategoryResponse extends RemoveCategoryResponse.AsObject {}
