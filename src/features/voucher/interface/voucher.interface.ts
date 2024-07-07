import { FindAllCategoriesResponse } from 'src/proto_build/e_commerce/category_pb';
import {
    CheckVoucherByCodeRequest,
    CreateVoucherRequest,
    DeleteVoucherRequest,
    FindAllVouchersByTenantRequest,
    FindAllVouchersRequest,
    FindAllVouchersResponse,
    FindVoucherByIdRequest,
    UpdateVoucherRequest,
    Voucher,
    VoucherResponse,
} from 'src/proto_build/e_commerce/voucher_pb';

export interface IVoucher extends Voucher.AsObject {}

export interface IVoucherResponse extends VoucherResponse.AsObject {}

export interface ICreateVoucherRequest extends CreateVoucherRequest.AsObject {}
export interface ICreateVoucherResponse extends IVoucherResponse {}

export interface IFindAllVouchersRequest extends FindAllVouchersRequest.AsObject {}
export interface IFindAllVouchersResponse
    extends Omit<FindAllVouchersResponse.AsObject, 'vouchersList'> {
    vouchers: IVoucherResponse[];
}

export interface IFindAllVouchersByTenantRequest extends FindAllVouchersByTenantRequest.AsObject {}

export interface IFindVoucherByIdRequest extends FindVoucherByIdRequest.AsObject {}
export interface IFindVoucherByIdResponse extends IVoucherResponse {}

export interface IUpdateVoucherRequest extends UpdateVoucherRequest.AsObject {}
export interface IUpdateVoucherResponse extends IVoucherResponse {}

export interface IDeleteVoucherRequest extends DeleteVoucherRequest.AsObject {}
export interface IDeleteVoucherResponse extends IVoucherResponse {}

export interface ICheckVoucherByCodeRequest extends CheckVoucherByCodeRequest.AsObject {}
export interface ICheckVoucherByCodeResponse extends IVoucherResponse {}
