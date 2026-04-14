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

const statusIcon = (status: CheckStatus) => {
  if (status === 'good') return '✅';
  if (status === 'warning') return '⚠️';
  return '❌';
};

const statusColor = (status: CheckStatus) => {
  if (status === 'good') return '#16a34a';
  if (status === 'warning') return '#d97706';
  return '#dc2626';
};

const scoreColor = (score: number) => {
  if (score >= 70) return '#16a34a';
  if (score >= 40) return '#d97706';
  return '#dc2626';
};

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

  const checkItems = result ? [
    { label: 'Title Tag', check: result.checks.title, detail: result.checks.title.value ? `"${result.checks.title.value}"` : 'Not found' },
    { label: 'Meta Description', check: result.checks.metaDescription, detail: result.checks.metaDescription.value ? `${result.checks.metaDescription.value.slice(0, 80)}...` : 'Not found' },
    { label: 'H1 Heading', check: result.checks.h1, detail: `${result.checks.h1.count} found` },
    { label: 'H2 Headings', check: result.checks.h2, detail: `${result.checks.h2.count} found` },
    { label: 'Image Alt Text', check: result.checks.images, detail: `${result.checks.images.missingAlt} missing alt text of ${result.checks.images.total} images` },
    { label: 'HTTPS', check: result.checks.httpsUsed, detail: result.checks.httpsUsed.value ? 'Secure connection' : 'Not using HTTPS' },
    { label: 'Mobile Viewport', check: result.checks.viewport, detail: result.checks.viewport.value || 'Not found' },
    { label: 'Canonical Tag', check: result.checks.canonical, detail: result.checks.canonical.value || 'Not found' },
    { label: 'Robots Meta', check: result.checks.robots, detail: result.checks.robots.value || 'Not set' },
    { label: 'Word Count', check: result.checks.wordCount, detail: `${result.checks.wordCount.count} words` },
    { label: 'Open Graph Tags', check: result.checks.ogTags, detail: result.checks.ogTags.title ? 'OG tags found' : 'Missing OG tags' },
    { label: 'Schema Markup', check: result.checks.schemaMarkup, detail: result.checks.schemaMarkup.found ? 'Structured data found' : 'No structured data' },
  ] : [];

  return (
    <>
      <Head>
        <title>Next Wave SEO Audit Tool</title>
        <meta name="description" content="Free SEO audit tool by Next Wave — New Zealand's AI-powered digital marketing agency." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", minHeight: '100vh', background: '#f8fafc', color: '#0f172a' }}>
        {/* Header */}
        <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 700, fontSize: 18 }}>Next Wave SEO Audit Tool</span>
        </header>

        <main style={{ maxWidth: 760, margin: '0 auto', padding: '40px 20px' }}>
          {!result ? (
            <>
              <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Comprehensive SEO Analysis</h1>
                <p style={{ color: '#64748b', fontSize: 16, maxWidth: 520, margin: '0 auto' }}>
                  Get a detailed analysis of your website's SEO performance, including meta tags, content structure, technical issues, and actionable recommendations.
                </p>
              </div>

              <div style={{ background: '#fff', borderRadius: 16, padding: 36, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 28 }}>Free SEO Audit Tool</h2>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Website URL *</label>
                  <input
                    type="text"
                    placeholder="https://example.com"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 15, boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Your Name *</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 15, boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>

                <div style={{ marginBottom: 28 }}>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Email Address *</label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 15, boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>

                {error && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', color: '#dc2626', marginBottom: 20, fontSize: 14 }}>
                    {error}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{ width: '100%', padding: '14px', background: loading ? '#94a3b8' : '#e8693a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
                >
                  {loading ? '🔍 Analysing your website...' : '🔍 Start Free Audit'}
                </button>
              </div>

              {/* Feature highlights */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 40 }}>
                {[
                  { icon: '📊', title: 'Comprehensive Analysis', desc: 'Meta tags, headings, images, and technical SEO elements' },
                  { icon: '💡', title: 'Actionable Recommendations', desc: 'Specific suggestions to improve your SEO performance' },
                  { icon: '🚀', title: 'Expert Insights', desc: "Powered by Next Wave's AI-driven SEO expertise" },
                ].map(f => (
                  <div key={f.title} style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', textAlign: 'center' }}>
                    <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{f.title}</div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>{f.desc}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Results Header */}
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>SEO Audit Results</h1>
                <p style={{ color: '#64748b', fontSize: 14 }}>Analysis for <strong>{result.url}</strong></p>
                <p style={{ color: '#64748b', fontSize: 13 }}>Hi {result.name}! Here's your report generated on {new Date(result.generatedAt).toLocaleString('en-NZ')}</p>
              </div>

              {/* Score Card */}
              <div style={{ background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 72, fontWeight: 900, color: scoreColor(result.score), lineHeight: 1 }}>{result.score}</div>
                <div style={{ fontSize: 16, color: '#64748b', marginTop: 4 }}>SEO Score out of 100</div>
                <div style={{ marginTop: 16, height: 12, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${result.score}%`, background: scoreColor(result.score), borderRadius: 99, transition: 'width 1s ease' }} />
                </div>
                <div style={{ marginTop: 12, fontSize: 15, fontWeight: 600, color: scoreColor(result.score) }}>
                  {result.score >= 70 ? '🎉 Good SEO health! A few tweaks could make it great.' : result.score >= 40 ? '⚠️ Moderate. Several areas need improvement.' : '🚨 Needs significant SEO work. Let\'s fix this together!'}
                </div>
              </div>

              {/* Check Results */}
              <div style={{ background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: 24 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Detailed Checks</h2>
                {checkItems.map(item => (
                  <div key={item.label} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 16, marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span>{statusIcon(item.check.status)}</span>
                          <span style={{ fontWeight: 600, fontSize: 15 }}>{item.label}</span>
                          <span style={{ fontSize: 12, background: item.check.status === 'good' ? '#dcfce7' : item.check.status === 'warning' ? '#fef3c7' : '#fee2e2', color: statusColor(item.check.status), padding: '2px 8px', borderRadius: 99, fontWeight: 500 }}>
                            {item.check.status.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4, paddingLeft: 28 }}>{item.detail}</div>
                        <div style={{ fontSize: 13, color: statusColor(item.check.status), paddingLeft: 28 }}>💬 {item.check.recommendation}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div style={{ background: '#0f172a', borderRadius: 16, padding: 32, color: '#fff', textAlign: 'center' }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Want us to fix these issues?</h2>
                <p style={{ color: '#94a3b8', marginBottom: 24, fontSize: 15 }}>Next Wave specialises in SEO for New Zealand businesses. Let's get your site ranking.</p>
                
                  href="https://www.nextwave.nz"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-block', background: '#e8693a', color: '#fff', padding: '14px 32px', borderRadius: 8, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}
                >
                  Book a Free Strategy Call →
                </a>
                <div style={{ marginTop: 16 }}>
                  <button onClick={() => setResult(null)} style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
                    ← Audit Another Website
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}
