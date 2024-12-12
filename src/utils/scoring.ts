// src/utils/scoring.ts
import type { SEOAuditResults, ScoreBreakdown } from '@/types/seo';

const calculateCategoryScore = (items: {
  name: string;
  status: 'pass' | 'warning' | 'fail';
  score: number;
  maxScore: number;
  details?: string;
}[]): ScoreBreakdown => {
  const totalScore = items.reduce((sum, item) => sum + item.score, 0);
  const maxScore = items.reduce((sum, item) => sum + item.maxScore, 0);

  return {
    score: totalScore,
    maxScore,
    items
  };
};

export const calculateTechnicalScore = (results: SEOAuditResults['technical']): ScoreBreakdown => {
  const items = [
    {
      name: 'SSL Security',
      status: results.security.ssl.isValid ? 'pass' : 'fail',
      score: results.security.ssl.isValid ? 10 : 0,
      maxScore: 10
    },
    {
      name: 'Robots.txt',
      status: results.crawling.robotsTxt.exists ? 'pass' : 'fail',
      score: results.crawling.robotsTxt.exists ? 5 : 0,
      maxScore: 5
    },
    {
      name: 'Sitemap.xml',
      status: results.crawling.sitemap.isValid ? 'pass' : 'fail',
      score: results.crawling.sitemap.isValid ? 5 : 0,
      maxScore: 5
    },
    {
      name: 'Page Speed',
      status: results.performance.pageSpeed.mobile >= 90 ? 'pass' : 
             results.performance.pageSpeed.mobile >= 50 ? 'warning' : 'fail',
      score: results.performance.pageSpeed.mobile >= 90 ? 15 :
             results.performance.pageSpeed.mobile >= 50 ? 7 : 0,
      maxScore: 15
    },
    {
      name: 'Core Web Vitals',
      status: results.performance.coreWebVitals.status === 'good' ? 'pass' : 
              results.performance.coreWebVitals.status === 'needs-improvement' ? 'warning' : 'fail',
      score: results.performance.coreWebVitals.status === 'good' ? 15 : 
             results.performance.coreWebVitals.status === 'needs-improvement' ? 7 : 0,
      maxScore: 15
    }
  ];

  return calculateCategoryScore(items);
};

export const calculateOnPageScore = (results: SEOAuditResults['onPage']): ScoreBreakdown => {
  const items = [
    {
      name: 'Meta Title',
      status: results.meta.title.status === 'good' ? 'pass' : 'warning',
      score: results.meta.title.status === 'good' ? 10 : 5,
      maxScore: 10
    },
    {
      name: 'Meta Description',
      status: results.meta.description.status === 'good' ? 'pass' : 'warning',
      score: results.meta.description.status === 'good' ? 10 : 5,
      maxScore: 10
    },
    {
      name: 'Heading Structure',
      status: results.headings.structure.isValid ? 'pass' : 'fail',
      score: results.headings.structure.isValid ? 10 : 0,
      maxScore: 10
    },
    {
      name: 'Content Quality',
      status: results.content.uniqueness > 90 ? 'pass' :
              results.content.uniqueness > 70 ? 'warning' : 'fail',
      score: results.content.uniqueness > 90 ? 10 :
              results.content.uniqueness > 70 ? 5 : 0,
      maxScore: 10
    },
    {
      name: 'Internal Links',
      status: results.internalLinks.broken === 0 ? 'pass' : 'fail',
      score: results.internalLinks.broken === 0 ? 10 : 0,
      maxScore: 10
    }
  ];

  return calculateCategoryScore(items);
};

export const calculateAnalyticsScore = (results: SEOAuditResults['analytics']): ScoreBreakdown => {
  const items = [
    {
      name: 'Google Analytics',
      status: results.tracking.googleAnalytics.exists ? 'pass' : 'fail',
      score: results.tracking.googleAnalytics.exists ? 10 : 0,
      maxScore: 10
    },
    {
      name: 'Tag Manager',
      status: results.tracking.tagManager.exists ? 'pass' : 'fail',
      score: results.tracking.tagManager.exists ? 10 : 0,
      maxScore: 10
    },
    {
      name: 'Facebook Pixel',
      status: results.tracking.facebookPixel.exists ? 'pass' : 'fail',
      score: results.tracking.facebookPixel.exists ? 5 : 0,
      maxScore: 5
    },
    {
      name: 'Search Console Integration',
      status: results.searchConsole.indexingErrors === 0 ? 'pass' : 'warning',
      score: results.searchConsole.indexingErrors === 0 ? 15 : 7,
      maxScore: 15
    }
  ];

  return calculateCategoryScore(items);
};

