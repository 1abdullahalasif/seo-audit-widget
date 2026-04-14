import type { NextApiRequest, NextApiResponse } from 'next';
import * as cheerio from 'cheerio';

type CheckStatus = 'good' | 'warning' | 'error';

interface PageData {
  url: string;
  title: string | null;
  titleLength: number;
  titleStatus: CheckStatus;
  metaDescription: string | null;
  metaDescLength: number;
  metaDescStatus: CheckStatus;
  h1Tags: string[];
  h1Status: CheckStatus;
  h2Tags: string[];
  h3Count: number;
  imagesTotal: number;
  imagesMissingAlt: { src: string; context: string }[];
  internalLinks: number;
  brokenLinks: { url: string; status: number }[];
  canonical: string | null;
  robots: string | null;
  robotsStatus: CheckStatus;
  viewport: string | null;
  wordCount: number;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  twitterCard: string | null;
  schemaTypes: string[];
  isHttps: boolean;
  hasHreflang: boolean;
  isThin: boolean;
  hasDuplicateTitle?: boolean;
  hasDuplicateMeta?: boolean;
}

interface PageSpeedData {
  performanceScore: number;
  fcp: number;
  lcp: number;
  cls: number;
  tbt: number;
  mobileScore: number;
  desktopScore: number;
}

interface SiteAudit {
  siteUrl: string;
  name: string;
  email: string;
  score: number;
  pagesAudited: number;
  hasSitemap: boolean;
  sitemapUrl: string | null;
  hasRobotsTxt: boolean;
  robotsTxtContent: string | null;
  pageSpeed: PageSpeedData | null;
  pages: PageData[];
  summary: {
    titleIssues: { url: string; title: string | null; issue: string; length: number }[];
    duplicateTitles: { title: string; urls: string[] }[];
    metaDescIssues: { url: string; desc: string | null; issue: string; length: number }[];
    duplicateMetas: { desc: string; urls: string[] }[];
    h1Issues: { url: string; h1s: string[]; issue: string }[];
    missingAltImages: { pageUrl: string; imgSrc: string; context: string }[];
    brokenLinks: { pageUrl: string; linkUrl: string; status: number }[];
    thinPages: { url: string; wordCount: number }[];
    schemaFound: { url: string; types: string[] }[];
    httpsIssues: string[];
    canonicalIssues: string[];
    noindex: string[];
  };
  generatedAt: string;
}

async function fetchWithTimeout(url: string, timeout = 10000): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NextWaveSEOBot/1.0; +https://www.nextwave.nz)',
        'Accept': 'text/html,application/xhtml+xml,*/*',
        'Accept-Language': 'en-NZ,en;q=0.9',
      },
    });
    clearTimeout(timer);
    return res;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

async function getPageSpeed(url: string): Promise<PageSpeedData | null> {
  try {
    const psController = new AbortController();
    const psTimeout = setTimeout(() => psController.abort(), 8000);
    const [mobileRes, desktopRes] = await Promise.all([
      fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=performance`, { signal: psController.signal }),
      fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=desktop&category=performance`, { signal: psController.signal }),
    ]);
    clearTimeout(psTimeout);
    if (!mobileRes.ok || !desktopRes.ok) return null;
    const [mobile, desktop] = await Promise.all([mobileRes.json(), desktopRes.json()]);
    const mc = mobile?.lighthouseResult?.categories?.performance?.score ?? 0;
    const dc = desktop?.lighthouseResult?.categories?.performance?.score ?? 0;
    const audits = mobile?.lighthouseResult?.audits ?? {};
    return {
      performanceScore: Math.round(mc * 100),
      mobileScore: Math.round(mc * 100),
      desktopScore: Math.round(dc * 100),
      fcp: audits['first-contentful-paint']?.numericValue ?? 0,
      lcp: audits['largest-contentful-paint']?.numericValue ?? 0,
      cls: audits['cumulative-layout-shift']?.numericValue ?? 0,
      tbt: audits['total-blocking-time']?.numericValue ?? 0,
    };
  } catch {
    return null;
  }
}

