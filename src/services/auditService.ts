// src/services/auditService.ts
import type { SEOAuditResults } from '@/types/seo';

interface AuditFormData {
  websiteUrl: string;
  email: string;
  name: string;
}

interface AuditResponse {
  success: boolean;
  auditId?: string;
  message?: string;
}

// Base API URL configuration
const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || 'https://seo-audit-backend.onrender.com';
};

const BASE_URL = getBaseUrl();

const API_ENDPOINTS = {
  audit: `${BASE_URL}/audit`,
  status: (id: string) => `${BASE_URL}/audit/${id}`,
  health: `${BASE_URL}/health`,
  details: (id: string) => `${BASE_URL}/audit/${id}/details`,
  recommendations: (id: string) => `${BASE_URL}/audit/${id}/recommendations`,
  technicalSEO: (id: string) => `${BASE_URL}/audit/${id}/technical`,
  onPageSEO: (id: string) => `${BASE_URL}/audit/${id}/onpage`,
  offPageSEO: (id: string) => `${BASE_URL}/audit/${id}/offpage`,
  analytics: (id: string) => `${BASE_URL}/audit/${id}/analytics`
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    let errorMessage = `HTTP error! status: ${response.status}`;
    
    try {
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } else {
        errorMessage = await response.text() || errorMessage;
      }
    } catch (error) {
      console.error('Error parsing error response:', error);
    }
    
    throw new Error(errorMessage);
  }
  
  try {
    return await response.json();
  } catch (error) {
    console.error('Error parsing JSON response:', error);
    throw new Error('Invalid JSON response from server');
  }
};

const transformAuditResults = (data: any): SEOAuditResults => {
  return {
    technical: {
      crawling: {
        robotsTxt: {
          exists: data?.results?.robotsTxt?.exists || false,
          hasSitemap: data?.results?.robotsTxt?.hasSitemap || false,
          content: data?.results?.robotsTxt?.content || '',
          issues: data?.results?.robotsTxt?.issues || []
        },
        sitemap: {
          exists: data?.results?.sitemap?.exists || false,
          urlCount: data?.results?.sitemap?.urlCount || 0,
          issues: data?.results?.sitemap?.issues || []
        },
        urlStructure: {
          isValid: true,
          issues: []
        },
        canonical: {
          exists: true,
          isDuplicate: false,
          issues: []
        }
      },
      performance: {
        pageSpeed: {
          mobile: data?.results?.performance?.pageSpeed?.mobile || 0,
          desktop: data?.results?.performance?.pageSpeed?.desktop || 0
        },
        coreWebVitals: {
          fcp: data?.results?.performance?.coreWebVitals?.fcp || 0,
          lcp: data?.results?.performance?.coreWebVitals?.lcp || 0,
          cls: data?.results?.performance?.coreWebVitals?.cls || 0,
          status: data?.results?.performance?.coreWebVitals?.status || 'needs-improvement'
        },
        images: {
          total: data?.results?.images?.length || 0,
          unoptimized: data?.results?.images?.filter((img: any) => !img.optimized)?.length || 0,
          missingAlt: data?.results?.images?.filter((img: any) => !img.hasAlt)?.length || 0,
          largeImages: 0,
          issues: []
        }
      },
      security: {
        ssl: {
          exists: data?.results?.technical?.ssl || false,
          isValid: data?.results?.technical?.ssl || false,
          expiryDate: '',
          issues: []
        },
        httpToHttps: data?.results?.technical?.httpToHttps || false
      },
      scoreBreakdown: {
        score: 0,
        maxScore: 100,
        items: []
      }
    },
    onPage: {
      meta: {
        title: {
          content: data?.results?.meta?.title?.content || '',
          length: data?.results?.meta?.title?.length || 0,
          status: data?.results?.meta?.title?.status || 'warning'
        },
        description: {
          content: data?.results?.meta?.description?.content || '',
          length: data?.results?.meta?.description?.length || 0,
          status: data?.results?.meta?.description?.status || 'warning'
        },
        openGraph: {
          exists: false,
          tags: [],
          issues: []
        }
      },
      headings: {
        h1: {
          count: data?.results?.headings?.h1?.length || 0,
          unique: true,
          content: data?.results?.headings?.h1?.map((h: any) => h.content) || [],
          issues: []
        },
        structure: {
          isValid: true,
          issues: []
        }
      },
      content: {
        wordCount: 0,
        keywordDensity: {},
        uniqueness: 100,
        issues: []
      },
      internalLinks: {
        total: data?.results?.links?.internal || 0,
        broken: data?.results?.links?.broken?.length || 0,
        issues: []
      },
      scoreBreakdown: {
        score: 0,
        maxScore: 100,
        items: []
      }
    },
    offPage: {
      backlinks: {
        total: 0,
        toxic: 0,
        broken: 0,
        issues: []
      },
      socialMedia: {
        platforms: {},
        issues: []
      },
      scoreBreakdown: {
        score: 0,
        maxScore: 100,
        items: []
      }
    },
    analytics: {
      tracking: {
        googleAnalytics: {
          exists: false,
          type: null,
          issues: []
        },
        tagManager: {
          exists: false,
          issues: []
        },
        facebookPixel: {
          exists: false,
          issues: []
        }
      },
      searchConsole: {
        indexingErrors: 0,
        issues: []
      },
      scoreBreakdown: {
        score: 0,
        maxScore: 100,
        items: []
      }
    },
    advanced: {
      duplicateContent: {
        titles: [],
        descriptions: [],
        h1s: [],
        issues: []
      },
      schema: {
        exists: false,
        types: [],
        isValid: false,
        issues: []
      },
      international: {
        hreflang: {
          exists: false,
          isValid: false,
          issues: []
        },
        languages: []
      },
      javascript: {
        renderingIssues: [],
        iframeCount: 0,
        issues: []
      },
      scoreBreakdown: {
        score: 0,
        maxScore: 100,
        items: []
      }
    },
    overallScore: {
      score: 0,
      maxScore: 100,
      breakdown: {
        technical: 0,
        onPage: 0,
        offPage: 0,
        analytics: 0,
        advanced: 0
      }
    },
    recommendations: data?.summary?.recommendations || []
  };
};

