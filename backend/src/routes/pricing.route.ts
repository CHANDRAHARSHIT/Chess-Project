import { Router } from "express";
import { PricingController } from "../controllers/PricingController.js";

const pricingRouter = Router();

pricingRouter.get("/", PricingController.getPricing);

export { pricingRouter };