async function getSitemapUrls(baseUrl: string): Promise<{ hasSitemap: boolean; sitemapUrl: string | null; urls: string[] }> {
  const base = new URL(baseUrl);
  const candidates = [
    base.origin + '/sitemap.xml',
    base.origin + '/sitemap_index.xml',
    base.origin + '/sitemap/',
  ];

  // Check robots.txt for sitemap directive
  try {
    const robotsRes = await fetchWithTimeout(base.origin + '/robots.txt', 5000);
    if (robotsRes?.ok) {
      const txt = await robotsRes.text();
      const match = txt.match(/Sitemap:\s*(.+)/i);
      if (match) candidates.unshift(match[1].trim());
    }
  } catch { /* ignore */ }

  for (const candidate of candidates) {
    try {
      const res = await fetchWithTimeout(candidate, 6000);
      if (!res?.ok) continue;
      const xml = await res.text();
      if (!xml.includes('<url>') && !xml.includes('<sitemap>')) continue;

      const urls: string[] = [];
      const locRegex = /<loc>\s*([^<]+)\s*<\/loc>/g;
      let m: RegExpExecArray | null;
      while ((m = locRegex.exec(xml)) !== null) {
        const u = m[1].trim();
        if (u.startsWith('http') && !u.endsWith('.xml')) {
          urls.push(u);
          if (urls.length >= 15) break;
        }
      }
      return { hasSitemap: true, sitemapUrl: candidate, urls };
    } catch { /* try next */ }
  }
  return { hasSitemap: false, sitemapUrl: null, urls: [] };
}

async function getRobotsTxt(baseUrl: string): Promise<{ hasRobotsTxt: boolean; content: string | null }> {
  try {
    const base = new URL(baseUrl);
    const res = await fetchWithTimeout(base.origin + '/robots.txt', 5000);
    if (!res?.ok) return { hasRobotsTxt: false, content: null };
    const text = await res.text();
    return { hasRobotsTxt: true, content: text.slice(0, 1000) };
  } catch {
    return { hasRobotsTxt: false, content: null };
  }
}

function extractInternalLinks(baseUrl: string, html: string, limit = 12): string[] {
  const $ = cheerio.load(html);
  const base = new URL(baseUrl);
  const found = new Set<string>();
  $('a[href]').each((_, el) => {
    if (found.size >= limit) return;
    try {
      const href = $(el).attr('href') || '';
      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      const resolved = new URL(href, baseUrl);
      if (
        resolved.hostname === base.hostname &&
        resolved.pathname !== base.pathname &&
        !resolved.pathname.match(/\.(jpg|jpeg|png|gif|svg|pdf|zip|css|js|ico|woff|mp4)$/i) &&
        !found.has(resolved.origin + resolved.pathname)
      ) {
        found.add(resolved.origin + resolved.pathname);
      }
    } catch { /* ignore */ }
  });
  return Array.from(found);
}

async function checkBrokenLinks(baseUrl: string, html: string): Promise<{ url: string; status: number }[]> {
  const $ = cheerio.load(html);
  const base = new URL(baseUrl);
  const links: string[] = [];
  $('a[href]').each((_, el) => {
    if (links.length >= 10) return;
    try {
      const href = $(el).attr('href') || '';
      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      const resolved = new URL(href, baseUrl);
      if (resolved.hostname === base.hostname) links.push(resolved.href);
    } catch { /* ignore */ }
  });

  const results: { url: string; status: number }[] = [];
  await Promise.all(links.slice(0, 8).map(async (link) => {
    try {
      const res = await fetchWithTimeout(link, 5000);
      if (res && (res.status === 404 || res.status === 410 || res.status >= 500)) {
        results.push({ url: link, status: res.status });
      }
    } catch { /* ignore */ }
  }));
  return results;
}

