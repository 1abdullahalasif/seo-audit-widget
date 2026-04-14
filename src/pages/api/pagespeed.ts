import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url } = req.query;
  if (!url || typeof url !== 'string') return res.status(400).json({ error: 'URL required' });

  try {
    const [mobileRes, desktopRes] = await Promise.all([
      fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=performance`),
      fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=desktop&category=performance`),
    ]);

    if (!mobileRes.ok || !desktopRes.ok) return res.status(400).json({ error: 'PageSpeed API failed' });

    const [mobile, desktop] = await Promise.all([mobileRes.json(), desktopRes.json()]);
    const mc = mobile?.lighthouseResult?.categories?.performance?.score ?? 0;
    const dc = desktop?.lighthouseResult?.categories?.performance?.score ?? 0;
    const audits = mobile?.lighthouseResult?.audits ?? {};

    return res.status(200).json({
      mobileScore: Math.round(mc * 100),
      desktopScore: Math.round(dc * 100),
      fcp: audits['first-contentful-paint']?.numericValue ?? 0,
      lcp: audits['largest-contentful-paint']?.numericValue ?? 0,
      cls: audits['cumulative-layout-shift']?.numericValue ?? 0,
      tbt: audits['total-blocking-time']?.numericValue ?? 0,
      fcpDisplay: audits['first-contentful-paint']?.displayValue ?? '',
      lcpDisplay: audits['largest-contentful-paint']?.displayValue ?? '',
      clsDisplay: audits['cumulative-layout-shift']?.displayValue ?? '',
      tbtDisplay: audits['total-blocking-time']?.displayValue ?? '',
      opportunities: Object.values(audits as Record<string, { score: number; title: string; description: string; details?: { type: string } }>)
        .filter((a) => a.score !== null && a.score < 0.9 && a.details?.type === 'opportunity')
        .slice(0, 5)
        .map((a) => ({ title: a.title, description: a.description })),
    });
  } catch (e) {
    console.error('PageSpeed error:', e);
    return res.status(500).json({ error: 'PageSpeed fetch failed' });
  }
}
