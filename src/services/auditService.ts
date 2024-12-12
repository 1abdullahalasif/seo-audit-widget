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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://seo-audit-backend.onrender.com/api';

const API_ENDPOINTS = {
  audit: `${API_URL}/audit`,
  status: (id: string) => `${API_URL}/audit/${id}`,
  health: `${API_URL}/health`,
  details: (id: string) => `${API_URL}/audit/${id}/details`,
  recommendations: (id: string) => `${API_URL}/audit/${id}/recommendations`,
  technicalSEO: (id: string) => `${API_URL}/audit/${id}/technical`,
  onPageSEO: (id: string) => `${API_URL}/audit/${id}/onpage`,
  offPageSEO: (id: string) => `${API_URL}/audit/${id}/offpage`,
  analytics: (id: string) => `${API_URL}/audit/${id}/analytics`
};

export const auditService = {
  startAudit: async (formData: AuditFormData): Promise<AuditResponse> => {
    try {
      const response = await fetch(API_ENDPOINTS.audit, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          ...formData,
          companyDomain: new URL(formData.websiteUrl).hostname
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start audit');
      }

      return response.json();
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
      const response = await fetch(API_ENDPOINTS.status(id), {
        headers: {
          'Accept': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get audit status');
      }

      const data = await response.json();
      
      // If audit is complete, fetch all detailed results
      if (data && data.audit && data.audit.status === 'completed') {
        const [technical, onPage, offPage, analytics] = await Promise.all([
          auditService.getTechnicalSEO(id),
          auditService.getOnPageSEO(id),
          auditService.getOffPageSEO(id),
          auditService.getAnalytics(id)
        ]);

        data.audit.results = {
          technical,
          onPage,
          offPage,
          analytics,
          recommendations: await auditService.getRecommendations(id)
        };
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
      if (!response.ok) throw new Error('Failed to fetch technical SEO data');
      return response.json();
    } catch (error) {
      console.error('Get technical SEO error:', error);
      throw error;
    }
  },

  getOnPageSEO: async (id: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.onPageSEO(id));
      if (!response.ok) throw new Error('Failed to fetch on-page SEO data');
      return response.json();
    } catch (error) {
      console.error('Get on-page SEO error:', error);
      throw error;
    }
  },

  getOffPageSEO: async (id: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.offPageSEO(id));
      if (!response.ok) throw new Error('Failed to fetch off-page SEO data');
      return response.json();
    } catch (error) {
      console.error('Get off-page SEO error:', error);
      throw error;
    }
  },

  getAnalytics: async (id: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.analytics(id));
      if (!response.ok) throw new Error('Failed to fetch analytics data');
      return response.json();
    } catch (error) {
      console.error('Get analytics error:', error);
      throw error;
    }
  },

  getRecommendations: async (id: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.recommendations(id));
      if (!response.ok) throw new Error('Failed to fetch recommendations');
      return response.json();
    } catch (error) {
      console.error('Get recommendations error:', error);
      throw error;
    }
  },

  healthCheck: async (): Promise<boolean> => {
    try {
      const response = await fetch(API_ENDPOINTS.health, {
        headers: {
          'Accept': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
      return response.ok;
    } catch (error) {
      console.error('Health check error:', error);
      return false;
    }
  }
};