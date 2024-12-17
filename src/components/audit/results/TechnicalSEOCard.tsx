// src/components/audit/results/TechnicalSEOCard.tsx
import React from 'react';
import type { SEOAuditResults } from '@/types/seo';

interface TechnicalSEOCardProps {
  data: SEOAuditResults['technical'];
}

export const TechnicalSEOCard: React.FC<TechnicalSEOCardProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-bold mb-4">Technical SEO Details</h3>
      
      {/* SSL Section */}
      <div className="mb-4">
        <h4 className="font-medium">SSL Security</h4>
        <div className={`text-sm ${data?.security?.ssl?.isValid ? 'text-green-600' : 'text-red-600'}`}>
          {data.security?.ssl?.isValid ? 'Secure' : 'Not Secure'}
        </div>
      </div>

      {/* Performance Section */}
      <div className="mb-4">
        <h4 className="font-medium">Page Speed</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Mobile</p>
            <p className="font-bold">{data.performance.pageSpeed.mobile}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Desktop</p>
            <p className="font-bold">{data.performance.pageSpeed.desktop}</p>
          </div>
        </div>
      </div>

      {/* Core Web Vitals */}
      <div className="mb-4">
        <h4 className="font-medium">Core Web Vitals</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">FCP</p>
            <p className="font-bold">{data.performance.coreWebVitals.fcp}s</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">LCP</p>
            <p className="font-bold">{data.performance.coreWebVitals.lcp}s</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">CLS</p>
            <p className="font-bold">{data.performance.coreWebVitals.cls}</p>
          </div>
        </div>
      </div>

      {/* Crawling Details */}
      <div>
        <h4 className="font-medium">Crawling & Indexing</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Robots.txt</p>
            <p className={`font-bold ${data.crawling.robotsTxt.exists ? 'text-green-600' : 'text-red-600'}`}>
              {data.crawling.robotsTxt.exists ? 'Present' : 'Missing'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Sitemap</p>
            <p className={`font-bold ${data.crawling.sitemap.exists ? 'text-green-600' : 'text-red-600'}`}>
              {data.crawling.sitemap.exists ? 'Present' : 'Missing'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnicalSEOCard;