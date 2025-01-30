import express, { Request, Response } from "express";
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

vehicleRouter.post("/make",  async (req: Request, res: Response) => {
  await createMake(req, res);
});

vehicleRouter.get("/makes", async (req: Request, res: Response) => {
  await getMakes(req, res);
});

vehicleRouter.get("/makes/:id", async (req: Request, res: Response) => {
  await getMakeById(req, res);
});

vehicleRouter.put("/makes/:id", upload.single("logo"), async (req: Request, res: Response) => {
  await updateMake(req, res);
});

vehicleRouter.delete("/makes/:id", async (req: Request, res: Response) => {
  await deleteMake(req, res);
});

vehicleRouter.post("/vehicle-models", [
  check("make").notEmpty().withMessage("Make is required"),
  check("name").notEmpty().withMessage("Name is required"),
], async (req: Request, res: Response) => {
  await createVehicleModel(req, res);
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
], async (req: Request, res: Response) => {
  await updateVehicleModel(req, res);
});

vehicleRouter.delete("/vehicle-models/:id", async (req: Request, res: Response) => {
  await deleteVehicleModel(req, res);
});

// Vehicle category routes
vehicleRouter.post("/vehicle-category", async (req: Request, res: Response) => {
  await VehicleCategoryController.createVehicleCategory(req, res);
});

vehicleRouter.get("/vehicle-category", async (req: Request, res: Response) => {
  await VehicleCategoryController.getAllVehiclecategory(req, res);
});

vehicleRouter.put("/vehicle-category/:id", async (req: Request, res: Response) => {
  await VehicleCategoryController.updateVehicleCategory(req, res);
});

vehicleRouter.delete("/vehicle-category/:id", async (req: Request, res: Response) => {
  await VehicleCategoryController.deleteVehicleCategory(req, res);
});

vehicleRouter.get("/driver-vehicle-type/:driverId", async (req: Request, res: Response) => {
  await VehicleCategoryController.getDriverVehicleType(req, res);
});

export default vehicleRouter;
