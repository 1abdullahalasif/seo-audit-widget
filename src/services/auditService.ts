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

interface AuditStatusResponse {
  success: boolean;
  audit: {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    createdAt: string;
    completedAt?: string;
    results?: {
      meta: {
        title: {
          content: string | null;
          length: number;
        };
        description: {
          content: string | null;
          length: number;
        };
        keywords: string[];
        favicon: string | null;
        canonical: string | null;
      };
      headings: {
        h1: Array<{ content: string; length: number; _id: string }>;
        h2: any[];
        h3: any[];
        h4: any[];
        h5: any[];
        h6: any[];
      };
      links: {
        total: number;
        internal: number;
        external: number;
        broken: any[];
      };
      performance: {
        pageSize: number;
      };
      technical: {
        ssl: boolean;
        redirects: number;
      };
      robotsTxt: {
        exists: boolean;
        error?: string;
      };
      sitemap: {
        exists: boolean;
        error?: string;
      };
      images: any[];
    };
    summary?: {
      score: number;
      criticalIssues: number;
      warnings: number;
      passed: number;
      recommendations: Array<{
        type: string;
        severity: 'critical' | 'warning' | 'info';
        description: string;
        impact: string;
        howToFix: string;
        _id: string;
      }>;
    };
    error?: string;
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://seo-audit-backend.onrender.com';
const API_URL = API_BASE_URL.replace(/\/+$/, '');

const API_ENDPOINTS = {
  audit: `${API_URL}/api/audit`,
  status: (id: string) => `${API_URL}/api/audit/${id}`,
  health: `${API_URL}/health`
};

const commonFetchConfig = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

export const auditService = {
  startAudit: async (formData: AuditFormData): Promise<AuditResponse> => {
    try {
      const response = await fetch(API_ENDPOINTS.audit, {
        method: 'POST',
        ...commonFetchConfig,
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Start audit error:', error);
      throw error instanceof Error ? error : new Error('Failed to start audit');
    }
  },

  getAuditStatus: async (id: string): Promise<AuditStatusResponse> => {
    try {
      const response = await fetch(API_ENDPOINTS.status(id), {
        ...commonFetchConfig,
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: AuditStatusResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Get audit status error:', error);
      throw error instanceof Error ? error : new Error('Failed to get audit status');
    }
  },

  healthCheck: async (): Promise<boolean> => {
    try {
      const response = await fetch(API_ENDPOINTS.health, {
        ...commonFetchConfig,
        method: 'GET'
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.status === 'ok';
    } catch (error) {
      console.error('Health check error:', error);
      return false;
    }
  }
};