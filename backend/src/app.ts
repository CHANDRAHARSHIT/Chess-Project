import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { env } from "./config/env.js";
import { authRouter } from "./routes/auth.route.js";
import { userRouter } from "./routes/user.route.js";
import { paymentRouter } from "./routes/payment.route.js";
import { puzzleRouter } from "./routes/puzzle.route.js";
import { openingRouter } from "./routes/opening.route.js";
import { builderLessonRouter } from "./routes/builderLesson.route.js";
import { errorHandler } from "./middleware/error.middleware.js";

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
// Vercel rewrites change the Host header to the Railway backend hostname, which causes Auth.js
// to construct OAuth callback URLs with the wrong origin (redirect_uri_mismatch).
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
app.use("/api/payments", paymentRouter);
app.use("/api/puzzles", puzzleRouter);
app.use("/api/openings", openingRouter);
app.use("/api/builder-lessons", builderLessonRouter);

// Catch-all centralized error handler
app.use(errorHandler);

export { app };
