// src/components/audit/SEOAuditWidget.tsx
import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, AlertCircle, Clock, Shield, Globe, Timer, Image } from 'lucide-react';

interface FormData {
  websiteUrl: string;
  email: string;
  name: string;
}

interface FormErrors {
  websiteUrl?: string;
  email?: string;
  name?: string;
}

interface MetaTag {
  content: string;
  length: number;
  status: string;
}

interface ImageData {
  src: string;
  alt: string;
  hasAlt: boolean;
  dimensions?: {
    width: number;
    height: number;
  };
}

interface TechnicalData {
  ssl: boolean;
  headers: {
    server: string;
    contentType: string;
    cacheControl: string;
  };
}

interface RobotsTxtData {
  exists: boolean;
  hasSitemap: boolean;
  content?: string;
  error?: string;
}

interface SitemapData {
  exists: boolean;
  urlCount?: number;
  error?: string;
}

interface PerformanceData {
  loadTime: number;
  domContentLoaded: number;
  firstPaint: number;
}

interface SEOIssue {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  description: string;
}

interface AuditResults {
  meta: {
    title: MetaTag;
    description: MetaTag;
  };
  images: ImageData[];
  technical: TechnicalData;
  robotsTxt: RobotsTxtData;
  sitemap: SitemapData;
  performance: PerformanceData;
  seo: {
    score: number;
    issues: SEOIssue[];
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://seo-audit-backend.onrender.com/api';
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

const SEOAuditWidget: React.FC = () => {
  const [isBackendUp, setIsBackendUp] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    websiteUrl: '',
    email: '',
    name: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [auditStatus, setAuditStatus] = useState<'idle' | 'loading' | 'retrying' | 'completed' | 'error'>('idle');
  const [results, setResults] = useState<AuditResults | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    checkBackendStatus();
    const keepAliveInterval = setInterval(checkBackendStatus, 300000);
    return () => clearInterval(keepAliveInterval);
  }, []);

