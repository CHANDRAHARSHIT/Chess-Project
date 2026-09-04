import { useEffect, useState } from "react";
import { adminApi } from "./adminApi";

export type AdminSession = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: string;
};

export type AdminSessionStatus = "loading" | "authenticated" | "unauthenticated";

export function useAdminSession() {
  const [admin, setAdmin] = useState<AdminSession | null>(null);
  const [status, setStatus] = useState<AdminSessionStatus>("loading");

  useEffect(() => {
    let cancelled = false;

    adminApi<{ admin: AdminSession }>("/session")
      .then((data) => {
        if (cancelled) return;
        setAdmin(data.admin);
        setStatus("authenticated");
      })
      .catch(() => {
        if (cancelled) return;
        setAdmin(null);
        setStatus("unauthenticated");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { admin, status };
}
