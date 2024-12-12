// pages/index.tsx
import Head from 'next/head';
import SEOAuditWidget from '../components/audit/SEOAuditWidget';
import ErrorBoundary from '../components/ErrorBoundary';

export default function Home() {
  return (
    <>
      <Head>
        <title>Next Wave - SEO Audit Tool</title>
        <meta name="description" content="Free comprehensive SEO audit tool by Next Wave, New Zealand's leading AI-powered digital marketing agency" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Next Wave SEO Audit Tool
            </h1>
          </div>
        </header>

        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {/* Introduction Section */}
            <div className="px-4 py-6 sm:px-0 mb-8">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Comprehensive SEO Analysis
                </h2>
                <p className="max-w-2xl mx-auto text-gray-600">
                  Get a detailed analysis of your website's SEO performance, including meta tags, content structure, technical issues, and actionable recommendations.
                </p>
              </div>
            </div>

            {/* Audit Widget */}
            <div className="px-4 sm:px-0">
              <ErrorBoundary>
                <SEOAuditWidget />
              </ErrorBoundary>
            </div>

            {/* Benefits Section */}
            <div className="mt-16 px-4 sm:px-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Comprehensive Analysis
                  </h3>
                  <p className="text-gray-600">
                    Get insights into meta tags, headings, images, and technical SEO elements
                  </p>
                </div>
                <div className="text-center p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Actionable Recommendations
                  </h3>
                  <p className="text-gray-600">
                    Receive specific suggestions to improve your website's SEO performance
                  </p>
                </div>
                <div className="text-center p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Expert Insights
                  </h3>
                  <p className="text-gray-600">
                    Powered by Next Wave's AI-driven SEO expertise
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="bg-gray-50 mt-16">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-gray-500">
              © {new Date().getFullYear()} Next Wave. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}