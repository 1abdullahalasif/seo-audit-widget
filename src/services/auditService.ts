// src/services/auditService.ts

const API_URL = 'https://seo-audit-backend.onrender.com/api';

export const auditService = {
  startAudit: async (formData: any) => {
    const response = await fetch(`${API_URL}/audit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    return response.json();
  },

  getAuditStatus: async (id: string) => {
    const response = await fetch(`${API_URL}/audit/${id}`);
    return response.json();
  }
};