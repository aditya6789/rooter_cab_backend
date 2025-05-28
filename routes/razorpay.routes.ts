import express from 'express';
import RazorpayController from '../controller/razorpay.controller';
import auth from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * /api/razorpay/order:
 *   post:
 *     summary: Create a new Razorpay order
 *     security:
 *       - BearerAuth: []
 *     tags:
 *       - Razorpay
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount in INR
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/order', auth, RazorpayController.createOrder);

/**
 * @swagger
 * /api/razorpay/contact:
 *   post:
 *     summary: Create a new Razorpay contact for the authenticated user
 *     security:
 *       - BearerAuth: []
 *     tags:
 *       - Razorpay
 *     responses:
 *       201:
 *         description: Contact created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/contact', auth, RazorpayController.createContact);

/**
 * @swagger
 * /api/razorpay/fund-account:
 *   post:
 *     summary: Create a new fund account for the authenticated user
 *     security:
 *       - BearerAuth: []
 *     tags:
 *       - Razorpay
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountNumber
 *               - ifsc
 *               - accountHolderName
 *             properties:
 *               accountNumber:
 *                 type: string
 *                 description: Bank account number
 *               ifsc:
 *                 type: string
 *                 description: IFSC code of the bank
 *               accountHolderName:
 *                 type: string
 *                 description: Name of the account holder
 *     responses:
 *       201:
 *         description: Fund account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input or contact not found
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/fund-account', auth, RazorpayController.createFundAccount);

/**
 * @swagger
 * /api/razorpay/payout:
 *   post:
 *     summary: Make a payout to the user's fund account
 *     security:
 *       - BearerAuth: []
 *     tags:
 *       - Razorpay
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount in paise
 *     responses:
 *       201:
 *         description: Payout initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input or fund account not found
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/payout', auth, RazorpayController.makePayout);

export default router; 