// POST /api/checkout
// Creates a Stripe Checkout Session in embedded mode for a Next Wave invoice payment and
// returns its client_secret, so nextwave.nz/pay can render the card form on the page.
//
// Body (JSON): { amount: number, currency: "nzd" | "cad", reference?: string }
//   amount is the invoice total in major units (e.g. 500 for NZ$500.00).
// Response: { clientSecret: string } or { error: string }
//
// Env vars (Vercel > Settings > Environment Variables):
//   STRIPE_SECRET_KEY  your live secret key, sk_live_...  (never put this anywhere else)
//
// No npm dependency: this calls Stripe's REST API directly with fetch.

import type { NextApiRequest, NextApiResponse } from 'next';

const ALLOWED_ORIGINS = [
  'https://www.nextwave.nz',
  'https://nextwave.nz',
  'https://next-wave-nz.webflow.io',
];
const ALLOWED_CURRENCIES = ['nzd', 'cad'] as const;
const MIN_AMOUNT = 1;
const MAX_AMOUNT = 100000;
const RETURN_URL = 'https://www.nextwave.nz/pay-thanks?session_id={CHECKOUT_SESSION_ID}';

function setCors(req: NextApiRequest, res: NextApiResponse) {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error('[checkout] STRIPE_SECRET_KEY is not set');
    return res.status(500).json({ error: 'Card payments are not configured' });
  }

  const body = typeof req.body === 'string' ? safeJson(req.body) : req.body || {};
  const amount = Number(body.amount);
  const currency = String(body.currency || '').toLowerCase();
  const reference = String(body.reference || '').replace(/[^\w\s\-#./]/g, '').slice(0, 60).trim();

  if (!Number.isFinite(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
    return res.status(400).json({ error: `Amount must be between ${MIN_AMOUNT} and ${MAX_AMOUNT}` });
  }
  if (!(ALLOWED_CURRENCIES as readonly string[]).includes(currency)) {
    return res.status(400).json({ error: 'Currency must be NZD or CAD' });
  }

  const unitAmount = Math.round(amount * 100);
  const productName = reference ? `Next Wave invoice ${reference}` : 'Next Wave invoice';

  const params = new URLSearchParams();
  params.set('mode', 'payment');
  params.set('ui_mode', 'embedded');
  params.set('return_url', RETURN_URL);
  params.set('line_items[0][quantity]', '1');
  params.set('line_items[0][price_data][currency]', currency);
  params.set('line_items[0][price_data][unit_amount]', String(unitAmount));
  params.set('line_items[0][price_data][product_data][name]', productName);
  params.set('payment_intent_data[description]', productName);
  params.set('metadata[reference]', reference);
  params.set('metadata[source]', 'nextwave.nz/pay');
  // Ask for the invoice number on the Stripe form as well, so it is on the receipt even if the
  // payer skipped the field on our page.
  params.set('custom_fields[0][key]', 'invoice_number');
  params.set('custom_fields[0][label][type]', 'custom');
  params.set('custom_fields[0][label][custom]', 'Invoice number');
  params.set('custom_fields[0][type]', 'text');
  params.set('custom_fields[0][optional]', 'true');

  try {
    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    const data = await r.json();
    if (!r.ok) {
      console.error('[checkout] Stripe error', data?.error?.message);
      return res.status(502).json({ error: 'Stripe could not start the payment' });
    }
    return res.status(200).json({ clientSecret: data.client_secret });
  } catch (e) {
    console.error('[checkout] request failed', e);
    return res.status(502).json({ error: 'Stripe could not be reached' });
  }
}

function safeJson(s: string) {
  try { return JSON.parse(s); } catch { return {}; }
}
