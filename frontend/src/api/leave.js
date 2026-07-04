import apiClient from './client'

export const leaveApi = {
  apply: async (payload) => (await apiClient.post('/leaves/apply', payload)).data,
  myHistory: async () => (await apiClient.get('/leaves/me')).data,
  all: async (status) => (await apiClient.get('/leaves', { params: status ? { status } : {} })).data,
  approve: async (id, comment) => (await apiClient.put(`/leaves/${id}/approve`, { comment })).data,
  reject: async (id, comment) => (await apiClient.put(`/leaves/${id}/reject`, { comment })).data,
  notifications: async () => (await apiClient.get('/notifications')).data,
  markRead: async (id) => (await apiClient.put(`/notifications/${id}/read`)).data,
}

