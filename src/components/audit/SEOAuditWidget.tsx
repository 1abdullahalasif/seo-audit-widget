// src/components/audit/SEOAuditWidget.tsx
import React, { useState } from 'react';
import { Search, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface FormErrors {
  websiteUrl?: string;
  email?: string;
  name?: string;
  companyDomain?: string;
}

const SEOAuditWidget: React.FC = () => {
  const [formData, setFormData] = useState({
    websiteUrl: '',
    email: '',
    name: '',
    companyDomain: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [auditStatus, setAuditStatus] = useState<'idle' | 'loading' | 'completed' | 'error'>('idle');
  const [results, setResults] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validateForm = () => {
    const newErrors: FormErrors = {};
    
    // Website URL validation
    if (!formData.websiteUrl) {
      newErrors.websiteUrl = 'Website URL is required';
    } else if (!formData.websiteUrl.match(/^https?:\/\/.+\..+/)) {
      newErrors.websiteUrl = 'Please enter a valid URL';
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Name validation
    if (!formData.name) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Company domain validation
    if (!formData.companyDomain) {
      newErrors.companyDomain = 'Company domain is required';
    } else if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(formData.companyDomain)) {
      newErrors.companyDomain = 'Please enter a valid domain';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setAuditStatus('loading');
    setErrorMessage(null);

    try {
      const response = await fetch(process.env.NEXT_PUBLIC_API_URL + '/audit', {
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/audit/${id}`);
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
        <h2 className="text-2xl font-bold text-brand-dark mb-6">Free SEO Audit Tool</h2>
        
        {auditStatus === 'idle' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="websiteUrl" className="block text-sm font-medium text-brand-gray">
                Website URL
              </label>
              <input
                type="url"
                id="websiteUrl"
                className={`mt-1 block w-full rounded-md border ${errors.websiteUrl ? 'border-red-500' : 'border-brand-gray-light'} 
                          shadow-sm focus:border-brand-primary focus:ring focus:ring-brand-primary focus:ring-opacity-50 p-2`}
                value={formData.websiteUrl}
                onChange={(e) => {
                  setFormData({ ...formData, websiteUrl: e.target.value });
                  if (errors.websiteUrl) {
                    setErrors({ ...errors, websiteUrl: undefined });
                  }
                }}
                placeholder="https://example.com"
              />
              {errors.websiteUrl && (
                <p className="mt-1 text-sm text-red-500">{errors.websiteUrl}</p>
              )}
            </div>

            {/* Add similar validation UI for other fields */}

            <button
              type="submit"
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent 
                       rounded-md shadow-sm text-white bg-brand-primary hover:bg-opacity-90 
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
            >
              <Search className="w-5 h-5 mr-2" />
              Start Free Audit
            </button>
          </form>
        )}

        {auditStatus === 'loading' && (
          <div className="text-center">
            <Clock className="w-16 h-16 mx-auto text-brand-primary animate-spin" />
            <h2 className="mt-4 text-xl font-semibold text-brand-dark">Analyzing Your Website</h2>
            <p className="mt-2 text-brand-gray">This may take a few minutes...</p>
          </div>
        )}

        {/* Add your results display here */}
      </div>
    </div>
  );
};

export default SEOAuditWidget;