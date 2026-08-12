import { useState, useEffect, useCallback } from "react";
import type { UserSubscriptionState, SubscriptionStatus } from "@/types/payment";
import rollbar from "@/config/rollbar";

export function useSubscription() {
  const [subscription, setSubscription] = useState<UserSubscriptionState>({
    productId: null,
    product: null,
    status: "NONE",
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    features: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/users/profile");
      if (!res.ok) {
        if (res.status === 401) {
          // Unauthenticated users are defaults
          setSubscription({
            productId: null,
            product: null,
            status: "NONE",
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
            features: {},
          });
          return;
        }
        throw new Error("Failed to load subscription details.");
      }

      const json = await res.json();
      if (json.status === "success" && json.data?.user) {
        const user = json.data.user;
        const latestSub = user.subscriptions?.[0];

        if (latestSub && latestSub.product) {
          // Build a features map key-value from the database features list
          const featuresMap: Record<string, string> = {};
          if (latestSub.product.features) {
            latestSub.product.features.forEach((feat: { featureKey: string; featureValue: string }) => {
              featuresMap[feat.featureKey] = feat.featureValue;
            });
          }

          setSubscription({
            productId: latestSub.productId,
            product: latestSub.product,
            status: latestSub.status as SubscriptionStatus,
            currentPeriodEnd: latestSub.currentPeriodEnd,
            cancelAtPeriodEnd: latestSub.cancelAtPeriodEnd,
            features: featuresMap,
          });
        } else {
          setSubscription({
            productId: null,
            product: null,
            status: "NONE",
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
            features: {},
          });
        }
      } else {
        throw new Error(json.message || "Failed to parse user profile.");
      }
    } catch (err: unknown) {
      console.error(err);
      // Caught here rather than thrown, so this never reaches the
      // ErrorBoundary — report it manually since it gates premium features.
      rollbar.error(err instanceof Error ? err : new Error(String(err)), { context: "useSubscription.fetchSubscription" });
      setError(err instanceof Error ? err.message : "Error synchronizing subscription status.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const isPro = subscription.status === "ACTIVE" || subscription.status === "TRIALING";

  /**
   * Helper utility to query specific product feature permission keys.
   */
  const hasFeature = useCallback(
    (key: string): boolean => {
      if (!isPro) return false;
      const val = subscription.features[key];
      return val === "true" || (val !== undefined && val !== "false");
    },
    [isPro, subscription.features]
  );

  return {
    subscription,
    isPro,
    hasFeature,
    loading,
    error,
    refresh: fetchSubscription,
  };
}
