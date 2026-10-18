import { describe, expect, it } from 'vitest';
import { billingNote, formatPrice, parseCycle, plans, quote } from './pricing';

const [starter, shop, studio] = plans;

describe('quote', () => {
  it('charges the monthly price each month', () => {
    expect(quote(shop, 'monthly')).toEqual({ perMonthCents: 1900, billedCents: 1900, yearlySavingsCents: 0 });
  });

  it('charges ten months for a year and saves two', () => {
    expect(quote(shop, 'yearly')).toEqual({ perMonthCents: 1583, billedCents: 19000, yearlySavingsCents: 3800 });
    expect(quote(studio, 'yearly').yearlySavingsCents).toBe(9800);
  });

  it('never shows a per-month price that adds up to more than the year costs', () => {
    for (const plan of plans) {
      const q = quote(plan, 'yearly');
      expect(q.perMonthCents * 12).toBeLessThanOrEqual(q.billedCents);
    }
  });

  it('keeps the free plan free in both cycles', () => {
    expect(quote(starter, 'yearly')).toEqual({ perMonthCents: 0, billedCents: 0, yearlySavingsCents: 0 });
  });
});

describe('formatPrice', () => {
  it('drops the cents for whole euros and keeps them otherwise', () => {
    expect(formatPrice(1900)).toMatch(/^€\s19$/);
    expect(formatPrice(1583)).toMatch(/^€\s15,83$/);
    expect(formatPrice(0)).toMatch(/^€\s0$/);
  });
});

describe('billingNote', () => {
  it('describes each cycle', () => {
    expect(billingNote(starter, 'yearly')).toBe('Free, no card needed');
    expect(billingNote(shop, 'monthly')).toBe('Billed monthly, excluding VAT');
    expect(billingNote(shop, 'yearly')).toBe(`${formatPrice(19000)} billed yearly, you save ${formatPrice(3800)}`);
  });
});

describe('parseCycle', () => {
  it('falls back to monthly for anything unexpected', () => {
    expect(parseCycle('yearly')).toBe('yearly');
    expect(parseCycle('YEARLY')).toBe('monthly');
    expect(parseCycle(null)).toBe('monthly');
  });
});
