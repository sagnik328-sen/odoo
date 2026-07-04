import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mockState } from '../../utils/mockState';
import EmployeeDirectory from './EmployeeDirectory';
import { notificationApi } from '../../api/notification';
import { 
  ShieldAlert, Settings, Bell, LogOut, User, 
  Plus, Check, X, ClipboardList, Database, Heart,
  TrendingUp, Shield, Activity, RefreshCw, AlertTriangle
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend
} from 'recharts';

const AdminDashboard = () => {
  const { user, logout } = useAuth();

  // States
  const [usersList, setUsersList] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupTime, setBackupTime] = useState('12 hours ago');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Modals
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // New User Form State
  const [newEmpId, setNewEmpId] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('employee');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Load Data
  const loadData = () => {
    setUsersList(mockState.getUsersList());
    setSystemLogs(mockState.getSystemLogs());
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

  useEffect(() => {
    loadData();
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Actions
  const handleRoleChange = (userId, newRole) => {
    mockState.updateUserRole(userId, newRole);
    loadData();
  };

  const handleBackupDatabase = () => {
    setIsBackingUp(true);
    setTimeout(() => {
      setIsBackingUp(false);
      const now = new Date();
      setBackupTime('Just now');
      mockState.addSystemLog({
        action: 'Database backup',
        user: user.email,
        details: 'Backup complete: hrms_db_' + now.toISOString().replace(/[:.]/g, '') + '.sql'
      });
      mockState.addNotification({
        userId: 'admin',
        title: 'Database Backup Complete',
        message: 'System database has been successfully backed up to cloud storage.'
      });
      loadData();
    }, 1500);
  };

  const handleToggleMaintenance = () => {
    const nextMode = !maintenanceMode;
    setMaintenanceMode(nextMode);
    mockState.addSystemLog({
      action: 'Maintenance Toggle',
      user: user.email,
      details: `Maintenance mode toggled to ${nextMode ? 'ON' : 'OFF'}`
    });
    mockState.addNotification({
      userId: 'all',
      title: nextMode ? 'Scheduled Maintenance' : 'Maintenance Completed',
      message: nextMode 
        ? 'System is shifting to read-only mode for background infrastructure updates.'
        : 'System maintenance complete. Full operational capacities restored.'
    });
    loadData();
  };

  const handleCreateUser = (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!newEmpId || !newFullName || !newEmail) {
      setFormError('All fields are required.');
      return;
    }

    const emailExists = usersList.some(u => u.email.toLowerCase() === newEmail.toLowerCase());
    const empIdExists = usersList.some(u => u.employee_id.toLowerCase() === newEmpId.toLowerCase());

    if (emailExists || empIdExists) {
      setFormError('Employee ID or Email already registered.');
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

    // Logs & Notifications
    mockState.addSystemLog({
      action: 'Register User',
      user: user.email,
      details: `Admin registered user: ${newFullName} (${newEmpId}) as ${newRole}`
    });

    mockState.addNotification({
      userId: 'all',
      title: 'New Account Created',
      message: `Account created for ${newFullName}. Welcome to PeopleFlow!`
    });

    // Reset Form
    setNewEmpId('');
    setNewFullName('');
    setNewEmail('');
    setNewRole('employee');
    setFormSuccess('User account created successfully!');
    
    setTimeout(() => {
      setFormSuccess('');
      setIsUserModalOpen(false);
    }, 1500);

    loadData();
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      await fetchNotifications();
    } catch (err) {
      console.error("Failed to mark notifications read:", err);
    }
  };

  // Recharts Role Distribution calculations
  const roleCounts = usersList.reduce((acc, curr) => {
    acc[curr.role] = (acc[curr.role] || 0) + 1;
    return acc;
  }, { employee: 0, hr: 0, admin: 0 });

  const rolePieData = [
    { name: 'Employees', value: roleCounts.employee, color: '#6366f1' },
    { name: 'HR Managers', value: roleCounts.hr, color: '#10b981' },
    { name: 'Administrators', value: roleCounts.admin, color: '#d946ef' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-700 via-violet-800 to-rose-700 p-8 text-white shadow-xl">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-purple-600/30 blur-3xl"></div>
        <div className="absolute -bottom-24 -right-12 h-64 w-64 rounded-full bg-rose-600/30 blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="inline-block rounded-full bg-purple-500/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
              Root Administration
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              System Admin: {user?.full_name}
            </h2>
            <p className="mt-2 text-purple-100 max-w-xl">
              Configure system features, assign and audit user access levels, run database backups, and inspect real-time security event logs.
            </p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => setIsUserModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-purple-900 shadow-md transition hover:bg-purple-50 hover:scale-105 active:scale-95"
            >
              <Plus className="h-4 w-4" /> Create User
            </button>
            <button 
              onClick={handleBackupDatabase}
              disabled={isBackingUp}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <Database className="h-4 w-4" /> {isBackingUp ? 'Backing up...' : 'Backup Database'}
            </button>
          </div>
        </div>
      </div>

      {/* Admin Metrics Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1 */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="p-3.5 bg-purple-50 rounded-xl text-purple-600">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Total Active Users</span>
            <strong className="text-2xl text-gray-900">{usersList.length}</strong>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="p-3.5 bg-rose-50 rounded-xl text-rose-600">
            <Heart className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">System Health</span>
            <strong className="text-2xl text-emerald-600 font-bold">100%</strong>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="p-3.5 bg-amber-50 rounded-xl text-amber-600">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Active Sessions</span>
            <strong className="text-2xl text-gray-900">4 Sessions</strong>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="p-3.5 bg-fuchsia-50 rounded-xl text-fuchsia-600">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">DB Backup</span>
            <strong className="text-base text-gray-700 truncate block max-w-[130px]" title={backupTime}>{backupTime}</strong>
          </div>
        </div>
      </div>

      {/* User Management & Role Distribution Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* User Roles Management Directory (real backend database-driven) */}
        <div className="lg:col-span-2">
          <EmployeeDirectory currentUser={user} />
        </div>

        {/* Role Distribution Chart & Profile Card */}
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-gray-50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="p-2 bg-purple-50 rounded-lg text-purple-600">
                  <User className="h-5 w-5" />
                </span>
                Admin Profile
              </h3>
              <button 
                onClick={() => setIsProfileModalOpen(true)}
                className="text-xs font-semibold text-purple-600 hover:text-purple-800 transition"
              >
                Profile View
              </button>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-purple-500 to-rose-500 text-white flex items-center justify-center font-bold text-lg shadow-inner">
                {user?.full_name?.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h4 className="font-bold text-gray-800">{user?.full_name}</h4>
                <p className="text-xs text-gray-400 capitalize">{user?.role} Access</p>
                <span className="text-xs text-gray-400">{user?.email}</span>
              </div>
            </div>
          </div>

          {/* Role Distribution Pie Chart */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 pb-3 border-b border-gray-50 flex items-center gap-2">
              <span className="p-2 bg-fuchsia-50 rounded-lg text-fuchsia-600">
                <TrendingUp className="h-5 w-5" />
              </span>
              User Role Distribution
            </h3>
            <div className="h-44 mt-4 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={rolePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {rolePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex justify-center gap-4 text-[10px] font-semibold text-gray-500">
              <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#6366f1]"></span> Employee</div>
              <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#10b981]"></span> HR</div>
              <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#d946ef]"></span> Admin</div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time System Logs & Maintenance Mode Widgets */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* System Event Logs */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 pb-3 border-b border-gray-50 flex items-center gap-2">
            <span className="p-2 bg-purple-50 rounded-lg text-purple-600">
              <ClipboardList className="h-5 w-5" />
            </span>
            Real-time Security Event Audit
          </h3>
          <div className="mt-4 space-y-3 max-h-64 overflow-y-auto pr-1">
            {systemLogs.map(log => (
              <div key={log.id} className="p-3 border border-gray-50 rounded-xl bg-gray-50/20 text-xs flex justify-between items-start gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <strong className="text-gray-800">{log.action}</strong>
                    <span className="text-[10px] text-gray-400">{log.user}</span>
                  </div>
                  <p className="text-gray-500 text-[11px]">{log.details}</p>
                </div>
                <span className="text-[9px] text-gray-400 font-mono text-right shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Administrative Quick Actions & Maintenance Control */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-5">
          <h3 className="text-lg font-bold text-gray-900 pb-3 border-b border-gray-50 flex items-center gap-2">
            <span className="p-2 bg-rose-50 rounded-lg text-rose-600">
              <ShieldAlert className="h-5 w-5" />
            </span>
            Administrative Controls
          </h3>

          <div className="space-y-4">
            {/* System Status Alert */}
            <div className={`p-4 border rounded-xl flex items-start gap-3 transition ${
              maintenanceMode 
                ? 'bg-amber-50 border-amber-250 text-amber-800' 
                : 'bg-emerald-50 border-emerald-250 text-emerald-800'
            }`}>
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider">System Status</h4>
                <p className="text-xs mt-1">
                  {maintenanceMode 
                    ? 'Maintenance lock is active. Employees are in read-only dashboard statuses.' 
                    : 'All modules functioning under normal load. Global authentication checks OK.'}
                </p>
              </div>
            </div>

            {/* Quick Action Buttons Grid */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleToggleMaintenance}
                className={`py-3 px-4 rounded-xl text-xs font-bold transition text-center shadow-sm border ${
                  maintenanceMode
                    ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                    : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
                }`}
              >
                {maintenanceMode ? 'Disable Maint. Lock' : 'Enable Maint. Lock'}
              </button>
              <button
                onClick={() => setIsUserModalOpen(true)}
                className="py-3 px-4 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-550 transition text-center shadow-sm"
              >
                Add User Credentials
              </button>
              <button
                onClick={handleBackupDatabase}
                disabled={isBackingUp}
                className="py-3 px-4 rounded-xl text-xs font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition text-center shadow-sm disabled:opacity-50"
              >
                Trigger Sync Backup
              </button>
              <button
                onClick={() => {
                  mockState.addSystemLog({
                    action: 'Cache Cleared',
                    user: user.email,
                    details: 'System session cache and metrics cleared.'
                  });
                  loadData();
                }}
                className="py-3 px-4 rounded-xl text-xs font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition text-center shadow-sm"
              >
                Flush System Cache
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Card */}
      <div className="rounded-2xl border border-red-50 bg-red-50/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-red-900">Terminating Admin Portal?</h4>
          <p className="text-xs text-red-700">Audit logs are archived automatically. Ensure any direct authorization updates are successfully saved before exit.</p>
        </div>
        <button
          onClick={logout}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:scale-105 active:scale-95"
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </div>

      {/* Modal - Create User Account */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Plus className="h-5 w-5 text-purple-600" />
                Create New User Account
              </h3>
              <button 
                onClick={() => setIsUserModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="mt-4 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-150 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-150 rounded-xl text-xs flex items-center gap-2">
                  <Check text-emerald-600 className="h-4 w-4 shrink-0" />
                  {formSuccess}
                </div>
              )}
              
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Employee ID</label>
                <input
                  type="text"
                  placeholder="e.g. EMP-009"
                  value={newEmpId}
                  onChange={(e) => setNewEmpId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Clara Oswald"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. clara@peopleflow.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">System Authorization Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                >
                  <option value="employee">Employee</option>
                  <option value="hr">HR Manager</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-550 text-sm font-semibold text-white transition shadow-sm"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Admin Profile Details */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Administrator Profile</h3>
              <button 
                onClick={() => setIsProfileModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div className="flex flex-col items-center py-4 border-b border-gray-50">
                <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-purple-500 to-rose-500 text-white flex items-center justify-center font-bold text-2xl shadow-md mb-2">
                  {user?.full_name?.split(' ').map(n => n[0]).join('')}
                </div>
                <h4 className="font-extrabold text-xl text-gray-900">{user?.full_name}</h4>
                <p className="text-xs text-gray-400 capitalize font-medium">Role: {user?.role} Superuser</p>
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
                  <span className="text-gray-400">System Operations</span>
                  <span className="font-bold text-gray-800">Root / Owner</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Security Clearance</span>
                  <span className="font-bold text-emerald-600">Level 5 (Full)</span>
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

export default AdminDashboard;
