import apiClient from './client'

export const notificationApi = {
  list: async () => (await apiClient.get('/notifications')).data,
  markRead: async (id) => (await apiClient.put(`/notifications/${id}/read`)).data,
  markAllRead: async () => (await apiClient.put('/notifications/read-all')).data,
}
