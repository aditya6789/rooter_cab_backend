import express, { Request, Response, NextFunction } from "express";
import { check } from "express-validator";
import {
  createMake,
  createVehicleModel,
  deleteMake,
  deleteVehicleModel,
  getAllMakes,
  getMakeById,
  getMakes,
  getVehicleModelById,
  getVehicleModels,
  getVehicleModelsByMakeId,
  updateMake,
  updateVehicleModel,
  VehicleCategoryController
} from "../controller/vechileController";
import upload from "../middleware/multer"; // Import your multer middleware

const vehicleRouter = express.Router();

vehicleRouter.get("/make", async (req: Request, res: Response) => {
  await getAllMakes(req, res);
});

vehicleRouter.get("/model/:id", async (req: Request, res: Response) => {
  await getVehicleModelsByMakeId(req, res);
});

vehicleRouter.post("/make",  async (req: Request, res: Response, next: NextFunction) => {
  await createMake(req, res, next);
});

vehicleRouter.get("/makes", async (req: Request, res: Response) => {
  await getMakes(req, res);
});

vehicleRouter.get("/makes/:id", async (req: Request, res: Response) => {
  await getMakeById(req, res);
});

vehicleRouter.put("/makes/:id", upload.single("logo"), async (req: Request, res: Response, next: NextFunction) => {
  await updateMake(req, res, next);
});

vehicleRouter.delete("/makes/:id", async (req: Request, res: Response, next: NextFunction) => {
  await deleteMake(req, res, next);
});

vehicleRouter.post("/vehicle-models", [
  check("make").notEmpty().withMessage("Make is required"),
  check("name").notEmpty().withMessage("Name is required"),
], async (req: Request, res: Response, next: NextFunction) => {
  await createVehicleModel(req, res, next);
});

vehicleRouter.get("/vehicle-models", async (req: Request, res: Response) => {
  await getVehicleModels(req, res);
});

vehicleRouter.get("/vehicle-models/:id", async (req: Request, res: Response) => {
  await getVehicleModelById(req, res);
});

vehicleRouter.put("/vehicle-models/:id", upload.single("image"), [
  check("make").notEmpty().withMessage("Make is required"),
  check("name").notEmpty().withMessage("Name is required"),
], async (req: Request, res: Response, next: NextFunction) => {
  await updateVehicleModel(req, res, next);
});

vehicleRouter.delete("/vehicle-models/:id", async (req: Request, res: Response, next: NextFunction) => {
  await deleteVehicleModel(req, res, next);
});

// Vehicle category routes
vehicleRouter.post("/vehicle-category", async (req: Request, res: Response, next: NextFunction) => {
  await VehicleCategoryController.createVehicleCategory(req, res, next);
});

vehicleRouter.get("/vehicle-category", async (req: Request, res: Response, next: NextFunction) => {
  await VehicleCategoryController.getAllVehiclecategory(req, res, next);
});

vehicleRouter.put("/vehicle-category/:id", async (req: Request, res: Response, next: NextFunction) => {
  await VehicleCategoryController.updateVehicleCategory(req, res, next);
});

vehicleRouter.delete("/vehicle-category/:id", async (req: Request, res: Response, next: NextFunction) => {
  await VehicleCategoryController.deleteVehicleCategory(req, res, next);
});

vehicleRouter.get("/driver-vehicle-type/:driverId", async (req: Request, res: Response, next: NextFunction) => {
  await VehicleCategoryController.getDriverVehicleType(req, res);
});

export default vehicleRouter;
