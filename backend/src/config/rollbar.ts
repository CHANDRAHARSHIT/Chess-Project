import Rollbar from "rollbar";
import { env } from "./env.js";

/**
 * Rollbar singleton for the backend.
 * Import this instance anywhere you want to report errors manually,
 * e.g. rollbar.error(err) in catch blocks.
 * The Express error handler middleware uses this automatically.
 */
const rollbar = new Rollbar({
  accessToken: env.ROLLBAR_ACCESS_TOKEN,
  environment: env.NODE_ENV,
  captureUncaught: true,
  captureUnhandledRejections: true,
  // Scrub sensitive fields from payloads before sending to Rollbar
  scrubFields: ["password", "accessToken", "authorization", "cookie"],
});

export default rollbar;
