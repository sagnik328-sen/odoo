import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { Loader2, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [statusState, setStatusState] = useState('verifying'); // verifying, success, error
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const performVerification = async () => {
      if (!token) {
        setStatusState('error');
        setErrorMsg('Verification token is missing or invalid.');
        return;
      }

      try {
        await authApi.verifyEmail(token);
        setStatusState('success');
        
        // Redirect to login after 3 seconds
        const timer = setTimeout(() => {
          navigate('/login');
        }, 3000);
        
        return () => clearTimeout(timer);
      } catch (err) {
        setStatusState('error');
        setErrorMsg(err.response?.data?.detail || 'Email verification failed.');
      }
    };

    performVerification();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-800 animate-page">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-2xl shadow-xl border border-slate-100 text-center">
        
        {/* Brand/Logo header */}
        <div className="flex flex-col items-center gap-1.5 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-650 text-white shadow-md shadow-indigo-200">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <span className="font-extrabold text-slate-900 tracking-tight text-lg">PeopleFlow</span>
          <span className="text-[10px] text-slate-400 -mt-1.5 font-bold uppercase tracking-wider">Account Security</span>
        </div>

        {statusState === 'verifying' && (
          <div className="space-y-4 py-4">
            <Loader2 className="mx-auto h-12 w-12 text-indigo-650 animate-spin" />
            <h2 className="text-xl font-bold text-slate-900">Verifying Your Email</h2>
            <p className="text-sm text-slate-500">
              Please wait while we confirm your email address with our servers...
            </p>
          </div>
        )}

        {statusState === 'success' && (
          <div className="space-y-4 py-4">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 animate-bounce" />
            <h2 className="text-xl font-bold text-slate-900">Email Verified!</h2>
            <p className="text-sm text-slate-500">
              Your email address has been successfully verified.
            </p>
            <p className="text-xs text-indigo-605 font-semibold mt-2">
              Redirecting you to the login screen in 3 seconds...
            </p>
            <div className="pt-4">
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition active:scale-95"
              >
                Go to Login Now
              </Link>
            </div>
          </div>
        )}

        {statusState === 'error' && (
          <div className="space-y-4 py-4">
            <AlertCircle className="mx-auto h-12 w-12 text-rose-500" />
            <h2 className="text-xl font-bold text-slate-900">Verification Failed</h2>
            <p className="text-sm text-rose-600 font-medium bg-rose-50 border border-rose-100 rounded-lg p-3">
              {errorMsg}
            </p>
            <p className="text-sm text-slate-500">
              The link may have expired or is invalid. Please try requesting a new verification link or contact support.
            </p>
            <div className="pt-4">
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition active:scale-95"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
