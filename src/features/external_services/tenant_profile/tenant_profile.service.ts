import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import { GrpcPermissionDeniedException } from 'nestjs-grpc-exceptions';
import { GrpcItemNotFoundException } from 'src/common/exceptions/exceptions';
import {
    IFindTenantProfileByTenantIdRequest,
    ITenantProfileResponse,
    TenantProfileService,
} from './tenant_profile.interface';

@Injectable()
export class FindTenantProfileService {
    private tenantProfileService: TenantProfileService;

    constructor(@Inject('GRPC_ECOMMERCE_TENANT') private readonly client: ClientGrpc) {}

    onModuleInit() {
        this.tenantProfileService =
            this.client.getService<TenantProfileService>('TenantProfileService');
    }

    async findTenantProfileByTenantId(
        data: IFindTenantProfileByTenantIdRequest,
    ): Promise<ITenantProfileResponse> {
        try {
            return await firstValueFrom(
                this.tenantProfileService.findTenantProfileByTenantId(data),
            );
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

            if (errorDetails.error == 'TENANT_PROFILE_NOT_FOUND') {
                throw new GrpcPermissionDeniedException('Tenant profile not found');
            } else {
                throw new NotFoundException(
                    `Unhandled error type: ${errorDetails.error}`,
                    'Error not recognized',
                );
            }
        }
    }
}
