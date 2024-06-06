import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AppService } from './app.service';

@Controller()
export class AppController {
    constructor(private readonly heroService: AppService) {}

    @GrpcMethod('SignUpService', 'SignUp')
    SignUp(data: { email: string; password: string }): { token: string } {
        console.log(data);
        return { token: 'hello' };
    }

    @GrpcMethod('AppService', 'FindOne')
    findOne(data: { id: string }): { id; name } {
        return { id: data.id, name: 'hello' };
    }
}