export const auditService = {
  healthCheck: async (): Promise<boolean> => {
    try {
      console.log('Checking health at:', API_ENDPOINTS.health);
      const response = await fetch(API_ENDPOINTS.health, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        mode: 'cors',
        cache: 'no-cache'
      });

      if (!response.ok) {
        console.error('Health check failed:', {
          status: response.status,
          statusText: response.statusText
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Health check error:', error);
      return false;
    }
  },

  startAudit: async (formData: AuditFormData): Promise<AuditResponse> => {
    try {
      console.log('Starting audit with URL:', API_ENDPOINTS.audit);
      const response = await fetch(API_ENDPOINTS.audit, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify({
          ...formData,
          companyDomain: new URL(formData.websiteUrl).hostname
        })
      });

      const data = await handleResponse(response);
      console.log('Audit start response:', data);
      return data;
    } catch (error) {
      console.error('Start audit error:', error);
      throw error instanceof Error ? error : new Error('Failed to start audit');
    }
  },

  getAuditStatus: async (id: string): Promise<{
    success: boolean;
    audit: {
      status: 'pending' | 'processing' | 'completed' | 'failed';
      results?: SEOAuditResults;
      error?: string;
    };
  }> => {
    try {
      console.log('Checking audit status:', API_ENDPOINTS.status(id));
      const response = await fetch(API_ENDPOINTS.status(id), {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        mode: 'cors'
      });

      const data = await handleResponse(response);
      
      if (data?.audit?.status === 'completed' && data?.audit?.results) {
        const transformedResults = transformAuditResults(data.audit);
        data.audit.results = transformedResults;
        console.log('Transformed audit results:', transformedResults);
      }

      return data;
    } catch (error) {
      console.error('Get audit status error:', error);
      throw error instanceof Error ? error : new Error('Failed to get audit status');
    }
  },

  getTechnicalSEO: async (id: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.technicalSEO(id));
      return handleResponse(response);
    } catch (error) {
      console.error('Get technical SEO error:', error);
      return {};
    }
  },

  getOnPageSEO: async (id: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.onPageSEO(id));
      return handleResponse(response);
    } catch (error) {
      console.error('Get on-page SEO error:', error);
      return {};
    }
  },

  getOffPageSEO: async (id: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.offPageSEO(id));
      return handleResponse(response);
    } catch (error) {
      console.error('Get off-page SEO error:', error);
      return {};
    }
  },

  getAnalytics: async (id: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.analytics(id));
      return handleResponse(response);
    } catch (error) {
      console.error('Get analytics error:', error);
      return {};
    }
  },

  getRecommendations: async (id: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.recommendations(id));
      return handleResponse(response);
    } catch (error) {
      console.error('Get recommendations error:', error);
      return [];
    }
  }
};