  const checkBackendStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/health`);
      setIsBackendUp(response.ok);
    } catch (error) {
      console.error('Backend health check failed:', error);
      setIsBackendUp(false);
    }
  };

  const validateForm = (): { isValid: boolean; errors: FormErrors } => {
    const newErrors: FormErrors = {};

    if (!formData.websiteUrl) {
      newErrors.websiteUrl = 'Website URL is required';
    } else if (!formData.websiteUrl.match(/^https?:\/\/.+\..+/)) {
      newErrors.websiteUrl = 'Please enter a valid URL';
    }

    if (!formData.name) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isBackendUp) {
      setErrorMessage('Service is temporarily unavailable. Please try again later.');
      setAuditStatus('error');
      return;
    }

    const { isValid, errors } = validateForm();
    if (!isValid) {
      setErrors(errors);
      return;
    }

    setAuditStatus('loading');
    setErrorMessage(null);
    setRetryCount(0);

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          setAuditStatus('retrying');
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }

        const response = await fetch(`${API_URL}/audit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...formData,
            companyDomain: new URL(formData.websiteUrl).hostname
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to start audit');
        }

        if (data.success) {
          setRetryCount(0);
          pollAuditStatus(data.auditId);
          return;
        }
      } catch (error) {
        console.error(`Attempt ${attempt + 1} failed:`, error);
        setRetryCount(attempt + 1);
        
        if (attempt === MAX_RETRIES - 1) {
          setAuditStatus('error');
          setErrorMessage('Service temporarily unavailable. Please try again in a few minutes.');
        }
      }
    }
  };

  const pollAuditStatus = async (id: string, pollAttempt = 0) => {
    try {
      const response = await fetch(`${API_URL}/audit/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch audit status');
      }

      if (data.audit.status === 'completed') {
        setAuditStatus('completed');
        setResults(data.audit.results);
      } else if (data.audit.status === 'failed') {
        setAuditStatus('error');
        setErrorMessage(data.audit.error || 'Audit failed');
      } else {
        if (pollAttempt < 30) {
          setTimeout(() => pollAuditStatus(id, pollAttempt + 1), 2000);
        } else {
          throw new Error('Audit timed out');
        }
      }
    } catch (error) {
      console.error('Status polling error:', error);
      setAuditStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to get audit status');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Free SEO Audit Tool</h2>
        
        {auditStatus === 'idle' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700">
                Website URL *
              </label>
              <input
                type="url"
                id="websiteUrl"
                className={`mt-1 block w-full rounded-md border ${
                  errors.websiteUrl ? 'border-red-500' : 'border-gray-300'
                } p-2 focus:ring-[#ff9270] focus:border-[#ff9270]`}
                value={formData.websiteUrl}
                onChange={(e) => {
                  setFormData({ ...formData, websiteUrl: e.target.value });
                  if (errors.websiteUrl) {
                    const { websiteUrl, ...restErrors } = errors;
                    setErrors(restErrors);
                  }
                }}
                placeholder="https://example.com"
                required
              />
              {errors.websiteUrl && (
                <p className="mt-1 text-sm text-red-500">{errors.websiteUrl}</p>
              )}
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Your Name *
              </label>
              <input
                type="text"
                id="name"
                className={`mt-1 block w-full rounded-md border ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                } p-2 focus:ring-[#ff9270] focus:border-[#ff9270]`}
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) {
                    const { name, ...restErrors } = errors;
                    setErrors(restErrors);
                  }
                }}
                placeholder="John Doe"
                required
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                className={`mt-1 block w-full rounded-md border ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                } p-2 focus:ring-[#ff9270] focus:border-[#ff9270]`}
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errors.email) {
                    const { email, ...restErrors } = errors;
                    setErrors(restErrors);
                  }
                }}
                placeholder="john@example.com"
                required
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md
                text-white bg-[#ff9270] hover:bg-opacity-90 focus:outline-none focus:ring-2 
                focus:ring-offset-2 focus:ring-[#ff9270]"
            >
              <Search className="w-5 h-5 mr-2" />
              Start Free Audit
            </button>
          </form>
        )}

        {(auditStatus === 'loading' || auditStatus === 'retrying') && (
          <div className="text-center">
            <Clock className="w-16 h-16 mx-auto text-[#ff9270] animate-spin" />
            <h2 className="mt-4 text-xl font-semibold">
              {auditStatus === 'retrying' 
                ? `Retrying... (Attempt ${retryCount}/${MAX_RETRIES})`
                : 'Analyzing Your Website'
              }
            </h2>
            <p className="mt-2 text-gray-600">This may take a few minutes...</p>
          </div>
        )}

        {auditStatus === 'completed' && results && (
          <div className="space-y-8">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
              <h2 className="text-2xl font-bold">Audit Results</h2>
            </div>

            {/* Overall Score */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">SEO Score</h3>
              <div className={`text-6xl font-bold text-center ${
                results.seo.score >= 90 ? 'text-green-600' :
                results.seo.score >= 70 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {results.seo.score}/100
              </div>
            </div>

            {/* Meta Tags */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Meta Tags</h3>
              <div className="space-y-4">
                <div>
                  <p className="font-medium">Title Tag</p>
                  <p className="text-sm text-gray-600">{results.meta.title.content || 'Missing'}</p>
                  <p className={`text-sm mt-1 ${
                    results.meta.title.status === 'good' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    Length: {results.meta.title.length} characters 
                    {results.meta.title.length < 50 ? ' (Too short)' : 
                     results.meta.title.length > 60 ? ' (Too long)' : ' (Good)'}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Meta Description</p>
                  <p className="text-sm text-gray-600">{results.meta.description.content || 'Missing'}</p>
                  <p className={`text-sm mt-1 ${
                    results.meta.description.status === 'good' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    Length: {results.meta.description.length} characters
                    {results.meta.description.length < 120 ? ' (Too short)' : 
                     results.meta.description.length > 160 ? ' (Too long)' : ' (Good)'}
                  </p>
                </div>
              </div>
            </div>

            {/* Images Analysis */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Images</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">Total Images</p>
                  <p className="text-2xl">{results.images?.length || 0}</p>
                </div>
                <div>
                  <p className="font-medium">Missing Alt Text</p>
                  <p className="text-2xl text-yellow-600">
                    {results.images?.filter(img => !img.hasAlt).length || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Technical