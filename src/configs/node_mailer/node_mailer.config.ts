/**
 * @description NodeMailer configuration
 */

export default () => ({
    mailHost: process.env.MAIL_HOST || 'smtp.mailtrap.io',
    mailPort: parseInt(process.env.MAIL_PORT, 10) || 2525,
    mailUser: process.env.MAIL_USER || 'user',
    mailPassword: process.env.MAIL_PASSWORD || '123',
    mailFrom: process.env.MAIL_FROM || 'no-reply@gmail.com',
});
