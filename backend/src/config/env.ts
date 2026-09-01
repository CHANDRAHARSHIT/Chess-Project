import dotenv from "dotenv";

// Load environment variables from the server-side environment definition (.env)
dotenv.config();

const requiredEnvs = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "AUTH_URL",
  "AUTH_GOOGLE_ID",
  "AUTH_GOOGLE_SECRET",
  "ROLLBAR_ACCESS_TOKEN",
];

const missingEnvs = requiredEnvs.filter((key) => !process.env[key]);

if (missingEnvs.length > 0) {
  throw new Error(
    `Configuration Error: Missing required environment variables: ${missingEnvs.join(", ")}`
  );
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "3000", 10),
  DATABASE_URL: process.env.DATABASE_URL!,
  AUTH_SECRET: process.env.AUTH_SECRET!,
  AUTH_URL: process.env.AUTH_URL!,
  AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST || "true",
  AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID!,
  AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET!,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  
  // Payment variables
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  STRIPE_PRICE_PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY,
  STRIPE_PRICE_PRO_YEARLY: process.env.STRIPE_PRICE_PRO_YEARLY,
  STRIPE_SUCCESS_URL: process.env.STRIPE_SUCCESS_URL,
  STRIPE_CANCEL_URL: process.env.STRIPE_CANCEL_URL,

  // Multiplayer (all optional — MULTIPLAYER_ENABLED=false disables all real-time infrastructure)
  // MULTIPLAYER_ENABLED: Gates every WebSocket route and matchmaking endpoint.
  MULTIPLAYER_ENABLED: process.env.MULTIPLAYER_ENABLED === "true",

  //   Must match the Vite dev proxy entry and the Vercel rewrite rule (if applicable).
  WS_PATH: process.env.WS_PATH ?? "/ws",

  // Bot fallback (all optional — BOT_FALLBACK_ENABLED=false keeps current matchmaking behavior)
  BOT_FALLBACK_ENABLED: process.env.BOT_FALLBACK_ENABLED === "true",
  BOT_FALLBACK_DELAY_MS: (() => {
    const parsed = Number(process.env.BOT_FALLBACK_DELAY_MS);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 10_000;
  })(),

  // Maia-3 human-like engine (optional — MAIA_ENABLED=false leaves the route returning 503).
  // Unlike Stockfish, which runs in the browser, Maia is a PyTorch model and must
  // run here as a Python child process. The host needs Python with the `maia3`
  // package installed and `maia3-uci` on PATH.
  MAIA_ENABLED: process.env.MAIA_ENABLED === "true",
  MAIA_UCI_COMMAND: process.env.MAIA_UCI_COMMAND ?? "maia3-uci",
  // 79M is the default because it keeps the Elo bands distinct — 5M collapses
  // 1600/2000/2600 onto the same move, which defeats the point of the strength
  // selector. Costs 302MB on disk and ~236ms per move versus 21MB and ~40ms;
  // both are hidden behind the UI's human-like reply delay. Must match the model
  // baked in by nixpacks.toml, or the first request downloads it at runtime.
  MAIA_MODEL: process.env.MAIA_MODEL ?? "maia3-79m",

  // Rollbar error monitoring
  ROLLBAR_ACCESS_TOKEN: process.env.ROLLBAR_ACCESS_TOKEN!,
};
