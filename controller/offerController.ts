import { Request, Response } from 'express';
import Offer, { IOffer } from '../models/offerModel';

const createOffer = async (req: Request, res: Response): Promise<void> => {
  try {
    const offer: IOffer = new Offer(req.body);
    await offer.save();
    res.status(201).json(offer);
  } catch (error:any) {
    res.status(400).json({ message: error.message });
  }
};

const getOffers = async (req: Request, res: Response): Promise<void> => {
  try {
    const offers: IOffer[] = await Offer.find();
    res.status(200).json(offers);
  } catch (error:any) {
    res.status(500).json({ message: error.message });
  }
};

const getOfferById = async (req: Request, res: Response): Promise<void> => {
  try {
    const offer: IOffer | null = await Offer.findById(req.params.id);
    if (offer) {
      res.status(200).json(offer);
    } else {
      res.status(404).json({ message: 'Offer not found' });
    }
  } catch (error:any) {
    res.status(500).json({ message: error.message });
  }
};

const updateOffer = async (req: Request, res: Response): Promise<void> => {
  try {
    const offer: IOffer | null = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (offer) {
      res.status(200).json(offer);
    } else {
      res.status(404).json({ message: 'Offer not found' });
    }
  } catch (error:any) {
    res.status(500).json({ message: error.message });
  }
};

const deleteOffer = async (req: Request, res: Response): Promise<void> => {
  try {
    const offer: IOffer | null = await Offer.findByIdAndDelete(req.params.id);
    if (offer) {
      res.status(200).json({ message: 'Offer deleted' });
    } else {
      res.status(404).json({ message: 'Offer not found' });
    }
  } catch (error:any) {
    res.status(500).json({ message: error.message });
  }
};

export { createOffer, getOffers, getOfferById, updateOffer, deleteOffer };
