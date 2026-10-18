export type BillingCycle = 'monthly' | 'yearly';

export interface Plan {
  id: string;
  name: string;
  /** Monthly price in euro cents, excluding VAT. */
  monthlyCents: number;
}

export const plans: readonly Plan[] = [
  { id: 'starter', name: 'Starter', monthlyCents: 0 },
  { id: 'shop', name: 'Shop', monthlyCents: 1900 },
  { id: 'studio', name: 'Studio', monthlyCents: 4900 },
];

/** A yearly plan charges ten months, so two months are free. */
export const MONTHS_CHARGED_PER_YEAR = 10;

export interface Quote {
  /** What the plan works out to per month, the number shown large on the card. */
  perMonthCents: number;
  /** What the customer is actually charged each billing period. */
  billedCents: number;
  /** Saved per year compared with paying monthly. */
  yearlySavingsCents: number;
}

export function quote(plan: Plan, cycle: BillingCycle): Quote {
  if (cycle === 'monthly') {
    return { perMonthCents: plan.monthlyCents, billedCents: plan.monthlyCents, yearlySavingsCents: 0 };
  }
  const billedCents = plan.monthlyCents * MONTHS_CHARGED_PER_YEAR;
  return {
    // Round down so the card never shows a monthly price higher than what the year actually costs.
    perMonthCents: Math.floor(billedCents / 12),
    billedCents,
    yearlySavingsCents: plan.monthlyCents * 12 - billedCents,
  };
}

const whole = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const exact = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

/** Whole euros stay short (€ 19), anything with cents shows them (€ 15,83). */
export const formatPrice = (cents: number): string =>
  cents % 100 === 0 ? whole.format(cents / 100) : exact.format(cents / 100);

/** The small line under the price that says how and when the customer pays. */
export function billingNote(plan: Plan, cycle: BillingCycle): string {
  if (plan.monthlyCents === 0) return 'Free, no card needed';
  const q = quote(plan, cycle);
  if (cycle === 'monthly') return 'Billed monthly, excluding VAT';
  return `${formatPrice(q.billedCents)} billed yearly, you save ${formatPrice(q.yearlySavingsCents)}`;
}

export const parseCycle = (value: string | null): BillingCycle => (value === 'yearly' ? 'yearly' : 'monthly');
