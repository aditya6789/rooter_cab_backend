import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import { RazorpayError, RazorpayValidationError, RazorpayPaymentError, RazorpayResourceNotFoundError } from '../utils/errors/RazorpayError';

dotenv.config();

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

class RazorpayService {
    async createOrder(amount: number) {
        try {
            if (!amount || amount <= 0) {
                throw new RazorpayValidationError('Invalid amount provided');
            }

            const options = {
                amount: amount * 100,
                currency: 'INR',
                receipt: `receipt_order_id_${Date.now()}`,
            };
            return await razorpay.orders.create(options);
        } catch (error: any) {
            if (error instanceof RazorpayError) {
                throw error;
            }
            throw new RazorpayError(
                error.message || 'Failed to create order',
                error.statusCode || 500
            );
        }
    }

    async createContact(name: string, email: string, phone: string) {
        try {
            if (!name || !email || !phone) {
                throw new RazorpayValidationError('Name, email, and phone are required');
            }

            return await (razorpay as any).contacts.create({
                name,
                email,
                contact: phone,
                type: 'employee',
                reference_id: `user_${Date.now()}`,
                notes: {},
            });
        } catch (error: any) {
            if (error instanceof RazorpayError) {
                throw error;
            }
            throw new RazorpayError(
                error.message || 'Failed to create contact',
                error.statusCode || 500
            );
        }
    }

    async fetchContact(contactId: string) {
        try {
            if (!contactId) {
                throw new RazorpayValidationError('Contact ID is required');
            }

            const contact = await (razorpay as any).contacts.fetch(contactId);
            if (!contact) {
                throw new RazorpayResourceNotFoundError('Contact not found');
            }
            return contact;
        } catch (error: any) {
            if (error instanceof RazorpayError) {
                throw error;
            }
            throw new RazorpayError(
                error.message || 'Failed to fetch contact',
                error.statusCode || 500
            );
        }
    }

    async createFundAccount(contactId: string, accountNumber: string, ifsc: string, accountHolderName: string) {
        try {
            if (!contactId || !accountNumber || !ifsc || !accountHolderName) {
                throw new RazorpayValidationError('Contact ID, account number, IFSC, and account holder name are required');
            }

            return await (razorpay as any).fundAccount.create({
                contact_id: contactId,
                account_type: 'bank_account',
                bank_account: {
                    name: accountHolderName,
                    ifsc,
                    account_number: accountNumber,
                },
            });
        } catch (error: any) {
            if (error instanceof RazorpayError) {
                throw error;
            }
            throw new RazorpayError(
                error.message || 'Failed to create fund account',
                error.statusCode || 500
            );
        }
    }

    async makePayout(fundAccountId: string, amountInPaise: number, accountNumber: string) {
        try {
            if (!fundAccountId || !accountNumber) {
                throw new RazorpayValidationError('Fund account ID and account number are required');
            }

            if (!amountInPaise || amountInPaise <= 0) {
                throw new RazorpayPaymentError('Invalid payout amount');
            }

            return await (razorpay as any).payouts.create({
                account_number: accountNumber,
                fund_account_id: fundAccountId,
                amount: amountInPaise,
                currency: 'INR',
                mode: 'IMPS',
                purpose: 'payout',
                queue_if_low_balance: true,
            });
        } catch (error: any) {
            if (error instanceof RazorpayError) {
                throw error;
            }
            throw new RazorpayError(
                error.message || 'Failed to create payout',
                error.statusCode || 500
            );
        }
    }
}

export default new RazorpayService();