import { WalletModel } from '../models/walletModel';
import { Types } from 'mongoose';

// Add money to wallet (on ride completion)
export const addMoneyToWallet = async (driverId: string, amount: number, description: string) => {
  let wallet = await WalletModel.findOne({ driverId });
  console.log(wallet);
  if (!wallet) {
    wallet = new WalletModel({ driverId, balance: 0, transactions: [] });
  }

  // Update balance and add transaction
  wallet.balance += amount;
  wallet.transactions.push({ type: 'credit', amount, description, date: new Date() });

  await wallet.save();
  return wallet;
};

// Withdraw money from wallet
export const withdrawFromWallet = async (driverId: string, amount: number) => {
  const wallet = await WalletModel.findOne({ driverId });
  if (!wallet) {
    throw new Error('Wallet not found');
  }

  // Ensure balance is sufficient
  if (wallet.balance < amount) {
    throw new Error('Insufficient balance');
  }

  // Deduct balance and add transaction
  wallet.balance -= amount;
  wallet.transactions.push({ type: 'debit', amount, description: 'Withdrawal', date: new Date() });

  await wallet.save();
  return wallet;
};

// Fetch wallet and transactions
export const getWallet = async (driverId: string) => {
  console.log("driverId", driverId);
  const wallet = await WalletModel.findOne({ driverId });
  if (!wallet) {
   console.log("wallet not found");
   const wallet = new WalletModel({ driverId: driverId });
   await wallet.save();
   return wallet;
  }

  return wallet;
};
