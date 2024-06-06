import { Inject, Injectable } from '@nestjs/common';
import Logger, { LoggerKey } from './core/logger/interfaces/logger.interface';
import { GrpcNotFoundException, GrpcUnknownException } from 'nestjs-grpc-exceptions';
import { Hero } from './proto_build/main_pb';

@Injectable()
export class AppService {
    constructor(@Inject(LoggerKey) private logger: Logger) {}

    findOne(data: { id: number }): Hero {
        this.logger.error('findOne called');
        var res = new Hero();
        res.setId(data.id);
        res.setName("Hero's name"); // replace with actual name
        return res;
    }
}
