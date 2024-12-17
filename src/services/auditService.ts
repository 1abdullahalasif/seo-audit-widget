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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://seo-audit-backend.onrender.com';
const API_URL = API_BASE_URL.replace(/\/+$/, ''); // Remove trailing slashes

const API_ENDPOINTS = {
  audit: `${API_URL}/api/audit`,
  status: (id: string) => `${API_URL}/api/audit/${id}`,
  health: `${API_URL}/health`,
  details: (id: string) => `${API_URL}/api/audit/${id}/details`,
  recommendations: (id: string) => `${API_URL}/api/audit/${id}/recommendations`,
  technicalSEO: (id: string) => `${API_URL}/api/audit/${id}/technical`,
  onPageSEO: (id: string) => `${API_URL}/api/audit/${id}/onpage`,
  offPageSEO: (id: string) => `${API_URL}/api/audit/${id}/offpage`,
  analytics: (id: string) => `${API_URL}/api/audit/${id}/analytics`
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ 
      message: 'Network response was not ok',
      status: response.status 
    }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

const commonFetchConfig = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
};

export const auditService = {
  startAudit: async (formData: AuditFormData): Promise<AuditResponse> => {
    try {
      console.log('Starting audit with URL:', API_ENDPOINTS.audit);
      const response = await fetch(API_ENDPOINTS.audit, {
        method: 'POST',
        ...commonFetchConfig,
        body: JSON.stringify(formData)
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
      const response = await fetch(API_ENDPOINTS.status(id), commonFetchConfig);
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
      const response = await fetch(API_ENDPOINTS.technicalSEO(id), commonFetchConfig);
      return handleResponse(response);
    } catch (error) {
      console.error('Get technical SEO error:', error);
      return {};
    }
  },

  getOnPageSEO: async (id: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.onPageSEO(id), commonFetchConfig);
      return handleResponse(response);
    } catch (error) {
      console.error('Get on-page SEO error:', error);
      return {};
    }
  },

  getOffPageSEO: async (id: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.offPageSEO(id), commonFetchConfig);
      return handleResponse(response);
    } catch (error) {
      console.error('Get off-page SEO error:', error);
      return {};
    }
  },

  getAnalytics: async (id: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.analytics(id), commonFetchConfig);
      return handleResponse(response);
    } catch (error) {
      console.error('Get analytics error:', error);
      return {};
    }
  },

  getRecommendations: async (id: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.recommendations(id), commonFetchConfig);
      return handleResponse(response);
    } catch (error) {
      console.error('Get recommendations error:', error);
      return [];
    }
  },

  healthCheck: async (): Promise<boolean> => {
    try {
      console.log('Checking health at:', API_ENDPOINTS.health);
      const response = await fetch(API_ENDPOINTS.health, commonFetchConfig);
      return response.ok;
    } catch (error) {
      console.error('Health check error:', error);
      return false;
    }
  }
};