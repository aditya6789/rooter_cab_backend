import { Request, Response } from 'express';
import Banner from '../models/bannerModel'; // You'll need to create this model

const BannerController = {
  // Create a new banner
  async createBanner(req: Request, res: Response): Promise<void> {
    console.log("createBanner");
    try {
      const { title, description, imageUrl, isActive, startDate, endDate } = req.body;
      console.log(req.body);

      if (!title || !imageUrl) {
        res.status(400).json({ message: 'Title and image URL are required' });
        return;
      }

      const banner = new Banner({
        title,
        description,
        imageUrl,
        isActive: isActive ?? true,
        startDate: startDate || new Date(),
        endDate
      });

      await banner.save();
      res.status(201).json(banner);
    } catch (error) {
      res.status(500).json({ message: 'Error creating banner', error });
    }
  },

  // Get all active banners
  async getActiveBanners(req: Request, res: Response): Promise<void> {
    console.log("getActiveBanners");
    try {
      const currentDate = new Date();
      const banners = await Banner.find({
        isActive: true,
        startDate: { $lte: currentDate },
        $or: [
          { endDate: { $gte: currentDate } },
          { endDate: null }
        ]
      }).sort({ createdAt: -1 });

      res.status(200).json(banners);
      console.log(banners);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching banners', error });
    }
  },

  // Get all banners (including inactive ones) - for admin
  async getAllBanners(req: Request, res: Response): Promise<void> {
    try {
      const banners = await Banner.find().sort({ createdAt: -1 });
      res.status(200).json(banners);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching banners', error });
    }
  },

  // Update a banner
  async updateBanner(req: Request, res: Response): Promise<void> {
    try {
      const { bannerId } = req.params;
      const updateData = req.body;

      const banner = await Banner.findByIdAndUpdate(
        bannerId,
        { $set: updateData },
        { new: true }
      );

      if (!banner) {
        res.status(404).json({ message: 'Banner not found' });
        return;
      }

      res.status(200).json(banner);
    } catch (error) {
      res.status(500).json({ message: 'Error updating banner', error });
    }
  },

  // Delete a banner
  async deleteBanner(req: Request, res: Response): Promise<void> {
    try {
      const { bannerId } = req.params;
      const banner = await Banner.findByIdAndDelete(bannerId);

      if (!banner) {
        res.status(404).json({ message: 'Banner not found' });
        return;
      }

      res.status(200).json({ message: 'Banner deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting banner', error });
    }
  },

  // Toggle banner active status
  async toggleBannerStatus(req: Request, res: Response): Promise<void> {
    try {
      const { bannerId } = req.params;
      const banner = await Banner.findById(bannerId);

      if (!banner) {
        res.status(404).json({ message: 'Banner not found' });
        return;
      }

      banner.isActive = !banner.isActive;
      await banner.save();

      res.status(200).json(banner);
    } catch (error) {
      res.status(500).json({ message: 'Error toggling banner status', error });
    }
  }
};

export default BannerController;
