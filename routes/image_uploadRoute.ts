import { Router } from 'express';
import upload from '../middleware/multer';
import { Request, Response } from 'express';
import { successResponse, failureResponse } from '../utils/response';

const router = Router();

// Single image upload route
router.post('/single', upload.single('image'), (req: Request, res: Response) => {
    console.log("single");
    console.log("req.file", req.file);
  try {
    if (!req.file) {
      console.log("No image file uploaded");
      return res.status(400).json(failureResponse('No image file uploaded'));
    }

    // Return the file information
    res.status(200).json(successResponse('Image uploaded successfully', {
      imageUrl: (req.file as any).location // AWS S3 URL
    }));

  } catch (error: any) {
    console.log("error", error);
    res.status(500).json(failureResponse(error.message));
  }
});

// Multiple images upload route (max 5 images)
router.post('/multiple', upload.array('images', 5), (req: Request, res: Response) => {
  console.log("multiple");
  console.log("req.files", req.files);
  try {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      console.log("No images uploaded");
      return res.status(400).json(failureResponse('No images uploaded'));
    }

    const files = req.files as Express.Multer.File[];
    const imageUrls = files.map(file => (file as any).location);

    res.status(200).json(successResponse('Images uploaded successfully', {
      imageUrls
    }));

  } catch (error: any) {
    console.log("error", error);
    res.status(500).json(failureResponse(error.message));
  }
});

export default router;
