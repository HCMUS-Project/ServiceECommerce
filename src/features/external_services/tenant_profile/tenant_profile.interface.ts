import { Observable } from 'rxjs';
import {
    FindTenantProfileByTenantIdRequest,
    TenantProfileResponse,
} from 'src/proto_build/service/tenantprofile_pb';

export interface TenantProfileService {
    findTenantProfileByTenantId(
        data: IFindTenantProfileByTenantIdRequest,
    ): Observable<ITenantProfileResponse>;
}

export interface IFindTenantProfileByTenantIdRequest
    extends FindTenantProfileByTenantIdRequest.AsObject {}
export interface ITenantProfileResponse extends TenantProfileResponse.AsObject {}
