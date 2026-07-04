import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building,
  Calendar,
  Clock,
  Shield,
  User,
  Key,
  Moon,
  Sun,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Save
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { settingsApi } from '../api/settings';
import { employeeApi } from '../api/employee';
import { authApi } from '../api/auth';

export default function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'admin';

  // State
  const [activeTab, setActiveTab] = useState('profile');
  const [feedback, setFeedback] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || document.documentElement.classList.contains('dark');
  });

  // Dark Mode side effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // React Queries
  const profileQuery = useQuery({
    queryKey: ['employeeProfile', user?.id],
    queryFn: () => employeeApi.getEmployee(user?.id),
    enabled: !!user?.id,
  });

  const companySettingsQuery = useQuery({
    queryKey: ['companySettings'],
    queryFn: settingsApi.getCompanySettings,
    enabled: isAdmin,
  });

  const leavePolicyQuery = useQuery({
    queryKey: ['leavePolicy'],
    queryFn: settingsApi.getLeavePolicy,
    enabled: isAdmin,
  });

  const workingHoursQuery = useQuery({
    queryKey: ['workingHours'],
    queryFn: settingsApi.getWorkingHours,
    enabled: isAdmin,
  });

  const holidaysQuery = useQuery({
    queryKey: ['holidays'],
    queryFn: settingsApi.getHolidays,
    enabled: isAdmin,
  });

  const rolePermissionsQuery = useQuery({
    queryKey: ['rolePermissions'],
    queryFn: settingsApi.getRolePermissions,
    enabled: isAdmin,
  });

  // React Hook Forms
  const profileForm = useForm();
  const passwordForm = useForm();
  const companyForm = useForm();
  const policyForm = useForm();
  const hoursForm = useForm();
  const holidayForm = useForm();

  // Populate Forms on data load
  useEffect(() => {
    if (profileQuery.data) {
      profileForm.reset({
        phone: profileQuery.data.profile?.phone || '',
        address: profileQuery.data.profile?.address || '',
      });
    }
  }, [profileQuery.data, profileForm]);

  useEffect(() => {
    if (companySettingsQuery.data) {
      companyForm.reset(companySettingsQuery.data);
    }
  }, [companySettingsQuery.data, companyForm]);

  useEffect(() => {
    if (leavePolicyQuery.data) {
      policyForm.reset(leavePolicyQuery.data);
    }
  }, [leavePolicyQuery.data, policyForm]);

  useEffect(() => {
    if (workingHoursQuery.data) {
      hoursForm.reset(workingHoursQuery.data);
    }
  }, [workingHoursQuery.data, hoursForm]);

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: (data) => employeeApi.updateEmployee(user.id, data),
    onSuccess: () => {
      setFeedback({ type: 'success', text: 'Profile updated successfully.' });
      queryClient.invalidateQueries(['employeeProfile', user.id]);
    },
    onError: (err) => {
      setFeedback({ type: 'error', text: err.response?.data?.detail || 'Failed to update profile.' });
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data) => authApi.changePassword(data),
    onSuccess: () => {
      setFeedback({ type: 'success', text: 'Password changed successfully.' });
      passwordForm.reset({ old_password: '', new_password: '', confirm_password: '' });
    },
    onError: (err) => {
      setFeedback({ type: 'error', text: err.response?.data?.detail || 'Failed to change password.' });
    }
  });

  const updateCompanyMutation = useMutation({
    mutationFn: settingsApi.updateCompanySettings,
    onSuccess: () => {
      setFeedback({ type: 'success', text: 'Company settings updated successfully.' });
      queryClient.invalidateQueries(['companySettings']);
    },
    onError: (err) => {
      setFeedback({ type: 'error', text: err.response?.data?.detail || 'Failed to update company settings.' });
    }
  });

  const updatePolicyMutation = useMutation({
    mutationFn: settingsApi.updateLeavePolicy,
    onSuccess: () => {
      setFeedback({ type: 'success', text: 'Leave policy updated successfully.' });
      queryClient.invalidateQueries(['leavePolicy']);
    },
    onError: (err) => {
      setFeedback({ type: 'error', text: err.response?.data?.detail || 'Failed to update leave policy.' });
    }
  });

  const updateHoursMutation = useMutation({
    mutationFn: settingsApi.updateWorkingHours,
    onSuccess: () => {
      setFeedback({ type: 'success', text: 'Working hours updated successfully.' });
      queryClient.invalidateQueries(['workingHours']);
    },
    onError: (err) => {
      setFeedback({ type: 'error', text: err.response?.data?.detail || 'Failed to update working hours.' });
    }
  });

  const addHolidayMutation = useMutation({
    mutationFn: settingsApi.addHoliday,
    onSuccess: () => {
      setFeedback({ type: 'success', text: 'Holiday added successfully.' });
      holidayForm.reset({ name: '', date: '' });
      queryClient.invalidateQueries(['holidays']);
    },
    onError: (err) => {
      setFeedback({ type: 'error', text: err.response?.data?.detail || 'Failed to add holiday.' });
    }
  });

  const removeHolidayMutation = useMutation({
    mutationFn: settingsApi.removeHoliday,
    onSuccess: () => {
      setFeedback({ type: 'success', text: 'Holiday removed successfully.' });
      queryClient.invalidateQueries(['holidays']);
    },
    onError: (err) => {
      setFeedback({ type: 'error', text: err.response?.data?.detail || 'Failed to remove holiday.' });
    }
  });

  const updatePermissionMutation = useMutation({
    mutationFn: ({ role, data }) => settingsApi.updateRolePermissions(role, data),
    onSuccess: () => {
      setFeedback({ type: 'success', text: 'Role permissions updated successfully.' });
      queryClient.invalidateQueries(['rolePermissions']);
    },
    onError: (err) => {
      setFeedback({ type: 'error', text: err.response?.data?.detail || 'Failed to update role permissions.' });
    }
  });

  // Submit handlers
  const handleProfileSubmit = (data) => {
    setFeedback(null);
    updateProfileMutation.mutate(data);
  };

  const handlePasswordSubmit = (data) => {
    setFeedback(null);
    if (data.new_password !== data.confirm_password) {
      setFeedback({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    changePasswordMutation.mutate({
      old_password: data.old_password,
      new_password: data.new_password,
    });
  };

  const handleCompanySubmit = (data) => {
    setFeedback(null);
    updateCompanyMutation.mutate(data);
  };

  const handlePolicySubmit = (data) => {
    setFeedback(null);
    updatePolicyMutation.mutate({
      annual_allowance: parseInt(data.annual_allowance, 10),
      max_consecutive_days: parseInt(data.max_consecutive_days, 10),
      approval_required: data.approval_required,
      carry_over_days: parseInt(data.carry_over_days, 10),
    });
  };

  const handleHoursSubmit = (data) => {
    setFeedback(null);
    updateHoursMutation.mutate(data);
  };

  const handleHolidaySubmit = (data) => {
    setFeedback(null);
    addHolidayMutation.mutate(data);
  };

  const handlePermissionToggle = (rolePerm, permissionName) => {
    setFeedback(null);
    const updatedValue = !rolePerm[permissionName];
    updatePermissionMutation.mutate({
      role: rolePerm.role,
      data: {
        [permissionName]: updatedValue,
      },
    });
  };

  const getTabClass = (tab) => {
    const base = 'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200';
    if (activeTab === tab) {
      return `${base} bg-indigo-600 text-white shadow-md shadow-indigo-150`;
    }
    return `${base} text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="rounded-xl border border-slate-200 dark:border-slate-800 p-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-indigo-600 dark:text-indigo-400">PeopleFlow</p>
              <h1 className="text-xl font-extrabold">Settings & System Policies</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Dark Mode toggle button */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="rounded-xl border border-slate-200 dark:border-slate-800 p-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900"
              title="Toggle Dark Mode"
            >
              {darkMode ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} />}
            </button>
            <span className="rounded-full bg-indigo-50 dark:bg-indigo-950 px-3 py-1.5 text-xs font-bold capitalize text-indigo-600 dark:text-indigo-400">
              {user?.role} Portal
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6">
        {feedback && (
          <div
            className={`mb-6 flex items-center gap-3 rounded-xl border p-4 text-sm font-semibold transition-all ${
              feedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50'
                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900/50'
            }`}
          >
            {feedback.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
            <span>{feedback.text}</span>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-4">
          {/* Navigation tabs */}
          <div className="flex flex-col gap-2">
            <button onClick={() => setActiveTab('profile')} className={getTabClass('profile')}>
              <User size={18} /> My Profile
            </button>
            <button onClick={() => setActiveTab('password')} className={getTabClass('password')}>
              <Key size={18} /> Change Password
            </button>

            {isAdmin && (
              <>
                <div className="my-2 border-t border-slate-200 dark:border-slate-800" />
                <p className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Admin Control</p>
                <button onClick={() => setActiveTab('company')} className={getTabClass('company')}>
                  <Building size={18} /> Company Information
                </button>
                <button onClick={() => setActiveTab('policies')} className={getTabClass('policies')}>
                  <Clock size={18} /> Policies & Working Hours
                </button>
                <button onClick={() => setActiveTab('holidays')} className={getTabClass('holidays')}>
                  <Calendar size={18} /> Holiday Calendar
                </button>
                <button onClick={() => setActiveTab('permissions')} className={getTabClass('permissions')}>
                  <Shield size={18} /> Role Permissions
                </button>
              </>
            )}
          </div>

          {/* Form panels */}
          <div className="md:col-span-3">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm">
              
              {/* PROFILE TAB */}
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-lg font-bold">Personal Profile Settings</h2>
                  <p className="text-xs text-slate-400 mb-6">Update your contact information visible to the organization.</p>
                  
                  {profileQuery.isLoading ? (
                    <div className="text-slate-400 text-sm">Loading profile…</div>
                  ) : (
                    <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Full Name (Read-Only)</label>
                          <input
                            type="text"
                            disabled
                            value={profileQuery.data?.full_name || ''}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Employee ID (Read-Only)</label>
                          <input
                            type="text"
                            disabled
                            value={profileQuery.data?.employee_id || ''}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Email (Read-Only)</label>
                          <input
                            type="text"
                            disabled
                            value={profileQuery.data?.email || ''}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Phone Number</label>
                          <input
                            type="text"
                            {...profileForm.register('phone')}
                            placeholder="e.g. +1 (555) 123-4567"
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none dark:focus:border-indigo-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Residential Address</label>
                        <textarea
                          rows={3}
                          {...profileForm.register('address')}
                          placeholder="Your complete home address"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none dark:focus:border-indigo-400"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 shadow shadow-indigo-200 disabled:opacity-50"
                      >
                        <Save size={16} />
                        {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* CHANGE PASSWORD TAB */}
              {activeTab === 'password' && (
                <div>
                  <h2 className="text-lg font-bold">Change Account Password</h2>
                  <p className="text-xs text-slate-400 mb-6">Keep your credentials secure. Password should be at least 6 characters.</p>

                  <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Current Password</label>
                      <input
                        type="password"
                        {...passwordForm.register('old_password', { required: true })}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none dark:focus:border-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">New Password</label>
                      <input
                        type="password"
                        {...passwordForm.register('new_password', { required: true, minLength: 6 })}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none dark:focus:border-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Confirm New Password</label>
                      <input
                        type="password"
                        {...passwordForm.register('confirm_password', { required: true })}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none dark:focus:border-indigo-400"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={changePasswordMutation.isPending}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 shadow shadow-indigo-200 disabled:opacity-50"
                    >
                      <Save size={16} />
                      {changePasswordMutation.isPending ? 'Updating...' : 'Change Password'}
                    </button>
                  </form>
                </div>
              )}

              {/* COMPANY SETTINGS TAB */}
              {activeTab === 'company' && isAdmin && (
                <div>
                  <h2 className="text-lg font-bold">Company Profile Information</h2>
                  <p className="text-xs text-slate-400 mb-6">Manage global company attributes shown on report headers and documents.</p>

                  {companySettingsQuery.isLoading ? (
                    <div className="text-slate-400 text-sm">Loading company settings…</div>
                  ) : (
                    <form onSubmit={companyForm.handleSubmit(handleCompanySubmit)} className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Company Name</label>
                          <input
                            type="text"
                            {...companyForm.register('company_name', { required: true })}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none dark:focus:border-indigo-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Tax Registration ID (optional)</label>
                          <input
                            type="text"
                            {...companyForm.register('tax_id')}
                            placeholder="e.g. REG-98765-ABC"
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none dark:focus:border-indigo-400"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Corporate Email</label>
                          <input
                            type="email"
                            {...companyForm.register('email')}
                            placeholder="info@yourcompany.com"
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none dark:focus:border-indigo-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Company Phone</label>
                          <input
                            type="text"
                            {...companyForm.register('phone')}
                            placeholder="+1 (800) 555-0100"
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none dark:focus:border-indigo-400"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Website Domain</label>
                          <input
                            type="text"
                            {...companyForm.register('website')}
                            placeholder="www.yourcompany.com"
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none dark:focus:border-indigo-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Corporate Address</label>
                          <input
                            type="text"
                            {...companyForm.register('address')}
                            placeholder="HQ Street address"
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none dark:focus:border-indigo-400"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={updateCompanyMutation.isPending}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 shadow shadow-indigo-200 disabled:opacity-50"
                      >
                        <Save size={16} />
                        {updateCompanyMutation.isPending ? 'Saving...' : 'Save Corporate Settings'}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* POLICIES & WORKING HOURS TAB */}
              {activeTab === 'policies' && isAdmin && (
                <div className="space-y-8">
                  {/* Leave Policy Settings */}
                  <div>
                    <h2 className="text-lg font-bold">Leave Policy & Allowances</h2>
                    <p className="text-xs text-slate-400 mb-6 font-medium">Configure global limits and requirements for time-off requests.</p>
                    
                    {leavePolicyQuery.isLoading ? (
                      <div className="text-slate-400 text-sm">Loading leave policy…</div>
                    ) : (
                      <form onSubmit={policyForm.handleSubmit(handlePolicySubmit)} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Annual Allowance (Days)</label>
                            <input
                              type="number"
                              {...policyForm.register('annual_allowance', { required: true, min: 0 })}
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none dark:focus:border-indigo-400"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Max Consecutive Days</label>
                            <input
                              type="number"
                              {...policyForm.register('max_consecutive_days', { required: true, min: 1 })}
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none dark:focus:border-indigo-400"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Carry Over Limit (Days)</label>
                            <input
                              type="number"
                              {...policyForm.register('carry_over_days', { required: true, min: 0 })}
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none dark:focus:border-indigo-400"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-3 py-2">
                          <input
                            type="checkbox"
                            id="approval_required"
                            {...policyForm.register('approval_required')}
                            className="h-4.5 w-4.5 rounded border-slate-200 text-indigo-600 focus:ring-indigo-500"
                          />
                          <label htmlFor="approval_required" className="text-sm font-semibold select-none">
                            Managerial approval required for all leaves
                          </label>
                        </div>

                        <button
                          type="submit"
                          disabled={updatePolicyMutation.isPending}
                          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 shadow shadow-indigo-200 disabled:opacity-50"
                        >
                          <Save size={16} />
                          {updatePolicyMutation.isPending ? 'Saving...' : 'Save Leave Policy'}
                        </button>
                      </form>
                    )}
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-800" />

                  {/* Working Hours Settings */}
                  <div>
                    <h2 className="text-lg font-bold">Standard Office Working Hours</h2>
                    <p className="text-xs text-slate-400 mb-6 font-medium">Set the official daily working schedule and active working days.</p>

                    {workingHoursQuery.isLoading ? (
                      <div className="text-slate-400 text-sm">Loading working hours…</div>
                    ) : (
                      <form onSubmit={hoursForm.handleSubmit(handleHoursSubmit)} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Daily Shift Start Time</label>
                            <input
                              type="text"
                              placeholder="HH:MM (e.g. 09:00)"
                              {...hoursForm.register('start_time', { required: true, minLength: 5, maxLength: 5 })}
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none dark:focus:border-indigo-400"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Daily Shift End Time</label>
                            <input
                              type="text"
                              placeholder="HH:MM (e.g. 17:00)"
                              {...hoursForm.register('end_time', { required: true, minLength: 5, maxLength: 5 })}
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none dark:focus:border-indigo-400"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Working Days (comma separated)</label>
                          <input
                            type="text"
                            placeholder="Monday,Tuesday,Wednesday,Thursday,Friday"
                            {...hoursForm.register('work_days', { required: true })}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none dark:focus:border-indigo-400"
                          />
                          <p className="text-[10px] text-slate-400 mt-1">Provide days fully spelled out, separated by commas without spaces.</p>
                        </div>

                        <button
                          type="submit"
                          disabled={updateHoursMutation.isPending}
                          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 shadow shadow-indigo-200 disabled:opacity-50"
                        >
                          <Save size={16} />
                          {updateHoursMutation.isPending ? 'Saving...' : 'Save Shift Settings'}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )}

              {/* HOLIDAY CALENDAR TAB */}
              {activeTab === 'holidays' && isAdmin && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold">Holiday Calendar Management</h2>
                    <p className="text-xs text-slate-400 mb-6 font-medium">Declare national or company-wide holidays. These days are automatically exempted from attendance penalties.</p>

                    <form onSubmit={holidayForm.handleSubmit(handleHolidaySubmit)} className="flex flex-col sm:flex-row gap-3 items-end">
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Holiday Title</label>
                        <input
                          type="text"
                          placeholder="e.g. New Year's Day"
                          {...holidayForm.register('name', { required: true })}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none dark:focus:border-indigo-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Date</label>
                        <input
                          type="date"
                          {...holidayForm.register('date', { required: true })}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none dark:focus:border-indigo-400"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={addHolidayMutation.isPending}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 h-10 px-5 text-sm font-bold text-white hover:bg-indigo-700 shadow shadow-indigo-150 disabled:opacity-50"
                      >
                        <Plus size={16} />
                        Add Holiday
                      </button>
                    </form>
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-800" />

                  {holidaysQuery.isLoading ? (
                    <div className="text-slate-400 text-sm">Loading holidays...</div>
                  ) : (
                    <div>
                      <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wider">Scheduled Holidays</h3>
                      {holidaysQuery.data?.length === 0 ? (
                        <p className="text-sm text-slate-400 italic">No holidays configured yet.</p>
                      ) : (
                        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left">
                            <thead className="bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-500 uppercase">
                              <tr>
                                <th className="px-4 py-3">Holiday Name</th>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-transparent text-sm">
                              {holidaysQuery.data?.map((holiday) => (
                                <tr key={holiday.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                                  <td className="px-4 py-3 font-semibold">{holiday.name}</td>
                                  <td className="px-4 py-3 text-slate-550 dark:text-slate-400">
                                    {new Date(holiday.date).toLocaleDateString(undefined, {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <button
                                      onClick={() => {
                                        if (confirm(`Remove holiday "${holiday.name}"?`)) {
                                          removeHolidayMutation.mutate(holiday.id);
                                        }
                                      }}
                                      className="rounded p-1 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950 hover:text-rose-600 transition"
                                      title="Delete Holiday"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ROLE PERMISSIONS matrix TAB */}
              {activeTab === 'permissions' && isAdmin && (
                <div>
                  <h2 className="text-lg font-bold">Role & Permissions Authorization Matrix</h2>
                  <p className="text-xs text-slate-400 mb-6">Manage dynamic functional access for organization roles. Changes take effect on the next operation.</p>

                  {rolePermissionsQuery.isLoading ? (
                    <div className="text-slate-400 text-sm">Loading permissions matrix...</div>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-500 uppercase">
                          <tr>
                            <th className="px-4 py-3">Permission/Access Area</th>
                            <th className="px-4 py-3 text-center">Administrator</th>
                            <th className="px-4 py-3 text-center">HR Operations</th>
                            <th className="px-4 py-3 text-center">Employee</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-transparent text-sm">
                          {[
                            { key: 'can_manage_employees', label: 'Manage Employee Profiles' },
                            { key: 'can_manage_leave', label: 'Review & Approve Leaves' },
                            { key: 'can_manage_payroll', label: 'Process Payroll & Generate Payslips' },
                            { key: 'can_view_reports', label: 'Access System Reports & Analytics' },
                            { key: 'can_manage_settings', label: 'Access System Settings Panel' },
                          ].map((perm) => {
                            const adminPerm = rolePermissionsQuery.data?.find(p => p.role === 'admin');
                            const hrPerm = rolePermissionsQuery.data?.find(p => p.role === 'hr');
                            const empPerm = rolePermissionsQuery.data?.find(p => p.role === 'employee');

                            return (
                              <tr key={perm.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                                <td className="px-4 py-3 font-semibold">{perm.label}</td>
                                
                                {/* Admin checkbox (read-only usually) */}
                                <td className="px-4 py-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={adminPerm ? adminPerm[perm.key] : true}
                                    disabled
                                    className="h-4.5 w-4.5 rounded border-slate-200 text-indigo-600 cursor-not-allowed opacity-60"
                                  />
                                </td>

                                {/* HR Checkbox */}
                                <td className="px-4 py-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={hrPerm ? hrPerm[perm.key] : false}
                                    onChange={() => hrPerm && handlePermissionToggle(hrPerm, perm.key)}
                                    disabled={updatePermissionMutation.isPending}
                                    className="h-4.5 w-4.5 rounded border-slate-200 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                                  />
                                </td>

                                {/* Employee Checkbox */}
                                <td className="px-4 py-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={empPerm ? empPerm[perm.key] : false}
                                    onChange={() => empPerm && handlePermissionToggle(empPerm, perm.key)}
                                    disabled={updatePermissionMutation.isPending}
                                    className="h-4.5 w-4.5 rounded border-slate-200 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
