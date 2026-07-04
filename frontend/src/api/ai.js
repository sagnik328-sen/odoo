import apiClient from './client'

export const aiApi = {
  chat: async (message) => (await apiClient.post('/ai/chat', { message })).data,
}
