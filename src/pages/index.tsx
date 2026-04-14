import { useState, useEffect } from 'react';
import Head from 'next/head';

type CheckStatus = 'good' | 'warning' | 'error';
interface PageData {
  url: string; title: string | null; titleLength: number; titleStatus: CheckStatus;
  metaDescription: string | null; metaDescLength: number; metaDescStatus: CheckStatus;
  h1Tags: string[]; h1Status: CheckStatus; h2Tags: string[]; h3Count: number;
  imagesTotal: number; imagesMissingAlt: { src: string; context: string }[];
  internalLinks: number; brokenLinks: { url: string; status: number }[];
  canonical: string | null; robots: string | null; robotsStatus: CheckStatus;
  viewport: string | null; wordCount: number; isThin: boolean;
  ogTitle: string | null; ogDescription: string | null; ogImage: string | null;
  schemaTypes: string[]; isHttps: boolean; hasHreflang: boolean;
  hasDuplicateTitle?: boolean; hasDuplicateMeta?: boolean;
}
interface PageSpeed {
  mobileScore: number; desktopScore: number;
  fcp: number; lcp: number; cls: number; tbt: number;
  fcpDisplay: string; lcpDisplay: string; clsDisplay: string; tbtDisplay: string;
  opportunities: { title: string; description: string }[];
}
interface SiteAudit {
  siteUrl: string; name: string; score: number; pagesAudited: number;
  hasSitemap: boolean; sitemapUrl: string | null; hasRobotsTxt: boolean;
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
    httpsIssues: string[]; canonicalIssues: string[]; noindex: string[];
  };
  generatedAt: string;
}

const G = (s: number) => s >= 90 ? 'A+' : s >= 80 ? 'A' : s >= 70 ? 'B' : s >= 55 ? 'C' : s >= 40 ? 'D' : 'F';
const SC = (s: number) => s >= 70 ? '#15803d' : s >= 40 ? '#b45309' : '#b91c1c';
const SL = (s: number) => s >= 70 ? 'Good SEO health. A few improvements could make it great.' : s >= 40 ? 'Moderate. Several issues need attention.' : 'Significant issues found. Action required to rank well.';
const B = (st: CheckStatus) => ({ good: { bg: '#dcfce7', c: '#15803d', t: 'GOOD' }, warning: { bg: '#fef9c3', c: '#a16207', t: 'WARNING' }, error: { bg: '#fee2e2', c: '#b91c1c', t: 'FIX NEEDED' } }[st]);
const IC = (st: CheckStatus) => ({ good: '✓', warning: '!', error: '✗' }[st]);
const PC = (s: number) => s >= 90 ? '#15803d' : s >= 50 ? '#b45309' : '#b91c1c';
const SU = (u: string) => { try { const p = new URL(u); return (p.pathname === '/' ? p.hostname : p.hostname + p.pathname).slice(0, 42); } catch { return u.slice(0, 42); } };

