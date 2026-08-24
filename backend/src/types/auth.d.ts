import "@auth/core";
import "@auth/core/jwt";
import type { Session } from "@auth/core";

declare module "@auth/core" {
  interface Session {
    user?: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    provider?: string;
  }
}

// Extend Express Request interface to include session data
declare global {
  namespace Express {
    interface Request {
      user?: Session["user"];
      session?: Session;
    }
  }
}
