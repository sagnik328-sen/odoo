import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mockState } from '../../utils/mockState';
import { employeeApi } from '../../api/employee';
import { attendanceApi } from '../../api/attendance';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Clock, Calendar, DollarSign, Bell, LogOut, User, 
  Plus, CheckCircle, AlertCircle, CalendarRange, Download, 
  TrendingUp, Play, Square, RefreshCw, Check, X,
  Upload, Trash2, Edit2, Briefcase, CreditCard, FileText, File, Eye
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  Tooltip, PieChart, Pie, Cell, Legend 
} from 'recharts';

const EmployeeDashboard = () => {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  
  // States
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState({ vacation: {}, sick: {}, casual: {} });
  const [payroll, setPayroll] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  
  // Attendance query
  const { data: todayAttendance } = useQuery({
    queryKey: ['todayAttendance'],
    queryFn: () => attendanceApi.getTodayAttendance(),
  });
  
  // Check in mutation
  const checkInMutation = useMutation({
    mutationFn: attendanceApi.checkIn,
    onSuccess: () => {
      queryClient.invalidateQueries(['todayAttendance']);
    },
  });
  
  // Check out mutation
  const checkOutMutation = useMutation({
    mutationFn: attendanceApi.checkOut,
    onSuccess: () => {
      queryClient.invalidateQueries(['todayAttendance']);
    },
  });
  
  // Clock status based on real API data
  const clockStatus = {
    isClockedIn: !!todayAttendance?.check_in && !todayAttendance?.check_out,
    clockInTime: todayAttendance?.check_in,
  };
  
  // Modals
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  // Profile specific states
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [activeProfileTab, setActiveProfileTab] = useState('personal');
  const [editMode, setEditMode] = useState(false);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [docName, setDocName] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [profileError, setProfileError] = useState('');

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

  const fetchProfile = async () => {
    if (!user) return;
    try {
      setLoadingProfile(true);
      const data = await employeeApi.getEmployee(user.id);
      setProfileData(data);
      setPhone(data.profile?.phone || '');
      setAddress(data.profile?.address || '');
    } catch (err) {
      console.error("Failed to fetch employee profile:", err);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
      fetchProfile();
    }
  }, [user]);

  // Profile Action Helpers
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    try {
      const updated = await employeeApi.updateEmployee(user.id, { phone, address });
      setProfileData(updated);
      setEditMode(false);
      mockState.addNotification({
        userId: user.employee_id,
        title: 'Profile Updated',
        message: 'Your personal address and phone number were successfully updated.'
      });
      loadData();
    } catch (err) {
      setProfileError(err.response?.data?.detail || 'Failed to update profile');
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProfileError('');
    try {
      setUploadingAvatar(true);
      await employeeApi.uploadAvatar(user.id, file);
      await fetchProfile();
      mockState.addNotification({
        userId: user.employee_id,
        title: 'Avatar Updated',
        message: 'Your profile picture was successfully uploaded.'
      });
      loadData();
    } catch (err) {
      setProfileError('Failed to upload profile picture');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUploadDoc = async (e) => {
    e.preventDefault();
    if (!docName || !docFile) return;
    setProfileError('');
    try {
      setUploadingDoc(true);
      await employeeApi.uploadDocument(user.id, docName, docFile);
      setDocName('');
      setDocFile(null);
      await fetchProfile();
      mockState.addNotification({
        userId: user.employee_id,
        title: 'Document Uploaded',
        message: `Document "${docName}" uploaded successfully.`
      });
      loadData();
    } catch (err) {
      setProfileError('Failed to upload document');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    setProfileError('');
    try {
      await employeeApi.deleteDocument(user.id, docId);
      await fetchProfile();
      mockState.addNotification({
        userId: user.employee_id,
        title: 'Document Deleted',
        message: 'Your document was successfully removed.'
      });
      loadData();
    } catch (err) {
      setProfileError('Failed to delete document');
    }
  };

  const getAvatarUrl = (path) => {
    if (!path) return null;
    return path.startsWith('http') ? path : `http://localhost:8000${path}`;
  };

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
      checkOutMutation.mutate();
    } else {
      checkInMutation.mutate();
    }
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
              onClick={() => {
                setActiveProfileTab('personal');
                setEditMode(false);
                setIsProfileModalOpen(true);
              }}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
            >
              Details
            </button>
          </div>
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-4">
              {profileData?.profile?.profile_picture ? (
                <img 
                  src={getAvatarUrl(profileData.profile.profile_picture)} 
                  alt={user?.full_name} 
                  className="h-16 w-16 rounded-full object-cover border border-slate-200 shadow-inner"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-indigo-500 to-teal-500 text-white flex items-center justify-center font-bold text-xl shadow-inner">
                  {user?.full_name?.split(' ').map(n => n[0]).join('')}
                </div>
              )}
              <div>
                <h4 className="font-bold text-gray-900">{user?.full_name}</h4>
                <p className="text-sm text-gray-500 capitalize">{profileData?.profile?.designation || 'Employee'} - {profileData?.profile?.department || 'Operations'}</p>
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
                <strong className="text-gray-700">
                  {profileData?.profile?.joining_date 
                    ? new Date(profileData.profile.joining_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
                    : 'June 01, 2026'}
                </strong>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-150">
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">Employee Profile</h3>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mt-0.5">{user?.full_name} &bull; ID: {user?.employee_id}</p>
              </div>
              <button 
                onClick={() => setIsProfileModalOpen(false)}
                className="text-gray-400 hover:text-gray-650 transition p-1 bg-slate-50 hover:bg-slate-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {profileError && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 border border-red-150 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {profileError}
              </div>
            )}

            {/* Profile Summary Card with Avatar Uploader */}
            <div className="mt-4 flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="relative group shrink-0">
                {profileData?.profile?.profile_picture ? (
                  <img 
                    src={getAvatarUrl(profileData.profile.profile_picture)} 
                    alt={user?.full_name} 
                    className="h-20 w-20 rounded-full object-cover border-2 border-indigo-100 shadow-md"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-indigo-500 to-teal-500 text-white flex items-center justify-center font-black text-2xl shadow-md">
                    {user?.full_name?.split(' ').map(n => n[0]).join('')}
                  </div>
                )}
                <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload className="h-4 w-4" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleAvatarChange} 
                    className="hidden" 
                    disabled={uploadingAvatar}
                  />
                </label>
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-white/75 rounded-full flex items-center justify-center">
                    <RefreshCw className="h-5 w-5 animate-spin text-indigo-600" />
                  </div>
                )}
              </div>
              <div className="text-center sm:text-left">
                <h4 className="font-extrabold text-xl text-slate-800">{user?.full_name}</h4>
                <p className="text-sm font-semibold text-indigo-600">{profileData?.profile?.designation || 'Software Engineer'}</p>
                <p className="text-xs text-slate-400 capitalize">{user?.role} portal &bull; {profileData?.profile?.department || 'Development'}</p>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="mt-5 flex border-b border-gray-150">
              {[
                { id: 'personal', name: 'Personal', icon: User },
                { id: 'job', name: 'Job Details', icon: Briefcase },
                { id: 'salary', name: 'Salary', icon: CreditCard },
                { id: 'documents', name: 'Documents', icon: FileText }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveProfileTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold border-b-2 transition uppercase tracking-wider ${
                    activeProfileTab === tab.id 
                      ? 'border-indigo-600 text-indigo-600' 
                      : 'border-transparent text-gray-400 hover:text-gray-650'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.name}</span>
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="mt-4 min-h-48">
              {/* Tab 1: Personal (Editable) */}
              {activeProfileTab === 'personal' && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="font-bold text-slate-800 text-sm">Personal Contacts & Address</h5>
                    {!editMode ? (
                      <button 
                        onClick={() => setEditMode(true)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-850"
                      >
                        <Edit2 className="h-3 w-3" /> Edit Details
                      </button>
                    ) : (
                      <span className="text-xs text-amber-600 font-bold uppercase">Editing Mode</span>
                    )}
                  </div>

                  {!editMode ? (
                    <div className="space-y-3.5 text-sm">
                      <div className="flex justify-between border-b border-slate-50 pb-2">
                        <span className="text-slate-400">Email Address</span>
                        <span className="font-bold text-slate-800">{user?.email}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 pb-2">
                        <span className="text-slate-400">Phone Number</span>
                        <span className="font-bold text-slate-800">{profileData?.profile?.phone || 'Not Provided'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 pb-2">
                        <span className="text-slate-400">Residential Address</span>
                        <span className="font-bold text-slate-800 text-right max-w-xs">{profileData?.profile?.address || 'Not Provided'}</span>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleUpdateProfile} className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Phone Number</label>
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                          placeholder="e.g. +1 555-0199"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Residential Address</label>
                        <textarea
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none h-16 resize-none"
                          placeholder="Street, City, Country"
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditMode(false)}
                          className="flex-1 py-2 rounded-lg border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition shadow-sm"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Tab 2: Job Details */}
              {activeProfileTab === 'job' && (
                <div className="space-y-3.5 text-sm">
                  <h5 className="font-bold text-slate-800 text-sm mb-3">Employment Details</h5>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-400">Department</span>
                    <span className="font-bold text-slate-800">{profileData?.profile?.department || 'Operations'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-400">Designation</span>
                    <span className="font-bold text-slate-800">{profileData?.profile?.designation || 'Staff'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-400">Direct Manager</span>
                    <span className="font-bold text-slate-800">{profileData?.profile?.manager_name || 'HR Department'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-400">Joining Date</span>
                    <span className="font-bold text-slate-800">
                      {profileData?.profile?.joining_date 
                        ? new Date(profileData.profile.joining_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
                        : 'June 01, 2026'}
                    </span>
                  </div>
                </div>
              )}

              {/* Tab 3: Salary */}
              {activeProfileTab === 'salary' && (
                <div className="space-y-3.5 text-sm">
                  <h5 className="font-bold text-slate-800 text-sm mb-3">Compensation Structure</h5>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-400">Base Salary</span>
                    <span className="font-bold text-slate-800">${(profileData?.profile?.base_salary || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-400">Allowances</span>
                    <span className="font-bold text-green-600">+ ${(profileData?.profile?.allowances || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-400">Deductions</span>
                    <span className="font-bold text-red-500">- ${(profileData?.profile?.deductions || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="font-bold text-slate-800">Net Estimated Salary</span>
                    <span className="font-black text-indigo-600 text-base">
                      ${((profileData?.profile?.base_salary || 0) + (profileData?.profile?.allowances || 0) - (profileData?.profile?.deductions || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Tab 4: Documents */}
              {activeProfileTab === 'documents' && (
                <div>
                  <h5 className="font-bold text-slate-800 text-sm mb-3">My Uploaded Documents</h5>

                  {/* Documents List */}
                  <div className="space-y-2 max-h-32 overflow-y-auto mb-4 pr-1">
                    {(!profileData?.profile?.documents || profileData.profile.documents.length === 0) ? (
                      <div className="text-center py-4 text-gray-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        No uploaded documents found.
                      </div>
                    ) : (
                      profileData.profile.documents.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <File className="h-4 w-4 shrink-0 text-slate-400" />
                            <span className="font-bold text-slate-700 truncate">{doc.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => window.open(getAvatarUrl(doc.file_path))}
                              className="p-1 hover:bg-indigo-50 hover:text-indigo-600 rounded transition"
                              title="Download/View File"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteDoc(doc.id)}
                              className="p-1 hover:bg-red-50 hover:text-red-600 rounded transition"
                              title="Delete File"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Upload Form */}
                  <form onSubmit={handleUploadDoc} className="border-t border-slate-100 pt-3 flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="Document Name (e.g. ID, CV)"
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                      required
                    />
                    <div className="flex gap-2">
                      <input
                        type="file"
                        id="profile-doc-file"
                        onChange={(e) => setDocFile(e.target.files[0])}
                        className="hidden"
                      />
                      <label 
                        htmlFor="profile-doc-file"
                        className="cursor-pointer border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-650 flex items-center justify-center shrink-0"
                      >
                        {docFile ? "File Selected" : "Select File"}
                      </label>
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-1.5 rounded-lg flex items-center gap-1 shadow-sm shrink-0"
                        disabled={uploadingDoc}
                      >
                        {uploadingDoc ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Upload className="h-3.5 w-3.5" /> Upload
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
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
