// src/utils/scoring.ts
import type { SEOAuditResults } from '@/types/seo';
import type { ScoreBreakdown, ScoreItem } from '@/types/ScoreItems';

const calculateCategoryScore = (items: ScoreItem[]): ScoreBreakdown => {
  const totalScore = items.reduce((sum, item) => sum + item.score, 0);
  const maxScore = items.reduce((sum, item) => sum + item.maxScore, 0);

  return {
    score: totalScore,
    maxScore,
    items
  };
};

export const calculateTechnicalScore = (results: SEOAuditResults['technical']): ScoreBreakdown => {
  const items: ScoreItem[] = [
    {
      name: 'SSL Security',
      status: results.security.ssl.isValid ? 'pass' : 'fail',
      score: results.security.ssl.isValid ? 10 : 0,
      maxScore: 10,
      details: results.security.ssl.issues.join(', ')
    },
    {
      name: 'Robots.txt',
      status: results.crawling.robotsTxt.exists ? 'pass' : 'fail',
      score: results.crawling.robotsTxt.exists ? 5 : 0,
      maxScore: 5,
      details: results.crawling.robotsTxt.issues.join(', ')
    },
    {
      name: 'Sitemap.xml',
      status: results.crawling.sitemap.isValid ? 'pass' : 'fail',
      score: results.crawling.sitemap.isValid ? 5 : 0,
      maxScore: 5,
      details: results.crawling.sitemap.issues.join(', ')
    },
    {
      name: 'Page Speed',
      status: results.performance.pageSpeed.mobile >= 90 ? 'pass' : 
             results.performance.pageSpeed.mobile >= 50 ? 'warning' : 'fail',
      score: results.performance.pageSpeed.mobile >= 90 ? 15 :
             results.performance.pageSpeed.mobile >= 50 ? 7 : 0,
      maxScore: 15,
      details: `Mobile: ${results.performance.pageSpeed.mobile}, Desktop: ${results.performance.pageSpeed.desktop}`
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
  const items: ScoreItem[] = [
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
      maxScore: 10,
      details: results.headings.structure.issues.join(', ')
    },
    {
      name: 'Content Quality',
      status: results.content.uniqueness > 90 ? 'pass' :
              results.content.uniqueness > 70 ? 'warning' : 'fail',
      score: results.content.uniqueness > 90 ? 10 :
              results.content.uniqueness > 70 ? 5 : 0,
      maxScore: 10,
      details: `Uniqueness: ${results.content.uniqueness}%`
    },
    {
      name: 'Internal Links',
      status: results.internalLinks.broken === 0 ? 'pass' : 'fail',
      score: results.internalLinks.broken === 0 ? 10 : 0,
      maxScore: 10,
      details: `${results.internalLinks.broken} broken links found`
    }
  ];

  return calculateCategoryScore(items);
};

export const calculateAnalyticsScore = (results: SEOAuditResults['analytics']): ScoreBreakdown => {
  const items: ScoreItem[] = [
    {
      name: 'Google Analytics',
      status: results.tracking.googleAnalytics.exists ? 'pass' : 'fail',
      score: results.tracking.googleAnalytics.exists ? 10 : 0,
      maxScore: 10,
      details: results.tracking.googleAnalytics.issues.join(', ')
    },
    {
      name: 'Tag Manager',
      status: results.tracking.tagManager.exists ? 'pass' : 'fail',
      score: results.tracking.tagManager.exists ? 10 : 0,
      maxScore: 10,
      details: results.tracking.tagManager.issues.join(', ')
    },
    {
      name: 'Facebook Pixel',
      status: results.tracking.facebookPixel.exists ? 'pass' : 'fail',
      score: results.tracking.facebookPixel.exists ? 5 : 0,
      maxScore: 5,
      details: results.tracking.facebookPixel.issues.join(', ')
    },
    {
      name: 'Search Console',
      status: results.searchConsole.indexingErrors === 0 ? 'pass' : 'warning',
      score: results.searchConsole.indexingErrors === 0 ? 15 : 7,
      maxScore: 15,
      details: results.searchConsole.issues.join(', ')
    }
  ];

  return calculateCategoryScore(items);
};

export const calculateAdvancedScore = (results: SEOAuditResults['advanced']): ScoreBreakdown => {
  const items: ScoreItem[] = [
    {
      name: 'Schema Markup',
      status: results.schema.isValid ? 'pass' : results.schema.exists ? 'warning' : 'fail',
      score: results.schema.isValid ? 15 : results.schema.exists ? 7 : 0,
      maxScore: 15,
      details: results.schema.issues.join(', ')
    },
    {
      name: 'Internationalization',
      status: results.international.hreflang.isValid ? 'pass' : 'fail',
      score: results.international.hreflang.isValid ? 10 : 0,
      maxScore: 10,
      details: results.international.hreflang.issues.join(', ')
    },
    {
      name: 'JavaScript Rendering',
      status: results.javascript.renderingIssues.length === 0 ? 'pass' : 'warning',
      score: results.javascript.renderingIssues.length === 0 ? 10 : 5,
      maxScore: 10,
      details: results.javascript.issues.join(', ')
    },
    {
      name: 'Duplicate Content',
      status: Object.values(results.duplicateContent).every(arr => arr.length === 0) ? 'pass' : 'warning',
      score: Object.values(results.duplicateContent).every(arr => arr.length === 0) ? 15 : 7,
      maxScore: 15,
      details: results.duplicateContent.issues.join(', ')
    }
  ];

  return calculateCategoryScore(items);
};

export const calculateOffPageScore = (results: SEOAuditResults['offPage']): ScoreBreakdown => {
  const items: ScoreItem[] = [
    {
      name: 'Backlink Quality',
      status: results.backlinks.toxic < results.backlinks.total * 0.1 ? 'pass' : 'fail',
      score: results.backlinks.toxic < results.backlinks.total * 0.1 ? 20 : 0,
      maxScore: 20,
      details: `Total: ${results.backlinks.total}, Toxic: ${results.backlinks.toxic}`
    },
    {
      name: 'Social Media',
      status: Object.values(results.socialMedia.platforms).some(p => p.exists) ? 'pass' : 'fail',
      score: Object.values(results.socialMedia.platforms).filter(p => p.exists).length * 5,
      maxScore: 20,
      details: results.socialMedia.issues.join(', ')
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

  const weights = {
    technical: 0.3,
    onPage: 0.3,
    offPage: 0.2,
    analytics: 0.1,
    advanced: 0.1
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