export { handleGameResult } from "./results-listener.js";
export { persistGameResult } from "./results.repository.js";
export {
  DEFAULT_RATING,
  PROVISIONAL_K,
  ESTABLISHED_K,
  PROVISIONAL_GAMES_THRESHOLD,
  ELO_SCORE,
  kFactorFor,
  computeEloDelta,
} from "./rating.service.js";
