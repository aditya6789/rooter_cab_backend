import express, { Request, Response, NextFunction } from 'express';
import { UserController } from '../controller/userController';
import upload from '../middleware/multer';
import { checkFcmToken, storeFcmToken } from '../controller/driverTokenSaveController';

export const UserRouter = express.Router();

UserRouter.get('/users', async (req: Request, res: Response, next: NextFunction) => {
  await UserController.getAllUsers(req, res, next);
});

UserRouter.get('/user', async (req: Request, res: Response, next: NextFunction) => {
  await UserController.getUser(req, res, next);
});

UserRouter.get('/driver-users', async (req: Request, res: Response, next: NextFunction) => {
  await UserController.getAllDrivers(req, res, next);
});

UserRouter.get('/driver-user/:id', async (req: Request, res: Response, next: NextFunction) => {
  await UserController.getDriver(req, res, next);
});

UserRouter.post('/driver-verify/:id', async (req: Request, res: Response, next: NextFunction) => {
  await UserController.verifyDriver(req, res, next);
});

UserRouter.post('/driver-reject/:id', async (req: Request, res: Response, next: NextFunction) => {
  await UserController.rejectDriver(req, res, next);
});

UserRouter.post('/driver-suspend/:id', async (req: Request, res: Response, next: NextFunction) => {
  await UserController.suspendDriver(req, res, next);
});

UserRouter.get('/driver-profile/:id', async (req: Request, res: Response, next: NextFunction) => {
  await UserController.getDriverProfile(req, res, next);
});

UserRouter.post('/contacts/:id', async (req: Request, res: Response, next: NextFunction) => {
  await UserController.createContacts(req, res);
});
UserRouter.post('/contacts/:id', async (req: Request, res: Response, next: NextFunction) => {
  await UserController.getUserContacts(req, res);
});

UserRouter.put('/update-user/:userId',upload.single("profile"), UserController.updateUser);

UserRouter.put('/update-driver/:id',upload.single("profile_image"), UserController.updateDriver);

UserRouter.get('/check-fcm-token/:driverId', checkFcmToken);

UserRouter.post('/store-fcm-token', async (req: Request, res: Response, ) => {
  await storeFcmToken(req, res, );
});

UserRouter.get('/driver-vehicles/:id', UserController.getDriverVehicles); 

UserRouter.put('/change-earnings-type/:id', UserController.changeEarningsType); 