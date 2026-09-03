/**
 * routes.config.ts
 * Centralized Route Constants for XLChess.
 * 
 * Rules:
 * - Short, descriptive, lowercase, single word wherever reasonably possible.
 * - Hierarchically nested paths for genuine sub-pages (/settings/profile, /lessons/builder).
 * - Query parameters for filters/sorting/views (?tab=online, ?role=engineering).
 */

export const ROUTES = {
  // Main Public / App Routes
  HOME: "/",
  NEWS: "/news",
  CONTACT: "/contact",
  PUZZLES: "/puzzles",
  ODYSSEY: "/odyssey",
  OPENINGS: "/openings",
  DATABASE: "/database",
  DATABASE_PLAYER: (id: string) => `/database/${id}`,
  DATABASE_GAME: (id: string) => `/database/game/${id}`,
  SUBSCRIPTIONS: "/subscriptions",
  PRICING: "/pricing",
  PREMIUM: "/premium",
  STATS: "/stats",
  SAVED: "/saved",
  CONTENT: "/content",
  CHANNEL: "/channel",
  REPORT: "/report",

  // Play Hub & Modes
  PLAY: "/play",
  PLAY_TAB: (tab: "online" | "bots" | "variants" | "maia" | "quick", hash?: string) =>
    hash ? `/play?tab=${tab}#${hash}` : `/play?tab=${tab}`,
  PLAY_ONLINE: "/play?tab=online",
  PLAY_BOTS: "/play?tab=bots",
  PLAY_VARIANTS: "/play?tab=variants",
  PLAY_MAIA: "/play?tab=maia",
  PLAY_CHESS960: "/play/chess960",
  MAIA: "/maia",

  // Lessons & Lesson Builder
  LESSONS: "/lessons",
  LESSON: (id: string | number) => `/lessons/${id}`,
  LESSON_BUILDER: "/lessons/builder",
  LESSON_BUILDER_EDIT: (id: string | number) => `/lessons/builder/${id}`,

  // Settings & Profile
  SETTINGS: "/settings",
  SETTINGS_BOARD: "/settings/board-and-pieces",
  SETTINGS_PROFILE: "/settings/profile",
  SETTINGS_MEMBERSHIP: "/settings/membership",
  SETTINGS_CATEGORY: (category: string) => `/settings/${category}`,
  PROFILE: "/profile",

  // Join Us & Careers
  JOIN: "/join",
  JOIN_ROLE: (role: string) => `/join?role=${role}`,
  JOIN_ASSESSMENT: "/join/assessment",
  JOIN_ASSESSMENT_ROLE: (role: string) => `/join/assessment?role=${role}`,

  // Checkout & Payment Flow
  PAYMENT: "/payment",
  PAYMENT_SUCCESS: "/payment/success",
  PAYMENT_FAILED: "/payment/failed",

  // Footer / Informational Pages
  ABOUT: "/about",
  COPYRIGHT: "/copyright",
  CREATOR: "/creator",
  ADVERTISE: "/advertise",
  DEVELOPERS: "/developers",
  TERMS: "/terms",
  PRIVACY: "/privacy",
  HOW_IT_WORKS: "/how-it-works",
} as const;
