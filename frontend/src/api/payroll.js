import apiClient from './client';

export const payrollApi = {
  generate: async (payload) => {
    const response = await apiClient.post('/payroll/generate', payload);
    return response.data;
  },

  me: async (page = 1, size = 10) => {
    const response = await apiClient.get('/payroll/me', { params: { page, size } });
    return response.data;
  },

  history: async (params = {}) => {
    const response = await apiClient.get('/payroll/history', { params });
    return response.data;
  },

  stats: async () => {
    const response = await apiClient.get('/payroll/stats');
    return response.data;
  },

  update: async (id, payload) => {
    const response = await apiClient.put(`/payroll/${id}`, payload);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/payroll/${id}`);
    return response.data;
  },

  downloadPdf: async (id, filename = 'payslip.pdf') => {
    const response = await apiClient.get(`/payroll/${id}/pdf`, { responseType: 'blob' });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    return response.data;
  }
};
