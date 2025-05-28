import express from 'express';
import BannerController from '../controller/bannerController';


const router = express.Router();

// Public routes
router.get('/active', BannerController.getActiveBanners);


router.post('/create', BannerController.createBanner);
router.get('/all', BannerController.getAllBanners);
router.put('/:bannerId', BannerController.updateBanner);
router.delete('/:bannerId', BannerController.deleteBanner);
router.patch('/:bannerId/toggle-status', BannerController.toggleBannerStatus);

export default router; 