function analysePage(url: string, html: string): PageData {
  const $ = cheerio.load(html);

  const title = $('title').first().text().trim() || null;
  const titleLength = title?.length ?? 0;
  const titleStatus: CheckStatus = !title ? 'error' : (titleLength < 30 || titleLength > 60) ? 'warning' : 'good';

  const metaDescription = $('meta[name="description"]').attr('content')?.trim() || null;
  const metaDescLength = metaDescription?.length ?? 0;
  const metaDescStatus: CheckStatus = !metaDescription ? 'error' : (metaDescLength < 100 || metaDescLength > 160) ? 'warning' : 'good';

  const h1Tags = $('h1').map((_, el) => $(el).text().trim()).get().filter((t: string) => t.length > 0);
  const h1Status: CheckStatus = h1Tags.length === 0 ? 'error' : h1Tags.length > 1 ? 'warning' : 'good';
  const h2Tags = $('h2').map((_, el) => $(el).text().trim()).get().filter((t: string) => t.length > 0);
  const h3Count = $('h3').length;

  const imagesMissingAlt: { src: string; context: string }[] = [];
  let imagesTotal = 0;
  $('img').each((_, el) => {
    imagesTotal++;
    const alt = $(el).attr('alt');
    if (alt === undefined || alt.trim() === '') {
      const src = $(el).attr('src') || $(el).attr('data-src') || '(no src)';
      const nearbyText = $(el).closest('a, figure, div').first().text().trim().slice(0, 50);
      imagesMissingAlt.push({ src: src.slice(0, 120), context: nearbyText || '' });
    }
  });

  const internalLinks = $('a[href]').filter((_, el) => {
    try { const u = new URL($(el).attr('href') || '', url); return u.hostname === new URL(url).hostname; } catch { return false; }
  }).length;

  const canonical = $('link[rel="canonical"]').attr('href') || null;
  const robots = $('meta[name="robots"]').attr('content') || null;
  const robotsStatus: CheckStatus = robots?.includes('noindex') ? 'error' : !robots ? 'warning' : 'good';
  const viewport = $('meta[name="viewport"]').attr('content') || null;
  const isHttps = url.startsWith('https://');

  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  const wordCount = bodyText.split(' ').filter((w: string) => w.length > 0).length;
  const isThin = wordCount < 300;

  const ogTitle = $('meta[property="og:title"]').attr('content') || null;
  const ogDescription = $('meta[property="og:description"]').attr('content') || null;
  const ogImage = $('meta[property="og:image"]').attr('content') || null;
  const twitterCard = $('meta[name="twitter:card"]').attr('content') || null;

  const schemaTypes: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raw = $(el).html() || '';
      const parsed = JSON.parse(raw);
      const graphs = parsed['@graph'] ? parsed['@graph'] : [parsed];
      graphs.forEach((item: Record<string, unknown>) => {
        if (item['@type']) {
          const t = Array.isArray(item['@type']) ? item['@type'].join(', ') : String(item['@type']);
          if (!schemaTypes.includes(t)) schemaTypes.push(t);
        }
      });
    } catch { /* ignore */ }
  });

  const hasHreflang = $('link[hreflang]').length > 0;

  return {
    url, title, titleLength, titleStatus,
    metaDescription, metaDescLength, metaDescStatus,
    h1Tags, h1Status, h2Tags, h3Count,
    imagesTotal, imagesMissingAlt, internalLinks,
    brokenLinks: [],
    canonical, robots, robotsStatus, viewport,
    wordCount, isThin,
    ogTitle, ogDescription, ogImage, twitterCard,
    schemaTypes, isHttps, hasHreflang,
  };
}

