import apiClient from './client';

export const employeeApi = {
  getEmployees: async (params) => {
    const response = await apiClient.get('/employees', { params });
    return response.data;
  },

  getEmployee: async (userId) => {
    const response = await apiClient.get(`/employees/${userId}`);
    return response.data;
  },

  createEmployee: async (data) => {
    const response = await apiClient.post('/employees', data);
    return response.data;
  },

  updateEmployee: async (userId, data) => {
    const response = await apiClient.put(`/employees/${userId}`, data);
    return response.data;
  },

  deleteEmployee: async (userId) => {
    const response = await apiClient.delete(`/employees/${userId}`);
    return response.data;
  },

  uploadAvatar: async (userId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(`/employees/${userId}/upload-avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  uploadDocument: async (userId, name, file) => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('file', file);
    const response = await apiClient.post(`/employees/${userId}/upload-document`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteDocument: async (userId, documentId) => {
    const response = await apiClient.delete(`/employees/${userId}/documents/${document_id || documentId}`);
    return response.data;
  },
};
