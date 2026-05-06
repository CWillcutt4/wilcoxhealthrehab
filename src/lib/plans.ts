// Wilcox Health and Rehab Center plan catalog.
// Prices are stored as cents to avoid floating-point issues.

export type PlanCode =
  | "weekly"
  | "monthly_individual"
  | "monthly_couple"
  | "yearly_contract_individual"
  | "yearly_contract_couple"
  | "yearly_paid_individual"
  | "yearly_paid_couple";

export type BillingCycle = "weekly" | "monthly" | "yearly";
export type MembershipType = "individual" | "couple";

export interface Plan {
  code: PlanCode;
  label: string;
  description: string;
  billingCycle: BillingCycle;
  membershipType: MembershipType;
  basePriceCents: number;
  kidAddOnCents: number; // per-kid per billing period
  recurringByDefault: boolean;
  /** Length of one billing period in days — used for endDate / grace logic. */
  periodDays: number;
  /** Fixed commitment length in days (0 = none). 1-year contracts require 365. */
  commitmentDays: number;
}

export const PLANS: Record<PlanCode, Plan> = {
  weekly: {
    code: "weekly",
    label: "Weekly",
    description: "$15.00 per week. Pay-as-you-go, no commitment.",
    billingCycle: "weekly",
    membershipType: "individual",
    basePriceCents: 1500,
    kidAddOnCents: 0,
    recurringByDefault: false,
    periodDays: 7,
    commitmentDays: 0,
  },
  monthly_individual: {
    code: "monthly_individual",
    label: "Monthly — Individual",
    description: "$45.00 per month. Add kids for $15.00 each.",
    billingCycle: "monthly",
    membershipType: "individual",
    basePriceCents: 4500,
    kidAddOnCents: 1500,
    recurringByDefault: true,
    periodDays: 30,
    commitmentDays: 0,
  },
  monthly_couple: {
    code: "monthly_couple",
    label: "Monthly — Husband & Wife",
    description: "$60.00 per month. Add kids for $15.00 each.",
    billingCycle: "monthly",
    membershipType: "couple",
    basePriceCents: 6000,
    kidAddOnCents: 1500,
    recurringByDefault: true,
    periodDays: 30,
    commitmentDays: 0,
  },
  yearly_contract_individual: {
    code: "yearly_contract_individual",
    label: "1-Year Contract — Individual",
    description: "$35.00 per month, billed monthly. 1-year commitment. Add kids for $12.00 each.",
    billingCycle: "monthly",
    membershipType: "individual",
    basePriceCents: 3500,
    kidAddOnCents: 1200,
    recurringByDefault: true,
    periodDays: 30,
    commitmentDays: 365,
  },
  yearly_contract_couple: {
    code: "yearly_contract_couple",
    label: "1-Year Contract — Husband & Wife",
    description: "$50.00 per month, billed monthly. 1-year commitment. Add kids for $12.00 each.",
    billingCycle: "monthly",
    membershipType: "couple",
    basePriceCents: 5000,
    kidAddOnCents: 1200,
    recurringByDefault: true,
    periodDays: 30,
    commitmentDays: 365,
  },
  yearly_paid_individual: {
    code: "yearly_paid_individual",
    label: "Yearly — Individual (paid upfront)",
    description: "$450.00 for one full year. No recurring charges.",
    billingCycle: "yearly",
    membershipType: "individual",
    basePriceCents: 45000,
    kidAddOnCents: 0,
    recurringByDefault: false,
    periodDays: 365,
    commitmentDays: 365,
  },
  yearly_paid_couple: {
    code: "yearly_paid_couple",
    label: "Yearly — Husband & Wife (paid upfront)",
    description: "$600.00 for one full year. No recurring charges.",
    billingCycle: "yearly",
    membershipType: "couple",
    basePriceCents: 60000,
    kidAddOnCents: 0,
    recurringByDefault: false,
    periodDays: 365,
    commitmentDays: 365,
  },
};

export function totalPriceCents(plan: Plan, numKids: number): number {
  return plan.basePriceCents + plan.kidAddOnCents * Math.max(0, numKids);
}

export function formatDollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function getPlan(code: string): Plan | null {
  return (PLANS as Record<string, Plan>)[code] ?? null;
}

export function listPlans(): Plan[] {
  return Object.values(PLANS);
}
