import apiClient from './client';

export const settingsApi = {
  getCompanySettings: async () => {
    const response = await apiClient.get('/settings/company');
    return response.data;
  },

  updateCompanySettings: async (data) => {
    const response = await apiClient.put('/settings/company', data);
    return response.data;
  },

  getLeavePolicy: async () => {
    const response = await apiClient.get('/settings/leave-policy');
    return response.data;
  },

  updateLeavePolicy: async (data) => {
    const response = await apiClient.put('/settings/leave-policy', data);
    return response.data;
  },

  getWorkingHours: async () => {
    const response = await apiClient.get('/settings/working-hours');
    return response.data;
  },

  updateWorkingHours: async (data) => {
    const response = await apiClient.put('/settings/working-hours', data);
    return response.data;
  },

  getHolidays: async () => {
    const response = await apiClient.get('/settings/holidays');
    return response.data;
  },

  addHoliday: async (data) => {
    const response = await apiClient.post('/settings/holidays', data);
    return response.data;
  },

  removeHoliday: async (holidayId) => {
    const response = await apiClient.delete(`/settings/holidays/${holidayId}`);
    return response.data;
  },

  getRolePermissions: async () => {
    const response = await apiClient.get('/settings/role-permissions');
    return response.data;
  },

  updateRolePermissions: async (role, data) => {
    const response = await apiClient.put(`/settings/role-permissions/${role}`, data);
    return response.data;
  },
};
