import {  Router } from 'express';
import { createOffer, getOffers, getOfferById, updateOffer, deleteOffer } from '../controller/offerController';

const offerRouter = Router();

offerRouter.post('/offers', createOffer);
offerRouter.get('/offers', getOffers);
offerRouter.get('/offers/:id', getOfferById);
offerRouter.put('/offers/:id', updateOffer);
offerRouter.delete('/offers/:id', deleteOffer);

export default offerRouter;
