import { Observable } from 'rxjs'; 
import {GetAllUserProfileRequest, GetAllUserProfileResponse, GetProfileRequest, GetProfileResponse} from 'src/proto_build/service/profile_pb';

export interface ProfileUsersService {
    getAllUserProfile(data: IGetAllUserProfileRequest): Observable<IGetAllUserProfileResponse>;
    getProfile(data: IGetProfileRequest): Observable<IGetProfileResponse>;
}

export interface IGetProfileRequest extends GetProfileRequest.AsObject {}
export interface IGetProfileResponse extends GetProfileResponse.AsObject {}

export interface IGetAllUserProfileRequest extends GetAllUserProfileRequest.AsObject {}
export interface IGetAllUserProfileResponse
    extends Omit<GetAllUserProfileResponse.AsObject, 'usersList'> {
    users: IGetProfileResponse[];
}
