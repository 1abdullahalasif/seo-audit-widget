import { useState } from 'react';
import Head from 'next/head';

type CheckStatus = 'good' | 'warning' | 'error';

interface Check {
  status: CheckStatus;
  recommendation: string;
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
    good: { bg: '#d1fae5', color: '#065f46', label: 'GOOD' },
    warning: { bg: '#fef3c7', color: '#92400e', label: 'WARNING' },
    error: { bg: '#fee2e2', color: '#991b1b', label: 'ERROR' },
  };
  return map[status];
};

const statusIcon = (status: CheckStatus) =>
  ({ good: '\u2705', warning: '\u26a0\ufe0f', error: '\u274c' }[status]);

const scoreColor = (score: number) =>
  score >= 70 ? '#059669' : score >= 40 ? '#d97706' : '#dc2626';

const scoreLabel = (score: number) =>
  score >= 70
    ? 'Good SEO health! A few tweaks could make it great.'
    : score >= 40
    ? 'Moderate — several areas need improvement.'
    : 'Needs significant work. Let us fix this together!';

export default function Home() {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditResult | null>(null);

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

  const checkItems = result
    ? [
        { label: 'Title Tag', check: result.checks.title, detail: result.checks.title.value ? '"' + result.checks.title.value + '"' : 'Not found' },
        { label: 'Meta Description', check: result.checks.metaDescription, detail: result.checks.metaDescription.value ? result.checks.metaDescription.value.slice(0, 90) + '...' : 'Not found' },
        { label: 'H1 Heading', check: result.checks.h1, detail: result.checks.h1.count + ' found' + (result.checks.h1.values[0] ? ' — "' + result.checks.h1.values[0].slice(0, 50) + '"' : '') },
        { label: 'H2 Subheadings', check: result.checks.h2, detail: result.checks.h2.count + ' found' },
        { label: 'Image Alt Text', check: result.checks.images, detail: result.checks.images.missingAlt + ' missing of ' + result.checks.images.total + ' images' },
        { label: 'HTTPS Security', check: result.checks.httpsUsed, detail: result.checks.httpsUsed.value ? 'Secure HTTPS connection' : 'Not using HTTPS!' },
        { label: 'Mobile Viewport', check: result.checks.viewport, detail: result.checks.viewport.value || 'Not found' },
        { label: 'Canonical Tag', check: result.checks.canonical, detail: result.checks.canonical.value || 'Not found' },
        { label: 'Robots Meta', check: result.checks.robots, detail: result.checks.robots.value || 'Not set' },
        { label: 'Word Count', check: result.checks.wordCount, detail: result.checks.wordCount.count + ' words on page' },
        { label: 'Open Graph Tags', check: result.checks.ogTags, detail: result.checks.ogTags.title ? 'OG title, description and image set' : 'Missing OG tags' },
        { label: 'Schema Markup', check: result.checks.schemaMarkup, detail: result.checks.schemaMarkup.found ? 'Structured data found' : 'No structured data detected' },
      ]
    : [];

  const good = checkItems.filter((c) => c.check.status === 'good').length;
  const warn = checkItems.filter((c) => c.check.status === 'warning').length;
  const err = checkItems.filter((c) => c.check.status === 'error').length;

  return (
    <>
      <Head>
        <title>Next Wave SEO Audit Tool</title>
        <meta name="description" content="Free SEO audit tool by Next Wave, New Zealand AI-powered digital marketing agency." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap" rel="stylesheet" />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'DM Sans', sans-serif; background: #f5f4f0; }
          input:focus { outline: 2px solid #e8693a; outline-offset: -2px; border-color: #e8693a !important; }
          @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes spin { to { transform: rotate(360deg); } }
          .check-row { transition: background 0.15s; }
          .check-row:hover { background: #fafaf8 !important; }
          .cta-btn:hover { background: #c45a2a !important; transform: translateY(-1px); }
          .cta-btn { transition: all 0.2s; }
          .secondary-btn:hover { background: rgba(255,255,255,0.1) !important; }
          .secondary-btn { transition: background 0.2s; }
          .audit-btn:hover { background: #c45a2a !important; }
          .audit-btn { transition: background 0.2s; }
          @media (max-width: 600px) {
            .feature-grid { grid-template-columns: 1fr !important; }
            .score-summary { flex-direction: column !important; gap: 8px !important; }
          }
        `}</style>
      </Head>

      <div style={{ minHeight: '100vh', background: '#f5f4f0' }}>
        <header style={{ background: '#0f0e0c', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 15, color: '#fff', letterSpacing: '0.02em' }}>
            NEXT WAVE <span style={{ color: '#e8693a' }}>+</span> SEO AUDIT
          </span>
          <a href="https://www.nextwave.nz" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#94928e', textDecoration: 'none', fontWeight: 500, letterSpacing: '0.05em' }}>
            NEXTWAVE.NZ
          </a>
        </header>

        <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px 80px' }}>
          {!result ? (
            <div style={{ animation: 'fadeUp 0.5s ease forwards' }}>
              <div style={{ textAlign: 'center', marginBottom: 48 }}>
                <div style={{ display: 'inline-block', background: '#e8693a', color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', padding: '5px 14px', borderRadius: 99, marginBottom: 20 }}>
                  FREE TOOL
                </div>
                <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, lineHeight: 1.1, color: '#0f0e0c', marginBottom: 16 }}>
                  Comprehensive<br />SEO Analysis
                </h1>
                <p style={{ color: '#6b6963', fontSize: 16, maxWidth: 480, margin: '0 auto', lineHeight: 1.7, fontWeight: 300 }}>
                  Get a detailed analysis of your website SEO performance including meta tags, content structure, technical issues, and actionable recommendations.
                </p>
              </div>

              <div style={{ background: '#fff', borderRadius: 20, padding: '40px 40px 36px', boxShadow: '0 2px 20px rgba(0,0,0,0.06)', border: '1px solid #ece9e3' }}>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, marginBottom: 28, color: '#0f0e0c' }}>
                  Free SEO Audit Tool
                </h2>

                {[
                  { label: 'Website URL', placeholder: 'https://example.co.nz', value: url, setter: setUrl, type: 'text' },
                  { label: 'Your Name', placeholder: 'Jane Smith', value: name, setter: setName, type: 'text' },
                  { label: 'Email Address', placeholder: 'jane@example.co.nz', value: email, setter: setEmail, type: 'email' },
                ].map((field) => (
                  <div key={field.label} style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#3d3b37', marginBottom: 7, letterSpacing: '0.01em' }}>
                      {field.label} <span style={{ color: '#e8693a' }}>*</span>
                    </label>
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={field.value}
                      onChange={(e) => field.setter(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                      style={{ width: '100%', padding: '13px 16px', border: '1.5px solid #e5e2dc', borderRadius: 10, fontSize: 15, color: '#0f0e0c', background: '#fdfcfb', transition: 'border-color 0.2s' }}
                    />
                  </div>
                ))}

                {error && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', color: '#dc2626', marginBottom: 20, fontSize: 14 }}>
                    {error}
                  </div>
                )}

                <button
                  className="audit-btn"
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{ width: '100%', padding: '15px', background: loading ? '#b5b0a8' : '#e8693a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Syne, sans-serif', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                >
                  {loading ? (
                    <>
                      <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                      Analysing your website...
                    </>
                  ) : 'Start Free Audit'}
                </button>
              </div>

              <div className="feature-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 32 }}>
                {[
                  { icon: '\ud83d\udcca', title: 'Comprehensive Analysis', desc: 'Meta tags, headings, images, and all technical SEO elements' },
                  { icon: '\ud83d\udca1', title: 'Actionable Fixes', desc: 'Specific recommendations you can act on immediately' },
                  { icon: '\ud83d\ude80', title: 'Expert Insights', desc: 'Powered by Next Wave AI-driven SEO expertise' },
                ].map((f) => (
                  <div key={f.title} style={{ background: '#fff', borderRadius: 14, padding: '22px 20px', border: '1px solid #ece9e3', textAlign: 'center' }}>
                    <div style={{ fontSize: 26, marginBottom: 10 }}>{f.icon}</div>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 13, marginBottom: 6, color: '#0f0e0c' }}>{f.title}</div>
                    <div style={{ fontSize: 12, color: '#8a8680', lineHeight: 1.6 }}>{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ animation: 'fadeUp 0.5s ease forwards' }}>
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'inline-block', background: '#e8693a', color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', padding: '5px 14px', borderRadius: 99, marginBottom: 16 }}>
                  AUDIT COMPLETE
                </div>
                <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: '#0f0e0c', marginBottom: 8 }}>
                  Your SEO Report
                </h1>
                <p style={{ color: '#6b6963', fontSize: 14, fontWeight: 300 }}>
                  Analysis for <strong style={{ color: '#0f0e0c', fontWeight: 500 }}>{result.url}</strong>
                  {' — Generated '}{new Date(result.generatedAt).toLocaleString('en-NZ')}
                </p>
              </div>

              <div style={{ background: '#0f0e0c', borderRadius: 20, padding: '36px 40px', marginBottom: 20, color: '#fff', display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 80, fontWeight: 900, color: scoreColor(result.score), lineHeight: 1 }}>
                    {result.score}
                  </div>
                  <div style={{ fontSize: 12, color: '#94928e', letterSpacing: '0.08em', fontWeight: 500 }}>OUT OF 100</div>
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 16, color: '#f5f4f0' }}>
                    {scoreLabel(result.score)}
                  </div>
                  <div style={{ height: 8, background: '#2a2824', borderRadius: 99, overflow: 'hidden', marginBottom: 16 }}>
                    <div style={{ height: '100%', width: result.score + '%', background: scoreColor(result.score), borderRadius: 99 }} />
                  </div>
                  <div className="score-summary" style={{ display: 'flex', gap: 16 }}>
                    {[
                      { label: 'Passed', count: good, color: '#059669' },
                      { label: 'Warnings', count: warn, color: '#d97706' },
                      { label: 'Errors', count: err, color: '#dc2626' },
                    ].map((s) => (
                      <div key={s.label} style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, color: s.color }}>{s.count}</div>
                        <div style={{ fontSize: 11, color: '#94928e', letterSpacing: '0.06em' }}>{s.label.toUpperCase()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #ece9e3', overflow: 'hidden', marginBottom: 20 }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid #f0ede7' }}>
                  <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 700, color: '#0f0e0c' }}>
                    Detailed Checks ({checkItems.length})
                  </h2>
                </div>
                {checkItems.map((item, i) => {
                  const badge = statusBadge(item.check.status);
                  return (
                    <div key={item.label} className="check-row" style={{ padding: '20px 32px', borderBottom: i < checkItems.length - 1 ? '1px solid #f0ede7' : 'none', background: '#fff' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                        <span style={{ fontSize: 18, marginTop: 1, flexShrink: 0 }}>{statusIcon(item.check.status)}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5, flexWrap: 'wrap' }}>
                            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: '#0f0e0c' }}>{item.label}</span>
                            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', padding: '2px 8px', borderRadius: 99, background: badge.bg, color: badge.color }}>{badge.label}</span>
                          </div>
                          <div style={{ fontSize: 13, color: '#8a8680', marginBottom: 6, fontWeight: 300 }}>{item.detail}</div>
                          <div style={{ fontSize: 13, color: '#4a4643', lineHeight: 1.5 }}>{item.check.recommendation}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ background: '#e8693a', borderRadius: 20, padding: '36px 40px', color: '#fff', textAlign: 'center' }}>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, marginBottom: 10 }}>
                  Want us to fix these issues?
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.85)', marginBottom: 28, fontSize: 15, fontWeight: 300 }}>
                  Next Wave specialises in SEO for New Zealand businesses. Get your site ranking.
                </p>
                <a href="https://www.nextwave.nz" target="_blank" rel="noopener noreferrer" className="cta-btn" style={{ display: 'inline-block', background: '#0f0e0c', color: '#fff', padding: '14px 32px', borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: 'none', fontFamily: 'Syne, sans-serif' }}>
                  Book a Free Strategy Call
                </a>
                <div style={{ marginTop: 16 }}>
                  <button className="secondary-btn" onClick={() => { setResult(null); setUrl(''); setName(''); setEmail(''); }} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.8)', padding: '10px 24px', borderRadius: 10, cursor: 'pointer', fontSize: 13 }}>
                    Audit another website
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