if (typeof window !== 'undefined') {
  const rh = () => { if (window.parent !== window) window.parent.postMessage({ type: 'nw-seo-height', height: document.body.scrollHeight }, '*'); };
  window.addEventListener('load', () => setTimeout(rh, 400));
  if (typeof MutationObserver !== 'undefined') new MutationObserver(() => setTimeout(rh, 200)).observe(document.documentElement, { childList: true, subtree: true });
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SiteAudit | null>(null);
  const [ps, setPs] = useState<PageSpeed | null>(null);
  const [psLoading, setPsLoading] = useState(false);

  useEffect(() => {
    if (!result) return;
    setPsLoading(true);
    fetch(`/api/pagespeed?url=${encodeURIComponent(result.siteUrl)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setPs(d); })
      .catch(() => {})
      .finally(() => setPsLoading(false));
  }, [result]);

  const submit = async () => {
    if (!url || !name || !email) { setError('Please fill in all fields.'); return; }
    setError(null); setLoading(true); setResult(null); setPs(null);
    const msgs = ['Fetching your homepage...', 'Checking sitemap & robots.txt...', 'Crawling internal pages...', 'Checking for broken links...', 'Detecting duplicate content...', 'Building your report...'];
    let i = 0; setLoadingMsg(msgs[0]);
    const iv = setInterval(() => { i = Math.min(i + 1, msgs.length - 1); setLoadingMsg(msgs[i]); }, 3500);
    try {
      const res = await fetch('/api/audit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url, name, email }) });
      const data = await res.json();
      if (!res.ok) setError(data.error || 'Something went wrong.');
      else setResult(data);
    } catch { setError('Network error. Please check your connection.'); }
    finally { clearInterval(iv); setLoading(false); setLoadingMsg(''); }
  };

  const home = result?.pages[0];

  return (
    <>
      <Head>
        <title>Next Wave SEO Audit Tool</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Fraunces:wght@300;400;600&display=swap" rel="stylesheet" />
        <style>{`
          *{box-sizing:border-box;margin:0;padding:0}
          body{font-family:'Plus Jakarta Sans',sans-serif;background:#f7f6f2;color:#1a1a1a;font-size:14px;line-height:1.5}
          input,button{font-family:inherit}
          input:focus{outline:2px solid #e8693a;outline-offset:-2px;border-color:#e8693a!important}
          @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
          @keyframes spin{to{transform:rotate(360deg)}}
          @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
          .fade{animation:fadeUp .4s ease forwards}
          .card{background:#fff;border-radius:14px;border:1px solid #e8e4dc;margin-bottom:14px;overflow:hidden}
          .ch{padding:13px 20px;border-bottom:1px solid #f0ece5;background:#faf9f6;display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
          .row{padding:13px 20px;border-bottom:1px solid #f5f2ec;display:flex;align-items:flex-start;gap:10}
          .row:last-child{border-bottom:none}
          .row:hover{background:#faf9f6}
          .badge{display:inline-block;font-size:9px;font-weight:700;letter-spacing:.1em;padding:2px 7px;border-radius:99px;text-transform:uppercase;white-space:nowrap}
          .fix{background:#fef6f2;border-left:3px solid #e8693a;border-radius:0 6px 6px 0;padding:10px 12px;margin-top:8px}
          .fix-t{font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#e8693a;margin-bottom:4px}
          .tag{display:inline-block;background:#f0ece5;color:#444;font-size:10px;padding:2px 8px;border-radius:4px;margin:2px 2px 2px 0;font-family:monospace;word-break:break-all}
          .chip{display:inline-block;background:#f0ece5;color:#555;font-size:11px;padding:2px 8px;border-radius:4px;font-family:monospace;word-break:break-all;max-width:100%}
          .sbtn{width:100%;padding:13px;background:#e8693a;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;transition:background .15s}
          .sbtn:hover:not(:disabled){background:#c95a2a}
          .sbtn:disabled{background:#bbb;cursor:not-allowed}
          .pbtn{padding:9px 16px;background:#fff;border:1.5px solid #e0dcd5;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;color:#555;transition:background .15s}
          .pbtn:hover{background:#f5f2ec}
          table{width:100%;border-collapse:collapse;font-size:12px}
          th{text-align:left;padding:7px 12px;background:#faf9f6;color:#888;font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;border-bottom:1px solid #ede9e1}
          td{padding:9px 12px;border-bottom:1px solid #f5f2ec;vertical-align:top}
          tr:last-child td{border-bottom:none}
          tr:hover td{background:#faf9f6}
          .st{font-family:'Fraunces',serif;font-size:15px;font-weight:400;color:#111}
          .ss{font-size:11px;color:#999;margin-left:8px}
          .ic{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0;margin-top:1px}
          @media(max-width:600px){.sf{flex-direction:column!important;gap:16px!important}.cg{grid-template-columns:1fr 1fr!important}}

          /* ── PRINT / PDF STYLES ── */
          @media print{
            @page{size:A4;margin:18mm 14mm}
            *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
            body{background:#fff!important;font-size:11px;color:#111}
            .np{display:none!important}
            .nw-header{display:flex!important;align-items:center;justify-content:space-between;padding:0 0 12px;border-bottom:2px solid #e8693a;margin-bottom:16px}
            .nw-logo{font-size:13px;font-weight:700;letter-spacing:.08em;color:#111;text-transform:uppercase}
            .nw-logo span{color:#e8693a}
            .nw-meta{font-size:10px;color:#888}
            .card{border-radius:8px!important;margin-bottom:10px!important;break-inside:avoid;border:1px solid #ddd!important}
            .ch{padding:9px 14px!important;background:#f7f6f2!important}
            .row{padding:9px 14px!important}
            .row:hover{background:#fff!important}
            table{font-size:10px}
            th{padding:5px 10px!important;font-size:8px!important}
            td{padding:7px 10px!important}
            .fix{padding:8px 10px!important;margin-top:6px!important}
            .fix-t{font-size:8px!important}
            .fix div{font-size:10px!important}
            .score-dark{background:#1a1a1a!important;border-radius:10px!important;padding:18px 20px!important;margin-bottom:10px;break-inside:avoid}
            .ps-section{break-inside:avoid}
            .cta-section{display:none!important}
            h1.report-title{font-size:22px!important}
            .tag{font-size:9px!important}
            .chip{font-size:9px!important}
            .badge{font-size:8px!important}
          }
        `}</style>
      </Head>
      <div style={{ minHeight: '100vh', background: '#f7f6f2' }}>

        {/* Screen top bar */}
        <div className="np" style={{ background: '#111', padding: '0 24px', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase' }}>Next Wave <span style={{ color: '#e8693a', margin: '0 5px' }}>|</span> SEO Audit</span>
          <a href="https://www.nextwave.nz" target="_blank" rel="noopener noreferrer" style={{ color: '#666', fontSize: 11, textDecoration: 'none', letterSpacing: '.06em', textTransform: 'uppercase' }}>nextwave.nz</a>
        </div>

        {/* Print-only header (hidden on screen) */}
        {result && (
          <div className="nw-header" style={{ display: 'none' }}>
            <div className="nw-logo">Next Wave <span>|</span> SEO Audit Report</div>
            <div className="nw-meta">{result.siteUrl} &nbsp;·&nbsp; {new Date(result.generatedAt).toLocaleDateString('en-NZ')} &nbsp;·&nbsp; Prepared for {result.name}</div>
          </div>
        )}

        <main style={{ maxWidth: 860, margin: '0 auto', padding: '36px 16px 80px' }}>

          {/* ── FORM ── */}
          {!result && (
            <div className="fade">
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <span style={{ display: 'inline-block', background: '#e8693a', color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: '.14em', padding: '4px 12px', borderRadius: 99, marginBottom: 14, textTransform: 'uppercase' }}>Free Tool</span>
                <h1 style={{ fontFamily: 'Fraunces,serif', fontSize: 'clamp(26px,5vw,44px)', fontWeight: 300, lineHeight: 1.15, color: '#111', marginBottom: 10 }}>Website SEO Audit</h1>
                <p style={{ color: '#666', fontSize: 14, maxWidth: 440, margin: '0 auto', lineHeight: 1.8, fontWeight: 300 }}>Comprehensive SEO analysis — crawls up to 10 pages, checks PageSpeed, broken links, duplicate content and more.</p>
              </div>
              <div className="card" style={{ padding: '28px 24px 24px' }}>
                <h2 style={{ fontFamily: 'Fraunces,serif', fontSize: 18, fontWeight: 400, marginBottom: 20, color: '#111' }}>Start Your Free Audit</h2>
                {[
                  { label: 'Website URL', ph: 'https://yourbusiness.co.nz', val: url, set: setUrl, type: 'text' },
                  { label: 'Your Name', ph: 'Jane Smith', val: name, set: setName, type: 'text' },
                  { label: 'Email Address', ph: 'jane@yourbusiness.co.nz', val: email, set: setEmail, type: 'email' },
                ].map(f => (
                  <div key={f.label} style={{ marginBottom: 13 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 5, letterSpacing: '.06em', textTransform: 'uppercase' }}>{f.label} <span style={{ color: '#e8693a' }}>*</span></label>
                    <input type={f.type} placeholder={f.ph} value={f.val} onChange={e => f.set(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} style={{ width: '100%', padding: '11px 13px', border: '1.5px solid #e5e0d8', borderRadius: 8, fontSize: 14, color: '#111', background: '#fdfcfb' }} />
                  </div>
                ))}
                {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 13px', color: '#b91c1c', marginBottom: 13, fontSize: 13, fontWeight: 500 }}>{error}</div>}
                <button className="sbtn" onClick={submit} disabled={loading}>
                  {loading
                    ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,.35)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />{loadingMsg}</span>
                    : 'Start Free Audit'}
                </button>
                <p style={{ fontSize: 11, color: '#aaa', marginTop: 10, textAlign: 'center' }}>Crawls up to 10 pages. Takes 20–40 seconds. Your report will be emailed to you.</p>
              </div>
              <div className="cg" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 12 }}>
                {[['📄','Page-by-Page','Title, meta, H1 on every page crawled'],['⚡','PageSpeed','Core Web Vitals mobile & desktop'],['🔗','Broken Links','Detects 404 and dead links'],['📋','Schema Detail','Lists all structured data found']].map(([ic,t,d]) => (
                  <div key={t} style={{ background: '#fff', borderRadius: 10, padding: '14px 12px', border: '1px solid #e8e4dc', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, marginBottom: 5 }}>{ic}</div>
                    <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 3 }}>{t}</div>
                    <div style={{ fontSize: 10, color: '#999', lineHeight: 1.6 }}>{d}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── REPORT ── */}
          {result && (
            <div className="fade">
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <span style={{ display: 'inline-block', background: '#e8693a', color: '#fff', fontSize: 9, fontWeight: 700, letterSpacing: '.14em', padding: '3px 10px', borderRadius: 99, marginBottom: 10, textTransform: 'uppercase' }}>Audit Complete</span>
                  <h1 className="report-title" style={{ fontFamily: 'Fraunces,serif', fontSize: 'clamp(18px,3vw,28px)', fontWeight: 400, color: '#111', marginBottom: 5 }}>SEO Audit Report</h1>
                  <p style={{ color: '#777', fontSize: 12, lineHeight: 1.7 }}><strong style={{ color: '#111' }}>{result.siteUrl}</strong><br />{result.pagesAudited} pages audited &middot; {new Date(result.generatedAt).toLocaleString('en-NZ')} &middot; For {result.name}</p>
                </div>
                <div className="np" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="pbtn" onClick={() => window.print()}>🖨 Print / Save PDF</button>
                  <button className="pbtn" onClick={() => { setResult(null); setPs(null); setUrl(''); setName(''); setEmail(''); }}>New Audit</button>
                </div>
              </div>

              {/* Score card */}
              <div className="card score-dark" style={{ background: '#111' }}>
                <div style={{ padding: '24px 24px' }}>
                  <div className="sf" style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center', minWidth: 90 }}>
                      <div style={{ fontFamily: 'Fraunces,serif', fontSize: 68, fontWeight: 300, color: SC(result.score), lineHeight: 1 }}>{G(result.score)}</div>
                      <div style={{ fontSize: 10, color: '#555', letterSpacing: '.1em', textTransform: 'uppercase', marginTop: 2 }}>{result.score}/100</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ fontSize: 13, color: '#bbb', marginBottom: 10, fontWeight: 300, lineHeight: 1.6 }}>{SL(result.score)}</div>
                      <div style={{ height: 5, background: '#222', borderRadius: 99, overflow: 'hidden', marginBottom: 14 }}>
                        <div style={{ height: '100%', width: result.score + '%', background: SC(result.score), borderRadius: 99 }} />
                      </div>
                      <div className="cg" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
                        {[
                          { l: 'Pages', v: result.pagesAudited, c: '#888' },
                          { l: 'Issues', v: result.summary.titleIssues.length + result.summary.metaDescIssues.length + result.summary.h1Issues.length + result.summary.brokenLinks.length, c: '#dc2626' },
                          { l: 'Missing Alt', v: result.summary.missingAltImages.length, c: '#b45309' },
                          { l: 'Thin Pages', v: result.summary.thinPages.length, c: '#b45309' },
                        ].map(s => (
                          <div key={s.l} style={{ background: '#1c1c1c', borderRadius: 8, padding: '10px 6px', textAlign: 'center' }}>
                            <div style={{ fontFamily: 'Fraunces,serif', fontSize: 24, fontWeight: 300, color: s.c, lineHeight: 1 }}>{s.v}</div>
                            <div style={{ fontSize: 9, color: '#555', letterSpacing: '.07em', textTransform: 'uppercase', marginTop: 2 }}>{s.l}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PageSpeed — loads after main audit */}
              <div className="card ps-section">
                <div className="ch">
                  <span className="st">Page Speed & Core Web Vitals</span>
                  {psLoading && <span style={{ fontSize: 11, color: '#aaa', animation: 'pulse 1.2s ease infinite' }}>Running PageSpeed analysis...</span>}
                  {!psLoading && !ps && !psLoading && <span style={{ fontSize: 11, color: '#aaa' }}>Homepage analysis</span>}
                  {ps && <span className="badge" style={{ background: ps.mobileScore >= 70 ? '#dcfce7' : ps.mobileScore >= 50 ? '#fef9c3' : '#fee2e2', color: ps.mobileScore >= 70 ? '#15803d' : ps.mobileScore >= 50 ? '#a16207' : '#b91c1c' }}>Mobile: {ps.mobileScore}/100</span>}
                </div>
                {psLoading && (
                  <div style={{ padding: '24px', textAlign: 'center' }}>
                    <span style={{ width: 20, height: 20, border: '2px solid #e8e4dc', borderTopColor: '#e8693a', borderRadius: '50%', display: 'inline-block', animation: 'spin .8s linear infinite' }} />
                    <p style={{ marginTop: 10, color: '#aaa', fontSize: 12 }}>Analysing page speed... this takes 15-30 seconds</p>
                  </div>
                )}
                {!psLoading && !ps && (
                  <div style={{ padding: '16px 20px', color: '#aaa', fontSize: 12 }}>PageSpeed data unavailable for this site.</div>
                )}
                {ps && (
                  <div style={{ padding: '16px 20px' }}>
                    {/* Score bars */}
                    <div className="cg" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                      {[{ l: 'Mobile Score', v: ps.mobileScore }, { l: 'Desktop Score', v: ps.desktopScore }].map(s => (
                        <div key={s.l} style={{ background: '#f7f6f2', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
                          <div style={{ fontSize: 10, color: '#888', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 6 }}>{s.l}</div>
                          <div style={{ fontFamily: 'Fraunces,serif', fontSize: 40, fontWeight: 300, color: PC(s.v), lineHeight: 1 }}>{s.v}</div>
                          <div style={{ height: 5, background: '#e8e4dc', borderRadius: 99, overflow: 'hidden', margin: '8px 0 4px' }}>
                            <div style={{ height: '100%', width: s.v + '%', background: PC(s.v), borderRadius: 99 }} />
                          </div>
                          <div style={{ fontSize: 10, color: '#aaa' }}>{s.v >= 90 ? 'Fast' : s.v >= 50 ? 'Needs improvement' : 'Slow'}</div>
                        </div>
                      ))}
                    </div>
                    {/* Core Web Vitals */}
                    <div style={{ marginBottom: 8, fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#888' }}>Core Web Vitals</div>
                    <div className="cg" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: ps.opportunities.length > 0 ? 16 : 0 }}>
                      {[
                        { l: 'FCP', v: ps.fcpDisplay || `${(ps.fcp/1000).toFixed(1)}s`, ok: ps.fcp < 1800, desc: 'First Contentful Paint', good: '< 1.8s' },
                        { l: 'LCP', v: ps.lcpDisplay || `${(ps.lcp/1000).toFixed(1)}s`, ok: ps.lcp < 2500, desc: 'Largest Contentful Paint', good: '< 2.5s' },
                        { l: 'TBT', v: ps.tbtDisplay || `${Math.round(ps.tbt)}ms`, ok: ps.tbt < 200, desc: 'Total Blocking Time', good: '< 200ms' },
                        { l: 'CLS', v: ps.clsDisplay || ps.cls.toFixed(3), ok: ps.cls < 0.1, desc: 'Cumulative Layout Shift', good: '< 0.1' },
                      ].map(m => (
                        <div key={m.l} style={{ background: '#f7f6f2', borderRadius: 8, padding: '12px 8px', textAlign: 'center' }}>
                          <div style={{ fontSize: 9, color: '#aaa', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>{m.l}</div>
                          <div style={{ fontSize: 20, fontWeight: 700, color: m.ok ? '#15803d' : '#b91c1c', marginBottom: 2 }}>{m.v}</div>
                          <div style={{ fontSize: 9, color: '#aaa', marginBottom: 2 }}>{m.desc}</div>
                          <div style={{ fontSize: 9, color: '#ccc' }}>Good: {m.good}</div>
                        </div>
                      ))}
                    </div>
                    {/* Opportunities */}
                    {ps.opportunities.length > 0 && (
                      <>
                        <div style={{ marginBottom: 8, fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#888' }}>Top Opportunities to Improve Speed</div>
                        {ps.opportunities.map((o, i) => (
                          <div key={i} style={{ padding: '10px 12px', background: '#fef6f2', borderLeft: '3px solid #e8693a', borderRadius: '0 6px 6px 0', marginBottom: 6 }}>
                            <div style={{ fontWeight: 600, fontSize: 12, color: '#111', marginBottom: 2 }}>{o.title}</div>
                            <div style={{ fontSize: 11, color: '#666' }}>{o.description}</div>
                          </div>
                        ))}
                      </>
                    )}
                    {ps.mobileScore < 70 && (
                      <div className="fix" style={{ marginTop: 12 }}>
                        <div className="fix-t">How to Improve Speed</div>
                        <div style={{ fontSize: 12, color: '#555', lineHeight: 1.75 }}>Compress images and convert to WebP. Remove unused CSS/JS plugins. Enable lazy loading for images. In Webflow: Site Settings → Asset Optimisation → enable Minify CSS/JS. Use a CDN. Reduce third-party scripts (chat widgets, analytics).</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Site-wide checks */}
              <div className="card">
                <div className="ch"><span className="st">Site-Wide Technical Checks</span></div>
                {[
                  { l: 'Sitemap', st: result.hasSitemap ? 'good' : 'error' as CheckStatus, d: result.hasSitemap ? `Found: ${result.sitemapUrl}` : 'No sitemap.xml found', fix: !result.hasSitemap ? 'Webflow: Site Settings → SEO → enable sitemap. Submit to Google Search Console after publishing.' : undefined },
                  { l: 'robots.txt', st: result.hasRobotsTxt ? 'good' : 'warning' as CheckStatus, d: result.hasRobotsTxt ? 'robots.txt found' : 'No robots.txt found', fix: !result.hasRobotsTxt ? 'Webflow: Site Settings → SEO → robots.txt. Add User-agent: * / Allow: / and include your sitemap URL.' : undefined },
                  { l: 'HTTPS', st: (home?.isHttps ? 'good' : 'error') as CheckStatus, d: home?.isHttps ? 'Secure HTTPS detected' : 'Site not using HTTPS!', fix: !home?.isHttps ? 'Enable SSL on your hosting. Webflow includes free SSL automatically via Cloudflare.' : undefined },
                  { l: 'Noindex Pages', st: result.summary.noindex.length === 0 ? 'good' : 'error' as CheckStatus, d: result.summary.noindex.length === 0 ? 'No pages accidentally blocked from Google' : `${result.summary.noindex.length} page(s) set to noindex!`, fix: result.summary.noindex.length > 0 ? `URGENT: These pages will not appear in Google: ${result.summary.noindex.slice(0,3).join(', ')}. Remove noindex in Page Settings → SEO.` : undefined },
                  { l: 'Duplicate Titles', st: result.summary.duplicateTitles.length === 0 ? 'good' : 'warning' as CheckStatus, d: result.summary.duplicateTitles.length === 0 ? 'All page titles are unique' : `${result.summary.duplicateTitles.length} duplicate title(s) found`, fix: result.summary.duplicateTitles.length > 0 ? 'Each page must have a unique title. Identical titles confuse Google about which page to rank for a keyword.' : undefined },
                  { l: 'Broken Links', st: result.summary.brokenLinks.length === 0 ? 'good' : 'error' as CheckStatus, d: result.summary.brokenLinks.length === 0 ? 'No broken links detected' : `${result.summary.brokenLinks.length} broken link(s) found`, fix: result.summary.brokenLinks.length > 0 ? 'Fix or remove broken links. They hurt user experience and waste Google crawl budget.' : undefined },
                ].map((item, i) => {
                  const b = B(item.st);
                  return (
                    <div key={i} className="row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className="ic" style={{ background: b.bg, color: b.c }}>{IC(item.st)}</span>
                        <span style={{ fontWeight: 600, fontSize: 13, color: '#111', flex: 1 }}>{item.l}</span>
                        <span className="badge" style={{ background: b.bg, color: b.c }}>{b.t}</span>
                      </div>
                      <div style={{ paddingLeft: 30, marginTop: 3, fontSize: 12, color: '#777' }}>{item.d}</div>
                      {item.fix && <div className="fix" style={{ marginLeft: 30, marginTop: 6 }}><div className="fix-t">How to Fix</div><div style={{ fontSize: 12, color: '#555', lineHeight: 1.7 }}>{item.fix}</div></div>}
                    </div>
                  );
                })}
              </div>

              {/* Title issues */}
              {result.summary.titleIssues.length > 0 && (
                <div className="card">
                  <div className="ch"><div><span className="st">Title Tag Issues</span><span className="ss">{result.summary.titleIssues.length} page(s)</span></div><span className="badge" style={{ background: '#fee2e2', color: '#b91c1c' }}>Fix Needed</span></div>
                  <table><thead><tr><th>Page</th><th>Title Found</th><th>Chars</th><th>Issue</th></tr></thead>
                    <tbody>{result.summary.titleIssues.map((t, i) => (
                      <tr key={i}><td><span className="chip">{SU(t.url)}</span></td>
                        <td style={{ color: '#555', maxWidth: 200 }}>{t.title ? `"${t.title.slice(0,55)}${t.title.length>55?'...':''}"` : <em style={{ color: '#b91c1c' }}>Missing</em>}</td>
                        <td style={{ fontWeight: 600, color: t.length===0?'#b91c1c':'#b45309', whiteSpace:'nowrap' }}>{t.length}</td>
                        <td style={{ color: '#555', fontSize: 11 }}>{t.issue}</td>
                      </tr>))}
                    </tbody>
                  </table>
                  {result.summary.duplicateTitles.length > 0 && (
                    <div style={{ padding: '12px 16px', borderTop: '1px solid #f0ece5', background: '#fffbf5' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#b45309', marginBottom: 6, letterSpacing: '.06em', textTransform: 'uppercase' }}>Duplicate Titles Found</div>
                      {result.summary.duplicateTitles.map((d, i) => (
                        <div key={i} style={{ marginBottom: 8 }}>
                          <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>"{d.title.slice(0,70)}" used on:</div>
                          {d.urls.map((u, j) => <span key={j} className="chip" style={{ display: 'inline-block', marginRight: 4, marginBottom: 3 }}>{SU(u)}</span>)}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="fix" style={{ margin: '0 16px 14px' }}><div className="fix-t">How to Fix</div><div style={{ fontSize: 12, color: '#555', lineHeight: 1.75 }}>Webflow: <strong>Page Settings → SEO → Title</strong>. Write 50-60 characters. Include your primary keyword near the start. Every page must have a unique title.</div></div>
                </div>
              )}

              {/* Meta desc issues */}
              {result.summary.metaDescIssues.length > 0 && (
                <div className="card">
                  <div className="ch"><div><span className="st">Meta Description Issues</span><span className="ss">{result.summary.metaDescIssues.length} page(s)</span></div><span className="badge" style={{ background: '#fee2e2', color: '#b91c1c' }}>Fix Needed</span></div>
                  <table><thead><tr><th>Page</th><th>Description Found</th><th>Chars</th><th>Issue</th></tr></thead>
                    <tbody>{result.summary.metaDescIssues.map((m, i) => (
                      <tr key={i}><td><span className="chip">{SU(m.url)}</span></td>
                        <td style={{ color: '#555', maxWidth: 220 }}>{m.desc ? `"${m.desc.slice(0,80)}${m.desc.length>80?'...':''}"` : <em style={{ color: '#b91c1c' }}>Missing</em>}</td>
                        <td style={{ fontWeight: 600, color: m.length===0?'#b91c1c':'#b45309', whiteSpace:'nowrap' }}>{m.length}</td>
                        <td style={{ color: '#555', fontSize: 11 }}>{m.issue}</td>
                      </tr>))}
                    </tbody>
                  </table>
                  <div className="fix" style={{ margin: '0 16px 14px' }}><div className="fix-t">How to Fix</div><div style={{ fontSize: 12, color: '#555', lineHeight: 1.75 }}>Webflow: <strong>Page Settings → SEO → Description</strong>. Aim for 140-160 characters. Write a compelling summary including your keyword and a call to action. Each page needs a unique meta description.</div></div>
                </div>
              )}

              {/* H1 issues */}
              {result.summary.h1Issues.length > 0 && (
                <div className="card">
                  <div className="ch"><div><span className="st">H1 Heading Issues</span><span className="ss">{result.summary.h1Issues.length} page(s)</span></div><span className="badge" style={{ background: '#fee2e2', color: '#b91c1c' }}>Fix Needed</span></div>
                  <table><thead><tr><th>Page</th><th>H1 Tags Found</th><th>Issue</th></tr></thead>
                    <tbody>{result.summary.h1Issues.map((h, i) => (
                      <tr key={i}><td><span className="chip">{SU(h.url)}</span></td>
                        <td style={{ maxWidth: 250 }}>{h.h1s.length===0 ? <em style={{ color:'#b91c1c' }}>None found</em> : h.h1s.map((t,j)=><div key={j}><span className="tag">{t.slice(0,65)}</span></div>)}</td>
                        <td style={{ color: '#555', fontSize: 11 }}>{h.issue}</td>
                      </tr>))}
                    </tbody>
                  </table>
                  <div className="fix" style={{ margin: '0 16px 14px' }}><div className="fix-t">How to Fix</div><div style={{ fontSize: 12, color: '#555', lineHeight: 1.75 }}>Every page needs exactly <strong>one H1 tag</strong>. In Webflow: select heading → Style panel → set Tag to H1. Include your primary keyword. If you have two H1 tags, change the decorative/secondary one to H2.</div></div>
                </div>
              )}

              {/* Missing alt */}
              {result.summary.missingAltImages.length > 0 && (
                <div className="card">
                  <div className="ch"><div><span className="st">Images Missing Alt Text</span><span className="ss">{result.summary.missingAltImages.length} image(s)</span></div><span className="badge" style={{ background: '#fef9c3', color: '#a16207' }}>Warning</span></div>
                  <table><thead><tr><th>Page</th><th>Image URL</th><th>Nearby Text</th></tr></thead>
                    <tbody>{result.summary.missingAltImages.map((img, i) => (
                      <tr key={i}><td style={{ whiteSpace:'nowrap' }}><span className="chip">{SU(img.pageUrl)}</span></td>
                        <td><span className="tag" style={{ whiteSpace:'normal' }}>{img.imgSrc}</span></td>
                        <td style={{ color:'#888', fontSize:11 }}>{img.context||'—'}</td>
                      </tr>))}
                    </tbody>
                  </table>
                  <div className="fix" style={{ margin: '0 16px 14px' }}><div className="fix-t">How to Fix</div><div style={{ fontSize: 12, color: '#555', lineHeight: 1.75 }}>Webflow: click image → gear icon → <strong>Alt Text</strong>. Write a natural description: e.g. "Next Wave digital marketing team in Hamilton office". Avoid keyword stuffing. Every meaningful image needs alt text.</div></div>
                </div>
              )}

              {/* Broken links */}
              {result.summary.brokenLinks.length > 0 && (
                <div className="card">
                  <div className="ch"><div><span className="st">Broken Links</span><span className="ss">{result.summary.brokenLinks.length} found</span></div><span className="badge" style={{ background: '#fee2e2', color: '#b91c1c' }}>Fix Needed</span></div>
                  <table><thead><tr><th>Found On</th><th>Broken URL</th><th>Status</th></tr></thead>
                    <tbody>{result.summary.brokenLinks.map((l, i) => (
                      <tr key={i}><td><span className="chip">{SU(l.pageUrl)}</span></td>
                        <td><span className="tag" style={{ whiteSpace:'normal' }}>{l.linkUrl}</span></td>
                        <td><span className="badge" style={{ background:'#fee2e2', color:'#b91c1c' }}>{l.status}</span></td>
                      </tr>))}
                    </tbody>
                  </table>
                  <div className="fix" style={{ margin: '0 16px 14px' }}><div className="fix-t">How to Fix</div><div style={{ fontSize: 12, color: '#555', lineHeight: 1.75 }}>Find each broken link in Webflow and update or remove it. Regularly check Google Search Console → Coverage for crawl errors.</div></div>
                </div>
              )}

              {/* Thin content */}
              {result.summary.thinPages.length > 0 && (
                <div className="card">
                  <div className="ch"><div><span className="st">Thin Content Pages</span><span className="ss">Under 300 words</span></div><span className="badge" style={{ background: '#fef9c3', color: '#a16207' }}>Warning</span></div>
                  <table><thead><tr><th>Page</th><th>Word Count</th><th>Recommendation</th></tr></thead>
                    <tbody>{result.summary.thinPages.map((p, i) => (
                      <tr key={i}><td><span className="chip">{SU(p.url)}</span></td>
                        <td style={{ fontWeight:600, color:'#b45309' }}>{p.wordCount} words</td>
                        <td style={{ fontSize:11, color:'#555' }}>Add more content — aim for 300+ words minimum</td>
                      </tr>))}
                    </tbody>
                  </table>
                  <div className="fix" style={{ margin: '0 16px 14px' }}><div className="fix-t">How to Fix</div><div style={{ fontSize: 12, color: '#555', lineHeight: 1.75 }}>Pages under 300 words tend to rank poorly. Add service descriptions, FAQs, testimonials, location content, or case studies to each thin page.</div></div>
                </div>
              )}

              {/* Schema */}
              <div className="card">
                <div className="ch"><span className="st">Schema / Structured Data</span>{result.summary.schemaFound.length > 0 ? <span className="badge" style={{ background:'#dcfce7', color:'#15803d' }}>Detected</span> : <span className="badge" style={{ background:'#fef9c3', color:'#a16207' }}>Not Found</span>}</div>
                {result.summary.schemaFound.length > 0
                  ? <table><thead><tr><th>Page</th><th>Schema Types Found</th></tr></thead><tbody>{result.summary.schemaFound.map((s,i)=><tr key={i}><td><span className="chip">{SU(s.url)}</span></td><td>{s.types.map((t,j)=><span key={j} className="tag">{t}</span>)}</td></tr>)}</tbody></table>
                  : <div style={{ padding:'14px 20px', color:'#777', fontSize:13 }}>No structured data found on any crawled page.</div>
                }
                <div className="fix" style={{ margin:'0 16px 14px' }}><div className="fix-t">{result.summary.schemaFound.length>0?'Recommended Schema to Add':'How to Add Schema'}</div><div style={{ fontSize:12, color:'#555', lineHeight:1.75 }}>{result.summary.schemaFound.length>0?'Consider adding: LocalBusiness (address, phone, opening hours), FAQPage, BreadcrumbList, Review. Validate at search.google.com/test/rich-results.':'Webflow: Page Settings → Custom Code → Head. Add JSON-LD LocalBusiness or Organization schema. Visit schema.org for templates.'}</div></div>
              </div>

              {/* Pages table */}
              <div className="card">
                <div className="ch"><span className="st">All Pages Crawled ({result.pagesAudited})</span></div>
                <table><thead><tr><th>URL</th><th>Title</th><th>Meta Desc</th><th>H1</th><th>Words</th><th>Images</th><th>Schema</th></tr></thead>
                  <tbody>{result.pages.map((p, i) => {
                    const tb=B(p.titleStatus),mb=B(p.metaDescStatus),hb=B(p.h1Status);
                    return <tr key={i}>
                      <td><span className="chip">{SU(p.url)}</span></td>
                      <td><span className="badge" style={{ background:tb.bg, color:tb.c }}>{p.titleLength>0?p.titleLength+'ch':'Missing'}</span></td>
                      <td><span className="badge" style={{ background:mb.bg, color:mb.c }}>{p.metaDescLength>0?p.metaDescLength+'ch':'Missing'}</span></td>
                      <td><span className="badge" style={{ background:hb.bg, color:hb.c }}>{p.h1Tags.length===0?'None':p.h1Tags.length}</span></td>
                      <td style={{ color:p.isThin?'#b45309':'#15803d', fontWeight:500 }}>{p.wordCount}</td>
                      <td style={{ color:p.imagesMissingAlt.length>0?'#b45309':'#15803d', fontSize:11 }}>{p.imagesMissingAlt.length>0?p.imagesMissingAlt.length+' missing':p.imagesTotal+' OK'}</td>
                      <td style={{ color:p.schemaTypes.length>0?'#15803d':'#aaa', fontSize:11 }}>{p.schemaTypes.length>0?p.schemaTypes.slice(0,2).join(', '):'None'}</td>
                    </tr>;
                  })}</tbody>
                </table>
              </div>

              {/* CTA */}
              <div className="cta-section" style={{ background:'#e8693a', borderRadius:14, padding:'28px 24px', color:'#fff', textAlign:'center' }}>
                <h2 style={{ fontFamily:'Fraunces,serif', fontSize:22, fontWeight:400, marginBottom:8 }}>Want us to fix these issues?</h2>
                <p style={{ color:'rgba(255,255,255,.88)', marginBottom:20, fontSize:13, fontWeight:300, lineHeight:1.8, maxWidth:420, margin:'0 auto 20px' }}>Next Wave specialises in SEO for New Zealand businesses. Book a free strategy call and we will walk you through exactly what needs to be done.</p>
                <a href="https://www.nextwave.nz/contact-us" style={{ display:'inline-block', background:'#111', color:'#fff', padding:'12px 24px', borderRadius:8, fontWeight:600, fontSize:13, textDecoration:'none' }}>Book a Free Strategy Call</a>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
