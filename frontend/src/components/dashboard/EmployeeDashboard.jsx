import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mockState } from '../../utils/mockState';
import { 
  Clock, Calendar, DollarSign, Bell, LogOut, User, 
  Plus, CheckCircle, AlertCircle, CalendarRange, Download, 
  TrendingUp, Play, Square, RefreshCw, Check, X
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  Tooltip, PieChart, Pie, Cell, Legend 
} from 'recharts';

const EmployeeDashboard = () => {
  const { user, logout } = useAuth();
  
  // States
  const [attendance, setAttendance] = useState([]);
  const [clockStatus, setClockStatus] = useState({ isClockedIn: false, clockInTime: null });
  const [leaves, setLeaves] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState({ vacation: {}, sick: {}, casual: {} });
  const [payroll, setPayroll] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  
  // Modals
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  // Leave Form
  const [leaveType, setLeaveType] = useState('Vacation');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveError, setLeaveError] = useState('');

  // Load Data
  const loadData = () => {
    if (!user) return;
    setAttendance(mockState.getAttendance());
    setClockStatus(mockState.getClockStatus());
    setLeaves(mockState.getLeaves().filter(l => l.employeeId === user.employee_id));
    setLeaveBalances(mockState.getLeaveBalances());
    setPayroll(mockState.getPayroll());
    setNotifications(mockState.getNotifications(user.employee_id, user.role));
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Timer for Clock-In
  useEffect(() => {
    let timer;
    if (clockStatus.isClockedIn && clockStatus.clockInTime) {
      const updateTimer = () => {
        const diff = new Date() - new Date(clockStatus.clockInTime);
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        
        const pad = (num) => String(num).padStart(2, '0');
        setElapsedTime(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      };
      
      updateTimer();
      timer = setInterval(updateTimer, 1000);
    } else {
      setElapsedTime('00:00:00');
    }
    
    return () => clearInterval(timer);
  }, [clockStatus.isClockedIn, clockStatus.clockInTime]);

  // Actions
  const handleClockToggle = () => {
    if (clockStatus.isClockedIn) {
      // Clock Out: calculate simulated hours
      const diffMs = new Date() - new Date(clockStatus.clockInTime);
      const hours = Math.max(0.1, diffMs / 3600000); // minimum 0.1 hours for test
      mockState.clockOut(user.employee_id, hours);
      mockState.addNotification({
        userId: user.employee_id,
        title: 'Clocked Out Successfully',
        message: `You clocked out. Worked ${hours.toFixed(2)} hours today.`
      });
      mockState.addSystemLog({
        action: 'Clock Out',
        user: user.email,
        details: `Employee clocked out. Hours worked: ${hours.toFixed(2)}`
      });
    } else {
      // Clock In
      mockState.clockIn(user.employee_id);
      mockState.addNotification({
        userId: user.employee_id,
        title: 'Clocked In Successfully',
        message: `You clocked in at ${new Date().toLocaleTimeString()}.`
      });
      mockState.addSystemLog({
        action: 'Clock In',
        user: user.email,
        details: `Employee clocked in.`
      });
    }
    loadData();
  };

  const handleRequestLeave = (e) => {
    e.preventDefault();
    setLeaveError('');

    if (!startDate || !endDate || !leaveReason) {
      setLeaveError('Please fill in all fields.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setLeaveError('Start date cannot be after end date.');
      return;
    }

    const newRequest = {
      employeeId: user.employee_id,
      employeeName: user.full_name,
      type: leaveType,
      startDate,
      endDate,
      reason: leaveReason,
    };

    mockState.addLeaveRequest(newRequest);
    
    // Reset form
    setStartDate('');
    setEndDate('');
    setLeaveReason('');
    setIsLeaveModalOpen(false);
    
    // Reload
    loadData();
  };

  const handleMarkAllRead = () => {
    mockState.markAllNotificationsRead(user.employee_id, user.role);
    loadData();
  };

  const handleDownloadPayslip = (slip) => {
    // Simulate payslip download
    const content = `
-----------------------------------------
           PEOPLEFLOW HRMS
              PAY SLIP
-----------------------------------------
Employee ID:   ${user.employee_id}
Name:          ${user.full_name}
Role:          ${user.role.toUpperCase()}
Month/Year:    ${slip.month} ${slip.year}
-----------------------------------------
Earnings:
  Base Pay:    $${slip.basePay.toFixed(2)}
  Allowances:  $${slip.allowances.toFixed(2)}

Deductions:
  Tax/Others:  $${slip.deductions.toFixed(2)}
-----------------------------------------
NET SALARY:    $${slip.netSalary.toFixed(2)}
-----------------------------------------
Status:        ${slip.status.toUpperCase()}
Generated on:  ${new Date().toLocaleDateString()}
-----------------------------------------
`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payslip_${slip.month.toLowerCase()}_${slip.year}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    mockState.addNotification({
      userId: user.employee_id,
      title: 'Payslip Downloaded',
      message: `Downloaded payslip for ${slip.month} ${slip.year}.`
    });
    loadData();
  };

  // Recharts Formatters
  const weeklyAttendanceData = attendance.slice(-5).map(item => ({
    name: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
    hours: item.hours,
  }));

  const leavePieData = [
    { name: 'Vacation Remaining', value: leaveBalances.vacation.remaining || 12, color: '#4f46e5' },
    { name: 'Vacation Used', value: leaveBalances.vacation.used || 3, color: '#c7d2fe' },
    { name: 'Sick Remaining', value: leaveBalances.sick.remaining || 8, color: '#06b6d4' },
    { name: 'Sick Used', value: leaveBalances.sick.used || 2, color: '#a5f3fc' },
    { name: 'Casual Remaining', value: leaveBalances.casual.remaining || 5, color: '#10b981' },
    { name: 'Casual Used', value: leaveBalances.casual.used || 2, color: '#a7f3d0' },
  ];

  // Activities helper (merging mock events chronologically)
  const recentActivities = [
    ...attendance.slice(-3).map(a => ({
      type: 'attendance',
      title: 'Clock Record',
      detail: `Clocked in ${a.checkIn} - Out ${a.checkOut} (${a.hours} hrs)`,
      date: a.date,
      icon: Clock,
      color: 'bg-indigo-100 text-indigo-700'
    })),
    ...leaves.slice(-2).map(l => ({
      type: 'leave',
      title: `${l.type} Leave Requested`,
      detail: `${l.startDate} to ${l.endDate} - Status: ${l.status}`,
      date: l.appliedDate,
      icon: Calendar,
      color: l.status === 'Approved' ? 'bg-green-100 text-green-700' : l.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-700 via-indigo-800 to-teal-800 p-8 text-white shadow-xl">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-indigo-600/30 blur-3xl"></div>
        <div className="absolute -bottom-24 -right-12 h-64 w-64 rounded-full bg-teal-600/30 blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="inline-block rounded-full bg-indigo-500/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
              Employee Portal
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Hello, {user?.full_name}!
            </h2>
            <p className="mt-2 text-indigo-100 max-w-xl">
              Welcome back to your workspace. You can manage your profile, log work attendance, request time off, and access your payroll invoices here.
            </p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => setIsLeaveModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-900 shadow-md transition hover:bg-indigo-50 hover:scale-105 active:scale-95"
            >
              <Plus className="h-4 w-4" /> Request Leave
            </button>
            <button 
              onClick={handleClockToggle}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:scale-105 active:scale-95 ${
                clockStatus.isClockedIn ? 'bg-rose-600 hover:bg-rose-500' : 'bg-teal-600 hover:bg-teal-500'
              }`}
            >
              {clockStatus.isClockedIn ? (
                <>
                  <Square className="h-4 w-4 fill-white" /> Clock Out
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-white" /> Clock In
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between pb-4 border-b border-gray-50">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <User className="h-5 w-5" />
              </span>
              My Profile
            </h3>
            <button 
              onClick={() => setIsProfileModalOpen(true)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
            >
              Details
            </button>
          </div>
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-indigo-500 to-teal-500 text-white flex items-center justify-center font-bold text-xl shadow-inner">
                {user?.full_name?.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h4 className="font-bold text-gray-900">{user?.full_name}</h4>
                <p className="text-sm text-gray-500 capitalize">{user?.role} - Product Dev</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
              <div>
                <span className="text-gray-400 block text-xs uppercase tracking-wider">Employee ID</span>
                <strong className="text-gray-700">{user?.employee_id}</strong>
              </div>
              <div>
                <span className="text-gray-400 block text-xs uppercase tracking-wider">Email Address</span>
                <strong className="text-gray-700 truncate block max-w-full">{user?.email}</strong>
              </div>
              <div>
                <span className="text-gray-400 block text-xs uppercase tracking-wider">Status</span>
                <span className="inline-flex items-center gap-1 mt-0.5 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                  Active
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-xs uppercase tracking-wider">Join Date</span>
                <strong className="text-gray-700">June 01, 2026</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Timer & Check-in Card */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between pb-4 border-b border-gray-50">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="p-2 bg-teal-50 rounded-lg text-teal-600">
                <Clock className="h-5 w-5" />
              </span>
              Work Tracker
            </h3>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              clockStatus.isClockedIn ? 'bg-teal-50 text-teal-700' : 'bg-rose-50 text-rose-700'
            }`}>
              {clockStatus.isClockedIn ? 'Checked In' : 'Checked Out'}
            </span>
          </div>
          <div className="mt-4 flex flex-col items-center justify-center py-2">
            <span className="text-4xl font-black text-gray-900 font-mono tracking-wider tabular-nums">
              {elapsedTime}
            </span>
            <span className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-semibold">
              Today's Session
            </span>
            <button
              onClick={handleClockToggle}
              className={`mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition shadow-sm ${
                clockStatus.isClockedIn 
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100' 
                  : 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100'
              }`}
            >
              {clockStatus.isClockedIn ? (
                <>
                  <Square className="h-4 w-4 fill-rose-700" /> Stop Clock-Out
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-teal-700" /> Start Clock-In
                </>
              )}
            </button>
          </div>
        </div>

        {/* Notifications Card */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between pb-4 border-b border-gray-50">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="p-2 bg-indigo-50 rounded-lg text-indigo-600 relative">
                <Bell className="h-5 w-5" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
                )}
              </span>
              Notifications
            </h3>
            {notifications.length > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="text-xs text-gray-400 hover:text-indigo-600 font-medium transition"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="mt-4 space-y-3 max-h-36 overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">
                No notifications to show.
              </div>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.id} 
                  className={`flex gap-3 p-2.5 rounded-xl border text-xs transition ${
                    n.read 
                      ? 'border-gray-50 bg-gray-50/50 text-gray-500' 
                      : 'border-indigo-50 bg-indigo-50/20 text-gray-700 font-medium'
                  }`}
                >
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">{n.title}</p>
                    <p className="mt-0.5">{n.message}</p>
                    <span className="text-[10px] text-gray-400 block mt-1">
                      {new Date(n.date).toLocaleDateString()} at {new Date(n.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Analytics & Visualization Section */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Attendance Summary Recharts */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 pb-3 border-b border-gray-50 flex items-center gap-2">
            <span className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <TrendingUp className="h-5 w-5" />
            </span>
            Weekly Activity Log
          </h3>
          <div className="h-64 mt-4 w-full">
            {weeklyAttendanceData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                No attendance logs found this week.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyAttendanceData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                  <Bar dataKey="hours" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Leave Allocation Recharts */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 pb-3 border-b border-gray-50 flex items-center gap-2">
            <span className="p-2 bg-teal-50 rounded-lg text-teal-600">
              <CalendarRange className="h-5 w-5" />
            </span>
            Leave Balance Breakdown
          </h3>
          <div className="h-64 mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leavePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {leavePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full sm:w-1/2 grid grid-cols-1 gap-2 text-xs">
              <div className="border-l-4 border-indigo-600 pl-2">
                <span className="text-gray-400 block">Vacation Leaves</span>
                <strong>{leaveBalances.vacation.remaining} / {leaveBalances.vacation.total} Days Left</strong>
              </div>
              <div className="border-l-4 border-cyan-500 pl-2">
                <span className="text-gray-400 block">Sick Leaves</span>
                <strong>{leaveBalances.sick.remaining} / {leaveBalances.sick.total} Days Left</strong>
              </div>
              <div className="border-l-4 border-emerald-500 pl-2">
                <span className="text-gray-400 block">Casual Leaves</span>
                <strong>{leaveBalances.casual.remaining} / {leaveBalances.casual.total} Days Left</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leave Status & Payroll Payslips */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Leave Requests List */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between pb-4 border-b border-gray-50">
            <h3 className="text-lg font-bold text-gray-900">Recent Leave Requests</h3>
            <button 
              onClick={() => setIsLeaveModalOpen(true)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition"
            >
              <Plus className="h-3 w-3" /> New Request
            </button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 rounded-l-xl">Type</th>
                  <th className="px-4 py-3">Start Date</th>
                  <th className="px-4 py-3">End Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 rounded-r-xl">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {leaves.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-6 text-gray-400">
                      No leave requests submitted yet.
                    </td>
                  </tr>
                ) : (
                  leaves.map(l => (
                    <tr key={l.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-4 py-3.5 font-bold text-gray-800">{l.type}</td>
                      <td className="px-4 py-3.5">{l.startDate}</td>
                      <td className="px-4 py-3.5">{l.endDate}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          l.status === 'Approved' ? 'bg-green-50 text-green-700' : l.status === 'Pending' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-400 truncate max-w-xs">{l.reason}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payslips Card */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 pb-4 border-b border-gray-50 flex items-center gap-2">
            <span className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <DollarSign className="h-5 w-5" />
            </span>
            Payroll Ledger
          </h3>
          <div className="mt-4 space-y-4">
            {payroll.map(slip => (
              <div key={slip.id} className="flex items-center justify-between p-3.5 border border-gray-100 rounded-xl hover:border-indigo-100 hover:bg-indigo-50/5 transition">
                <div>
                  <h4 className="font-bold text-gray-800">{slip.month} {slip.year}</h4>
                  <p className="text-xs text-gray-400 mt-0.5">Net Pay: <strong className="text-indigo-600">${slip.netSalary.toFixed(2)}</strong></p>
                </div>
                <button
                  onClick={() => handleDownloadPayslip(slip)}
                  className="p-2 text-gray-400 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50/50 rounded-xl transition"
                  title="Download payslip"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Logout/Action Confirmation Footer Card */}
      <div className="rounded-2xl border border-red-50 bg-red-50/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-red-900">Terminating Dashboard Session?</h4>
          <p className="text-xs text-red-700">Ensure you save your profile modifications or clock-out if your shift is complete.</p>
        </div>
        <button
          onClick={logout}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:scale-105 active:scale-95"
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </div>

      {/* Modal - Request Leave */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Request Leave</h3>
              <button 
                onClick={() => setIsLeaveModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleRequestLeave} className="mt-4 space-y-4">
              {leaveError && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-150 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {leaveError}
                </div>
              )}
              
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Leave Type</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Vacation">Vacation Leave</option>
                  <option value="Sick">Sick Leave</option>
                  <option value="Casual">Casual Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Reason</label>
                <textarea
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="State the reason for your time-off request..."
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none h-24 resize-none"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white transition shadow-sm"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Profile Details */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Profile Details</h3>
              <button 
                onClick={() => setIsProfileModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div className="flex flex-col items-center py-4 border-b border-gray-50">
                <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-indigo-500 to-teal-500 text-white flex items-center justify-center font-bold text-2xl shadow-md mb-2">
                  {user?.full_name?.split(' ').map(n => n[0]).join('')}
                </div>
                <h4 className="font-extrabold text-xl text-gray-900">{user?.full_name}</h4>
                <p className="text-xs text-gray-400 capitalize font-medium">Role: {user?.role}</p>
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
                  <span className="font-bold text-gray-800">Product Development</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Designation</span>
                  <span className="font-bold text-gray-800">Senior Frontend Engineer</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Manager</span>
                  <span className="font-bold text-gray-800">Alice Williams (Admin)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Joining Date</span>
                  <span className="font-bold text-gray-800">June 01, 2026</span>
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

export default EmployeeDashboard;
