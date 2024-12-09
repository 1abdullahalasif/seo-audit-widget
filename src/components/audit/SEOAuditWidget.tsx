// src/components/audit/SEOAuditWidget.tsx
import React, { useState } from 'react';
import { Search, CheckCircle, AlertCircle, Clock } from 'lucide-react';

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

interface AuditResults {
  meta: {
    title: {
      content: string;
      length: number;
      status: string;
    };
    description: {
      content: string;
      length: number;
      status: string;
    };
  };
  seo: {
    score: number;
    issues: Array<{
      type: string;
      severity: string;
      description: string;
    }>;
  };
}

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
      const response = await fetch('https://seo-audit-backend.onrender.com/api/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to start audit');
      }

      if (data.success) {
        pollAuditStatus(data.auditId);
      } else {
        throw new Error(data.message || 'Failed to start audit');
      }
    } catch (error) {
      setAuditStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
  };

  const pollAuditStatus = async (id: string) => {
    try {
      const response = await fetch(`https://seo-audit-backend.onrender.com/api/audit/${id}`);
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
        setTimeout(() => pollAuditStatus(id), 2000);
      }
    } catch (error) {
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

        {auditStatus === 'loading' && (
          <div className="text-center">
            <Clock className="w-16 h-16 mx-auto text-[#ff9270] animate-spin" />
            <h2 className="mt-4 text-xl font-semibold">Analyzing Your Website</h2>
            <p className="mt-2 text-gray-600">This may take a few minutes...</p>
          </div>
        )}

        {auditStatus === 'completed' && results && (
          <div className="space-y-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
              <h2 className="text-2xl font-bold">Audit Results</h2>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">SEO Score</h3>
              <div className="text-5xl font-bold text-center">
                {results.seo.score}/100
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Issues Found</h3>
              <div className="space-y-4">
                {results.seo.issues.map((issue, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg ${
                      issue.severity === 'critical'
                        ? 'bg-red-50'
                        : issue.severity === 'warning'
                        ? 'bg-yellow-50'
                        : 'bg-blue-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-medium">{issue.type}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          issue.severity === 'critical'
                            ? 'bg-red-100 text-red-800'
                            : issue.severity === 'warning'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {issue.severity}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{issue.description}</p>
                  </div>
                ))}
              </div>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default SEOAuditWidget;