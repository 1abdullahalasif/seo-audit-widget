// src/components/audit/SEOAuditWidget.tsx
import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import ScoreCard from './results/ScoreCard';
import TechnicalSEOCard from './results/TechnicalSEOCard';
import { auditService } from 'src/services/auditService';
import type { SEOAuditResults } from '@/types/seo';
import { 
  calculateTechnicalScore,
  calculateOnPageScore,
  calculateOffPageScore,
  calculateAnalyticsScore,
  calculateAdvancedScore,
  calculateOverallScore 
} from 'src/utils/scoring';
import { 
  SCORE_THRESHOLDS,
  AUDIT_WEIGHTS,
  MAX_POLL_ATTEMPTS,
  POLL_INTERVAL,
  HEALTH_CHECK_INTERVAL 
} from 'src/utils/constants';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://seo-audit-backend.onrender.com/api';

const API_ENDPOINTS = {
  audit: `${API_URL}/audit`,
  status: (id: string) => `${API_URL}/audit/${id}`,
  health: `${API_URL}/health`,
};

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

const SEOAuditWidget: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    websiteUrl: '',
    email: '',
    name: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [auditStatus, setAuditStatus] = useState<'idle' | 'loading' | 'retrying' | 'completed' | 'error'>('idle');
  const [results, setResults] = useState<SEOAuditResults | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    checkBackendStatus();
    const keepAliveInterval = setInterval(checkBackendStatus, HEALTH_CHECK_INTERVAL);
    return () => clearInterval(keepAliveInterval);
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

    if (!formData.websiteUrl) {
      newErrors.websiteUrl = 'Website URL is required';
    } else if (!formData.websiteUrl.match(/^https?:\/\/.+\..+/)) {
      newErrors.websiteUrl = 'Please enter a valid URL';
    }

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email?.trim()) {
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
    setRetryCount(0);

    try {
      const response = await auditService.startAudit(formData);
      if (response.success && response.auditId) {
        pollAuditStatus(response.auditId);
      } else {
        throw new Error(response.message || 'Failed to start audit');
      }
    } catch (error) {
      console.error('Audit error:', error);
      setAuditStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
  };

  const pollAuditStatus = async (id: string, pollAttempt = 0) => {
    try {
      const response = await auditService.getAuditStatus(id);

      if (response.audit.status === 'completed' && response.audit.results) {
        setAuditStatus('completed');
        setResults(response.audit.results);
      } else if (response.audit.status === 'failed') {
        setAuditStatus('error');
        setErrorMessage(response.audit.error || 'Audit failed');
      } else if (pollAttempt < MAX_POLL_ATTEMPTS) {
        setTimeout(() => pollAuditStatus(id, pollAttempt + 1), POLL_INTERVAL);
      } else {
        throw new Error('Audit timed out');
      }
    } catch (error) {
      console.error('Status polling error:', error);
      setAuditStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to get audit status');
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= SCORE_THRESHOLDS.EXCELLENT) return 'text-green-600';
    if (score >= SCORE_THRESHOLDS.GOOD) return 'text-yellow-600';
    return 'text-red-600';
  };

  const resetForm = () => {
    setFormData({ websiteUrl: '', email: '', name: '' });
    setAuditStatus('idle');
    setResults(null);
    setErrorMessage(null);
    setErrors({});
  };

  // The component's JSX return
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
            {/* Overall Score */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Overall SEO Score</h2>
                <div className={`text-5xl font-bold ${getScoreColor(results.overallScore.score)}`}>
                  {results.overallScore.score}/100
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(results.overallScore.breakdown).map(([category, score]) => (
                  <div key={category} className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-500 capitalize">
                      {category.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
                      {score}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Score Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ScoreCard
                title="Technical SEO"
                {...calculateTechnicalScore(results.technical)}
              />

              <TechnicalSEOCard data={results.technical} />

              <ScoreCard
                title="On-Page SEO"
                {...calculateOnPageScore(results.onPage)}
              />

              <ScoreCard
                title="Off-Page SEO"
                {...calculateOffPageScore(results.offPage)}
              />

              <ScoreCard
                title="Analytics & Tracking"
                {...calculateAnalyticsScore(results.analytics)}
              />

              <ScoreCard
                title="Advanced SEO"
                {...calculateAdvancedScore(results.advanced)}
              />
            </div>

            {/* Issues and Recommendations */}
            {results.recommendations.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h3 className="text-xl font-bold mb-6">Critical Issues & Recommendations</h3>
                <div className="space-y-4">
                  {results.recommendations
                    .sort((a, b) => b.priority - a.priority)
                    .map((rec, index) => (
                      <div key={index} className={`p-4 rounded-lg ${
                        rec.category === 'critical' ? 'bg-red-50' :
                        rec.category === 'important' ? 'bg-yellow-50' :
                        'bg-blue-50'
                      }`}>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{rec.issue}</h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            rec.category === 'critical' ? 'bg-red-100 text-red-800' :
                            rec.category === 'important' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {rec.category}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">Impact: {rec.impact}</p>
                        <p className="text-sm text-gray-800">
                          Recommendation: {rec.recommendation}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="text-center">
              <button
                onClick={resetForm}
                className="px-6 py-3 bg-[#ff9270] text-white rounded-md hover:bg-opacity-90"
              >
                Run Another Audit
              </button>
            </div>
          </div>
        )}

        {auditStatus === 'error' && (
          <div className="text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-red-500" />
            <h2 className="mt-4 text-xl font-semibold text-red-700">Error</h2>
            <p className="mt-2 text-red-600">
              {errorMessage || 'An error occurred while analyzing your website.'}
            </p>
            <button
              onClick={resetForm}
              className="mt-4 px-6 py-2 text-[#ff9270] hover:text-opacity-90 rounded-md border border-[#ff9270]"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SEOAuditWidget;