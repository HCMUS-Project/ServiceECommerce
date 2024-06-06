/**
 * @fileoverview callback.config - Configuration for redis database
 */

export default () => ({
    vnpayCallback: process.env.VNPAY_CALLBACK || 'http://localhost:3000/api/payment/url/return',
});
