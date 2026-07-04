import { apiClient } from "./client";

export const reportsApi = {
  // Dashboard
  getDashboardSummary: () => apiClient.get("/reports/dashboard"),

  // Reports
  getAttendanceReport: (params) => apiClient.get("/reports/attendance", { params }),
  getLeaveReport: (params) => apiClient.get("/reports/leave", { params }),
  getPayrollReport: (params) => apiClient.get("/reports/payroll", { params }),
  getEmployeeReport: (params) => apiClient.get("/reports/employees", { params }),

  // Analytics
  getAttendanceAnalytics: () => apiClient.get("/reports/analytics/attendance"),
  getLeaveAnalytics: () => apiClient.get("/reports/analytics/leave"),
  getPayrollAnalytics: () => apiClient.get("/reports/analytics/payroll"),
  getEmployeeAnalytics: () => apiClient.get("/reports/analytics/employees"),

  // Exports
  exportAttendanceReport: (format, params) =>
    apiClient.get(`/reports/export/attendance/${format}`, {
      params,
      responseType: "blob",
    }),
  exportEmployeeReport: (format) =>
    apiClient.get(`/reports/export/employees/${format}`, {
      responseType: "blob",
    }),
};

// Helper function to download files
export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
