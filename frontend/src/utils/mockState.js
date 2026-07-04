// Mock State Management for HRMS Dashboard (localStorage based)

const getStoredItem = (key, defaultValue) => {
  const item = localStorage.getItem(key);
  if (!item) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(item);
  } catch (e) {
    return defaultValue;
  }
};

const setStoredItem = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Initial Default Mock Data
const DEFAULT_ATTENDANCE = [
  { id: '1', date: '2026-06-29', checkIn: '09:00', checkOut: '17:30', hours: 8.5 },
  { id: '2', date: '2026-06-30', checkIn: '08:55', checkOut: '17:00', hours: 8.08 },
  { id: '3', date: '2026-07-01', checkIn: '09:15', checkOut: '18:00', hours: 8.75 },
  { id: '4', date: '2026-07-02', checkIn: '09:00', checkOut: '17:00', hours: 8.0 },
  { id: '5', date: '2026-07-03', checkIn: '08:45', checkOut: '17:15', hours: 8.5 },
];

const DEFAULT_LEAVES = [
  {
    id: 'l1',
    employeeId: 'EMP-002',
    employeeName: 'Jane Smith',
    type: 'Vacation',
    startDate: '2026-07-10',
    endDate: '2026-07-15',
    status: 'Pending',
    reason: 'Family trip',
    appliedDate: '2026-07-01',
  },
  {
    id: 'l2',
    employeeId: 'EMP-003',
    employeeName: 'Bob Johnson',
    type: 'Sick',
    startDate: '2026-07-05',
    endDate: '2026-07-06',
    status: 'Pending',
    reason: 'Dental surgery',
    appliedDate: '2026-07-03',
  },
  {
    id: 'l3',
    employeeId: 'EMP-001',
    employeeName: 'John Doe',
    type: 'Casual',
    startDate: '2026-06-15',
    endDate: '2026-06-16',
    status: 'Approved',
    reason: 'Personal urgent work',
    appliedDate: '2026-06-10',
  }
];

const DEFAULT_PAYROLL = [
  { id: 'p1', month: 'June', year: 2026, basePay: 5000, allowances: 800, deductions: 450, netSalary: 5350, status: 'Paid' },
  { id: 'p2', month: 'May', year: 2026, basePay: 5000, allowances: 600, deductions: 450, netSalary: 5150, status: 'Paid' },
  { id: 'p3', month: 'April', year: 2026, basePay: 5000, allowances: 600, deductions: 450, netSalary: 5150, status: 'Paid' },
];

const DEFAULT_NOTIFICATIONS = [
  { id: 'n1', userId: 'all', title: 'Welcome to PeopleFlow', message: 'Explore your new HRMS dashboard portals.', read: false, date: '2026-07-01T09:00:00Z' },
  { id: 'n2', userId: 'hr', title: 'New Leave Request', message: 'Jane Smith submitted a Vacation leave request.', read: false, date: '2026-07-01T10:15:00Z' },
  { id: 'n3', userId: 'EMP-001', title: 'Leave Approved', message: 'Your Casual leave request for June 15-16 has been approved.', read: true, date: '2026-06-12T14:30:00Z' },
];

const DEFAULT_USERS_LIST = [
  { id: 'u1', employee_id: 'EMP-001', full_name: 'John Doe', email: 'john@peopleflow.com', role: 'employee', status: 'Active' },
  { id: 'u2', employee_id: 'EMP-002', full_name: 'Jane Smith', email: 'jane@peopleflow.com', role: 'hr', status: 'Active' },
  { id: 'u3', employee_id: 'EMP-003', full_name: 'Bob Johnson', email: 'bob@peopleflow.com', role: 'employee', status: 'Active' },
  { id: 'u4', employee_id: 'EMP-004', full_name: 'Alice Williams', email: 'alice@peopleflow.com', role: 'admin', status: 'Active' },
];

const DEFAULT_SYSTEM_LOGS = [
  { id: 'sl1', action: 'User login', user: 'admin@peopleflow.com', timestamp: '2026-07-04T09:45:00Z', details: 'IP: 192.168.1.5' },
  { id: 'sl2', action: 'Database backup', user: 'System', timestamp: '2026-07-03T23:00:00Z', details: 'Backup file: backup_20260703.sql' },
  { id: 'sl3', action: 'Role Updated', user: 'alice@peopleflow.com', timestamp: '2026-07-02T15:20:00Z', details: 'Updated John Doe to HR' },
];

