import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authApi } from '../../api/auth';
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch('newPassword');

  const onSubmit = async (data) => {
    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    try {
      await authApi.resetPassword(token, data.newPassword);
      setIsSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Password reset failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-900">Invalid Link</h2>
          <p className="mt-2 text-gray-600">
            This password reset link is invalid or has expired.
          </p>
          <div className="mt-6">
            <Link
              to="/forgot-password"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Request a new reset link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            Password Reset Successful!
          </h2>
          <p className="mt-2 text-gray-600">
            Redirecting you to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset Your Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  {...register('newPassword', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Password must be at least 8 characters' },
                    validate: (value) => {
                      const hasUpperCase = /[A-Z]/.test(value);
                      const hasLowerCase = /[a-z]/.test(value);
                      const hasNumber = /[0-9]/.test(value);
                      const hasSpecialChar = /[!@#$%^&*()_+=[\]{};':"\\|,.<>/?-]/.test(value);
                      
                      if (!hasUpperCase) return 'Password must contain at least one uppercase letter';
                      if (!hasLowerCase) return 'Password must contain at least one lowercase letter';
                      if (!hasNumber) return 'Password must contain at least one number';
                      if (!hasSpecialChar) return 'Password must contain at least one special character';
                      return true;
                    },
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === password || 'Passwords do not match',
                })}
                type="password"
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Confirm new password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
              ) : null}
              Reset Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
