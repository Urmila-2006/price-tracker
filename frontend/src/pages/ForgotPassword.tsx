import { useState } from 'react';
import { Link } from 'react-router-dom';

import { supabase } from '../lib/supabase';
import { Activity, Mail, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (authError) throw authError;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <div className="flex w-full flex-col justify-center bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 p-8 text-white md:w-1/2 lg:p-16">
        <div className="mb-12 flex items-center gap-2">
          <Activity className="h-8 w-8 text-indigo-400" />
          <span className="text-2xl font-bold tracking-tight">PriceTracker</span>
        </div>
        <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight lg:text-5xl">
          Forgot your password?
        </h1>
        <p className="mb-12 max-w-md text-lg text-indigo-100">
          Don't worry! Enter the email address associated with your account and we'll send you a link to reset your password.
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
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
                  <label className="mb-1 block text-sm font-medium text-gray-700">Email address</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      required
                      className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative flex w-full justify-center rounded-lg border border-transparent bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 shadow-md transition-all"
                >
                  {loading ? 'Sending link...' : 'Send Reset Link'}
                </button>
              </div>
              
              <p className="text-center text-sm">
                <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                  &larr; Back to Login
                </Link>
              </p>
            </form>
          ) : (
            <div className="mt-8 space-y-6">
              <div className="rounded-md bg-green-50 p-6 border border-green-200 text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-medium text-green-800 mb-2">Reset link sent</h3>
                <p className="text-sm text-green-700">
                  If an account with this email exists, we've sent instructions to reset your password.
                </p>
              </div>
              <div className="text-center">
                <Link to="/login" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500">
                  &larr; Back to Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
