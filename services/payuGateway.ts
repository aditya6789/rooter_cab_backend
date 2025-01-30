import { PayU } from "payu-websdk";

const payu = new PayU({
  merchantId: process.env.PAYU_MERCHANT_ID,
  merchantKey: process.env.PAYU_MERCHANT_KEY,
  merchantSalt: process.env.PAYU_MERCHANT_SALT,
  baseUrl: process.env.PAYU_BASE_URL,
});
