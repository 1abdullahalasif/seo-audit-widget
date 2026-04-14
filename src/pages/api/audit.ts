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
  h2Count: number;
  imagesTotal: number;
  imagesMissingAlt: { src: string; context: string }[];
  canonical: string | null;
  robots: string | null;
  robotsStatus: CheckStatus;
  viewport: string | null;
  wordCount: number;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  schemaTypes: string[];
  schemaRaw: string[];
  isHttps: boolean;
  fetchError: string | null;
}

interface SiteAudit {
  siteUrl: string;
  name: string;
  email: string;
  score: number;
  pagesAudited: number;
  pages: PageData[];
  summary: {
    titleIssues: { url: string; title: string | null; issue: string; length: number }[];
    metaDescIssues: { url: string; desc: string | null; issue: string; length: number }[];
    h1Issues: { url: string; h1s: string[]; issue: string }[];
    missingAltImages: { pageUrl: string; imgSrc: string; context: string }[];
    schemaFound: { url: string; types: string[] }[];
    httpsIssues: string[];
    canonicalIssues: string[];
  };
  generatedAt: string;
}

async function fetchPage(url: string): Promise<{ html: string; finalUrl: string } | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NextWaveSEOBot/1.0; +https://www.nextwave.nz)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-NZ,en;q=0.9',
      },
    });
    clearTimeout(timeout);
    if (!response.ok) return null;
    const html = await response.text();
    return { html, finalUrl: response.url || url };
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

function analysePage(url: string, html: string): PageData {
  const $ = cheerio.load(html);

  const title = $('title').first().text().trim() || null;
  const titleLength = title?.length ?? 0;
  const titleStatus: CheckStatus = !title ? 'error' : titleLength < 30 || titleLength > 60 ? 'warning' : 'good';

  const metaDescription = $('meta[name="description"]').attr('content')?.trim() || null;
  const metaDescLength = metaDescription?.length ?? 0;
  const metaDescStatus: CheckStatus = !metaDescription ? 'error' : metaDescLength < 100 || metaDescLength > 160 ? 'warning' : 'good';

  const h1Tags = $('h1').map((_, el) => $(el).text().trim()).get().filter((t: string) => t.length > 0);
  const h1Status: CheckStatus = h1Tags.length === 0 ? 'error' : h1Tags.length > 1 ? 'warning' : 'good';

  const h2Count = $('h2').length;

  const imagesMissingAlt: { src: string; context: string }[] = [];
  let imagesTotal = 0;
  $('img').each((_, el) => {
    imagesTotal++;
    const alt = $(el).attr('alt');
    if (!alt || alt.trim() === '') {
      const src = $(el).attr('src') || $(el).attr('data-src') || '(no src)';
      const nearbyText = $(el).closest('a, figure, div').first().text().trim().slice(0, 60);
      imagesMissingAlt.push({ src: src.slice(0, 120), context: nearbyText || 'no context' });
    }
  });

  const canonical = $('link[rel="canonical"]').attr('href') || null;
  const robots = $('meta[name="robots"]').attr('content') || null;
  const robotsStatus: CheckStatus = robots?.includes('noindex') ? 'error' : !robots ? 'warning' : 'good';
  const viewport = $('meta[name="viewport"]').attr('content') || null;
  const isHttps = url.startsWith('https://');

  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  const wordCount = bodyText.split(' ').filter((w: string) => w.length > 0).length;

  const ogTitle = $('meta[property="og:title"]').attr('content') || null;
  const ogDescription = $('meta[property="og:description"]').attr('content') || null;
  const ogImage = $('meta[property="og:image"]').attr('content') || null;

  const schemaTypes: string[] = [];
  const schemaRaw: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raw = $(el).html() || '';
      schemaRaw.push(raw.slice(0, 300));
      const parsed = JSON.parse(raw);
      const graphs = parsed['@graph'] ? parsed['@graph'] : [parsed];
      graphs.forEach((item: Record<string, unknown>) => {
        if (item['@type']) {
          const t = Array.isArray(item['@type']) ? item['@type'].join(', ') : String(item['@type']);
          if (!schemaTypes.includes(t)) schemaTypes.push(t);
        }
      });
    } catch { /* ignore parse errors */ }
  });

  return {
    url, title, titleLength, titleStatus,
    metaDescription, metaDescLength, metaDescStatus,
    h1Tags, h1Status, h2Count,
    imagesTotal, imagesMissingAlt,
    canonical, robots, robotsStatus, viewport,
    wordCount, ogTitle, ogDescription, ogImage,
    schemaTypes, schemaRaw, isHttps,
    fetchError: null,
  };
}

