import * as randomString from 'randomstring';

export function generateOtp(length: number): string {
    return randomString.generate({
        length: length,
        charset: 'numeric',
    });
}
