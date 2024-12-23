// src/types/seo.ts
export interface MetaTag {
  content: string;
  length: number;
  status: 'good' | 'warning' | 'error';
}

export interface CoreWebVitals {
  fcp: number;
  lcp: number;
  cls: number;
  status: 'good' | 'needs-improvement' | 'poor';
}

export interface ScoreBreakdown {
  score: number;
  maxScore: number;
  items: Array<{
    name: string;
    status: 'pass' | 'fail' | 'warning';
    score: number;
    maxScore: number;
    details?: string;
  }>;
}

export interface SEOAuditResults {
  technical: {
    crawling: {
      robotsTxt: {
        exists: boolean;
        hasSitemap: boolean;
        content?: string;
        issues: string[];
      };
      sitemap: {
        exists: boolean;
        urlCount: number;
        issues: string[];
      };
      urlStructure: {
        isValid: boolean;
        issues: string[];
      };
      canonical: {
        exists: boolean;
        isDuplicate: boolean;
        issues: string[];
      };
    };
    performance: {
      pageSpeed: {
        mobile: number;
        desktop: number;
      };
      coreWebVitals: CoreWebVitals;
      images: {
        total: number;
        unoptimized: number;
        missingAlt: number;
        largeImages: number;
        issues: string[];
      };
    };
    security: {
      ssl: {
        exists: boolean;
        isValid: boolean;
        expiryDate: string;
        issues: string[];
      };
      httpToHttps: boolean;
    };
    scoreBreakdown: ScoreBreakdown;
  };
  onPage: {
    meta: {
      title: MetaTag;
      description: MetaTag;
      openGraph: {
        exists: boolean;
        tags: string[];
        issues: string[];
      };
    };
    headings: {
      h1: {
        count: number;
        unique: boolean;
        content: string[];
        issues: string[];
      };
      structure: {
        isValid: boolean;
        issues: string[];
      };
    };
    content: {
      wordCount: number;
      keywordDensity: Record<string, number>;
      uniqueness: number;
      issues: string[];
    };
    internalLinks: {
      total: number;
      broken: number;
      issues: string[];
    };
    scoreBreakdown: ScoreBreakdown;
  };
  offPage: {
    backlinks: {
      total: number;
      toxic: number;
      broken: number;
      issues: string[];
    };
    socialMedia: {
      platforms: Record<string, {
        exists: boolean;
        url?: string;
      }>;
      issues: string[];
    };
    scoreBreakdown: ScoreBreakdown;
  };
  analytics: {
    tracking: {
      googleAnalytics: {
        exists: boolean;
        type: 'UA' | 'GA4' | null;
        issues: string[];
      };
      tagManager: {
        exists: boolean;
        issues: string[];
      };
      facebookPixel: {
        exists: boolean;
        issues: string[];
      };
    };
    searchConsole: {
      indexingErrors: number;
      issues: string[];
    };
    scoreBreakdown: ScoreBreakdown;
  };
  advanced: {
    duplicateContent: {
      titles: string[];
      descriptions: string[];
      h1s: string[];
      issues: string[];
    };
    schema: {
      exists: boolean;
      types: string[];
      isValid: boolean;
      issues: string[];
    };
    international: {
      hreflang: {
        exists: boolean;
        isValid: boolean;
        issues: string[];
      };
      languages: string[];
    };
    javascript: {
      renderingIssues: string[];
      iframeCount: number;
      issues: string[];
    };
    scoreBreakdown: ScoreBreakdown;
  };
  overallScore: {
    score: number;
    maxScore: number;
    breakdown: {
      technical: number;
      onPage: number;
      offPage: number;
      analytics: number;
      advanced: number;
    };
  };
  recommendations: Array<{
    category: 'critical' | 'important' | 'minor';
    issue: string;
    impact: string;
    recommendation: string;
    priority: number;
  }>;
}