import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { getApiErrorMessage } from '../utils/errorHandler';
import PasswordInput from '../components/PasswordInput';
import { Activity, ShieldCheck, AlertCircle } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!token) {
      setError('Invalid or missing reset token.');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(getApiErrorMessage(err) || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h2>
          <p className="text-gray-600 mb-6">This password reset link is missing or invalid.</p>
          <Link to="/forgot-password" className="inline-flex justify-center rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700">
            Request new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row-reverse">
      <div className="flex w-full flex-col justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 p-8 text-white md:w-1/2 lg:p-16">
        <div className="mb-12 flex items-center gap-2">
          <Activity className="h-8 w-8 text-purple-400" />
          <span className="text-2xl font-bold tracking-tight">PriceTracker</span>
        </div>
        <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight lg:text-5xl">
          Create new password
        </h1>
        <p className="max-w-md text-lg text-purple-100">
          Almost there! Please enter a strong, new password below.
        </p>
      </div>

      <div className="flex w-full items-center justify-center bg-gray-50 p-8 md:w-1/2">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
              Reset Password
            </h2>
          </div>
          
          {!success ? (
            <form className="mt-8 space-y-6" onSubmit={handleReset}>
              {error && (
                <div className="rounded-md bg-red-50 p-4 border border-red-200">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Error</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{error}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <PasswordInput 
                    label="New Password"
                    required
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                
                <div>
                  <PasswordInput 
                    label="Confirm Password"
                    required
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative flex w-full justify-center rounded-lg border border-transparent bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 shadow-md transition-all"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-8 space-y-6">
              <div className="rounded-md bg-green-50 p-6 border border-green-200 text-center">
                <ShieldCheck className="mx-auto h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-medium text-green-800 mb-2">Password reset successfully</h3>
                <p className="text-sm text-green-700 mb-4">
                  Your password has been changed. You can now use your new password to log in.
                </p>
                <Link to="/login" className="inline-flex justify-center rounded-lg border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
                  Go to Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
