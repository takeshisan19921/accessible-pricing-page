import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initBillingToggle } from './billingToggle';
import { formatPrice } from './pricing';
import page from '../index.html?raw';

const body = page.slice(page.indexOf('<body>') + 6, page.indexOf('</body>'));

const price = (plan: string) => document.querySelector(`[data-plan="${plan}"] [data-price]`)!.textContent;
const note = (plan: string) => document.querySelector(`[data-plan="${plan}"] [data-billing-note]`)!.textContent;
const status = () => document.getElementById('billing-status')!.textContent;
const radio = (value: string) => document.querySelector<HTMLInputElement>(`input[name="billing"][value="${value}"]`)!;

let dispose: () => void = () => {};

beforeEach(() => {
  window.history.replaceState(null, '', '/');
  document.body.innerHTML = body;
});
afterEach(() => dispose());

describe('billing toggle', () => {
  it('fills in monthly prices without announcing anything on load', () => {
    dispose = initBillingToggle();
    expect(price('shop')).toBe(formatPrice(1900));
    expect(note('starter')).toBe('Free, no card needed');
    expect(status()).toBe('');
  });

  it('switches every card to yearly, announces it and updates the URL', () => {
    dispose = initBillingToggle();
    radio('yearly').click();
    expect(price('shop')).toBe(formatPrice(1583));
    expect(price('studio')).toBe(formatPrice(4083));
    expect(note('shop')).toContain('billed yearly');
    expect(status()).toBe('Showing yearly prices. Two months free.');
    expect(window.location.search).toBe('?billing=yearly');
  });

  it('opens on the cycle from a shared link', () => {
    window.history.replaceState(null, '', '/?billing=yearly');
    dispose = initBillingToggle();
    expect(radio('yearly').checked).toBe(true);
    expect(price('shop')).toBe(formatPrice(1583));
  });
});

describe('page structure', () => {
  beforeEach(() => {
    dispose = initBillingToggle();
  });

  it('labels every radio and groups them in a fieldset with a legend', () => {
    for (const input of document.querySelectorAll<HTMLInputElement>('input[type="radio"]')) {
      expect(document.querySelector(`label[for="${input.id}"]`)).not.toBeNull();
      expect(input.closest('fieldset')?.querySelector('legend')?.textContent).toBe('Billing period');
    }
  });

  it('gives every comparison header a scope and every check mark a text alternative', () => {
    for (const th of document.querySelectorAll('table th')) expect(th.getAttribute('scope')).toMatch(/^(row|col)$/);
    for (const mark of document.querySelectorAll('td [aria-hidden="true"]')) {
      expect(mark.nextElementSibling?.textContent).toMatch(/^(Included|Not included)$/);
    }
  });

  it('uses one h1 and names each plan button after its plan', () => {
    expect(document.querySelectorAll('h1')).toHaveLength(1);
    const buttons = [...document.querySelectorAll('.plan .button')].map((b) => b.textContent);
    expect(buttons).toEqual(['Start with Starter', 'Start with Shop', 'Start with Studio']);
  });
});
