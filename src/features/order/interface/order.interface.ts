import {
    CancelOrderRequest,
    CancelOrderResponse,
    CreateOrderRequest,
    CreateOrderResponse,
    GetOrderRequest,
    GetOrderResponse,
    ListOrdersRequest,
    ListOrdersForTenantRequest,
    ListOrdersResponse,
    OrderProduct,
    UpdateStageOrderRequest,
    UpdateStageOrderResponse,
    GetAllOrderValueRequest,
    OrderReport,
    GetAllOrderValueResponse,
    OrderReportOfUser,
    GetOrdersReportOfListUsersRequest,
    GetOrdersReportOfListUsersResponse,
} from 'src/proto_build/e_commerce/order_pb';

export interface ICreateOrderRequest
    extends Omit<CreateOrderRequest.AsObject, 'productsIdList' | 'quantitiesList'> {
    productsId: string[];
    quantities: number[];
}
export interface ICreateOrderResponse extends CreateOrderResponse.AsObject {}

export interface IOrderProduct extends Omit<OrderProduct.AsObject, 'imagesList'> {
    images: string[];
}
export interface IGetOrderRequest extends GetOrderRequest.AsObject {}
export interface IGetOrderResponse extends Omit<GetOrderResponse.AsObject, 'productsList'> {
    products: IOrderProduct[];
}

export interface IListOrdersRequest extends ListOrdersRequest.AsObject {}
export interface IListOrdersResponse extends Omit<ListOrdersResponse.AsObject, 'ordersList'> {
    orders: IGetOrderResponse[];
}

export interface IListOrdersForTenantRequest extends ListOrdersForTenantRequest.AsObject {}

export interface IUpdateStageOrderRequest extends UpdateStageOrderRequest.AsObject {}
export interface IUpdateStageOrderResponse extends UpdateStageOrderResponse.AsObject {}

export interface ICancelOrderRequest extends CancelOrderRequest.AsObject {}
export interface ICancelOrderResponse extends CancelOrderResponse.AsObject {}

export interface IOrderReport extends OrderReport.AsObject {}

export interface IGetAllOrderValueRequest extends GetAllOrderValueRequest.AsObject {}
export interface IGetAllOrderValueResponse
    extends Omit<GetAllOrderValueResponse.AsObject, 'reportList'> {
    report: IOrderProduct[];
}

export interface IOrderReportOfUser extends OrderReportOfUser.AsObject {}
export interface IGetOrdersReportOfListUsersRequest
    extends Omit<GetOrdersReportOfListUsersRequest.AsObject, 'emailsList'> {
    emails: string[];
}
export interface IGetOrdersReportOfListUsersResponse
    extends Omit<GetOrdersReportOfListUsersResponse.AsObject, 'reportOrdersList'> {
    reportOrders: IOrderReportOfUser[];
}