export const calculateAdvancedScore = (results: SEOAuditResults['advanced']): ScoreBreakdown => {
  const items = [
    {
      name: 'Schema Markup',
      status: results.schema.isValid ? 'pass' : results.schema.exists ? 'warning' : 'fail',
      score: results.schema.isValid ? 15 : results.schema.exists ? 7 : 0,
      maxScore: 15
    },
    {
      name: 'Internationalization',
      status: results.international.hreflang.isValid ? 'pass' : 'fail',
      score: results.international.hreflang.isValid ? 10 : 0,
      maxScore: 10
    },
    {
      name: 'JavaScript Rendering',
      status: results.javascript.renderingIssues.length === 0 ? 'pass' : 'warning',
      score: results.javascript.renderingIssues.length === 0 ? 10 : 5,
      maxScore: 10
    },
    {
      name: 'Duplicate Content',
      status: Object.values(results.duplicateContent).every(arr => arr.length === 0) ? 'pass' : 'warning',
      score: Object.values(results.duplicateContent).every(arr => arr.length === 0) ? 15 : 7,
      maxScore: 15
    }
  ];

  return calculateCategoryScore(items);
};

export const calculateOffPageScore = (results: SEOAuditResults['offPage']): ScoreBreakdown => {
  const items = [
    {
      name: 'Backlink Quality',
      status: results.backlinks.toxic < results.backlinks.total * 0.1 ? 'pass' : 'fail',
      score: results.backlinks.toxic < results.backlinks.total * 0.1 ? 20 : 0,
      maxScore: 20
    },
    {
      name: 'Social Media Presence',
      status: Object.values(results.socialMedia.platforms).some(p => p.exists) ? 'pass' : 'fail',
      score: Object.values(results.socialMedia.platforms).filter(p => p.exists).length * 5,
      maxScore: 20
    }
  ];

  return calculateCategoryScore(items);
};

export const calculateOverallScore = (results: SEOAuditResults) => {
  const technical = calculateTechnicalScore(results.technical);
  const onPage = calculateOnPageScore(results.onPage);
  const offPage = calculateOffPageScore(results.offPage);
  const analytics = calculateAnalyticsScore(results.analytics);
  const advanced = calculateAdvancedScore(results.advanced);

  // Calculate weighted scores
  const weights = {
    technical: 0.3,  // 30%
    onPage: 0.3,     // 30%
    offPage: 0.2,    // 20%
    analytics: 0.1,  // 10%
    advanced: 0.1    // 10%
  };

  const weightedScores = {
    technical: (technical.score / technical.maxScore) * weights.technical * 100,
    onPage: (onPage.score / onPage.maxScore) * weights.onPage * 100,
    offPage: (offPage.score / offPage.maxScore) * weights.offPage * 100,
    analytics: (analytics.score / analytics.maxScore) * weights.analytics * 100,
    advanced: (advanced.score / advanced.maxScore) * weights.advanced * 100
  };

  const totalScore = Math.round(
    weightedScores.technical +
    weightedScores.onPage +
    weightedScores.offPage +
    weightedScores.analytics +
    weightedScores.advanced
  );

  return {
    score: totalScore,
    maxScore: 100,
    breakdown: {
      technical: Math.round((technical.score / technical.maxScore) * 100),
      onPage: Math.round((onPage.score / onPage.maxScore) * 100),
      offPage: Math.round((offPage.score / offPage.maxScore) * 100),
      analytics: Math.round((analytics.score / analytics.maxScore) * 100),
      advanced: Math.round((advanced.score / advanced.maxScore) * 100)
    }
  };
};