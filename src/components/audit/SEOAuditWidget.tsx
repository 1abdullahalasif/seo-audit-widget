// src/components/audit/SEOAuditWidget.tsx
import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { auditService } from '@/services/auditService';

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

interface AuditResults {
  meta: {
    title: MetaTag;
    description: MetaTag;
  };
  headings: {
    [key: string]: Array<{
      content: string;
      length: number;
    }>;
  };
  images: Array<{
    src: string;
    alt: string;
    hasAlt: boolean;
  }>;
  technical: {
    ssl: boolean;
    headers: {
      server: string;
      contentType: string;
      cacheControl: string;
    };
  };
  robotsTxt: {
    exists: boolean;
    hasSitemap: boolean;
  };
  sitemap: {
    exists: boolean;
    urlCount?: number;
  };
  performance: {
    loadTime: number;
    domContentLoaded: number;
    firstPaint: number;
  };
  seo: {
    score: number;
    issues: Array<{
      type: string;
      severity: 'critical' | 'warning' | 'info';
      description: string;
    }>;
  };
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

const SEOAuditWidget: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    websiteUrl: '',
    email: '',
    name: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [auditStatus, setAuditStatus] = useState<'idle' | 'loading' | 'completed' | 'error'>('idle');
  const [results, setResults] = useState<AuditResults | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    checkBackendStatus();
  }, []);

  const checkBackendStatus = async () => {
    const isUp = await auditService.healthCheck();
    if (!isUp) {
      setAuditStatus('error');
      setErrorMessage('Service is temporarily unavailable. Please try again later.');
    }
  };

  const validateForm = (): { isValid: boolean; errors: FormErrors } => {
    const newErrors: FormErrors = {};

    // Website URL validation
    if (!formData.websiteUrl) {
      newErrors.websiteUrl = 'Website URL is required';
    } else if (!formData.websiteUrl.match(/^https?:\/\/.+\..+/)) {
      newErrors.websiteUrl = 'Please enter a valid URL';
    }

    // Name validation
    if (!formData.name) {
      newErrors.name = 'Name is required';
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    return { 
      isValid: Object.keys(newErrors).length === 0, 
      errors: newErrors 
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { isValid, errors } = validateForm();
    if (!isValid) {
      setErrors(errors);
      return;
    }

    setAuditStatus('loading');
    setErrorMessage(null);

    try {
      const response = await auditService.startAudit(formData);
      if (response.success && response.auditId) {
        pollAuditStatus(response.auditId);
      } else {
        throw new Error('Failed to start audit');
      }
    } catch (error) {
      setAuditStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
  };

  const pollAuditStatus = async (id: string, attempt = 0) => {
    try {
      const response = await auditService.getAuditStatus(id);

      if (response.audit.status === 'completed' && response.audit.results) {
        setAuditStatus('completed');
        setResults(response.audit.results);
      } else if (response.audit.status === 'failed') {
        setAuditStatus('error');
        setErrorMessage(response.audit.error || 'Audit failed');
      } else if (attempt < 30) { // Limit polling to 1 minute
        setTimeout(() => pollAuditStatus(id, attempt + 1), 2000);
      } else {
        throw new Error('Audit timed out');
      }
    } catch (error) {
      setAuditStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to get audit status');
    }
  };

  const resetForm = () => {
    setFormData({
      websiteUrl: '',
      email: '',
      name: ''
    });
    setAuditStatus('idle');
    setResults(null);
    setErrorMessage(null);
    setErrors({});
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

        {auditStatus === 'loading' && (
          <div className="text-center">
            <Clock className="w-16 h-16 mx-auto text-[#ff9270] animate-spin" />
            <h2 className="mt-4 text-xl font-semibold">Analyzing Your Website</h2>
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

            {/* Technical SEO */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Technical SEO</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">SSL Security</p>
                  <p className={`text-sm ${results.technical.ssl ? 'text-green-600' : 'text-red-600'}`}>
                    {results.technical.ssl ? 'Secure' : 'Not Secure'}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Robots.txt</p>
                  <p className={`text-sm ${results.robotsTxt.exists ? 'text-green-600' : 'text-yellow-600'}`}>
                    {results.robotsTxt.exists ? 'Present' : 'Missing'}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Sitemap</p>
                  <p className={`text-sm ${results.sitemap.exists ? 'text-green-600' : 'text-yellow-600'}`}>
                    {results.sitemap.exists ? 'Present' : 'Missing'}
                    {results.sitemap.urlCount && ` (${results.sitemap.urlCount} URLs)`}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Page Load Time</p>
                  <p className="text-sm">{results.performance.loadTime}ms</p>
                </div>
              </div>
            </div>

            {/* Issues */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Issues Found</h3>
              <div className="space-y-4">
                {results.seo.issues.map((issue, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg ${
                      issue.severity === 'critical' ? 'bg-red-50' :
                      issue.severity === 'warning' ? 'bg-yellow-50' :
                      'bg-blue-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-medium">{issue.type}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        issue.severity === 'critical' ? 'bg-red-100 text-red-800' :