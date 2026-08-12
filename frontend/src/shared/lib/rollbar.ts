import Rollbar from "rollbar";

/**
 * Rollbar singleton for the frontend.
 * Import this instance anywhere you want to report errors manually,
 * e.g. rollbar.error(err) in catch blocks that swallow failures.
 * main.tsx passes this same instance into <RollbarProvider instance={rollbar}>
 * so components using useRollbar() share it too.
 */
const rollbar = new Rollbar({
  accessToken: import.meta.env.VITE_ROLLBAR_ACCESS_TOKEN,
  environment: import.meta.env.MODE || "development",
  // Rollbar only reports in production; local/dev runs are a no-op so
  // engineers don't burn quota or get paged for local errors.
  enabled: import.meta.env.PROD,
  captureUncaught: true,
  captureUnhandledRejections: true,
});

export default rollbar;
