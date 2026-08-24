import { Router } from "express";
import { PricingController } from "./pricing.controller.js";

const pricingRouter = Router();

pricingRouter.get("/", PricingController.getPricing);

export { pricingRouter };
