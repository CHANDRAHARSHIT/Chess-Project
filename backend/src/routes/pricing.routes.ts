import { Router } from "express";
import { PricingController } from "../controllers/pricing.controller.js";

const pricingRouter = Router();

pricingRouter.get("/", PricingController.getPricing);

export { pricingRouter };
