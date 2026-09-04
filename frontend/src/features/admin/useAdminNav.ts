import { useEffect, useState } from "react";
import { adminApi } from "./adminApi";

export type AdminNavItem = {
  id: string;
  key: string;
  label: string;
  path: string | null;
  icon: string | null;
  isDisabled: boolean;
  children: AdminNavItem[];
};

// Shown when the nav API is unreachable. An outage should cost an admin their
// section links, not the whole shell.
const HOME_ONLY: AdminNavItem[] = [
  { id: "home", key: "home", label: "Home", path: "/admin/home", icon: "Home", isDisabled: false, children: [] },
];

/** `enabled` is false outside /admin — otherwise every player page would fire an admin request. */
export function useAdminNav(enabled: boolean) {
  const [items, setItems] = useState<AdminNavItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    adminApi<{ items: AdminNavItem[] }>("/nav")
      .then((data) => {
        if (!cancelled) setItems(data.items);
      })
      .catch(() => {
        if (!cancelled) setItems(HOME_ONLY);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { items, isLoading };
}
