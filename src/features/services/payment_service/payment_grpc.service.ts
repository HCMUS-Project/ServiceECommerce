import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import {
    ICreatePaymentUrlRequest,
    ICreatePaymentUrlResponse,
    PaymentService,
} from './payment_grpc.interface';
import { GrpcPermissionDeniedException } from 'nestjs-grpc-exceptions';
import { GrpcItemNotFoundException } from 'src/common/exceptions/exceptions';

@Injectable()
export class PaymentGrpcService {
    private paymentService: PaymentService;

    constructor(@Inject('GRPC_TENANT_PAYMENT') private readonly client: ClientGrpc) {}

    onModuleInit() {
        this.paymentService = this.client.getService<PaymentService>('PaymentService');
    }

    async createPaymentUrl(data: ICreatePaymentUrlRequest): Promise<ICreatePaymentUrlResponse> {
        try {
            return await firstValueFrom(this.paymentService.createPaymentUrl(data));
        } catch (e) {
            // console.log(e)
            let errorDetails: { error?: string };
            try {
                errorDetails = JSON.parse(e.details);
            } catch (parseError) {
                console.error('Error parsing details:', parseError);
                throw new GrpcItemNotFoundException(String(e));
            }
            // console.log(errorDetails);

            if (errorDetails.error == 'PERMISSION_DENIED') {
                throw new GrpcPermissionDeniedException('PERMISSION_DENIED');
            }
            if (errorDetails.error == 'ORDER_EMPTY') {
                throw new GrpcItemNotFoundException('ORDER_EMPTY');
            }
            if (errorDetails.error == 'PAYMENT_METHOD_NOT_FOUND') {
                throw new GrpcItemNotFoundException('PAYMENT_METHOD_NOT_FOUND');
            } else {
                throw new NotFoundException(
                    `Unhandled error type: ${errorDetails.error}`,
                    'Error not recognized',
                );
            }
        }
    }
}
