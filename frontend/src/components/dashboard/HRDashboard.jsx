import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mockState } from '../../utils/mockState';
import EmployeeDirectory from './EmployeeDirectory';
import { payrollApi } from '../../api/payroll';
import { employeeApi } from '../../api/employee';
import { notificationApi } from '../../api/notification';
import { attendanceApi } from '../../api/attendance';
import { 
  Users, Calendar, DollarSign, Bell, LogOut, User, 
  Plus, Check, X, ClipboardList, CheckCircle, AlertCircle, 
  Briefcase, TrendingUp, UserPlus, Zap
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  Tooltip, LineChart, Line, CartesianGrid
} from 'recharts';

const HRDashboard = () => {
  const { user, logout } = useAuth();

  // States
  const [leaves, setLeaves] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  // Payroll Management States
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [payrollStats, setPayrollStats] = useState(null);
  const [payrollActiveTab, setPayrollActiveTab] = useState('generate');
  const [employeesList, setEmployeesList] = useState([]);
  const [selectedEmpIdForPayroll, setSelectedEmpIdForPayroll] = useState('');
  
  // Payroll Form Fields
  const [payMonth, setPayMonth] = useState('July');
  const [payYear, setPayYear] = useState(2026);
  const [payBasic, setPayBasic] = useState(0);
  const [payAllowances, setPayAllowances] = useState(0);
  const [payBonuses, setPayBonuses] = useState(0);
  const [payDeductions, setPayDeductions] = useState(0);
  const [payTax, setPayTax] = useState(0);
  
  const [payrollMsg, setPayrollMsg] = useState({ type: '', text: '' });
  const [isProcessingPayroll, setIsProcessingPayroll] = useState(false);
  const [editingPayslip, setEditingPayslip] = useState(null);
  
  // Modals
  const [_isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Registration Form State
  const [newEmpId, setNewEmpId] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('employee');
  const [_registerError, setRegisterError] = useState('');
  const [_registerSuccess, setRegisterSuccess] = useState('');

  // Load Data
  const loadData = () => {
    setLeaves(mockState.getLeaves());
    setAttendance(mockState.getAttendance());
    setUsersList(mockState.getUsersList());
    setNotifications(mockState.getNotifications(user?.employee_id, 'hr'));
  };

  const fetchPayrollData = async () => {
    try {
      const historyRes = await payrollApi.history({ page: 1, size: 100 });
      setPayrollHistory(historyRes.items || []);
      
      const statsRes = await payrollApi.stats();
      setPayrollStats(statsRes);
      
      const empRes = await employeeApi.getEmployees({ size: 100 });
      setEmployeesList(empRes.items || []);
    } catch (err) {
      console.error("Failed to load payroll data:", err);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await notificationApi.list();
      setNotifications(data || []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      await fetchNotifications();
    } catch (err) {
      console.error("Failed to mark notifications read:", err);
    }
  };

  const handleMarkOneRead = async (id) => {
    try {
      await notificationApi.markRead(id);
      await fetchNotifications();
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const handleSendReminders = async () => {
    try {
      const res = await attendanceApi.remindAll();
      alert(res.message || "Successfully sent check-in reminders!");
      mockState.addSystemLog({
        action: 'Attendance Reminders',
        user: user.email,
        details: `Dispatched bulk clock-in reminders to ${res.count} employees.`
      });
      loadData();
    } catch (err) {
      console.error("Failed to send reminders:", err);
      alert("Failed to dispatch attendance reminders.");
    }
  };

  useEffect(() => {
    loadData();
    if (user) {
      fetchPayrollData();
      fetchNotifications();
    }
  // User identity is the intentional refresh boundary for this dashboard.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Actions
  const handleApproveLeave = (id) => {
    mockState.updateLeaveStatus(id, 'Approved');
    mockState.addSystemLog({
      action: 'Approve Leave',
      user: user.email,
      details: `Approved leave request ID: ${id}`
    });
    loadData();
  };

  const handleRejectLeave = (id) => {
    mockState.updateLeaveStatus(id, 'Rejected');
    mockState.addSystemLog({
      action: 'Reject Leave',
      user: user.email,
      details: `Rejected leave request ID: ${id}`
    });
    loadData();
  };

  const _handleRegisterEmployee = (e) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess('');

    if (!newEmpId || !newFullName || !newEmail) {
      setRegisterError('All fields are required.');
      return;
    }

    const emailExists = usersList.some(u => u.email.toLowerCase() === newEmail.toLowerCase());
    const empIdExists = usersList.some(u => u.employee_id.toLowerCase() === newEmpId.toLowerCase());

    if (emailExists || empIdExists) {
      setRegisterError('Employee ID or Email already registered.');
      return;
    }

    const newUser = {
      id: 'u_' + Math.random().toString(36).substring(2, 9),
      employee_id: newEmpId,
      full_name: newFullName,
      email: newEmail,
      role: newRole,
      status: 'Active'
    };

    const updatedList = [...usersList, newUser];
    mockState.saveUsersList(updatedList);
    setUsersList(updatedList);

    // System logs & notifications
    mockState.addSystemLog({
      action: 'Register Employee',
      user: user.email,
      details: `Registered employee: ${newFullName} (${newEmpId})`
    });

    mockState.addNotification({
      userId: 'all',
      title: 'New Team Member',
      message: `Welcome ${newFullName} to the team as a ${newRole}!`
    });

    // Reset Form
    setNewEmpId('');
    setNewFullName('');
    setNewEmail('');
    setNewRole('employee');
    setRegisterSuccess('Employee registered successfully!');
    
    setTimeout(() => {
      setRegisterSuccess('');
      setIsRegisterModalOpen(false);
    }, 1500);

    loadData();
  };

  const handleEmployeeSelectForPayroll = (empId) => {
    setSelectedEmpIdForPayroll(empId);
    if (!empId) {
      setPayBasic(0);
      setPayAllowances(0);
      setPayBonuses(0);
      setPayDeductions(0);
      setPayTax(0);
      return;
    }
    const emp = employeesList.find(e => e.id === empId);
    if (emp && emp.profile) {
      setPayBasic(emp.profile.base_salary || 0);
      setPayAllowances(emp.profile.allowances || 0);
      setPayBonuses(emp.profile.bonuses || 0);
      setPayDeductions(emp.profile.deductions || 0);
      setPayTax(emp.profile.tax || 0);
    }
  };

  const handleCreatePayslip = async (e) => {
    e.preventDefault();
    setPayrollMsg({ type: '', text: '' });
    if (!selectedEmpIdForPayroll) {
      setPayrollMsg({ type: 'error', text: 'Please select an employee' });
      return;
    }
    
    try {
      setIsProcessingPayroll(true);
      const payload = {
        user_id: selectedEmpIdForPayroll,
        month: payMonth,
        year: parseInt(payYear),
        basic_salary: parseFloat(payBasic) || 0,
        allowances: parseFloat(payAllowances) || 0,
        bonuses: parseFloat(payBonuses) || 0,
        deductions: parseFloat(payDeductions) || 0,
        tax: parseFloat(payTax) || 0
      };
      
      const created = await payrollApi.generate(payload);
      setPayrollMsg({ type: 'success', text: `Payslip generated successfully for ${created.employee_name}!` });
      
      mockState.addSystemLog({
        action: 'Disburse Salary',
        user: user.email,
        details: `Disbursed salary for ${created.employee_name} (${created.month} ${created.year}): Net ${created.net_salary}`
      });
      
      // Reset form
      setSelectedEmpIdForPayroll('');
      setPayBasic(0);
      setPayAllowances(0);
      setPayBonuses(0);
      setPayDeductions(0);
      setPayTax(0);
      
      await fetchPayrollData();
      loadData();
    } catch (err) {
      setPayrollMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to generate payslip' });
    } finally {
      setIsProcessingPayroll(false);
    }
  };

  const handleDeletePayslip = async (slipId, name) => {
    if (!window.confirm(`Are you sure you want to delete payslip for ${name}?`)) return;
    try {
      await payrollApi.delete(slipId);
      mockState.addSystemLog({
        action: 'Delete Payslip',
        user: user.email,
        details: `Deleted payslip record for ${name}`
      });
      await fetchPayrollData();
    } catch (err) {
      alert("Failed to delete payslip");
    }
  };

  const handleDownloadPdf = async (slipId, name, month, year) => {
    try {
      await payrollApi.downloadPdf(slipId, `payslip_${name.replace(/\s+/g, '_')}_${month.toLowerCase()}_${year}.pdf`);
    } catch (err) {
      alert("Failed to download PDF payslip");
    }
  };

  const handleOpenEditPayslip = (slip) => {
    setEditingPayslip({
      ...slip,
      basic_salary: slip.basic_salary,
      allowances: slip.allowances,
      bonuses: slip.bonuses,
      deductions: slip.deductions,
      tax: slip.tax,
      status: slip.status
    });
  };

  const handleSaveEditPayslip = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        basic_salary: parseFloat(editingPayslip.basic_salary) || 0,
        allowances: parseFloat(editingPayslip.allowances) || 0,
        bonuses: parseFloat(editingPayslip.bonuses) || 0,
        deductions: parseFloat(editingPayslip.deductions) || 0,
        tax: parseFloat(editingPayslip.tax) || 0,
        status: editingPayslip.status
      };
      await payrollApi.update(editingPayslip.id, payload);
      setEditingPayslip(null);
      await fetchPayrollData();
    } catch (err) {
      alert("Failed to update payslip");
    }
  };



  // Recharts Attendance Rate Simulation
  const attendanceRateData = [
    { day: 'Mon', rate: 96 },
    { day: 'Tue', rate: 94 },
    { day: 'Wed', rate: 97 },
    { day: 'Thu', rate: 93 },
    { day: 'Fri', rate: 95 },
  ];

  const pendingLeaves = leaves.filter(l => l.status === 'Pending');

  // Activity Feed (merging leaves and mock system events)
  const activities = [
    ...leaves.map(l => ({
      id: l.id,
      title: `Leave ${l.status}`,
      details: `${l.employeeName} requested ${l.type} starting ${l.startDate}`,
      timestamp: l.appliedDate,
      type: 'leave',
      badgeColor: l.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : l.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-rose-50 text-rose-700 border-rose-100'
    })),
    ...attendance.slice(-3).map(a => ({
      id: a.id,
      title: 'Clock In Log',
      details: `Work entry logged for employee on ${a.date}`,
      timestamp: a.date,
      type: 'attendance',
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-100'
    }))
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-800 p-8 text-white shadow-xl">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-600/30 blur-3xl"></div>
        <div className="absolute -bottom-24 -right-12 h-64 w-64 rounded-full bg-teal-600/30 blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="inline-block rounded-full bg-emerald-500/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
              HR Operations Portal
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              HR Manager: {user?.full_name}
            </h2>
            <p className="mt-2 text-emerald-100 max-w-xl">
              Track team attendance logs, review leave request applications, onboard new employees, and manage payroll cycles.
            </p>
          </div>
          
          <div className="flex gap-3 flex-wrap">
            <button 
              onClick={() => setIsRegisterModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-emerald-900 shadow-md transition hover:bg-emerald-50 hover:scale-105 active:scale-95"
            >
              <UserPlus className="h-4 w-4" /> Add Employee
            </button>
            <button 
              onClick={handleSendReminders}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:scale-105 active:scale-95"
            >
              <Bell className="h-4 w-4" /> Remind Clock-In
            </button>
            <button 
              onClick={() => setIsPayrollModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-teal-500 hover:scale-105 active:scale-95"
            >
              <DollarSign className="h-4 w-4" /> Run Payroll
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1 */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="p-3.5 bg-emerald-50 rounded-xl text-emerald-600">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Total Employees</span>
            <strong className="text-2xl text-gray-900">{usersList.length}</strong>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="p-3.5 bg-amber-50 rounded-xl text-amber-600">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Pending Leaves</span>
            <strong className="text-2xl text-gray-900">{pendingLeaves.length}</strong>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="p-3.5 bg-teal-50 rounded-xl text-teal-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Attendance Rate</span>
            <strong className="text-2xl text-gray-900">95.2%</strong>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="p-3.5 bg-indigo-50 rounded-xl text-indigo-600">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Active Shifts</span>
            <strong className="text-2xl text-gray-900">10 / {usersList.filter(u=>u.role==='employee').length}</strong>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Leave Approval Panel */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-50">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <ClipboardList className="h-5 w-5" />
              </span>
              Pending Leave Reviews
            </h3>
            <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded-full">
              Requires Approval
            </span>
          </div>

          <div className="space-y-4">
            {pendingLeaves.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                No leave requests awaiting approval. All caught up!
              </div>
            ) : (
              pendingLeaves.map(l => (
                <div key={l.id} className="p-4 border border-gray-100 rounded-xl hover:border-emerald-100 hover:bg-emerald-50/5 transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-gray-800">{l.employeeName}</strong>
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase tracking-wider">{l.employeeId}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Requested: <strong className="text-emerald-700">{l.type}</strong> from <strong>{l.startDate}</strong> to <strong>{l.endDate}</strong>
                    </p>
                    <p className="text-xs italic text-gray-400">" {l.reason} "</p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleRejectLeave(l.id)}
                      className="flex-1 sm:flex-none p-2 text-rose-600 hover:bg-rose-50 border border-rose-100 rounded-xl transition flex items-center justify-center gap-1.5 text-xs font-bold"
                    >
                      <X className="h-4 w-4" /> Reject
                    </button>
                    <button
                      onClick={() => handleApproveLeave(l.id)}
                      className="flex-1 sm:flex-none p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition flex items-center justify-center gap-1.5 text-xs font-bold shadow-sm"
                    >
                      <Check className="h-4 w-4" /> Approve
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Profile Card & Action Widgets */}
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-gray-50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                  <User className="h-5 w-5" />
                </span>
                HR Profile
              </h3>
              <button 
                onClick={() => setIsProfileModalOpen(true)}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition"
              >
                Profile View
              </button>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center font-bold text-lg shadow-inner">
                {user?.full_name?.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h4 className="font-bold text-gray-800">{user?.full_name}</h4>
                <p className="text-xs text-gray-400 capitalize">{user?.role} Manager</p>
                <span className="text-xs text-gray-400">{user?.email}</span>
              </div>
            </div>
          </div>

          {/* Notifications Card */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-gray-50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="p-2 bg-emerald-50 rounded-lg text-emerald-600 relative">
                  <Bell className="h-5 w-5" />
                  {notifications.filter(n => !n.is_read).length > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
                  )}
                </span>
                Operations Alerts
              </h3>
              {notifications.length > 0 && (
                <button 
                  onClick={handleMarkAllRead}
                  className="text-xs text-gray-400 hover:text-emerald-600 font-medium transition"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="mt-4 space-y-3 max-h-36 overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">
                  No alerts currently registered.
                </div>
              ) : (
                notifications.map(n => (
                  <div 
                    key={n.id} 
                    onClick={() => !n.is_read && handleMarkOneRead(n.id)}
                    className={`p-2.5 rounded-xl border text-xs transition ${
                      !n.is_read ? 'cursor-pointer' : ''
                    } ${
                      n.is_read 
                        ? 'border-gray-50 bg-gray-50/50 text-gray-400' 
                        : 'border-emerald-50 bg-emerald-50/10 hover:bg-emerald-50/20 text-gray-600 font-medium'
                    }`}
                    title={!n.is_read ? "Click to mark as read" : ""}
                  >
                    <p className="font-bold text-gray-850">{n.title}</p>
                    <p className="mt-0.5">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Attendance Rates Recharts */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 pb-3 border-b border-gray-50 flex items-center gap-2">
            <span className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </span>
            Daily Attendance Rate (%)
          </h3>
          <div className="h-64 mt-4 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceRateData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} domain={[80, 100]} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="rate" fill="#10b981" radius={[6, 6, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Global activity logs */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 pb-3 border-b border-gray-50 flex items-center gap-2">
            <span className="p-2 bg-teal-50 rounded-lg text-teal-600">
              <ClipboardList className="h-5 w-5" />
            </span>
            Recent HR Activity Log
          </h3>
          <div className="mt-4 space-y-3 max-h-64 overflow-y-auto pr-1">
            {activities.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                No recent activity recorded.
              </div>
            ) : (
              activities.map(act => (
                <div key={act.id} className="flex gap-3 text-xs p-2.5 rounded-xl border border-gray-50 hover:bg-gray-50/50 transition">
                  <div className={`px-2 py-0.5 border rounded-lg h-fit text-[9px] uppercase font-bold tracking-wider ${act.badgeColor}`}>
                    {act.type}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">{act.title}</h4>
                    <p className="text-gray-500 mt-0.5">{act.details}</p>
                    <span className="text-[10px] text-gray-450 block mt-1">{act.timestamp}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Employee Directory Section */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <EmployeeDirectory currentUser={user} />
      </div>

      {/* Logout / Confirmation Section */}
      <div className="rounded-2xl border border-red-50 bg-red-50/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-red-905">Exiting HR Portal?</h4>
          <p className="text-xs text-red-700">Ensure you have completed all pending leave approvals and locked registration files before logout.</p>
        </div>
        <button
          onClick={logout}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-red-650 hover:bg-red-550 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:scale-105 active:scale-95"
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </div>

      {/* Modal - Process Payroll */}
      {isPayrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-150">
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">Payroll System Center</h3>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Disburse Salaries & Review Historic Records</p>
              </div>
              <button 
                onClick={() => setIsPayrollModalOpen(false)}
                className="text-gray-400 hover:text-gray-650 transition p-1 bg-slate-50 hover:bg-slate-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="mt-4 flex border-b border-gray-150">
              <button
                onClick={() => setPayrollActiveTab('generate')}
                className={`flex-1 py-2 text-xs font-bold border-b-2 transition uppercase tracking-wider ${
                  payrollActiveTab === 'generate' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-400 hover:text-gray-650'
                }`}
              >
                Disburse Payout
              </button>
              <button
                onClick={() => setPayrollActiveTab('history')}
                className={`flex-1 py-2 text-xs font-bold border-b-2 transition uppercase tracking-wider ${
                  payrollActiveTab === 'history' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-400 hover:text-gray-650'
                }`}
              >
                Ledger History & Stats ({payrollHistory.length})
              </button>
            </div>

            {/* Tab Contents */}
            <div className="mt-4 min-h-96">
              {payrollActiveTab === 'generate' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Column: Form */}
                  <form onSubmit={handleCreatePayslip} className="md:col-span-2 space-y-4">
                    {payrollMsg.text && (
                      <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                        payrollMsg.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      }`}>
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        {payrollMsg.text}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Select Employee *</label>
                        <select
                          value={selectedEmpIdForPayroll}
                          onChange={(e) => handleEmployeeSelectForPayroll(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 bg-white"
                          required
                        >
                          <option value="">Choose Employee...</option>
                          {employeesList.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.employee_id})</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Month</label>
                          <select
                            value={payMonth}
                            onChange={(e) => setPayMonth(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 bg-white"
                          >
                            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Year</label>
                          <input
                            type="number"
                            value={payYear}
                            onChange={(e) => setPayYear(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 border-t border-slate-50 pt-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Base Salary ($)</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={payBasic}
                          onChange={(e) => setPayBasic(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Allowances ($)</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={payAllowances}
                          onChange={(e) => setPayAllowances(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Bonuses ($)</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={payBonuses}
                          onChange={(e) => setPayBonuses(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Deductions ($)</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={payDeductions}
                          onChange={(e) => setPayDeductions(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Tax Deducted ($)</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={payTax}
                          onChange={(e) => setPayTax(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setIsPayrollModalOpen(false)}
                        className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition"
                      >
                        Close Portal
                      </button>
                      <button
                        type="submit"
                        disabled={isProcessingPayroll}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-550 text-sm font-semibold text-white transition shadow-sm flex items-center justify-center gap-1"
                      >
                        {isProcessingPayroll ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" /> Processing...
                          </>
                        ) : (
                          <>
                            <DollarSign className="h-4 w-4" /> Disburse & Generate PDF
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Right Column: Breakdown Preview */}
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-4">
                    <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-1">Payout Breakdown</h4>
                    
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Basic Salary:</span>
                        <strong className="text-slate-800">${(parseFloat(payBasic) || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Allowances:</span>
                        <strong className="text-emerald-600">+ ${(parseFloat(payAllowances) || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Bonuses:</span>
                        <strong className="text-emerald-600">+ ${(parseFloat(payBonuses) || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Deductions:</span>
                        <strong className="text-red-500">- ${(parseFloat(payDeductions) || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-2">
                        <span className="text-slate-400">Tax Deducted:</span>
                        <strong className="text-red-500">- ${(parseFloat(payTax) || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>
                      </div>
                      <div className="flex justify-between pt-2 text-sm font-black text-slate-850">
                        <span>Net Take-Home Pay:</span>
                        <span className="text-emerald-700">
                          ${(
                            (parseFloat(payBasic) || 0) +
                            (parseFloat(payAllowances) || 0) +
                            (parseFloat(payBonuses) || 0) -
                            (parseFloat(payDeductions) || 0) -
                            (parseFloat(payTax) || 0)
                          ).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {payrollActiveTab === 'history' && (
                <div className="space-y-6">
                  {/* Stats Widgets */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-center">
                      <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Total Disbursements</span>
                      <strong className="text-lg text-emerald-950">${(payrollStats?.total_disbursed || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>
                    </div>
                    <div className="bg-red-50 border border-red-100 p-3 rounded-xl text-center">
                      <span className="text-[10px] text-red-800 font-bold uppercase tracking-wider block">Total Taxes Collected</span>
                      <strong className="text-lg text-red-950">${(payrollStats?.total_tax || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>
                    </div>
                    <div className="bg-teal-50 border border-teal-100 p-3 rounded-xl text-center">
                      <span className="text-[10px] text-teal-800 font-bold uppercase tracking-wider block">Payroll Runs Count</span>
                      <strong className="text-lg text-teal-950">{payrollStats?.payslip_count || 0} Invoices</strong>
                    </div>
                  </div>

                  {/* Ledger Table */}
                  <div className="border border-slate-100 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-2.5">Employee</th>
                          <th className="px-4 py-2.5">Cycle</th>
                          <th className="px-4 py-2.5">Gross Pay</th>
                          <th className="px-4 py-2.5">Deductions/Tax</th>
                          <th className="px-4 py-2.5">Net Salary</th>
                          <th className="px-4 py-2.5 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 font-medium">
                        {payrollHistory.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="text-center py-8 text-slate-400">No salaries disbursed in this organization yet.</td>
                          </tr>
                        ) : (
                          payrollHistory.map(slip => (
                            <tr key={slip.id} className="hover:bg-slate-50/50">
                              <td className="px-4 py-2.5 font-bold text-slate-800">{slip.employee_name}</td>
                              <td className="px-4 py-2.5">{slip.month} {slip.year}</td>
                              <td className="px-4 py-2.5">${(slip.basic_salary + slip.allowances + slip.bonuses).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                              <td className="px-4 py-2.5 text-red-500">${(slip.deductions + slip.tax).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                              <td className="px-4 py-2.5 font-black text-emerald-700">${slip.net_salary.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                              <td className="px-4 py-2.5">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleDownloadPdf(slip.id, slip.employee_name, slip.month, slip.year)}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-emerald-600"
                                    title="Download ReportLab PDF Payslip"
                                  >
                                    <Download className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleOpenEditPayslip(slip)}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-amber-600"
                                    title="Edit Adjustments"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeletePayslip(slip.id, slip.employee_name)}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-red-600"
                                    title="Void Payslip"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mini Edit Modal for Payslip Adjustments */}
      {editingPayslip && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-150">
              <h3 className="text-lg font-bold text-gray-900">Edit Payslip Adjustments</h3>
              <button onClick={() => setEditingPayslip(null)} className="text-gray-400 hover:text-gray-650">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditPayslip} className="mt-4 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Employee: <strong className="text-slate-700">{editingPayslip.employee_name}</strong></label>
                <div className="text-xs text-slate-500 font-semibold">For Cycle: {editingPayslip.month} {editingPayslip.year}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Basic Salary ($)</label>
                  <input
                    type="number"
                    value={editingPayslip.basic_salary}
                    onChange={(e) => setEditingPayslip({ ...editingPayslip, basic_salary: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Allowances ($)</label>
                  <input
                    type="number"
                    value={editingPayslip.allowances}
                    onChange={(e) => setEditingPayslip({ ...editingPayslip, allowances: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Bonuses ($)</label>
                  <input
                    type="number"
                    value={editingPayslip.bonuses}
                    onChange={(e) => setEditingPayslip({ ...editingPayslip, bonuses: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Deductions ($)</label>
                  <input
                    type="number"
                    value={editingPayslip.deductions}
                    onChange={(e) => setEditingPayslip({ ...editingPayslip, deductions: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Tax ($)</label>
                  <input
                    type="number"
                    value={editingPayslip.tax}
                    onChange={(e) => setEditingPayslip({ ...editingPayslip, tax: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Payment Status</label>
                <select
                  value={editingPayslip.status}
                  onChange={(e) => setEditingPayslip({ ...editingPayslip, status: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500 bg-white"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPayslip(null)}
                  className="flex-1 py-2 rounded-lg border border-slate-200 text-xs font-bold text-gray-500 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-550 text-xs font-bold text-white transition shadow-sm"
                >
                  Save Adjustments
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Profile Info */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">HR Representative Profile</h3>
              <button 
                onClick={() => setIsProfileModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div className="flex flex-col items-center py-4 border-b border-gray-50">
                <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center font-bold text-2xl shadow-md mb-2">
                  {user?.full_name?.split(' ').map(n => n[0]).join('')}
                </div>
                <h4 className="font-extrabold text-xl text-gray-900">{user?.full_name}</h4>
                <p className="text-xs text-gray-400 capitalize font-medium">Role: {user?.role} Coordinator</p>
              </div>

              <div className="space-y-3.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Employee ID</span>
                  <span className="font-bold text-gray-800">{user?.employee_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Email Address</span>
                  <span className="font-bold text-gray-800">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Department</span>
                  <span className="font-bold text-gray-800">Human Resources & Operations</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Direct Reports</span>
                  <span className="font-bold text-gray-800">{usersList.filter(u=>u.role==='employee').length} Members</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Joining Date</span>
                  <span className="font-bold text-gray-800">January 15, 2025</span>
                </div>
              </div>

              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="w-full py-2.5 mt-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-semibold text-gray-700 transition"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRDashboard;
