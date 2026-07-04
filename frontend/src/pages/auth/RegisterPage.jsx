import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Loader2, CheckCircle2, Sparkles } from 'lucide-react';

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setError('');
    
    try {
      await registerUser({
        employee_id: data.employeeId,
        full_name: data.fullName,
        email: data.email,
        password: data.password,
        role: data.role,
      });
      setIsSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300 animate-page">
        {/* Background blobs */}
        <div className="absolute top-[-10%] left-[-10%] h-[40rem] w-[40rem] rounded-full bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[40rem] w-[40rem] rounded-full bg-gradient-to-br from-teal-500/10 to-indigo-500/10 blur-[120px] pointer-events-none" />

        <div className="max-w-md w-full z-10 p-8 sm:p-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 shadow-2xl rounded-3xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mb-6">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Registration Successful!
          </h2>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            A verification link has been sent to your email address. Please click the link inside the email to verify your account before logging in.
          </p>
          <div className="mt-8">
            <Link
              to="/login"
              className="w-full flex items-center justify-center rounded-2xl bg-indigo-600 hover:bg-indigo-550 py-3 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition active:scale-95"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300 animate-page">
      {/* Decorative Glow Blobs */}
      <div className="absolute top-[-10%] left-[-10%] h-[40rem] w-[40rem] rounded-full bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[40rem] w-[40rem] rounded-full bg-gradient-to-br from-teal-500/10 to-indigo-500/10 blur-[120px] pointer-events-none" />

      <div className="max-w-lg w-full z-10">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 shadow-2xl rounded-3xl p-8 sm:p-10 transition-all duration-300 hover:shadow-indigo-500/5 dark:hover:shadow-indigo-500/10">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20 mb-4">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Create Account
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Get started with PeopleFlow HRMS today.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="bg-red-50/80 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-655 dark:text-red-400 px-4 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Employee ID */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-1.5">
                  Employee ID
                </label>
                <input
                  {...register('employeeId', { required: 'Employee ID is required' })}
                  type="text"
                  className="block w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition sm:text-sm"
                  placeholder="EMP001"
                />
                {errors.employeeId && (
                  <p className="mt-1 text-xs font-semibold text-red-550 dark:text-red-400">{errors.employeeId.message}</p>
                )}
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  {...register('fullName', { required: 'Full name is required' })}
                  type="text"
                  className="block w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition sm:text-sm"
                  placeholder="John Doe"
                />
                {errors.fullName && (
                  <p className="mt-1 text-xs font-semibold text-red-550 dark:text-red-400">{errors.fullName.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  {...register('email', {
                    required: 'Email address is required',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  type="email"
                  className="block w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition sm:text-sm"
                  placeholder="john.doe@company.com"
                />
                {errors.email && (
                  <p className="mt-1 text-xs font-semibold text-red-550 dark:text-red-400">{errors.email.message}</p>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-1.5">
                  System Role
                </label>
                <select
                  {...register('role', { required: 'Please select a role' })}
                  className="block w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition sm:text-sm bg-white dark:bg-slate-900"
                >
                  <option value="employee">Employee</option>
                  <option value="hr">HR Operations Officer</option>
                </select>
                {errors.role && (
                  <p className="mt-1 text-xs font-semibold text-red-550 dark:text-red-400">{errors.role.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 8, message: 'Must be at least 8 chars' },
                      validate: (value) => {
                        const hasUpperCase = /[A-Z]/.test(value);
                        const hasLowerCase = /[a-z]/.test(value);
                        const hasNumber = /[0-9]/.test(value);
                        const hasSpecialChar = /[!@#$%^&*()_+=[\]{};':"\\|,.<>/?-]/.test(value);
                        
                        if (!hasUpperCase) return 'Requires an uppercase letter';
                        if (!hasLowerCase) return 'Requires a lowercase letter';
                        if (!hasNumber) return 'Requires a digit';
                        if (!hasSpecialChar) return 'Requires a symbol';
                        return true;
                      },
                    })}
                    type={showPassword ? 'text' : 'password'}
                    className="block w-full pl-4 pr-10 py-2.5 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition sm:text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-650"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs font-semibold text-red-550 dark:text-red-400">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <input
                  {...register('confirmPassword', {
                    required: 'Confirm your password',
                    validate: (value) => value === password || 'Passwords do not match',
                  })}
                  type="password"
                  className="block w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition sm:text-sm"
                  placeholder="••••••••"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs font-semibold text-red-550 dark:text-red-400">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-550 shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin h-4 w-4" />
                ) : null}
                <span>Create Account</span>
              </button>
            </div>
          </form>

          {/* Footer Link */}
          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition"
            >
              Sign In
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
