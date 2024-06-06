import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import Logger, { LoggerKey } from '../logger/interfaces/logger.interface';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
    constructor(@Inject(LoggerKey) private logger: Logger) {}
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map(data => {
                // Log the response
                this.logger.info('ResponseInterceptor called: ', { props: data });
                return data;
            }),
        );
    }
}
