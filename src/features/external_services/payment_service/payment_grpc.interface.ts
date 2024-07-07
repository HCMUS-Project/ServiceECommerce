import { Observable } from 'rxjs';
import {
    CreatePaymentUrlRequest,
    CreatePaymentUrlResponse,
} from 'src/proto_build/service/payment_pb';

export interface PaymentService {
    createPaymentUrl(data: ICreatePaymentUrlRequest): Observable<ICreatePaymentUrlResponse>;
}

export interface ICreatePaymentUrlRequest
    extends Omit<CreatePaymentUrlRequest.AsObject, 'orderProductsIdList' | 'orderBookingIdList'> {
    orderProductsId: string[];
    orderBookingId: string[];
}
export interface ICreatePaymentUrlResponse extends CreatePaymentUrlResponse.AsObject {}
