import {
    CancelOrderRequest,
    CancelOrderResponse,
    CreateOrderRequest,
    CreateOrderResponse,
    GetOrderRequest,
    GetOrderResponse,
    ListOrdersRequest,
    ListOrdersResponse,
    OrderProduct,
    UpdateStageOrderRequest,
    UpdateStageOrderResponse,
} from 'src/proto_build/e_commerce/order_pb';

export interface ICreateOrderRequest
    extends Omit<CreateOrderRequest.AsObject, 'productsIdList' | 'quantitiesList'> {
    productsId: string[];
    quantities: number[];
}
export interface ICreateOrderResponse extends CreateOrderResponse.AsObject {}

export interface IOrderProduct extends OrderProduct.AsObject {}
export interface IGetOrderRequest extends GetOrderRequest.AsObject {}
export interface IGetOrderResponse extends Omit<GetOrderResponse.AsObject, 'productsList'> {
    products: IOrderProduct[];
}

export interface IListOrdersRequest extends ListOrdersRequest.AsObject {}
export interface IListOrdersResponse extends Omit<ListOrdersResponse.AsObject, 'ordersList'> {
    orders: IGetOrderResponse[];
}

export interface IUpdateStageOrderRequest extends UpdateStageOrderRequest.AsObject {}
export interface IUpdateStageOrderResponse extends UpdateStageOrderResponse.AsObject {}

export interface ICancelOrderRequest extends CancelOrderRequest.AsObject {}
export interface ICancelOrderResponse extends CancelOrderResponse.AsObject {}
