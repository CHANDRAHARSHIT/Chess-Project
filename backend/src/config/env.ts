import dotenv from "dotenv";

// Load environment variables from the server-side environment definition (.env)
dotenv.config();

const requiredEnvs = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "AUTH_URL",
  "AUTH_GOOGLE_ID",
  "AUTH_GOOGLE_SECRET",
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
};
