import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authApi } from '../../api/auth';
import { Loader2, CheckCircle2 } from 'lucide-react';

const ForgotPasswordPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setError('');
    
    try {
      await authApi.forgotPassword(data.email);
      setIsSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong');
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
            Check Your Email
          </h2>
          <p className="mt-4 text-sm text-slate-650 dark:text-slate-400 leading-relaxed">
            If an account exists with that email, we've sent a password reset link.
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

      <div className="max-w-md w-full z-10">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 shadow-2xl rounded-3xl p-8 sm:p-10 transition-all duration-300 hover:shadow-indigo-500/5 dark:hover:shadow-indigo-500/10">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Reset Password
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="bg-red-50/80 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-650 dark:text-red-400 px-4 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Invalid email address',
                  },
                })}
                type="email"
                className="block w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition sm:text-sm"
                placeholder="name@company.com"
              />
              {errors.email && (
                <p className="mt-1.5 text-xs font-semibold text-red-550 dark:text-red-400">{errors.email.message}</p>
              )}
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
                <span>Send Reset Link</span>
              </button>
            </div>

            <div className="text-center mt-4">
              <Link
                to="/login"
                className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition"
              >
                Back to Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
