import { Request, Response } from 'express';
import RazorpayService from '../services/razorpay_service';
import User from '../models/userModel';
import AuthenticatedRequest from '../middleware/types/request';
import { RazorpayError } from '../utils/errors/RazorpayError';

class RazorpayController {
    async createOrder(req: Request, res: Response) {
        try {
            const { amount } = req.body;
            const order = await RazorpayService.createOrder(amount);
            res.status(201).json({
                success: true,
                data: order,
                message: 'Order created successfully'
            });
        } catch (error) {
            if (error instanceof RazorpayError) {
                return res.status(error.statusCode).json({
                    success: false,
                    error: {
                        code: error.errorCode,
                        message: error.message
                    }
                });
            }
            console.error('Error creating order:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'An unexpected error occurred while creating the order'
                }
            });
        }
    }

    async createContact(req: AuthenticatedRequest, res: Response) {
        try {
            const user = await User.findById(req.user?._id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'USER_NOT_FOUND',
                        message: 'User not found'
                    }
                });
            }

            const contact = await RazorpayService.createContact(
                user.full_name,
                user.email,
                user.phone as string
            );

            user.razorpay_contact_id = contact.id;
            await user.save();

            res.status(201).json({
                success: true,
                data: contact,
                message: 'Contact created successfully'
            });
        } catch (error) {
            if (error instanceof RazorpayError) {
                return res.status(error.statusCode).json({
                    success: false,
                    error: {
                        code: error.errorCode,
                        message: error.message
                    }
                });
            }
            console.error('Error creating contact:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'An unexpected error occurred while creating the contact'
                }
            });
        }
    }

    async createFundAccount(req: AuthenticatedRequest, res: Response) {
        try {
            const { accountNumber, ifsc, accountHolderName } = req.body;
            const user = await User.findById(req.user?._id);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'USER_NOT_FOUND',
                        message: 'User not found'
                    }
                });
            }

            if (!user.razorpay_contact_id) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'CONTACT_NOT_FOUND',
                        message: 'Please create a contact first'
                    }
                });
            }

            const fundAccount = await RazorpayService.createFundAccount(
                user.razorpay_contact_id,
                accountNumber,
                ifsc,
                accountHolderName
            );

            user.razorpay_fund_account_id = fundAccount.id;
            await user.save();

            res.status(201).json({
                success: true,
                data: fundAccount,
                message: 'Fund account created successfully'
            });
        } catch (error) {
            if (error instanceof RazorpayError) {
                return res.status(error.statusCode).json({
                    success: false,
                    error: {
                        code: error.errorCode,
                        message: error.message
                    }
                });
            }
            console.error('Error creating fund account:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'An unexpected error occurred while creating the fund account'
                }
            });
        }
    }

    async makePayout(req: AuthenticatedRequest, res: Response) {
        try {
            const { amount } = req.body;
            const user = await User.findById(req.user?._id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'USER_NOT_FOUND',
                        message: 'User not found'
                    }
                });
            }

            if (!user.razorpay_fund_account_id) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'FUND_ACCOUNT_NOT_FOUND',
                        message: 'Please create a fund account first'
                    }
                });
            }

            const payout = await RazorpayService.makePayout(
                user.razorpay_fund_account_id,
                amount,
                process.env.RAZORPAY_ACCOUNT_NUMBER!
            );

            res.status(201).json({
                success: true,
                data: payout,
                message: 'Payout initiated successfully'
            });
        } catch (error) {
            if (error instanceof RazorpayError) {
                return res.status(error.statusCode).json({
                    success: false,
                    error: {
                        code: error.errorCode,
                        message: error.message
                    }
                });
            }
            console.error('Error making payout:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'An unexpected error occurred while processing the payout'
                }
            });
        }
    }
}

export default new RazorpayController(); 