import { Catch, ExceptionFilter, ArgumentsHost, Injectable, Inject } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import Logger, { LoggerKey } from '../logger/interfaces/logger.interface';

@Catch(RpcException)
export class GrpcExceptionFilter implements ExceptionFilter {
    constructor(@Inject(LoggerKey) private logger: Logger) {}

    catch(exception: RpcException, host: ArgumentsHost) {
        const ctx = host.switchToRpc().getContext();
        console.log(exception);
        // Log the error
        this.logger.error('An error occurred when handling gRPC request:', {
            props: {
                error: exception.getError(),
                message: JSON.parse(exception.message),
            },
        });
    }
}