async function sendLeadEmail(data: {
  name: string; email: string; url: string;
  score: number; pagesAudited: number;
  issueCount: number; generatedAt: string;
  resendKey: string;
}) {
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${data.resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Next Wave SEO Audit <noreply@nextwave.nz>',
        to: ['hello@nextwave.nz'],
        subject: `New SEO Audit Lead: ${data.url}`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
            <div style="background:#e8693a;padding:16px 24px;border-radius:8px 8px 0 0">
              <h1 style="color:#fff;margin:0;font-size:20px">New SEO Audit Submission</h1>
            </div>
            <div style="background:#fff;border:1px solid #e5e0d8;border-top:none;padding:24px;border-radius:0 0 8px 8px">
              <table style="width:100%;border-collapse:collapse">
                <tr><td style="padding:8px 0;color:#888;font-size:13px;width:120px">Name</td><td style="padding:8px 0;font-weight:600;font-size:13px">${data.name}</td></tr>
                <tr><td style="padding:8px 0;color:#888;font-size:13px">Email</td><td style="padding:8px 0;font-weight:600;font-size:13px"><a href="mailto:${data.email}" style="color:#e8693a">${data.email}</a></td></tr>
                <tr><td style="padding:8px 0;color:#888;font-size:13px">Website</td><td style="padding:8px 0;font-size:13px"><a href="${data.url}" style="color:#e8693a">${data.url}</a></td></tr>
                <tr><td style="padding:8px 0;color:#888;font-size:13px">SEO Score</td><td style="padding:8px 0;font-weight:700;font-size:18px;color:${data.score >= 70 ? '#15803d' : data.score >= 40 ? '#b45309' : '#b91c1c'}">${data.score}/100</td></tr>
                <tr><td style="padding:8px 0;color:#888;font-size:13px">Pages Audited</td><td style="padding:8px 0;font-size:13px">${data.pagesAudited}</td></tr>
                <tr><td style="padding:8px 0;color:#888;font-size:13px">Issues Found</td><td style="padding:8px 0;font-size:13px;color:#b91c1c;font-weight:600">${data.issueCount}</td></tr>
                <tr><td style="padding:8px 0;color:#888;font-size:13px">Time</td><td style="padding:8px 0;font-size:13px">${new Date(data.generatedAt).toLocaleString('en-NZ')}</td></tr>
              </table>
              <div style="margin-top:20px;padding-top:20px;border-top:1px solid #f0ece5">
                <a href="mailto:${data.email}?subject=Re: Your SEO Audit for ${data.url}" style="display:inline-block;background:#e8693a;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;font-size:13px">Reply to ${data.name}</a>
              </div>
            </div>
          </div>
        `,
      }),
    });
  } catch { /* non-blocking — don't fail audit if email fails */ }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url, name, email } = req.body;
  if (!url || !name || !email) return res.status(400).json({ error: 'URL, name, and email are required' });

  let targetUrl = url.trim();
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) targetUrl = 'https://' + targetUrl;
  try { new URL(targetUrl); } catch { return res.status(400).json({ error: 'Invalid URL provided' }); }

  // Fetch homepage
  const homeRes = await fetchWithTimeout(targetUrl, 12000);
  if (!homeRes?.ok) return res.status(400).json({ error: 'Could not fetch the website. Make sure the URL is correct and publicly accessible.' });
  const homeHtml = await homeRes.text();
  const finalUrl = homeRes.url || targetUrl;
  const homeData = analysePage(finalUrl, homeHtml);

  // Run parallel initial tasks
  const [sitemapData, robotsData, pageSpeedData, brokenLinksData] = await Promise.all([
    getSitemapUrls(finalUrl),
    getRobotsTxt(finalUrl),
    getPageSpeed(finalUrl),
    checkBrokenLinks(finalUrl, homeHtml),
  ]);
  homeData.brokenLinks = brokenLinksData;

  // Collect pages to crawl — prefer sitemap URLs, fall back to extracted links
  let pagesToCrawl: string[] = sitemapData.urls.length > 0
    ? sitemapData.urls.filter(u => u !== finalUrl).slice(0, 9)
    : extractInternalLinks(finalUrl, homeHtml, 9);

  // Crawl additional pages
  const additionalPages: PageData[] = [];
  await Promise.all(pagesToCrawl.map(async (pageUrl) => {
    const res = await fetchWithTimeout(pageUrl, 8000);
    if (!res?.ok) return;
    const html = await res.text();
    const page = analysePage(pageUrl, html);
    page.brokenLinks = await checkBrokenLinks(pageUrl, html);
    additionalPages.push(page);
  }));

  const allPages = [homeData, ...additionalPages];

  // Duplicate detection
  const titleMap = new Map<string, string[]>();
  const metaMap = new Map<string, string[]>();
  allPages.forEach(p => {
    if (p.title) {
      const existing = titleMap.get(p.title) || [];
      titleMap.set(p.title, [...existing, p.url]);
    }
    if (p.metaDescription) {
      const existing = metaMap.get(p.metaDescription) || [];
      metaMap.set(p.metaDescription, [...existing, p.url]);
    }
  });
  allPages.forEach(p => {
    p.hasDuplicateTitle = p.title ? (titleMap.get(p.title) || []).length > 1 : false;
    p.hasDuplicateMeta = p.metaDescription ? (metaMap.get(p.metaDescription) || []).length > 1 : false;
  });

  // Build summaries
  const titleIssues = allPages.filter(p => p.titleStatus !== 'good').map(p => ({
    url: p.url, title: p.title, length: p.titleLength,
    issue: !p.title ? 'Missing title tag' : p.titleLength < 30 ? `Too short (${p.titleLength} chars)` : `Too long (${p.titleLength} chars)`,
  }));
  const duplicateTitles = Array.from(titleMap.entries()).filter(([, urls]) => urls.length > 1).map(([title, urls]) => ({ title, urls }));
  const metaDescIssues = allPages.filter(p => p.metaDescStatus !== 'good').map(p => ({
    url: p.url, desc: p.metaDescription, length: p.metaDescLength,
    issue: !p.metaDescription ? 'Missing meta description' : p.metaDescLength < 100 ? `Too short (${p.metaDescLength} chars)` : `Too long (${p.metaDescLength} chars)`,
  }));
  const duplicateMetas = Array.from(metaMap.entries()).filter(([, urls]) => urls.length > 1).map(([desc, urls]) => ({ desc, urls }));
  const h1Issues = allPages.filter(p => p.h1Status !== 'good').map(p => ({
    url: p.url, h1s: p.h1Tags,
    issue: p.h1Tags.length === 0 ? 'No H1 tag found' : `Multiple H1 tags (${p.h1Tags.length} found)`,
  }));
  const missingAltImages = allPages.flatMap(p => p.imagesMissingAlt.map(img => ({ pageUrl: p.url, imgSrc: img.src, context: img.context }))).slice(0, 40);
  const brokenLinksSummary = allPages.flatMap(p => p.brokenLinks.map(l => ({ pageUrl: p.url, linkUrl: l.url, status: l.status }))).slice(0, 20);
  const thinPages = allPages.filter(p => p.isThin).map(p => ({ url: p.url, wordCount: p.wordCount }));
  const schemaFound = allPages.filter(p => p.schemaTypes.length > 0).map(p => ({ url: p.url, types: p.schemaTypes }));
  const httpsIssues = allPages.filter(p => !p.isHttps).map(p => p.url);
  const canonicalIssues = allPages.filter(p => !p.canonical).map(p => p.url);
  const noindex = allPages.filter(p => p.robots?.includes('noindex')).map(p => p.url);

  // Score
  let score = 0;
  const h = homeData;
  if (h.titleStatus === 'good') score += 12; else if (h.titleStatus === 'warning') score += 6;
  if (h.metaDescStatus === 'good') score += 8; else if (h.metaDescStatus === 'warning') score += 4;
  if (h.h1Status === 'good') score += 8;
  if (h.h2Tags.length > 0) score += 4;
  if (h.imagesMissingAlt.length === 0) score += 8;
  if (h.isHttps) score += 10;
  if (h.viewport) score += 8;
  if (h.canonical) score += 4;
  if (h.robotsStatus === 'good') score += 4;
  if (!h.isThin) score += 6;
  if (h.ogTitle && h.ogImage) score += 4;
  if (h.schemaTypes.length > 0) score += 4;
  if (sitemapData.hasSitemap) score += 4;
  if (robotsData.hasRobotsTxt) score += 4;
  if (brokenLinksSummary.length === 0) score += 4;
  if (duplicateTitles.length === 0) score += 4;
  if (pageSpeedData && pageSpeedData.mobileScore >= 50) score += 4;

  const totalIssues = titleIssues.length + metaDescIssues.length + h1Issues.length + missingAltImages.length + brokenLinksSummary.length;
  const generatedAt = new Date().toISOString();

  const audit: SiteAudit = {
    siteUrl: finalUrl, name, email, score,
    pagesAudited: allPages.length,
    hasSitemap: sitemapData.hasSitemap,
    sitemapUrl: sitemapData.sitemapUrl,
    hasRobotsTxt: robotsData.hasRobotsTxt,
    robotsTxtContent: robotsData.content,
    pageSpeed: pageSpeedData,
    pages: allPages,
    summary: {
      titleIssues, duplicateTitles, metaDescIssues, duplicateMetas,
      h1Issues, missingAltImages, brokenLinks: brokenLinksSummary,
      thinPages, schemaFound, httpsIssues, canonicalIssues, noindex,
    },
    generatedAt,
  };

  // Send lead email (non-blocking)
  const resendKey = process.env.RESEND_API_KEY || '';
  if (resendKey) {
    sendLeadEmail({ name, email, url: finalUrl, score, pagesAudited: allPages.length, issueCount: totalIssues, generatedAt, resendKey });
  }

  return res.status(200).json(audit);
}
