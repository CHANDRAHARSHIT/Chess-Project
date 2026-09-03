import { Router } from "express";
import { PuzzleController } from "../controllers/puzzle.controller.js";

export const puzzleRouter = Router();

// GET /api/puzzles/themes — returns all distinct theme tags (public)
puzzleRouter.get("/themes", PuzzleController.getThemes);

// GET /api/puzzles — fetch puzzles filtered by themes + rating range (public)
puzzleRouter.get("/", PuzzleController.getPuzzles);
