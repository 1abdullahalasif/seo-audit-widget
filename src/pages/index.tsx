import { useState, useRef } from 'react';
import Head from 'next/head';

type CheckStatus = 'good' | 'warning' | 'error';

interface Check {
  status: CheckStatus;
  recommendation: string;
  howToFix?: string;
  [key: string]: unknown;
}

interface AuditResult {
  url: string;
  name: string;
  score: number;
  checks: {
    title: Check & { value: string | null };
    metaDescription: Check & { value: string | null };
    h1: Check & { count: number; values: string[] };
    h2: Check & { count: number };
    images: Check & { total: number; missingAlt: number };
    canonical: Check & { value: string | null };
    robots: Check & { value: string | null };
    wordCount: Check & { count: number };
    httpsUsed: Check & { value: boolean };
    viewport: Check & { value: string | null };
    ogTags: Check & { title: string | null; description: string | null; image: string | null };
    schemaMarkup: Check & { found: boolean };
  };
  generatedAt: string;
}

const statusBadge = (status: CheckStatus) => {
  const map = {
    good: { bg: '#dcfce7', color: '#15803d', label: 'GOOD' },
    warning: { bg: '#fef9c3', color: '#a16207', label: 'WARNING' },
    error: { bg: '#fee2e2', color: '#b91c1c', label: 'NEEDS FIX' },
  };
  return map[status];
};

const statusIcon = (status: CheckStatus) =>
  ({ good: '\u2713', warning: '\u25B2', error: '\u2715' }[status]);

const scoreColor = (score: number) =>
  score >= 70 ? '#16a34a' : score >= 40 ? '#ca8a04' : '#dc2626';

const scoreGrade = (score: number) =>
  score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F';

const scoreLabel = (score: number) =>
  score >= 70
    ? 'Good SEO health. A few tweaks could make it great.'
    : score >= 40
    ? 'Moderate. Several areas need improvement.'
    : 'Needs significant work to rank well in search.';

