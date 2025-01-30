import { Request, Response } from 'express';
import { addMoneyToWallet, withdrawFromWallet, getWallet } from '../services/walletService';
import { WalletModel } from '../models/walletModel';



// createWallet
export const createWallet = async (req: Request, res: Response) => {
  const { driverId } = req.body;
  const wallet = new WalletModel({ driverId: driverId });
  await wallet.save();
  res.status(200).json(wallet);
};


// Add balance to wallet (on ride completion)
export const addBalance = async (req: Request, res: Response) => {
  try {
    const { driverId, amount, description } = req.body;
    const wallet = await addMoneyToWallet(driverId, amount, description);
    res.status(200).json(wallet);
  } catch (error:any) {
    res.status(400).json({ message: error.message });
  }
};

// Withdraw from wallet
export const withdrawBalance = async (req: Request, res: Response) => {
  try {
    const { driverId, amount } = req.body;
    const wallet = await withdrawFromWallet(driverId, amount);
    res.status(200).json(wallet);
  } catch (error:any) {
    res.status(400).json({ message: error.message });
  }
};

// Get wallet details
export const getWalletDetails = async (req: Request, res: Response) => {
  console.log("getWalletDetails");
  try {
    const { driverId } = req.params;
    console.log("driverId", driverId);
    const wallet = await getWallet(driverId);
    console.log("wallet", wallet);
    // if(!wallet){
    //   const wallet = new WalletModel({ driverId: driverId });
    //   await wallet.save();
    //   console.log("wallet", wallet);
    //   return res.status(200).send(wallet);
    // }
    res.status(200).send(wallet);
  } catch (error:any) {
    res.status(400).json({ message: error.message });
  }
};
