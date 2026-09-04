import { OdysseyGame } from "../../models/OdysseyGame.js";
import { OdysseyMap } from "../../models/OdysseyMap.js";
import { OdysseyBattle } from "../../models/OdysseyBattle.js";
import { OdysseyBattleNode } from "../../models/OdysseyBattleNode.js";
import { ENodeType } from "../../enums/ENodeType.js";
import { EDifficulty } from "../../enums/EDifficulty.js";

/** Builds a fully-populated OdysseyGame for tests, overridable field-by-field. */
export function makeGame(overrides: Partial<OdysseyGame> = {}): OdysseyGame {
  const game = new OdysseyGame();
  game.id = "game-1";
  game.userId = "user-1";
  game.slotId = 1;
  game.player = null;
  game.map = OdysseyMap.generate("factory-seed");
  game.coins = 50;
  game.relics = [];
  game.completedNodes = [];
  game.currentNodeId = -1;
  game.journeyComplete = false;
  game.playtimeSeconds = 0;
  game.updatedAt = new Date();
  Object.assign(game, overrides);
  return game;
}

export function makeBattleNode(difficulty: EDifficulty = EDifficulty.Beginner, id = 1): OdysseyBattleNode {
  return new OdysseyBattleNode(id, ENodeType.Enemy, "Test Node", 50, 50, [], "A test encounter.", difficulty);
}

export function makeBattle(difficulty: EDifficulty = EDifficulty.Beginner): OdysseyBattle {
  return new OdysseyBattle(makeBattleNode(difficulty));
}
