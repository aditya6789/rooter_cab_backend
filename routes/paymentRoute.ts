import { Router } from "express";
import PaymentController from "../controller/paymentController";

const paymentRouter = Router();

paymentRouter.post("/pay", PaymentController.createPayment);
paymentRouter.get("/pay", PaymentController.getPayment);
paymentRouter.put("/pay/", PaymentController.updatePaymentStatus);
paymentRouter.post("/payu/hash", PaymentController.generateHash);

export default paymentRouter;
