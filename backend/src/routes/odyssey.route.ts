import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { OdysseyGameController } from "../controllers/odyssey-game.controller.js";
import { OdysseyBattleController } from "../controllers/odyssey-battle.controller.js";
import { OdysseyMerchantController } from "../controllers/odyssey-merchant.controller.js";
import { OdysseyRestController } from "../controllers/odyssey-rest.controller.js";
import { OdysseyPuzzleController } from "../controllers/odyssey-puzzle.controller.js";

export const odysseyRouter = Router();

// Every Odyssey/Story Mode route is scoped to the authenticated user's own save slots.
odysseyRouter.use(requireAuth);

// ── Run lifecycle ───────────────────────────────────────────────────────
// GET  /api/odyssey/slots                       — progress summary for every save slot
odysseyRouter.get("/slots", OdysseyGameController.getAllSlots);
// GET  /api/odyssey/slots/:slotId                — full run state for one save slot
odysseyRouter.get("/slots/:slotId", OdysseyGameController.getSlot);
// POST /api/odyssey/slots/:slotId/start          — starts a brand-new run (overwrites the slot)
odysseyRouter.post("/slots/:slotId/start", OdysseyGameController.startNewRun);
// POST /api/odyssey/slots/:slotId/character      — selects a character for the run
odysseyRouter.post("/slots/:slotId/character", OdysseyGameController.selectCharacter);
// POST /api/odyssey/slots/:slotId/reset          — resets the run (optionally keeping progress)
odysseyRouter.post("/slots/:slotId/reset", OdysseyGameController.resetRun);
// DELETE /api/odyssey/slots/:slotId              — deletes the save slot
odysseyRouter.delete("/slots/:slotId", OdysseyGameController.deleteSlot);
// POST /api/odyssey/slots/:slotId/nodes/:nodeId/enter — marks a node as entered
odysseyRouter.post("/slots/:slotId/nodes/:nodeId/enter", OdysseyGameController.enterNode);

// ── Battle ──────────────────────────────────────────────────────────────
// POST /api/odyssey/slots/:slotId/nodes/:nodeId/battle          — enters a battle node
odysseyRouter.post("/slots/:slotId/nodes/:nodeId/battle", OdysseyBattleController.startBattle);
// POST /api/odyssey/slots/:slotId/nodes/:nodeId/battle/move      — registers a player move's effect on bot conditions
odysseyRouter.post("/slots/:slotId/nodes/:nodeId/battle/move", OdysseyBattleController.registerPlayerMove);
// POST /api/odyssey/slots/:slotId/nodes/:nodeId/battle/ai-move   — computes the bot's move
odysseyRouter.post("/slots/:slotId/nodes/:nodeId/battle/ai-move", OdysseyBattleController.computeAiMove);
// POST /api/odyssey/slots/:slotId/nodes/:nodeId/battle/relic     — applies a battle relic's effect
odysseyRouter.post("/slots/:slotId/nodes/:nodeId/battle/relic", OdysseyBattleController.applyChargeAction);
// POST /api/odyssey/slots/:slotId/nodes/:nodeId/battle/resolve   — resolves the battle outcome
odysseyRouter.post("/slots/:slotId/nodes/:nodeId/battle/resolve", OdysseyBattleController.resolveOutcome);

// ── Merchant ────────────────────────────────────────────────────────────
// POST /api/odyssey/slots/:slotId/nodes/:nodeId/merchant   — enters a merchant node, rolls a catalog
odysseyRouter.post("/slots/:slotId/nodes/:nodeId/merchant", OdysseyMerchantController.openShop);
// POST /api/odyssey/slots/:slotId/merchant/purchase        — buys charges of a listing
odysseyRouter.post("/slots/:slotId/merchant/purchase", OdysseyMerchantController.purchase);
// POST /api/odyssey/slots/:slotId/merchant/sell            — sells an owned relic
odysseyRouter.post("/slots/:slotId/merchant/sell", OdysseyMerchantController.sell);
// POST /api/odyssey/slots/:slotId/merchant/reroll          — spends a Reroll charge for fresh offerings
odysseyRouter.post("/slots/:slotId/merchant/reroll", OdysseyMerchantController.reroll);
// POST /api/odyssey/slots/:slotId/nodes/:nodeId/merchant/leave — marks the merchant node completed
odysseyRouter.post("/slots/:slotId/nodes/:nodeId/merchant/leave", OdysseyMerchantController.leaveShop);

// ── Rest site ───────────────────────────────────────────────────────────
// POST /api/odyssey/slots/:slotId/nodes/:nodeId/rest        — enters a rest node, rolls an outcome
odysseyRouter.post("/slots/:slotId/nodes/:nodeId/rest", OdysseyRestController.enterRest);
// POST /api/odyssey/slots/:slotId/nodes/:nodeId/rest/apply   — applies the rolled outcome
odysseyRouter.post("/slots/:slotId/nodes/:nodeId/rest/apply", OdysseyRestController.applyRest);

// ── Puzzle ──────────────────────────────────────────────────────────────
// POST /api/odyssey/slots/:slotId/nodes/:nodeId/puzzle          — enters a puzzle node, fetches its puzzle set
odysseyRouter.post("/slots/:slotId/nodes/:nodeId/puzzle", OdysseyPuzzleController.enterPuzzle);
// POST /api/odyssey/slots/:slotId/nodes/:nodeId/puzzle/resolve  — resolves the puzzle set's reward
odysseyRouter.post("/slots/:slotId/nodes/:nodeId/puzzle/resolve", OdysseyPuzzleController.resolvePuzzle);