export default function Home() {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditResult | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async () => {
    if (!url || !name || !email) {
      setError('Please fill in all fields.');
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, name, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
      } else {
        setResult(data);
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const checkItems = result
    ? [
        {
          label: 'Title Tag',
          category: 'On-Page SEO',
          check: result.checks.title,
          detail: result.checks.title.value ? '"' + result.checks.title.value + '"' : 'No title tag found',
          howToFix: result.checks.title.status !== 'good'
            ? 'In your CMS or HTML, add a <title> tag inside the <head> section. For Webflow: go to Page Settings > SEO > Title. Keep it between 50-60 characters and include your primary keyword near the beginning.'
            : undefined,
        },
        {
          label: 'Meta Description',
          category: 'On-Page SEO',
          check: result.checks.metaDescription,
          detail: result.checks.metaDescription.value
            ? result.checks.metaDescription.value.slice(0, 100) + (result.checks.metaDescription.value.length > 100 ? '...' : '')
            : 'No meta description found',
          howToFix: result.checks.metaDescription.status !== 'good'
            ? 'Add a meta description tag: <meta name="description" content="Your description here">. For Webflow: Page Settings > SEO > Description. Write 140-160 characters that summarise the page and include a call to action.'
            : undefined,
        },
        {
          label: 'H1 Heading',
          category: 'On-Page SEO',
          check: result.checks.h1,
          detail: result.checks.h1.count + ' H1 tag(s) found' + (result.checks.h1.values[0] ? ': "' + result.checks.h1.values[0].slice(0, 60) + '"' : ''),
          howToFix: result.checks.h1.status !== 'good'
            ? result.checks.h1.count === 0
              ? 'Add exactly one H1 heading to your page. It should be the main headline and contain your primary keyword. In Webflow, set a text element heading style to H1.'
              : 'You have multiple H1 tags. Keep only one — usually the main page headline. Change the others to H2 or H3 in your page editor.'
            : undefined,
        },
        {
          label: 'H2 Subheadings',
          category: 'On-Page SEO',
          check: result.checks.h2,
          detail: result.checks.h2.count + ' H2 subheading(s) found',
          howToFix: result.checks.h2.status !== 'good'
            ? 'Add H2 tags to break up your content into sections. Each H2 should describe a key topic on the page. Good structure: H1 (page title) > H2 (section headings) > H3 (subsections).'
            : undefined,
        },
        {
          label: 'Image Alt Text',
          category: 'On-Page SEO',
          check: result.checks.images,
          detail: result.checks.images.total + ' images found, ' + result.checks.images.missingAlt + ' missing alt text',
          howToFix: result.checks.images.status !== 'good'
            ? 'Add descriptive alt text to every image. In Webflow: click each image > Element Settings > Alt Text. Write a natural description like "Red Toyota Camry 2023 side view". Avoid keyword stuffing.'
            : undefined,
        },
        {
          label: 'HTTPS Security',
          category: 'Technical',
          check: result.checks.httpsUsed,
          detail: result.checks.httpsUsed.value ? 'Site is served over HTTPS' : 'Site is NOT using HTTPS',
          howToFix: result.checks.httpsUsed.status !== 'good'
            ? 'Enable SSL/HTTPS on your hosting provider. Most hosts offer free SSL via Lets Encrypt. In Webflow this is automatic. Without HTTPS, Google may rank your site lower and show a "Not Secure" warning to visitors.'
            : undefined,
        },
        {
          label: 'Mobile Viewport',
          category: 'Technical',
          check: result.checks.viewport,
          detail: result.checks.viewport.value ? 'Viewport meta tag present' : 'No viewport meta tag found',
          howToFix: result.checks.viewport.status !== 'good'
            ? 'Add this to your HTML <head>: <meta name="viewport" content="width=device-width, initial-scale=1">. This tells mobile browsers how to scale the page. Without it, Google may penalise your mobile rankings.'
            : undefined,
        },
        {
          label: 'Canonical Tag',
          category: 'Technical',
          check: result.checks.canonical,
          detail: result.checks.canonical.value ? 'Canonical: ' + result.checks.canonical.value.slice(0, 60) : 'No canonical tag found',
          howToFix: result.checks.canonical.status !== 'good'
            ? 'Add a canonical tag to tell Google the preferred URL of this page: <link rel="canonical" href="https://yoursite.com/page">. In Webflow, go to Page Settings > SEO > Canonical Tag. This prevents duplicate content penalties.'
            : undefined,
        },
        {
          label: 'Robots Meta Tag',
          category: 'Technical',
          check: result.checks.robots,
          detail: result.checks.robots.value ? 'Robots: ' + result.checks.robots.value : 'No robots meta tag set',
          howToFix: result.checks.robots.status === 'error'
            ? 'URGENT: Your page has noindex set which means Google will not index this page. To fix: remove the <meta name="robots" content="noindex"> tag, or in Webflow uncheck "Exclude from search results" in Page Settings.'
            : result.checks.robots.status === 'warning'
            ? 'Consider adding: <meta name="robots" content="index, follow"> to explicitly tell search engines to index this page and follow its links.'
            : undefined,
        },
        {
          label: 'Word Count',
          category: 'Content',
          check: result.checks.wordCount,
          detail: result.checks.wordCount.count + ' words detected on page',
          howToFix: result.checks.wordCount.status !== 'good'
            ? 'Add more content to your page. Google favours pages with at least 300 words of meaningful content. Write about your services, location, benefits, FAQs, or customer testimonials. Thin content pages tend to rank poorly.'
            : undefined,
        },
        {
          label: 'Open Graph Tags',
          category: 'Social',
          check: result.checks.ogTags,
          detail: result.checks.ogTags.title
            ? 'OG title, description and image are all set'
            : 'Missing: ' + [!result.checks.ogTags.title && 'og:title', !result.checks.ogTags.description && 'og:description', !result.checks.ogTags.image && 'og:image'].filter(Boolean).join(', '),
          howToFix: result.checks.ogTags.status !== 'good'
            ? 'Add Open Graph meta tags to control how your page looks when shared on Facebook, LinkedIn etc. In Webflow: Page Settings > Open Graph. Add: og:title, og:description (max 200 chars), and og:image (1200x630px recommended).'
            : undefined,
        },
        {
          label: 'Schema Markup',
          category: 'Technical',
          check: result.checks.schemaMarkup,
          detail: result.checks.schemaMarkup.found ? 'JSON-LD structured data detected' : 'No structured data found',
          howToFix: result.checks.schemaMarkup.status !== 'good'
            ? 'Add JSON-LD Schema markup to help Google understand your content. For a local business: add LocalBusiness schema. For a product page: add Product schema. In Webflow, paste the JSON-LD script in Page Settings > Custom Code > Head. Use schema.org or Google\'s Rich Results Test to validate.'
            : undefined,
        },
      ]
    : [];

  const good = checkItems.filter((c) => c.check.status === 'good').length;
  const warn = checkItems.filter((c) => c.check.status === 'warning').length;
  const err = checkItems.filter((c) => c.check.status === 'error').length;
  const fixItems = checkItems.filter((c) => c.check.status !== 'good');

  const categories = ['On-Page SEO', 'Technical', 'Content', 'Social'];

  return (
    <>
      <Head>
        <title>Next Wave SEO Audit Tool</title>
        <meta name="description" content="Free SEO audit tool by Next Wave, New Zealand AI-powered digital marketing agency." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Fraunces:ital,wght@0,300;0,400;0,600;0,700;1,300&display=swap" rel="stylesheet" />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Plus Jakarta Sans', sans-serif; background: #f8f7f4; color: #1a1a1a; font-weight: 400; }
          input, button { font-family: 'Plus Jakarta Sans', sans-serif; }
          input:focus { outline: 2px solid #e8693a; outline-offset: -2px; border-color: #e8693a !important; }
          @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes spin { to { transform: rotate(360deg); } }
          .fade-in { animation: fadeUp 0.45s ease forwards; }
          .check-row:hover { background: #fafaf8 !important; }
          .submit-btn:hover:not(:disabled) { background: #c95a2a !important; }
          .submit-btn { transition: background 0.2s; }
          .cta-btn:hover { background: #1a1a1a !important; }
          .cta-btn { transition: background 0.2s; }
          .print-btn:hover { background: #e5e2dc !important; }
          .print-btn { transition: background 0.2s; }
          @media (max-width: 640px) {
            .feature-grid { grid-template-columns: 1fr !important; }
            .score-row { flex-direction: column !important; gap: 20px !important; }
            .cat-grid { grid-template-columns: 1fr 1fr !important; }
          }
          @media print {
            .no-print { display: none !important; }
            body { background: white; }
            .print-section { page-break-inside: avoid; }
          }
        `}</style>
      </Head>

      <div style={{ minHeight: '100vh', background: '#f8f7f4' }}>

        {/* Header */}
        <header className="no-print" style={{ background: '#111', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52 }}>
          <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600, fontSize: 13, color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Next Wave <span style={{ color: '#e8693a', margin: '0 6px' }}>|</span> SEO Audit
          </span>
          <a href="https://www.nextwave.nz" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#888', textDecoration: 'none', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            nextwave.nz
          </a>
        </header>

        <main style={{ maxWidth: 780, margin: '0 auto', padding: '44px 20px 80px' }}>
          {!result ? (
            <div className="fade-in">
              {/* Hero */}
              <div style={{ textAlign: 'center', marginBottom: 44 }}>
                <div style={{ display: 'inline-block', background: '#e8693a', color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', padding: '4px 12px', borderRadius: 99, marginBottom: 18, textTransform: 'uppercase' }}>
                  Free Tool
                </div>
                <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(30px, 5vw, 48px)', fontWeight: 300, lineHeight: 1.15, color: '#111', marginBottom: 14, letterSpacing: '-0.01em' }}>
                  Website SEO Audit
                </h1>
                <p style={{ color: '#666', fontSize: 15, maxWidth: 460, margin: '0 auto', lineHeight: 1.75, fontWeight: 400 }}>
                  Scan your website for SEO issues and get a detailed report with specific fixes — in seconds.
                </p>
              </div>

              {/* Form */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '36px 36px 32px', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #eae7e0' }}>
                <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 19, fontWeight: 400, marginBottom: 24, color: '#111', letterSpacing: '-0.01em' }}>
                  Free SEO Audit Tool
                </h2>

                {[
                  { label: 'Website URL', placeholder: 'https://yourbusiness.co.nz', value: url, setter: setUrl, type: 'text' },
                  { label: 'Your Name', placeholder: 'Jane Smith', value: name, setter: setName, type: 'text' },
                  { label: 'Email Address', placeholder: 'jane@yourbusiness.co.nz', value: email, setter: setEmail, type: 'email' },
                ].map((field) => (
                  <div key={field.label} style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#444', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      {field.label} <span style={{ color: '#e8693a' }}>*</span>
                    </label>
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={field.value}
                      onChange={(e) => field.setter(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                      style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e5e0d8', borderRadius: 8, fontSize: 14, color: '#111', background: '#fdfcfb', transition: 'border-color 0.15s' }}
                    />
                  </div>
                ))}

                {error && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '11px 14px', color: '#b91c1c', marginBottom: 16, fontSize: 13, fontWeight: 500 }}>
                    {error}
                  </div>
                )}

                <button
                  className="submit-btn"
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{ width: '100%', padding: '13px', background: loading ? '#bbb' : '#e8693a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}
                >
                  {loading ? (
                    <>
                      <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                      Analysing your website...
                    </>
                  ) : 'Start Free Audit'}
                </button>
              </div>

              {/* Features */}
              <div className="feature-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 24 }}>
                {[
                  { icon: '&#128202;', title: '12 SEO Checks', desc: 'Title, meta, headings, images, HTTPS, schema and more' },
                  { icon: '&#128161;', title: 'How-to-Fix Guides', desc: 'Step-by-step instructions for every issue found' },
                  { icon: '&#128221;', title: 'Printable Report', desc: 'Save or print your full audit report as PDF' },
                ].map((f) => (
                  <div key={f.title} style={{ background: '#fff', borderRadius: 12, padding: '18px 16px', border: '1px solid #eae7e0', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, marginBottom: 8 }} dangerouslySetInnerHTML={{ __html: f.icon }} />
                    <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4, color: '#111', letterSpacing: '0.01em' }}>{f.title}</div>
                    <div style={{ fontSize: 11, color: '#888', lineHeight: 1.6 }}>{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>

          ) : (
            <div className="fade-in" ref={reportRef}>

              {/* Report header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }} className="print-section">
                <div>
                  <div style={{ display: 'inline-block', background: '#e8693a', color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', padding: '4px 12px', borderRadius: 99, marginBottom: 12, textTransform: 'uppercase' }}>
                    Audit Complete
                  </div>
                  <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 400, color: '#111', marginBottom: 6, letterSpacing: '-0.01em' }}>
                    SEO Audit Report
                  </h1>
                  <p style={{ color: '#666', fontSize: 13, lineHeight: 1.6 }}>
                    <strong style={{ color: '#111', fontWeight: 600 }}>{result.url}</strong>
                    <br />
                    Generated {new Date(result.generatedAt).toLocaleString('en-NZ')} — Prepared for {result.name}
                  </p>
                </div>
                <div className="no-print" style={{ display: 'flex', gap: 8 }}>
                  <button className="print-btn" onClick={handlePrint} style={{ padding: '9px 18px', background: '#fff', border: '1.5px solid #e0dcd5', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#444', letterSpacing: '0.03em' }}>
                    Print / Save PDF
                  </button>
                  <button onClick={() => { setResult(null); setUrl(''); setName(''); setEmail(''); }} style={{ padding: '9px 18px', background: 'transparent', border: '1.5px solid #e0dcd5', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#888', letterSpacing: '0.03em' }}>
                    New Audit
                  </button>
                </div>
              </div>

              {/* Score card */}
              <div className="print-section" style={{ background: '#111', borderRadius: 16, padding: '32px 36px', marginBottom: 16, color: '#fff' }}>
                <div className="score-row" style={{ display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center', minWidth: 100 }}>
                    <div style={{ fontFamily: 'Fraunces, serif', fontSize: 72, fontWeight: 300, color: scoreColor(result.score), lineHeight: 1 }}>
                      {scoreGrade(result.score)}
                    </div>
                    <div style={{ fontSize: 11, color: '#666', letterSpacing: '0.1em', marginTop: 4, textTransform: 'uppercase' }}>
                      {result.score}/100
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 15, fontWeight: 400, marginBottom: 14, color: '#e8e8e8', lineHeight: 1.5 }}>
                      {scoreLabel(result.score)}
                    </div>
                    <div style={{ height: 6, background: '#2a2a2a', borderRadius: 99, overflow: 'hidden', marginBottom: 18 }}>
                      <div style={{ height: '100%', width: result.score + '%', background: scoreColor(result.score), borderRadius: 99, transition: 'width 1s ease' }} />
                    </div>
                    <div className="cat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                      {[
                        { label: 'Passed', count: good, color: '#16a34a' },
                        { label: 'Warnings', count: warn, color: '#ca8a04' },
                        { label: 'Errors', count: err, color: '#dc2626' },
                      ].map((s) => (
                        <div key={s.label} style={{ background: '#1c1c1c', borderRadius: 10, padding: '12px 8px', textAlign: 'center' }}>
                          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 28, fontWeight: 300, color: s.color, lineHeight: 1 }}>{s.count}</div>
                          <div style={{ fontSize: 10, color: '#666', letterSpacing: '0.08em', marginTop: 4, textTransform: 'uppercase' }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Category summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }} className="print-section cat-grid">
                {categories.map((cat) => {
                  const catItems = checkItems.filter((c) => c.category === cat);
                  const catGood = catItems.filter((c) => c.check.status === 'good').length;
                  const catTotal = catItems.length;
                  const allGood = catGood === catTotal;
                  const anyError = catItems.some((c) => c.check.status === 'error');
                  return (
                    <div key={cat} style={{ background: '#fff', border: '1.5px solid ' + (anyError ? '#fecaca' : allGood ? '#bbf7d0' : '#fde68a'), borderRadius: 12, padding: '14px 16px' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: anyError ? '#b91c1c' : allGood ? '#15803d' : '#a16207', marginBottom: 4 }}>{cat}</div>
                      <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 300, color: '#111' }}>{catGood}/{catTotal}</div>
                      <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>checks passed</div>
                    </div>
                  );
                })}
              </div>

              {/* Detailed checks by category */}
              {categories.map((cat) => {
                const catItems = checkItems.filter((c) => c.category === cat);
                return (
                  <div key={cat} className="print-section" style={{ background: '#fff', borderRadius: 16, border: '1px solid #eae7e0', overflow: 'hidden', marginBottom: 16 }}>
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0ede7', background: '#fafaf8' }}>
                      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 15, fontWeight: 400, color: '#111', letterSpacing: '-0.01em' }}>{cat}</h2>
                    </div>
                    {catItems.map((item, i) => {
                      const badge = statusBadge(item.check.status);
                      return (
                        <div key={item.label} className="check-row" style={{ padding: '18px 24px', borderBottom: i < catItems.length - 1 ? '1px solid #f5f3ef' : 'none', background: '#fff', transition: 'background 0.1s' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                            <span style={{ width: 22, height: 22, borderRadius: '50%', background: badge.bg, color: badge.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>
                              {statusIcon(item.check.status)}
                            </span>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 600, fontSize: 13, color: '#111' }}>{item.label}</span>
                                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', padding: '2px 7px', borderRadius: 99, background: badge.bg, color: badge.color, textTransform: 'uppercase' }}>
                                  {badge.label}
                                </span>
                              </div>
                              <div style={{ fontSize: 12, color: '#777', marginBottom: item.howToFix ? 8 : 0, lineHeight: 1.6 }}>{item.detail}</div>
                              <div style={{ fontSize: 12, color: '#444', marginBottom: item.howToFix ? 8 : 0, lineHeight: 1.65 }}>{item.check.recommendation}</div>
                              {item.howToFix && (
                                <div style={{ background: '#f8f6f2', borderLeft: '3px solid #e8693a', borderRadius: '0 6px 6px 0', padding: '10px 12px', marginTop: 8 }}>
                                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#e8693a', marginBottom: 4 }}>How to Fix</div>
                                  <div style={{ fontSize: 12, color: '#555', lineHeight: 1.7 }}>{item.howToFix}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* Priority fix list */}
              {fixItems.length > 0 && (
                <div className="print-section" style={{ background: '#fff', borderRadius: 16, border: '1px solid #eae7e0', overflow: 'hidden', marginBottom: 16 }}>
                  <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0ede7', background: '#fafaf8' }}>
                    <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 15, fontWeight: 400, color: '#111' }}>Priority Action List</h2>
                    <p style={{ fontSize: 12, color: '#888', marginTop: 3 }}>Fix these issues to improve your SEO score</p>
                  </div>
                  {fixItems
                    .sort((a, b) => (a.check.status === 'error' ? -1 : b.check.status === 'error' ? 1 : 0))
                    .map((item, i) => (
                      <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 24px', borderBottom: i < fixItems.length - 1 ? '1px solid #f5f3ef' : 'none' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#ccc', minWidth: 20 }}>{i + 1}</span>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.check.status === 'error' ? '#dc2626' : '#ca8a04', flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#111', flex: 1 }}>{item.label}</span>
                        <span style={{ fontSize: 11, color: '#888' }}>{item.category}</span>
                      </div>
                    ))}
                </div>
              )}

              {/* CTA */}
              <div className="print-section" style={{ background: '#e8693a', borderRadius: 16, padding: '32px 36px', color: '#fff', textAlign: 'center' }}>
                <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 24, fontWeight: 400, marginBottom: 8, letterSpacing: '-0.01em' }}>
                  Want us to fix these issues?
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.88)', marginBottom: 24, fontSize: 14, lineHeight: 1.7, fontWeight: 400 }}>
                  Next Wave specialises in SEO for New Zealand businesses. Book a free strategy call and we will walk you through exactly what needs to be done.
                </p>
                <a
                  href="https://www.nextwave.nz/contact-us"
                  target="_self"
                  rel="noopener noreferrer"
                  className="cta-btn"
                  style={{ display: 'inline-block', background: '#111', color: '#fff', padding: '13px 28px', borderRadius: 8, fontWeight: 600, fontSize: 14, textDecoration: 'none', letterSpacing: '0.02em' }}
                >
                  Book a Free Strategy Call
                </a>
              </div>

            </div>
          )}
        </main>
      </div>
    </>
  );
}
