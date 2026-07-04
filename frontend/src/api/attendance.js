import apiClient from "./client";

export const attendanceApi = {
  checkIn: async () => {
    const response = await apiClient.post("/attendance/check-in");
    return response.data;
  },

  checkOut: async () => {
    const response = await apiClient.post("/attendance/check-out");
    return response.data;
  },

  getTodayAttendance: async () => {
    const response = await apiClient.get("/attendance/me/today");
    return response.data;
  },

  getWeekAttendance: async () => {
    const response = await apiClient.get("/attendance/me/week");
    return response.data;
  },

  getMonthAttendance: async (year, month) => {
    const response = await apiClient.get("/attendance/me/month", {
      params: { year, month }
    });
    return response.data;
  },

  getAttendanceHistory: async (startDate, endDate) => {
    const response = await apiClient.get("/attendance/me/history", {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  },

  getAllAttendance: async (filters = {}) => {
    const response = await apiClient.get("/attendance", { params: filters });
    return response.data;
  },

  updateAttendance: async (id, data) => {
    const response = await apiClient.put(`/attendance/${id}`, data);
    return response.data;
  },

  requestCorrection: async (data) => {
    const response = await apiClient.post("/attendance/correction", data);
    return response.data;
  },

  approveCorrection: async (id, approved) => {
    const response = await apiClient.put(`/attendance/correction/${id}/approve`, null, {
      params: { approved }
    });
    return response.data;
  }
};