function extractInternalLinks(baseUrl: string, html: string, limit = 4): string[] {
  const $ = cheerio.load(html);
  const base = new URL(baseUrl);
  const found = new Set<string>();

  $('a[href]').each((_, el) => {
    if (found.size >= limit) return;
    try {
      const href = $(el).attr('href') || '';
      const resolved = new URL(href, baseUrl);
      if (
        resolved.hostname === base.hostname &&
        resolved.pathname !== '/' &&
        resolved.pathname !== base.pathname &&
        !resolved.pathname.match(/\.(jpg|jpeg|png|gif|svg|pdf|zip|css|js)$/i) &&
        !resolved.pathname.includes('#') &&
        !found.has(resolved.href)
      ) {
        found.add(resolved.origin + resolved.pathname);
      }
    } catch { /* ignore invalid URLs */ }
  });

  return Array.from(found);
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

  try { new URL(targetUrl); } catch {
    return res.status(400).json({ error: 'Invalid URL provided' });
  }

  // Fetch homepage
  const homeResult = await fetchPage(targetUrl);
  if (!homeResult) {
    return res.status(400).json({ error: 'Could not fetch the website. Make sure the URL is correct and publicly accessible.' });
  }

  const { html: homeHtml, finalUrl } = homeResult;
  const homeData = analysePage(finalUrl, homeHtml);

  // Crawl up to 4 additional internal pages
  const internalLinks = extractInternalLinks(finalUrl, homeHtml, 4);
  const additionalPages: PageData[] = [];

  for (const link of internalLinks) {
    const pageResult = await fetchPage(link);
    if (pageResult) {
      additionalPages.push(analysePage(link, pageResult.html));
    }
  }

  const allPages = [homeData, ...additionalPages];

  // Build summaries
  const titleIssues = allPages
    .filter(p => p.titleStatus !== 'good')
    .map(p => ({
      url: p.url,
      title: p.title,
      length: p.titleLength,
      issue: !p.title ? 'Missing title tag' : p.titleLength < 30 ? 'Too short (' + p.titleLength + ' chars, aim for 50-60)' : 'Too long (' + p.titleLength + ' chars, keep under 60)',
    }));

  const metaDescIssues = allPages
    .filter(p => p.metaDescStatus !== 'good')
    .map(p => ({
      url: p.url,
      desc: p.metaDescription,
      length: p.metaDescLength,
      issue: !p.metaDescription ? 'Missing meta description' : p.metaDescLength < 100 ? 'Too short (' + p.metaDescLength + ' chars, aim for 140-160)' : 'Too long (' + p.metaDescLength + ' chars, keep under 160)',
    }));

  const h1Issues = allPages
    .filter(p => p.h1Status !== 'good')
    .map(p => ({
      url: p.url,
      h1s: p.h1Tags,
      issue: p.h1Tags.length === 0 ? 'No H1 tag found' : 'Multiple H1 tags (' + p.h1Tags.length + ' found, should be exactly 1)',
    }));

  const missingAltImages = allPages.flatMap(p =>
    p.imagesMissingAlt.map(img => ({ pageUrl: p.url, imgSrc: img.src, context: img.context }))
  ).slice(0, 30);

  const schemaFound = allPages
    .filter(p => p.schemaTypes.length > 0)
    .map(p => ({ url: p.url, types: p.schemaTypes }));

  const httpsIssues = allPages.filter(p => !p.isHttps).map(p => p.url);
  const canonicalIssues = allPages.filter(p => !p.canonical).map(p => p.url);

  // Score
  let score = 0;
  const home = homeData;
  if (home.titleStatus === 'good') score += 15;
  else if (home.titleStatus === 'warning') score += 7;
  if (home.metaDescStatus === 'good') score += 10;
  else if (home.metaDescStatus === 'warning') score += 5;
  if (home.h1Status === 'good') score += 10;
  if (home.h2Count > 0) score += 5;
  if (home.imagesMissingAlt.length === 0) score += 10;
  if (home.isHttps) score += 10;
  if (home.viewport) score += 10;
  if (home.canonical) score += 5;
  if (home.robotsStatus === 'good') score += 5;
  if (home.wordCount >= 300) score += 10;
  if (home.ogTitle && home.ogDescription && home.ogImage) score += 5;
  if (home.schemaTypes.length > 0) score += 5;

  const audit: SiteAudit = {
    siteUrl: finalUrl,
    name, email, score,
    pagesAudited: allPages.length,
    pages: allPages,
    summary: { titleIssues, metaDescIssues, h1Issues, missingAltImages, schemaFound, httpsIssues, canonicalIssues },
    generatedAt: new Date().toISOString(),
  };

  return res.status(200).json(audit);
}
