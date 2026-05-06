// Shopify integration.
//
// For the embedded-checkout flow you'll use Shopify's Storefront API to create
// a checkout (or a cart, on newer API versions) and open it inside an iframe/modal
// with Shop Pay. Recurring billing is handled by a subscription app (Shopify
// Subscriptions, Recharge, etc.) which exposes a selling_plan_id you attach to
// the line item.
//
// Until credentials exist, createCheckout() returns a stub that simulates a
// successful payment so the full signup flow works end-to-end in dev.

import type { Plan } from "./plans";

export interface CreateCheckoutInput {
  userId: string;
  userEmail: string;
  plan: Plan;
  numKids: number;
  totalCents: number;
  recurring: boolean;
}

export interface CheckoutResult {
  /** If set, redirect the browser to this URL (Shopify-hosted page or embed). */
  checkoutUrl: string;
  /** Opaque id used to look the order up later. */
  checkoutId: string;
  /** If true, this is the local dev stub and no real charge occurred. */
  simulated: boolean;
}

export async function createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_STOREFRONT_TOKEN;

  if (!domain || !token) {
    // Dev stub — redirects to our local /onboarding/payment page which simulates checkout.
    return {
      checkoutUrl: `/onboarding/payment?sim=1&plan=${input.plan.code}&kids=${input.numKids}`,
      checkoutId: "sim_" + Math.random().toString(36).slice(2),
      simulated: true,
    };
  }

  // TODO: real Shopify Storefront API call.
  // Example shape (Storefront GraphQL — cart/checkoutCreate):
  //   mutation { cartCreate(input: { lines: [{ quantity: 1, merchandiseId: "gid://...", sellingPlanId: "..." }], buyerIdentity: { email: "..." } }) { cart { id checkoutUrl } } }
  throw new Error("Real Shopify integration not implemented yet. Set up credentials and finish this function.");
}

export function verifyShopifyWebhook(_rawBody: string, _signature: string | null): boolean {
  // TODO: verify HMAC using SHOPIFY_WEBHOOK_SECRET.
  // For now, in dev, allow everything.
  return true;
}
