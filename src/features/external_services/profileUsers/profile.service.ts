import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import { GrpcPermissionDeniedException } from 'nestjs-grpc-exceptions';
import { GrpcItemNotFoundException } from 'src/common/exceptions/exceptions';
import {
    IGetAllUserProfileRequest,
    IGetAllUserProfileResponse,
    IGetProfileRequest,
    IGetProfileResponse,
    ProfileUsersService,
} from './profile.interface';

@Injectable()
export class ProfileUserService {
    private profileUsersService: ProfileUsersService;

    constructor(@Inject('GRPC_ECOMMERCE_AUTH') private readonly client: ClientGrpc) {}

    onModuleInit() {
        this.profileUsersService = this.client.getService<ProfileUsersService>('ProfileService');
    }

    async getAllUserProfile(data: IGetAllUserProfileRequest): Promise<IGetAllUserProfileResponse> {
        try {
            return await firstValueFrom(this.profileUsersService.getAllUserProfile(data));
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
            if (errorDetails.error == 'DOMAIN_IS_EMPTY') {
                throw new GrpcItemNotFoundException('DOMAIN_IS_EMPTY');
            } else {
                throw new NotFoundException(
                    `Unhandled error type: ${errorDetails.error}`,
                    'Error not recognized',
                );
            }
        }
    }

    async getProfile(data: IGetProfileRequest): Promise<IGetProfileResponse> {
        try {
            return await firstValueFrom(this.profileUsersService.getProfile(data));
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
            if (errorDetails.error == 'DOMAIN_IS_EMPTY') {
                throw new GrpcItemNotFoundException('DOMAIN_IS_EMPTY');
            } else {
                throw new NotFoundException(
                    `Unhandled error type: ${errorDetails.error}`,
                    'Error not recognized',
                );
            }
        }
    }
}
