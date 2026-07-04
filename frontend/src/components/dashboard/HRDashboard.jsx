import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mockState } from '../../utils/mockState';
import EmployeeDirectory from './EmployeeDirectory';
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
  const [payrollStatus, setPayrollStatus] = useState('Pending');
  
  // Modals
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Registration Form State
  const [newEmpId, setNewEmpId] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('employee');
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');

  // Load Data
  const loadData = () => {
    setLeaves(mockState.getLeaves());
    setAttendance(mockState.getAttendance());
    setUsersList(mockState.getUsersList());
    setNotifications(mockState.getNotifications(user?.employee_id, 'hr'));
  };

  useEffect(() => {
    loadData();
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

  const handleRegisterEmployee = (e) => {
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

  const handleProcessPayroll = () => {
    setPayrollStatus('Processing');
    setTimeout(() => {
      setPayrollStatus('Completed');
      mockState.addNotification({
        userId: 'all',
        title: 'Payroll Released',
        message: 'Your paystub for the current cycle has been generated and released.'
      });
      mockState.addSystemLog({
        action: 'Process Payroll',
        user: user.email,
        details: 'Monthly payroll processed and disbursed.'
      });
      setIsPayrollModalOpen(false);
      loadData();
    }, 2000);
  };

  const handleMarkAllRead = () => {
    mockState.markAllNotificationsRead(user?.employee_id, 'hr');
    loadData();
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
          
          <div className="flex gap-3">
            <button 
              onClick={() => setIsRegisterModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-emerald-900 shadow-md transition hover:bg-emerald-50 hover:scale-105 active:scale-95"
            >
              <UserPlus className="h-4 w-4" /> Add Employee
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
                  {notifications.filter(n => !n.read).length > 0 && (
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
                    className={`p-2.5 rounded-xl border text-xs transition ${
                      n.read 
                        ? 'border-gray-50 bg-gray-50/50 text-gray-400' 
                        : 'border-emerald-50 bg-emerald-50/10 text-gray-600 font-medium'
                    }`}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Run Monthly Payroll</h3>
              <button 
                onClick={() => setIsPayrollModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div className="text-center py-2">
                <DollarSign className="h-12 w-12 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-gray-800 mt-2">Disburse July Salaries</h4>
                <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">This dispatches all compiled payslips and dispatches direct deposits to {usersList.filter(u=>u.role==='employee').length} active employees.</p>
              </div>
              
              <div className="border border-gray-50 rounded-xl p-3 bg-gray-50/50 space-y-2 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Gross Disbursements:</span>
                  <strong className="text-gray-800">$64,500.00</strong>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Total Allowances:</span>
                  <strong className="text-gray-800">$7,200.00</strong>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Total Deductions:</span>
                  <strong className="text-gray-800">$4,500.00</strong>
                </div>
                <div className="flex justify-between border-t border-gray-250 pt-2 font-bold text-emerald-700">
                  <span>Total Net Payout:</span>
                  <span>$67,200.00</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsPayrollModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcessPayroll}
                  disabled={payrollStatus === 'Processing'}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition shadow-sm ${
                    payrollStatus === 'Processing' ? 'bg-emerald-450 cursor-not-allowed opacity-70' : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                >
                  {payrollStatus === 'Processing' ? 'Processing...' : 'Disburse Now'}
                </button>
              </div>
            </div>
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
