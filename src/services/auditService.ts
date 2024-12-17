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

// Ensure trailing slash is removed from API URL
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://seo-audit-backend.onrender.com/api').replace(/\/$/, '');

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

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Network response was not ok' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const auditService = {
  startAudit: async (formData: AuditFormData): Promise<AuditResponse> => {
    try {
      console.log('Starting audit with URL:', API_ENDPOINTS.audit);
      const response = await fetch(API_ENDPOINTS.audit, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          companyDomain: new URL(formData.websiteUrl).hostname
        })
      });

      return handleResponse(response);
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
        headers: {
          'Accept': 'application/json',
        }
      });

      const data = await handleResponse(response);
      
      if (data?.audit?.status === 'completed') {
        try {
          const [technical, onPage, offPage, analytics, recommendations] = await Promise.all([
            auditService.getTechnicalSEO(id),
            auditService.getOnPageSEO(id),
            auditService.getOffPageSEO(id),
            auditService.getAnalytics(id),
            auditService.getRecommendations(id)
          ]);

          data.audit.results = {
            technical,
            onPage,
            offPage,
            analytics,
            recommendations
          };
        } catch (error) {
          console.error('Error fetching audit results:', error);
          data.audit.error = 'Failed to fetch some audit data';
        }
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
  },

  healthCheck: async (): Promise<boolean> => {
    try {
      console.log('Checking health at:', API_ENDPOINTS.health);
      const response = await fetch(API_ENDPOINTS.health, {
        headers: {
          'Accept': 'application/json',
        }
      });
      return response.ok;
    } catch (error) {
      console.error('Health check error:', error);
      return false;
    }
  }
};