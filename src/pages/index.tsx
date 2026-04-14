import { useState } from 'react';
import Head from 'next/head';

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
  isHttps: boolean;
}

interface SiteAudit {
  siteUrl: string;
  name: string;
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

const scoreGrade = (s: number) => s >= 90 ? 'A+' : s >= 80 ? 'A' : s >= 70 ? 'B' : s >= 55 ? 'C' : s >= 40 ? 'D' : 'F';
const scoreColor = (s: number) => s >= 70 ? '#15803d' : s >= 40 ? '#b45309' : '#b91c1c';
const scoreLabel = (s: number) => s >= 70 ? 'Good SEO health. A few tweaks could make it great.' : s >= 40 ? 'Moderate. Several areas need attention.' : 'Needs significant work to rank in search.';

const badge = (status: CheckStatus) => ({
  good: { bg: '#dcfce7', color: '#15803d', text: 'GOOD' },
  warning: { bg: '#fef9c3', color: '#a16207', text: 'WARNING' },
  error: { bg: '#fee2e2', color: '#b91c1c', text: 'FIX NEEDED' },
}[status]);

const icon = (status: CheckStatus) => ({ good: '✓', warning: '!', error: '✗' }[status]);

const shortUrl = (u: string) => {
  try { const p = new URL(u); return p.hostname + (p.pathname !== '/' ? p.pathname.slice(0, 30) : ''); }
  catch { return u.slice(0, 40); }
};

// Auto-resize when embedded in iframe
if (typeof window !== "undefined") {
  const reportHeight = () => {
    if (window.parent !== window) {
      window.parent.postMessage({ type: "nw-seo-height", height: document.body.scrollHeight }, "*");
    }
  };
  if (document.readyState === "complete") {
    setTimeout(reportHeight, 300);
  } else {
    window.addEventListener("load", () => setTimeout(reportHeight, 300));
  }
  const obs = typeof MutationObserver !== "undefined"
    ? new MutationObserver(() => setTimeout(reportHeight, 100))
    : null;
  if (obs) obs.observe(document.body, { childList: true, subtree: true });
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SiteAudit | null>(null);

  const handleSubmit = async () => {
    if (!url || !name || !email) { setError('Please fill in all fields.'); return; }
    setError(null); setLoading(true); setResult(null);
    const msgs = ['Fetching your homepage...', 'Crawling internal pages...', 'Analysing meta tags...', 'Checking images and schema...', 'Building your report...'];
    let i = 0;
    setLoadingMsg(msgs[0]);
    const interval = setInterval(() => { i = Math.min(i + 1, msgs.length - 1); setLoadingMsg(msgs[i]); }, 2800);
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, name, email }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || 'Something went wrong. Please try again.');
      else setResult(data);
    } catch { setError('Network error. Please check your connection and try again.'); }
    finally { clearInterval(interval); setLoading(false); setLoadingMsg(''); }
  };

  const home = result?.pages[0];
  const good = result ? result.pages.reduce((a, p) => a + ([p.titleStatus, p.metaDescStatus, p.h1Status, p.robotsStatus].filter(s => s === 'good').length), 0) : 0;

  return (
    <>
      <Head>
        <title>Next Wave SEO Audit Tool</title>
        <meta name="description" content="Free SEO audit tool by Next Wave NZ" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Fraunces:wght@300;400;600&display=swap" rel="stylesheet" />
        <style>{`
          *{box-sizing:border-box;margin:0;padding:0}
          body{font-family:'Plus Jakarta Sans',sans-serif;background:#f7f6f2;color:#1a1a1a;font-size:14px;font-weight:400;line-height:1.5}
          input,button,textarea{font-family:'Plus Jakarta Sans',sans-serif}
          input:focus{outline:2px solid #e8693a;outline-offset:-2px;border-color:#e8693a!important}
          @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
          @keyframes spin{to{transform:rotate(360deg)}}
          @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
          .fade{animation:fadeUp .4s ease forwards}
          .card{background:#fff;border-radius:14px;border:1px solid #e8e4dc;overflow:hidden;margin-bottom:14px}
          .card-head{padding:14px 20px;border-bottom:1px solid #f0ece5;background:#faf9f6;display:flex;align-items:center;justify-content:space-between}
          .card-body{padding:0}
          .row{padding:14px 20px;border-bottom:1px solid #f5f2ec;display:flex;align-items:flex-start;gap:10}
          .row:last-child{border-bottom:none}
          .row:hover{background:#faf9f6}
          .badge{display:inline-block;font-size:9px;font-weight:700;letter-spacing:.1em;padding:2px 7px;border-radius:99px;text-transform:uppercase}
          .fix-box{background:#fef6f2;border-left:3px solid #e8693a;border-radius:0 6px 6px 0;padding:10px 12px;margin-top:8px}
          .fix-title{font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#e8693a;margin-bottom:4px}
          .tag{display:inline-block;background:#f0ece5;color:#555;font-size:10px;padding:2px 8px;border-radius:4px;margin:2px;font-family:monospace}
          .submit-btn{width:100%;padding:13px;background:#e8693a;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;letter-spacing:.02em;transition:background .15s}
          .submit-btn:hover:not(:disabled){background:#c95a2a}
          .submit-btn:disabled{background:#bbb;cursor:not-allowed}
          .print-btn{padding:9px 16px;background:#fff;border:1.5px solid #e0dcd5;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;color:#555;transition:background .15s}
          .print-btn:hover{background:#f5f2ec}
          .url-chip{display:inline-block;background:#f0ece5;color:#555;font-size:11px;padding:2px 8px;border-radius:4px;font-family:monospace;word-break:break-all;max-width:100%}
          table{width:100%;border-collapse:collapse;font-size:12px}
          th{text-align:left;padding:8px 12px;background:#faf9f6;color:#888;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;border-bottom:1px solid #ede9e1}
          td{padding:10px 12px;border-bottom:1px solid #f5f2ec;vertical-align:top}
          tr:last-child td{border-bottom:none}
          tr:hover td{background:#faf9f6}
          @media(max-width:600px){.score-flex{flex-direction:column!important;gap:16px!important}.cat-grid{grid-template-columns:1fr 1fr!important}}
          @media print{.no-print{display:none!important}body{background:#fff}.card{break-inside:avoid}}
        `}</style>
      </Head>

      <div style={{ minHeight: '100vh', background: '#f7f6f2' }}>

        {/* Top bar */}
        <div className="no-print" style={{ background: '#111', padding: '0 24px', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase' }}>
            Next Wave <span style={{ color: '#e8693a', margin: '0 5px' }}>|</span> SEO Audit
          </span>
          <a href="https://www.nextwave.nz" target="_blank" rel="noopener noreferrer" style={{ color: '#777', fontSize: 11, textDecoration: 'none', letterSpacing: '.06em', textTransform: 'uppercase' }}>nextwave.nz</a>
        </div>

        <main style={{ maxWidth: 820, margin: '0 auto', padding: '36px 16px 80px' }}>

          {/* ── FORM ── */}
          {!result && (
            <div className="fade">
              <div style={{ textAlign: 'center', marginBottom: 36 }}>
                <span style={{ display: 'inline-block', background: '#e8693a', color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: '.14em', padding: '4px 12px', borderRadius: 99, marginBottom: 14, textTransform: 'uppercase' }}>Free Tool</span>
                <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(26px,5vw,44px)', fontWeight: 300, lineHeight: 1.15, color: '#111', marginBottom: 12 }}>
                  Website SEO Audit
                </h1>
                <p style={{ color: '#666', fontSize: 15, maxWidth: 440, margin: '0 auto', lineHeight: 1.8, fontWeight: 300 }}>
                  Scan your website for SEO issues. Get a detailed page-by-page report with specific fixes.
                </p>
              </div>

              <div className="card" style={{ padding: '32px 28px 28px' }}>
                <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 400, marginBottom: 22, color: '#111' }}>Start Your Free Audit</h2>

                {[
                  { label: 'Website URL', placeholder: 'https://yourbusiness.co.nz', value: url, setter: setUrl, type: 'text' },
                  { label: 'Your Name', placeholder: 'Jane Smith', value: name, setter: setName, type: 'text' },
                  { label: 'Email Address', placeholder: 'jane@yourbusiness.co.nz', value: email, setter: setEmail, type: 'email' },
                ].map(f => (
                  <div key={f.label} style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 5, letterSpacing: '.06em', textTransform: 'uppercase' }}>
                      {f.label} <span style={{ color: '#e8693a' }}>*</span>
                    </label>
                    <input type={f.type} placeholder={f.placeholder} value={f.value}
                      onChange={e => f.setter(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                      style={{ width: '100%', padding: '11px 13px', border: '1.5px solid #e5e0d8', borderRadius: 8, fontSize: 14, color: '#111', background: '#fdfcfb' }} />
                  </div>
                ))}

                {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#b91c1c', marginBottom: 14, fontSize: 13, fontWeight: 500 }}>{error}</div>}

                <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,.35)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />
                      {loadingMsg || 'Analysing...'}
                    </span>
                  ) : 'Start Free Audit'}
                </button>

                <p style={{ fontSize: 11, color: '#aaa', marginTop: 12, textAlign: 'center' }}>
                  We crawl up to 5 pages of your site for a comprehensive report.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 14 }} className="cat-grid">
                {[
                  { icon: '📄', t: 'Page-by-Page Detail', d: 'See issues on every page crawled, not just the homepage' },
                  { icon: '🖼', t: 'Image Alt Report', d: 'Every image missing alt text listed by URL' },
                  { icon: '🔧', t: 'How-to-Fix Guides', d: 'Step-by-step instructions for every issue found' },
                ].map(f => (
                  <div key={f.t} style={{ background: '#fff', borderRadius: 10, padding: '16px 14px', border: '1px solid #e8e4dc', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, marginBottom: 6 }}>{f.icon}</div>
                    <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 4, color: '#111' }}>{f.t}</div>
                    <div style={{ fontSize: 11, color: '#999', lineHeight: 1.6 }}>{f.d}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── REPORT ── */}
          {result && (
            <div className="fade">

              {/* Report header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <span style={{ display: 'inline-block', background: '#e8693a', color: '#fff', fontSize: 9, fontWeight: 700, letterSpacing: '.14em', padding: '3px 10px', borderRadius: 99, marginBottom: 10, textTransform: 'uppercase' }}>Audit Complete</span>
                  <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(20px,4vw,30px)', fontWeight: 400, color: '#111', marginBottom: 5 }}>SEO Audit Report</h1>
                  <p style={{ color: '#777', fontSize: 12, lineHeight: 1.7 }}>
                    <strong style={{ color: '#111' }}>{result.siteUrl}</strong><br />
                    {result.pagesAudited} pages audited &middot; Generated {new Date(result.generatedAt).toLocaleString('en-NZ')} &middot; For {result.name}
                  </p>
                </div>
                <div className="no-print" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="print-btn" onClick={() => window.print()}>Print / Save PDF</button>
                  <button className="print-btn" onClick={() => { setResult(null); setUrl(''); setName(''); setEmail(''); }}>New Audit</button>
                </div>
              </div>

              {/* Score */}
              <div className="card" style={{ background: '#111', borderRadius: 14 }}>
                <div style={{ padding: '28px 28px' }}>
                  <div className="score-flex" style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center', minWidth: 90 }}>
                      <div style={{ fontFamily: 'Fraunces, serif', fontSize: 68, fontWeight: 300, color: scoreColor(result.score), lineHeight: 1 }}>{scoreGrade(result.score)}</div>
                      <div style={{ fontSize: 10, color: '#555', letterSpacing: '.1em', textTransform: 'uppercase', marginTop: 2 }}>{result.score}/100</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontSize: 14, color: '#ccc', marginBottom: 12, lineHeight: 1.6, fontWeight: 300 }}>{scoreLabel(result.score)}</div>
                      <div style={{ height: 5, background: '#222', borderRadius: 99, overflow: 'hidden', marginBottom: 16 }}>
                        <div style={{ height: '100%', width: result.score + '%', background: scoreColor(result.score), borderRadius: 99 }} />
                      </div>
                      <div className="cat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                        {[
                          { l: 'Pages Audited', v: result.pagesAudited, c: '#888' },
                          { l: 'Issues Found', v: result.summary.titleIssues.length + result.summary.metaDescIssues.length + result.summary.h1Issues.length, c: '#dc2626' },
                          { l: 'Missing Alt', v: result.summary.missingAltImages.length, c: '#b45309' },
                        ].map(s => (
                          <div key={s.l} style={{ background: '#1c1c1c', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                            <div style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 300, color: s.c, lineHeight: 1 }}>{s.v}</div>
                            <div style={{ fontSize: 9, color: '#555', letterSpacing: '.08em', textTransform: 'uppercase', marginTop: 3 }}>{s.l}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Title Issues ── */}
              {result.summary.titleIssues.length > 0 && (
                <div className="card">
                  <div className="card-head">
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 13, color: '#111' }}>Title Tag Issues</span>
                      <span style={{ fontSize: 11, color: '#999', marginLeft: 8 }}>{result.summary.titleIssues.length} page(s) affected</span>
                    </div>
                    <span className="badge" style={{ background: '#fee2e2', color: '#b91c1c' }}>Needs Fix</span>
                  </div>
                  <div className="card-body">
                    <table>
                      <thead>
                        <tr><th>Page</th><th>Title Found</th><th>Length</th><th>Issue</th></tr>
                      </thead>
                      <tbody>
                        {result.summary.titleIssues.map((t, i) => (
                          <tr key={i}>
                            <td><span className="url-chip">{shortUrl(t.url)}</span></td>
                            <td style={{ color: '#555', maxWidth: 200 }}>{t.title ? '"' + t.title.slice(0, 60) + (t.title.length > 60 ? '...' : '') + '"' : <em style={{ color: '#b91c1c' }}>No title tag</em>}</td>
                            <td style={{ color: t.length === 0 ? '#b91c1c' : t.length < 30 || t.length > 60 ? '#b45309' : '#15803d', fontWeight: 600, whiteSpace: 'nowrap' }}>{t.length} chars</td>
                            <td style={{ color: '#555' }}>{t.issue}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="fix-box" style={{ margin: '0 16px 16px' }}>
                      <div className="fix-title">How to Fix</div>
                      <div style={{ fontSize: 12, color: '#555', lineHeight: 1.75 }}>
                        In Webflow: <strong>Page Settings &rarr; SEO &rarr; Title</strong>. Write 50-60 characters. Include your primary keyword near the start. Each page should have a unique title that accurately describes the page content.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Meta Description Issues ── */}
              {result.summary.metaDescIssues.length > 0 && (
                <div className="card">
                  <div className="card-head">
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 13, color: '#111' }}>Meta Description Issues</span>
                      <span style={{ fontSize: 11, color: '#999', marginLeft: 8 }}>{result.summary.metaDescIssues.length} page(s) affected</span>
                    </div>
                    <span className="badge" style={{ background: '#fee2e2', color: '#b91c1c' }}>Needs Fix</span>
                  </div>
                  <div className="card-body">
                    <table>
                      <thead>
                        <tr><th>Page</th><th>Description Found</th><th>Length</th><th>Issue</th></tr>
                      </thead>
                      <tbody>
                        {result.summary.metaDescIssues.map((m, i) => (
                          <tr key={i}>
                            <td><span className="url-chip">{shortUrl(m.url)}</span></td>
                            <td style={{ color: '#555', maxWidth: 220 }}>{m.desc ? '"' + m.desc.slice(0, 80) + (m.desc.length > 80 ? '...' : '') + '"' : <em style={{ color: '#b91c1c' }}>No meta description</em>}</td>
                            <td style={{ color: m.length === 0 ? '#b91c1c' : '#b45309', fontWeight: 600, whiteSpace: 'nowrap' }}>{m.length} chars</td>
                            <td style={{ color: '#555' }}>{m.issue}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="fix-box" style={{ margin: '0 16px 16px' }}>
                      <div className="fix-title">How to Fix</div>
                      <div style={{ fontSize: 12, color: '#555', lineHeight: 1.75 }}>
                        In Webflow: <strong>Page Settings &rarr; SEO &rarr; Description</strong>. Aim for 140-160 characters. Write a compelling summary that includes your keyword and a call to action. Each page needs a unique meta description.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── H1 Issues ── */}
              {result.summary.h1Issues.length > 0 && (
                <div className="card">
                  <div className="card-head">
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 13, color: '#111' }}>H1 Heading Issues</span>
                      <span style={{ fontSize: 11, color: '#999', marginLeft: 8 }}>{result.summary.h1Issues.length} page(s) affected</span>
                    </div>
                    <span className="badge" style={{ background: '#fee2e2', color: '#b91c1c' }}>Needs Fix</span>
                  </div>
                  <div className="card-body">
                    <table>
                      <thead>
                        <tr><th>Page</th><th>H1 Tags Found</th><th>Issue</th></tr>
                      </thead>
                      <tbody>
                        {result.summary.h1Issues.map((h, i) => (
                          <tr key={i}>
                            <td><span className="url-chip">{shortUrl(h.url)}</span></td>
                            <td style={{ maxWidth: 240 }}>
                              {h.h1s.length === 0
                                ? <em style={{ color: '#b91c1c' }}>No H1 found</em>
                                : h.h1s.map((t, j) => <div key={j} style={{ marginBottom: 2 }}><span className="tag">{t.slice(0, 60)}</span></div>)
                              }
                            </td>
                            <td style={{ color: '#555' }}>{h.issue}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="fix-box" style={{ margin: '0 16px 16px' }}>
                      <div className="fix-title">How to Fix</div>
                      <div style={{ fontSize: 12, color: '#555', lineHeight: 1.75 }}>
                        Every page needs exactly <strong>one H1 tag</strong> — usually the main headline. In Webflow: select the heading element &rarr; Style panel &rarr; set Tag to <strong>H1</strong>. Your H1 should include your primary keyword and clearly describe the page topic.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Missing Alt Text ── */}
              {result.summary.missingAltImages.length > 0 && (
                <div className="card">
                  <div className="card-head">
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 13, color: '#111' }}>Images Missing Alt Text</span>
                      <span style={{ fontSize: 11, color: '#999', marginLeft: 8 }}>{result.summary.missingAltImages.length} image(s) affected</span>
                    </div>
                    <span className="badge" style={{ background: '#fef9c3', color: '#a16207' }}>Warning</span>
                  </div>
                  <div className="card-body">
                    <table>
                      <thead>
                        <tr><th>Page</th><th>Image URL</th><th>Nearby Text</th></tr>
                      </thead>
                      <tbody>
                        {result.summary.missingAltImages.map((img, i) => (
                          <tr key={i}>
                            <td style={{ whiteSpace: 'nowrap' }}><span className="url-chip">{shortUrl(img.pageUrl)}</span></td>
                            <td style={{ maxWidth: 220 }}><span className="tag" style={{ wordBreak: 'break-all', whiteSpace: 'normal' }}>{img.imgSrc}</span></td>
                            <td style={{ color: '#888', fontSize: 11 }}>{img.context || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="fix-box" style={{ margin: '0 16px 16px' }}>
                      <div className="fix-title">How to Fix</div>
                      <div style={{ fontSize: 12, color: '#555', lineHeight: 1.75 }}>
                        In Webflow: click each image &rarr; <strong>Element Settings (gear icon) &rarr; Alt Text</strong>. Write a natural description of what the image shows. Example: "Red Toyota Camry 2024 exterior side view". Avoid keyword stuffing. Decorative images can use empty alt="" but should be rare.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Schema Markup ── */}
              <div className="card">
                <div className="card-head">
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#111' }}>Schema / Structured Data</span>
                  {result.summary.schemaFound.length > 0
                    ? <span className="badge" style={{ background: '#dcfce7', color: '#15803d' }}>Detected</span>
                    : <span className="badge" style={{ background: '#fef9c3', color: '#a16207' }}>Not Found</span>
                  }
                </div>
                <div className="card-body">
                  {result.summary.schemaFound.length > 0 ? (
                    <table>
                      <thead><tr><th>Page</th><th>Schema Types Found</th></tr></thead>
                      <tbody>
                        {result.summary.schemaFound.map((s, i) => (
                          <tr key={i}>
                            <td><span className="url-chip">{shortUrl(s.url)}</span></td>
                            <td>{s.types.map((t, j) => <span key={j} className="tag">{t}</span>)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ padding: '16px 20px', color: '#777', fontSize: 13 }}>
                      No structured data (JSON-LD schema) was found on any crawled page.
                    </div>
                  )}
                  <div className="fix-box" style={{ margin: '0 16px 16px' }}>
                    <div className="fix-title">{result.summary.schemaFound.length > 0 ? 'Recommended additions' : 'How to Fix'}</div>
                    <div style={{ fontSize: 12, color: '#555', lineHeight: 1.75 }}>
                      {result.summary.schemaFound.length > 0
                        ? 'Good — schema markup is present. Consider adding more types: <strong>LocalBusiness</strong> (address, phone, hours), <strong>Product</strong> (price, reviews), <strong>FAQPage</strong> (for FAQ sections), <strong>BreadcrumbList</strong> (for navigation). Use Google\'s Rich Results Test to validate.'
                        : 'Add JSON-LD schema markup to your pages. In Webflow: <strong>Page Settings &rarr; Custom Code &rarr; Head Code</strong>. Start with <strong>LocalBusiness</strong> or <strong>Organization</strong> schema. Visit schema.org to find the right type for your business.'
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Homepage Technical Summary ── */}
              {home && (
                <div className="card">
                  <div className="card-head">
                    <span style={{ fontWeight: 700, fontSize: 13, color: '#111' }}>Homepage Technical Checks</span>
                  </div>
                  <div className="card-body">
                    {[
                      { label: 'HTTPS', status: home.isHttps ? 'good' : 'error' as CheckStatus, detail: home.isHttps ? 'Secure HTTPS connection' : 'Not using HTTPS — critical ranking factor', fix: !home.isHttps ? 'Enable SSL on your hosting provider. Webflow includes free SSL automatically.' : undefined },
                      { label: 'Mobile Viewport', status: home.viewport ? 'good' : 'error' as CheckStatus, detail: home.viewport || 'Missing viewport meta tag', fix: !home.viewport ? 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to your HTML head.' : undefined },
                      { label: 'Canonical Tag', status: home.canonical ? 'good' : 'warning' as CheckStatus, detail: home.canonical || 'No canonical tag found', fix: !home.canonical ? 'In Webflow: Page Settings > SEO > Canonical URL. Set to the preferred URL of this page.' : undefined },
                      { label: 'Robots Meta', status: home.robotsStatus, detail: home.robots || 'Not set', fix: home.robotsStatus === 'error' ? 'URGENT: noindex is set — Google will NOT index this page! Remove it in Page Settings > SEO.' : home.robotsStatus === 'warning' ? 'Consider adding <meta name="robots" content="index, follow">.' : undefined },
                      { label: 'Open Graph', status: (home.ogTitle && home.ogImage ? 'good' : 'warning') as CheckStatus, detail: home.ogTitle ? 'OG title and image present' : 'Missing OG tags — affects social sharing appearance', fix: !home.ogTitle ? 'In Webflow: Page Settings > Open Graph. Add og:title, og:description, and og:image (1200x630px).' : undefined },
                      { label: 'Word Count', status: (home.wordCount >= 300 ? 'good' : 'warning') as CheckStatus, detail: home.wordCount + ' words on homepage', fix: home.wordCount < 300 ? 'Add more content — at least 300 words. Consider adding service descriptions, FAQs, or testimonials.' : undefined },
                    ].map((item, i) => {
                      const b = badge(item.status);
                      return (
                        <div key={i} className="row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ width: 20, height: 20, borderRadius: '50%', background: b.bg, color: b.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{icon(item.status)}</span>
                            <span style={{ fontWeight: 600, fontSize: 13, color: '#111', flex: 1 }}>{item.label}</span>
                            <span className="badge" style={{ background: b.bg, color: b.color }}>{b.text}</span>
                          </div>
                          <div style={{ paddingLeft: 30, marginTop: 4, fontSize: 12, color: '#777' }}>{item.detail}</div>
                          {item.fix && (
                            <div className="fix-box" style={{ marginLeft: 30, marginTop: 6 }}>
                              <div className="fix-title">How to Fix</div>
                              <div style={{ fontSize: 12, color: '#555', lineHeight: 1.7 }}>{item.fix}</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Pages crawled ── */}
              <div className="card">
                <div className="card-head">
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#111' }}>Pages Crawled ({result.pagesAudited})</span>
                </div>
                <div className="card-body">
                  <table>
                    <thead><tr><th>URL</th><th>Title</th><th>Meta Desc</th><th>H1</th><th>Images</th><th>Schema</th></tr></thead>
                    <tbody>
                      {result.pages.map((p, i) => (
                        <tr key={i}>
                          <td><span className="url-chip">{shortUrl(p.url)}</span></td>
                          <td>
                            <span className="badge" style={{ background: badge(p.titleStatus).bg, color: badge(p.titleStatus).color }}>{p.titleLength > 0 ? p.titleLength + 'ch' : 'Missing'}</span>
                          </td>
                          <td>
                            <span className="badge" style={{ background: badge(p.metaDescStatus).bg, color: badge(p.metaDescStatus).color }}>{p.metaDescLength > 0 ? p.metaDescLength + 'ch' : 'Missing'}</span>
                          </td>
                          <td>
                            <span className="badge" style={{ background: badge(p.h1Status).bg, color: badge(p.h1Status).color }}>{p.h1Tags.length === 0 ? 'Missing' : p.h1Tags.length + ' found'}</span>
                          </td>
                          <td style={{ color: p.imagesMissingAlt.length > 0 ? '#b45309' : '#15803d', fontWeight: 600 }}>
                            {p.imagesMissingAlt.length > 0 ? p.imagesMissingAlt.length + ' missing alt' : p.imagesTotal + ' OK'}
                          </td>
                          <td style={{ color: p.schemaTypes.length > 0 ? '#15803d' : '#aaa' }}>
                            {p.schemaTypes.length > 0 ? p.schemaTypes.slice(0, 2).join(', ') : 'None'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── CTA ── */}
              <div style={{ background: '#e8693a', borderRadius: 14, padding: '32px 28px', color: '#fff', textAlign: 'center' }}>
                <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 24, fontWeight: 400, marginBottom: 8 }}>Want us to fix these issues?</h2>
                <p style={{ color: 'rgba(255,255,255,.88)', marginBottom: 22, fontSize: 14, fontWeight: 300, lineHeight: 1.75, maxWidth: 440, margin: '0 auto 22px' }}>
                  Next Wave specialises in SEO for New Zealand businesses. Book a free strategy call and we will walk you through exactly what needs to be done.
                </p>
                <a href="https://www.nextwave.nz/contact-us" style={{ display: 'inline-block', background: '#111', color: '#fff', padding: '12px 26px', borderRadius: 8, fontWeight: 600, fontSize: 14, textDecoration: 'none', letterSpacing: '.02em' }}>
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
