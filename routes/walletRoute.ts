import express from 'express';
import { addBalance, withdrawBalance, getWalletDetails, createWallet } from '../controller/walletController';

const walletRouter = express.Router();
walletRouter.post('/create', createWallet);

walletRouter.post('/add', addBalance);        // Add money to wallet
walletRouter.post('/withdraw', withdrawBalance); // Withdraw money from wallet
walletRouter.get('/:driverId', getWalletDetails); // Get wallet and transactions

export default walletRouter;
