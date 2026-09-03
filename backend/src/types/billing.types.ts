export type SubscriptionTier = "free" | "pro_monthly" | "pro_yearly";

export interface FeatureMap {
  unlimited_puzzles: boolean;
  advanced_analysis: boolean;
  cloud_storage: boolean;
  premium_lessons: boolean;
  exclusive_content: boolean;
  [key: string]: boolean | string | number;
}

export interface ProductDTO {
  id: string;
  identifier: string; // e.g. "pro_monthly"
  name: string;
  description: string | null;
  priceAmount: number; // in cents
  currency: string;
  billingInterval: string;
  gatewayPriceId: string;
  isActive: boolean;
  displayOrder: number;
  features: Array<{ key: string; value: string }>;
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

export interface CheckoutSessionRequest {
  planId: string; // Matches a Product identifier e.g. "pro_monthly"
}

export interface CheckoutSessionResponse {
  status: "success";
  checkoutUrl: string;
}

export interface CustomerPortalResponse {
  status: "success";
  portalUrl: string;
}

export interface WebhookEventHandledResponse {
  received: boolean;
  eventId?: string;
  type?: string;
  status?: string;
}
