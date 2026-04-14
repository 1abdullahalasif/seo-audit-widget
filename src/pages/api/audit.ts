import type { NextApiRequest, NextApiResponse } from 'next';
import * as cheerio from 'cheerio';

type CheckStatus = 'good' | 'warning' | 'error';

interface AuditResult {
  url: string;
  name: string;
  email: string;
  score: number;
  checks: {
    title: { value: string | null; status: CheckStatus; recommendation: string };
    metaDescription: { value: string | null; status: CheckStatus; recommendation: string };
    h1: { count: number; values: string[]; status: CheckStatus; recommendation: string };
    h2: { count: number; status: CheckStatus; recommendation: string };
    images: { total: number; missingAlt: number; status: CheckStatus; recommendation: string };
    canonical: { value: string | null; status: CheckStatus; recommendation: string };
    robots: { value: string | null; status: CheckStatus; recommendation: string };
    wordCount: { count: number; status: CheckStatus; recommendation: string };
    httpsUsed: { value: boolean; status: CheckStatus; recommendation: string };
    viewport: { value: string | null; status: CheckStatus; recommendation: string };
    ogTags: { title: string | null; description: string | null; image: string | null; status: CheckStatus; recommendation: string };
    schemaMarkup: { found: boolean; status: CheckStatus; recommendation: string };
  };
  generatedAt: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, name, email } = req.body;

  if (!url || !name || !email) {
    return res.status(400).json({ error: 'URL, name, and email are required' });
  }

  let targetUrl = url.trim();
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl;
  }

  try {
    new URL(targetUrl);
  } catch {
    return res.status(400).json({ error: 'Invalid URL provided' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NextWaveSEOBot/1.0; +https://www.nextwave.nz)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(400).json({ error: `Could not fetch the website (HTTP ${response.status}). Make sure the URL is correct and publicly accessible.` });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const titleTag = $('title').first().text().trim() || null;
    const titleLen = titleTag?.length ?? 0;

    const metaDesc = $('meta[name="description"]').attr('content')?.trim() || null;
    const metaDescLen = metaDesc?.length ?? 0;

    const h1Tags = $('h1').map((_, el) => $(el).text().trim()).get();
    const h2Count = $('h2').length;

    const allImages = $('img');
    const missingAlt = allImages.filter((_, el) => !$(el).attr('alt')).length;

    const canonical = $('link[rel="canonical"]').attr('href') || null;
    const robotsMeta = $('meta[name="robots"]').attr('content') || null;
    const viewportMeta = $('meta[name="viewport"]').attr('content') || null;

    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    const wordCount = bodyText.split(' ').filter((w: string) => w.length > 0).length;

    const isHttps = targetUrl.startsWith('https://');

    const ogTitle = $('meta[property="og:title"]').attr('content') || null;
    const ogDesc = $('meta[property="og:description"]').attr('content') || null;
    const ogImage = $('meta[property="og:image"]').attr('content') || null;

    const hasSchema = $('script[type="application/ld+json"]').length > 0;

    let score = 0;

    const checks: AuditResult['checks'] = {
      title: (() => {
        if (!titleTag) return { value: null, status: 'error', recommendation: "Add a title tag. It's one of the most important on-page SEO elements." };
        if (titleLen < 30) return { value: titleTag, status: 'warning', recommendation: `Your title is too short (${titleLen} chars). Aim for 50–60 characters.` };
        if (titleLen > 60) return { value: titleTag, status: 'warning', recommendation: `Your title is too long (${titleLen} chars). Keep it under 60 characters to avoid truncation in search results.` };
        score += 15;
        return { value: titleTag, status: 'good', recommendation: 'Great! Your title tag is well-optimised.' };
      })(),

      metaDescription: (() => {
        if (!metaDesc) return { value: null, status: 'error', recommendation: 'Add a meta description. It dramatically improves click-through rates from search results.' };
        if (metaDescLen < 100) return { value: metaDesc, status: 'warning', recommendation: `Your meta description is too short (${metaDescLen} chars). Aim for 140–160 characters.` };
        if (metaDescLen > 160) return { value: metaDesc, status: 'warning', recommendation: `Your meta description is too long (${metaDescLen} chars). Keep it under 160 characters.` };
        score += 10;
        return { value: metaDesc, status: 'good', recommendation: 'Great! Your meta description is well-optimised.' };
      })(),

      h1: (() => {
        if (h1Tags.length === 0) return { count: 0, values: [], status: 'error', recommendation: 'Add an H1 tag. Every page should have exactly one H1 heading.' };
        if (h1Tags.length > 1) return { count: h1Tags.length, values: h1Tags, status: 'warning', recommendation: `You have ${h1Tags.length} H1 tags. Best practice is to have exactly one H1 per page.` };
        score += 10;
        return { count: 1, values: h1Tags, status: 'good', recommendation: 'You have exactly one H1 tag. Well done!' };
      })(),

      h2: (() => {
        if (h2Count === 0) return { count: 0, status: 'warning', recommendation: 'Add H2 subheadings to structure your content. This improves readability and SEO.' };
        score += 5;
        return { count: h2Count, status: 'good', recommendation: `You have ${h2Count} H2 subheadings. Good content structure!` };
      })(),

      images: (() => {
        if (missingAlt > 0) return { total: allImages.length, missingAlt, status: missingAlt > 5 ? 'error' : 'warning', recommendation: `${missingAlt} of your ${allImages.length} images are missing alt text. Add descriptive alt text for accessibility and image SEO.` };
        score += 10;
        return { total: allImages.length, missingAlt: 0, status: 'good', recommendation: `All ${allImages.length} images have alt text. Excellent!` };
      })(),

      canonical: (() => {
        if (!canonical) return { value: null, status: 'warning', recommendation: 'Add a canonical tag to prevent duplicate content issues.' };
        score += 5;
        return { value: canonical, status: 'good', recommendation: 'Canonical tag found. Good for preventing duplicate content.' };
      })(),

      robots: (() => {
        if (!robotsMeta) return { value: null, status: 'warning', recommendation: 'Consider adding a robots meta tag to control how search engines crawl your page.' };
        if (robotsMeta.includes('noindex')) return { value: robotsMeta, status: 'error', recommendation: 'Warning: Your page has "noindex" set — Google will NOT index this page!' };
        score += 5;
        return { value: robotsMeta, status: 'good', recommendation: 'Robots meta tag is configured correctly.' };
      })(),

      wordCount: (() => {
        if (wordCount < 300) return { count: wordCount, status: 'warning', recommendation: `Your page has only ${wordCount} words. Aim for at least 300+ words for better SEO.` };
        score += 10;
        return { count: wordCount, status: 'good', recommendation: `Good content length with ${wordCount} words.` };
      })(),

      httpsUsed: (() => {
        if (!isHttps) return { value: false, status: 'error', recommendation: 'Your site is not using HTTPS. This is a Google ranking factor and essential for security.' };
        score += 10;
        return { value: true, status: 'good', recommendation: 'Your site uses HTTPS. Great for security and SEO!' };
      })(),

      viewport: (() => {
        if (!viewportMeta) return { value: null, status: 'error', recommendation: 'Add a viewport meta tag for mobile responsiveness. Google uses mobile-first indexing.' };
        score += 10;
        return { value: viewportMeta, status: 'good', recommendation: 'Viewport meta tag found. Your site is mobile-friendly.' };
      })(),

      ogTags: (() => {
        const hasAll = ogTitle && ogDesc && ogImage;
        if (!hasAll) return { title: ogTitle, description: ogDesc, image: ogImage, status: 'warning', recommendation: 'Add Open Graph tags (og:title, og:description, og:image) to control how your page looks when shared on social media.' };
        score += 5;
        return { title: ogTitle, description: ogDesc, image: ogImage, status: 'good', recommendation: 'Open Graph tags are set. Your page will look great on social media!' };
      })(),

      schemaMarkup: (() => {
        if (!hasSchema) return { found: false, status: 'warning', recommendation: 'Add Schema.org structured data to help Google understand your content and earn rich snippets.' };
        score += 5;
        return { found: true, status: 'good', recommendation: 'Schema markup found. This can help you earn rich snippets in search results.' };
      })(),
    };

    const result: AuditResult = {
      url: targetUrl,
      name,
      email,
      score: Math.round((score / 100) * 100),
      checks,
      generatedAt: new Date().toISOString(),
    };

    return res.status(200).json(result);

  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      return res.status(408).json({ error: 'The website took too long to respond. Please try again.' });
    }
    console.error('Audit error:', error);
    return res.status(500).json({ error: 'Failed to analyse the website. It may be blocking automated requests.' });
  }
}
