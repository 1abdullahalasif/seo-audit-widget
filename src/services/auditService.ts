// src/services/auditService.ts

interface AuditFormData {
  websiteUrl: string;
  email: string;
  name: string;
}

interface AuditResponse {
  success: boolean;
  message?: string;
  auditId?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://seo-audit-backend.onrender.com/api';

export const auditService = {
  startAudit: async (formData: AuditFormData): Promise<AuditResponse> => {
    try {
      const response = await fetch(`${API_URL}/audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
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

  getAuditStatus: async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/audit/${id}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get audit status');
      }

      const data = await response.json();
      return {
        ...data,
        audit: {
          ...data.audit,
          results: data.audit.results || {
            technical: { ssl: false },
            meta: { 
              title: { content: '', length: 0, status: 'error' },
              description: { content: '', length: 0, status: 'error' }
            },
            seo: {
              score: 0,
              issues: []
            },
            images: [],
            robotsTxt: { exists: false },
            sitemap: { exists: false },
            performance: { loadTime: 0, domContentLoaded: 0, firstPaint: 0 }
          }
        }
      };
    } catch (error) {
      console.error('Get audit status error:', error);
      throw error instanceof Error ? error : new Error('Failed to get audit status');
    }
  },

  healthCheck: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/health`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      return response.ok;
    } catch (error) {
      console.error('Health check error:', error);
      return false;
    }
  }
};