export type SubscriptionStatus =
  | "ACTIVE"
  | "TRIALING"
  | "PAST_DUE"
  | "CANCELED"
  | "UNPAID"
  | "INCOMPLETE"
  | "INCOMPLETE_EXPIRED"
  | "NONE";

export interface ProductFeatureDTO {
  id: string;
  featureKey: string;
  featureValue: string;
}

export interface ProductDTO {
  id: string;
  identifier: string; // e.g. "pro_monthly"
  name: string;
  description: string | null;
  priceAmount: number; // in cents
  currency: string;
  billingInterval: string; // month, year, or one-time
  gatewayPriceId: string;
  features: ProductFeatureDTO[];
}

export interface UserSubscriptionState {
  productId: string | null;
  product: ProductDTO | null;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  features: Record<string, string>; // Maps active feature key to its value
}

export interface BillingProfileDTO {
  billingEmail: string | null;
  billingName: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  vatId?: string | null;
}

export interface CheckoutSessionResponse {
  status: "success" | "fail";
  checkoutUrl?: string;
  sessionId?: string;
  message?: string;
}

export interface BillingPortalResponse {
  status: "success" | "fail";
  portalUrl?: string;
  message?: string;
}
