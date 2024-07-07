import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as brevo from '@getbrevo/brevo';

export interface SmtpParams {
    email: string;
    name: string;
    type: string;
    domain: string;
    id: string;
    date: string;
    logolink: string;
    descriptionTenant: string;
    trackOrderLinkDesktop: string;
    trackOrderLinkMobile: string;
    continueShoppingLinkMobile: string;
    continueShoppingLinkDesktop: string;
    items: {
        name: string;
        price: number;
        description: string;
        img: string;
        quantityOrder: number;
    }[];
    noteCancel: string;
}

@Injectable()
export class BrevoMailerService {
    private apiInstance: any;

    constructor(private configService: ConfigService) {
        this.apiInstance = new brevo.TransactionalEmailsApi();
        let apiKey = this.apiInstance.authentications['apiKey'];
        apiKey.apiKey = this.configService.get<string>('BREVO_API_KEY');
    }

    async sendTransactionalEmail(
        to: { email: string; name?: string }[],
        templateId: number,
        params: SmtpParams,
    ) {
        const sendSmtpEmail = new brevo.SendSmtpEmail();

        // sendSmtpEmail.to = [
        //     {
        //         email: 'volehoai070902@gmail.com',
        //         name: 'Vo Le Hoai',
        //     },
        // ];
        sendSmtpEmail.to = to;
        // sendSmtpEmail.templateId = 4;
        sendSmtpEmail.templateId = templateId;
        // sendSmtpEmail.params = {
        //     email: 'volehoai070902@gmail.com',
        //     name: 'Hoai',
        //     type: 'Order',
        //     domain: '30shine.com',
        //     id: 'anh ba van ngai',
        //     date: '20-06-2024',
        //     logolink:
        //         'https://dpbostudfzvnyulolxqg.supabase.co/storage/v1/object/public/datn.tenant/service/49d3d73e-0740-444f-8b84-a55c66e6138d',
        //     descriptionTenant: 'description soem thing',
        //     trackOrderLinkDesktop: 'https://saas-30shine.vercel.app/user-info/order',
        //     trackOrderLinkMobile: 'https://nvukhoi.id.vn/result',
        //     continueShoppingLinkMobile: 'https://nvukhoi.id.vn/result',
        //     continueShoppingLinkDesktop: 'https://saas-30shine.vercel.app/',
        //     items: [
        //         {
        //             name: 'item1',
        //             price: 30,
        //             img: 'https://dpbostudfzvnyulolxqg.supabase.co/storage/v1/object/public/datn.tenant/service/8b47c968-fd8d-4c73-97de-3a1c1b780cb4',
        //             description: 'something',
        //         },
        //         {
        //             name: 'item2',
        //             price: 50,
        //             img: 'https://dpbostudfzvnyulolxqg.supabase.co/storage/v1/object/public/datn.tenant/service/8b9e1de8-9c9a-4e72-87c0-f7d8db1525d4',
        //             description: 'something',
        //         },
        //     ],
        // };
        sendSmtpEmail.params = params;
        sendSmtpEmail.headers = {
            'X-Mailin-custom':
                'custom_header_1:custom_value_1|custom_header_2:custom_value_2|custom_header_3:custom_value_3',
            charset: 'iso-8859-1',
        };

        try {
            const data = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
            // console.log('API called successfully. Returned data: ' + JSON.stringify(data));
            return data;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}
