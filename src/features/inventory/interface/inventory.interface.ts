import e from 'express';
import {
    AddProductQuantityRequest,
    AddProductQuantityResponse,
    FindAllInventoryFormRequest,
    FindAllInventoryFormResponse,
    UpdateInventoryFormRequest,
    InventoryFormResponse,
    DeleteInventoryFormRequest,
    DeleteInventoryFormResponse,
    TransactionProduct,
    UpdateInventoryFormResponse,
} from 'src/proto_build/e_commerce/inventory_pb';


export interface ITransactionProduct extends TransactionProduct.AsObject {}

export interface IInventoryForm extends Omit<InventoryFormResponse.AsObject, 'productsList'> {
    products: ITransactionProduct[];
}

export interface IAddProductQuantityRequest
    extends Omit<AddProductQuantityRequest.AsObject, 'productsList'> {
        products: ITransactionProduct[];
}

export interface IAddProductQuantityResponse extends Omit<AddProductQuantityResponse.AsObject, 'productsList'> {
    products: ITransactionProduct[];
}

export interface IFindAllInventoryFormRequest extends FindAllInventoryFormRequest.AsObject {}
export interface IFindAllInventoryFormResponse extends Omit<FindAllInventoryFormResponse.AsObject, 'inventoryFormList'> {
    inventoryForm: IInventoryForm[];
}

export interface IUpdateInventoryFormRequest
    extends Omit<UpdateInventoryFormRequest.AsObject, 'productsList'> {
        products: ITransactionProduct[];
}
export interface IUpdateInventoryFormResponse extends Omit<UpdateInventoryFormResponse.AsObject, 'productsList'> {
    products: ITransactionProduct[];
}


export interface IInventoryFormResponse extends InventoryFormResponse.AsObject {}

export interface IDeleteInventoryFormRequest extends DeleteInventoryFormRequest.AsObject {}
export interface IDeleteInventoryFormResponse extends Omit<DeleteInventoryFormResponse.AsObject, 'productsList'> {
    products: ITransactionProduct[];
}