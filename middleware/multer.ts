import multer from "multer";
import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Configure S3 client
const s3Client = new S3Client({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// File filter to accept only images
const fileFilter = (req: any, file: any, cb: any) => {
  console.log("Filtering file:", file.originalname);
  const fileTypes = /jpeg|jpg|png/;
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = fileTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only images are allowed"));
  }
};

// Initialize multer with S3 storage
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: 'rootercab',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req: any, file: any, cb: any) {
      console.log("Processing metadata for:", file.originalname);
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req: any, file: any, cb: any) {
      console.log("Generating key for:", file.originalname);
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const key = `uploads/${uniqueSuffix}-${file.originalname}`;
      console.log("Generated key:", key);
      cb(null, key);
    }
  } as any),
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});



export default upload;
