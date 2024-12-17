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
        results?: SEOAuditResults;
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

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        console.error('Response not OK:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
        });

        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
        } catch (e) {
            console.error('Error parsing error response:', e);
        }
        throw new Error(errorMessage);
    }

    try {
        const responseText = await response.text();
        console.log('Raw response:', responseText);
        return JSON.parse(responseText);
    } catch (e) {
        console.error('Error parsing response:', e);
        throw new Error('Failed to parse server response');
    }
};

export const auditService = {
    startAudit: async (formData: AuditFormData): Promise<AuditResponse> => {
        try {
            console.log('Starting audit with URL:', API_ENDPOINTS.audit);
            console.log('Request payload:', formData);

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

    getAuditStatus: async (id: string): Promise<AuditStatusResponse> => {
        try {
            const statusUrl = API_ENDPOINTS.status(id);
            console.log('Checking audit status at URL:', statusUrl);

            const response = await fetch(statusUrl, {
                ...commonFetchConfig,
                method: 'GET'
            });

            console.log('Status response:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries())
            });

            const data = await handleResponse(response);
            console.log('Parsed status response:', data);

            if (data?.audit?.status === 'completed') {
                console.log('Audit completed, results:', data.audit.results);
            }

            return data;
        } catch (error) {
            console.error('Get audit status error:', error);
            throw error instanceof Error ? error : new Error('Failed to get audit status');
        }
    },

    healthCheck: async (): Promise<boolean> => {
        try {
            console.log('Checking health at:', API_ENDPOINTS.health);
            const response = await fetch(API_ENDPOINTS.health, {
                ...commonFetchConfig,
                method: 'GET'
            });

            console.log('Health check response:', {
                status: response.status,
                statusText: response.statusText
            });

            if (!response.ok) {
                return false;
            }

            const data = await handleResponse(response);
            return data.status === 'ok';
        } catch (error) {
            console.error('Health check error:', error);
            return false;
        }
    }
};