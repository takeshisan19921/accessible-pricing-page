import { billingNote, formatPrice, parseCycle, plans, quote, type BillingCycle } from './pricing';

const announcements: Record<BillingCycle, string> = {
  monthly: 'Showing monthly prices.',
  yearly: 'Showing yearly prices. Two months free.',
};

/**
 * Wires the billing radios to the plan cards. The page is fully readable
 * without JavaScript apart from the prices themselves; this fills them in and
 * keeps them in sync with the toggle and the ?billing= query parameter, so a
 * shared link opens on the same cycle.
 */
export function initBillingToggle(root: Document = document): () => void {
  const radios = [...root.querySelectorAll<HTMLInputElement>('input[name="billing"]')];
  const status = root.getElementById('billing-status');
  const view = root.defaultView;

  const render = (cycle: BillingCycle, announce: boolean) => {
    for (const card of root.querySelectorAll<HTMLElement>('[data-plan]')) {
      const plan = plans.find((p) => p.id === card.dataset.plan);
      if (!plan) continue;
      const amount = card.querySelector('[data-price]');
      const note = card.querySelector('[data-billing-note]');
      if (amount) amount.textContent = formatPrice(quote(plan, cycle).perMonthCents);
      if (note) note.textContent = billingNote(plan, cycle);
    }
    root.documentElement.dataset.billing = cycle;
    // Only announce changes the visitor made, not the initial render.
    if (status && announce) status.textContent = announcements[cycle];
  };

  const onChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (!input.checked) return;
    const cycle = parseCycle(input.value);
    render(cycle, true);
    if (view) {
      const url = new URL(view.location.href);
      url.searchParams.set('billing', cycle);
      view.history.replaceState(null, '', url);
    }
  };

  const initial = parseCycle(view ? new URL(view.location.href).searchParams.get('billing') : null);
  for (const radio of radios) {
    radio.checked = radio.value === initial;
    radio.addEventListener('change', onChange);
  }
  render(initial, false);

  return () => radios.forEach((radio) => radio.removeEventListener('change', onChange));
}