export const mockState = {
  // Attendance
  getAttendance: () => getStoredItem('pf_attendance', DEFAULT_ATTENDANCE),
  saveAttendance: (data) => setStoredItem('pf_attendance', data),
  clockIn: (employeeId) => {
    const status = getStoredItem('pf_clock_status', { isClockedIn: false, clockInTime: null });
    status.isClockedIn = true;
    status.clockInTime = new Date().toISOString();
    setStoredItem('pf_clock_status', status);
  },
  clockOut: (employeeId, hours = 8) => {
    const status = getStoredItem('pf_clock_status', { isClockedIn: false, clockInTime: null });
    const attendance = mockState.getAttendance();
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Add attendance log
    const newRecord = {
      id: Math.random().toString(36).substring(2, 9),
      date: todayStr,
      checkIn: status.clockInTime ? new Date(status.clockInTime).toTimeString().substring(0, 5) : '09:00',
      checkOut: new Date().toTimeString().substring(0, 5),
      hours: parseFloat(hours.toFixed(2))
    };
    
    attendance.push(newRecord);
    mockState.saveAttendance(attendance);

    status.isClockedIn = false;
    status.clockInTime = null;
    setStoredItem('pf_clock_status', status);
  },
  getClockStatus: () => getStoredItem('pf_clock_status', { isClockedIn: false, clockInTime: null }),

  // Leave Requests
  getLeaves: () => getStoredItem('pf_leaves', DEFAULT_LEAVES),
  saveLeaves: (data) => setStoredItem('pf_leaves', data),
  addLeaveRequest: (request) => {
    const leaves = mockState.getLeaves();
    const newRequest = {
      id: 'l_' + Math.random().toString(36).substring(2, 9),
      status: 'Pending',
      appliedDate: new Date().toISOString().split('T')[0],
      ...request
    };
    leaves.push(newRequest);
    mockState.saveLeaves(leaves);

    // Also trigger HR notification
    mockState.addNotification({
      userId: 'hr',
      title: 'New Leave Request',
      message: `${request.employeeName} submitted a ${request.type} leave request.`
    });
  },
  updateLeaveStatus: (id, status) => {
    const leaves = mockState.getLeaves();
    const index = leaves.findIndex(l => l.id === id);
    if (index !== -1) {
      leaves[index].status = status;
      mockState.saveLeaves(leaves);

      // Notify the employee
      mockState.addNotification({
        userId: leaves[index].employeeId,
        title: `Leave ${status}`,
        message: `Your ${leaves[index].type} leave request from ${leaves[index].startDate} to ${leaves[index].endDate} has been ${status.toLowerCase()}.`
      });
    }
  },
  getLeaveBalances: () => getStoredItem('pf_leave_balances', {
    vacation: { total: 15, used: 3, remaining: 12 },
    sick: { total: 10, used: 2, remaining: 8 },
    casual: { total: 7, used: 2, remaining: 5 },
  }),
  saveLeaveBalances: (data) => setStoredItem('pf_leave_balances', data),

  // Payroll
  getPayroll: () => getStoredItem('pf_payroll', DEFAULT_PAYROLL),
  savePayroll: (data) => setStoredItem('pf_payroll', data),

  // Notifications
  getNotifications: (userId, role) => {
    const list = getStoredItem('pf_notifications', DEFAULT_NOTIFICATIONS);
    return list.filter(n => n.userId === 'all' || n.userId === userId || (n.userId === 'hr' && role === 'hr') || (n.userId === 'admin' && role === 'admin'));
  },
  addNotification: (notification) => {
    const list = getStoredItem('pf_notifications', DEFAULT_NOTIFICATIONS);
    const newNotif = {
      id: 'n_' + Math.random().toString(36).substring(2, 9),
      read: false,
      date: new Date().toISOString(),
      ...notification
    };
    list.unshift(newNotif);
    setStoredItem('pf_notifications', list);
  },
  markAllNotificationsRead: (userId, role) => {
    const list = getStoredItem('pf_notifications', DEFAULT_NOTIFICATIONS);
    const updated = list.map(n => {
      if (n.userId === 'all' || n.userId === userId || (n.userId === 'hr' && role === 'hr') || (n.userId === 'admin' && role === 'admin')) {
        return { ...n, read: true };
      }
      return n;
    });
    setStoredItem('pf_notifications', updated);
  },

  // Users List (Admin user dashboard management)
  getUsersList: () => getStoredItem('pf_users', DEFAULT_USERS_LIST),
  saveUsersList: (data) => setStoredItem('pf_users', data),
  updateUserRole: (id, newRole) => {
    const users = mockState.getUsersList();
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      const oldRole = users[index].role;
      users[index].role = newRole;
      mockState.saveUsersList(users);

      mockState.addSystemLog({
        action: 'Role Updated',
        user: 'admin@peopleflow.com',
        details: `Updated ${users[index].full_name} from ${oldRole} to ${newRole}`
      });
    }
  },

  // System Logs
  getSystemLogs: () => getStoredItem('pf_system_logs', DEFAULT_SYSTEM_LOGS),
  addSystemLog: (log) => {
    const logs = getStoredItem('pf_system_logs', DEFAULT_SYSTEM_LOGS);
    const newLog = {
      id: 'sl_' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      ...log
    };
    logs.unshift(newLog);
    setStoredItem('pf_system_logs', logs);
  }
};
