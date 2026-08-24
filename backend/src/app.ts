import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { env } from "./core/config/env.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { userRouter } from "./modules/users/user.routes.js";
import { customLinksRouter } from "./modules/links/custom-links.routes.js";
import { paymentRouter } from "./modules/billing/payment.routes.js";
import { pricingRouter } from "./modules/billing/pricing.routes.js";

import { puzzleRouter } from "./modules/puzzles/puzzle.routes.js";
import { openingRouter } from "./modules/openings/opening.routes.js";
import { builderLessonRouter } from "./modules/lessons/builder-lesson.routes.js";
import { matchmakingRouter } from "./matchmaking/index.js";
import { pathwayProgressRouter } from "./modules/puzzles/pathway-progress.routes.js";
import { gamesRouter } from "./modules/gameplay/games.routes.js";
import { errorHandler } from "./core/middleware/error.middleware.js";

const app = express();

// Required when running behind proxies (Vite dev proxy, Cloudflare, Nginx, etc.)
app.set("trust proxy", true);

// Configure Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  message: {
    status: "fail",
    message: "Too many requests from this IP, please try again after 15 minutes.",
  },
});

// Security Headers (Helmet)
app.use(helmet());

// Apply global rate limiter to all API endpoints
app.use("/api", apiLimiter);

app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
  })
);

// Stripe Webhook Endpoint Raw Parser Bypass
// Webhook validation requires raw binary buffer to verify signature integrity.
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));

// Payload Size Restrictions (prevents memory-exhaustion denial of service attacks)
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Log incoming requests for debugging
// app.use((req, res, next) => {
//   console.log(`[HTTP]: ${req.method} ${req.originalUrl}`);
//   next();
// });

// Intercept GET requests for provider-specific sign-in and trailing slashes,
// redirecting them to prevent Auth.js from throwing UnsupportedAction/UnknownAction errors.
app.get("/api/auth/signin/:provider", (req, res) => {
  res.redirect("/");
});
app.get("/api/auth/signin/", (req, res) => {
  res.redirect("/");
});

// Ensure Auth.js sees the correct public hostname when behind a reverse proxy (Vercel rewrite).

app.use("/api/auth/*", (req, _res, next) => {
  try {
    const authUrl = new URL(env.AUTH_URL);
    req.headers.host = authUrl.host;
  } catch {
    // If AUTH_URL is invalid, fall through with the original host header.
  }
  next();
}, authRouter);
app.use("/api/users", userRouter);
app.use("/api/custom-links", customLinksRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/pricing", pricingRouter);

import { publicLessonRouter } from "./modules/lessons/public-lesson.routes.js";

app.use("/api/puzzles", puzzleRouter);
app.use("/api/openings", openingRouter);
app.use("/api/builder-lessons", builderLessonRouter);
app.use("/api/public-lessons", publicLessonRouter);
app.use("/api/published-lessons", publicLessonRouter);
app.use("/api/matchmaking", matchmakingRouter);
app.use("/api/pathway-progress", pathwayProgressRouter);
app.use("/api/games", gamesRouter);

// Catch-all centralized error handler
app.use(errorHandler);

export { app };
