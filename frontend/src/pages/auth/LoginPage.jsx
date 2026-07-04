import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Loader2, Sparkles, Lock, Mail } from 'lucide-react';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setError('');
    
    try {
      await login(data);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300 animate-page">
      {/* Decorative Glow Blobs */}
      <div className="absolute top-[-10%] left-[-10%] h-[40rem] w-[40rem] rounded-full bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[40rem] w-[40rem] rounded-full bg-gradient-to-br from-teal-500/10 to-indigo-500/10 blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full z-10">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 shadow-2xl rounded-3xl p-8 sm:p-10 transition-all duration-300 hover:shadow-indigo-500/5 dark:hover:shadow-indigo-500/10">
          
          {/* Brand Logo & Header */}
          <div className="text-center mb-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20 mb-4">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Sign In
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Welcome back! Please enter your details.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="bg-red-50/80 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-650 dark:text-red-400 px-4 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail size={16} />
                  </span>
                  <input
                    {...register('email', {
                      required: 'Email address is required',
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: 'Please enter a valid email address',
                      },
                    })}
                    type="email"
                    className="block w-full pl-10 pr-4 py-3 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition sm:text-sm"
                    placeholder="name@company.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs font-semibold text-red-550 dark:text-red-400">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock size={16} />
                  </span>
                  <input
                    {...register('password', { required: 'Password is required' })}
                    type={showPassword ? 'text' : 'password'}
                    className="block w-full pl-10 pr-10 py-3 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition sm:text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs font-semibold text-red-550 dark:text-red-400">{errors.password.message}</p>
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
                <span>Sign In</span>
              </button>
            </div>
          </form>

          {/* Footer Link */}
          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition"
            >
              Create one now
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
