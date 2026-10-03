import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import { supabase } from '../lib/supabase';
import PasswordInput from '../components/PasswordInput';
import { Activity, TrendingDown } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw authError;
      
      // Keep localStorage token for backwards compatibility if needed, 
      // though Supabase manages its own session.
      if (data.session) {
        localStorage.setItem('token', data.session.access_token);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* LEFT PANEL */}
      <div className="flex w-full flex-col justify-center bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 p-8 text-white md:w-1/2 lg:p-16">
        <div className="mb-12 flex items-center gap-2">
          <Activity className="h-8 w-8 text-indigo-400" />
          <span className="text-2xl font-bold tracking-tight">PriceTracker</span>
        </div>
        
        <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight lg:text-5xl">
          Track prices.<br />
          <span className="text-indigo-400">Catch the perfect deal.</span>
        </h1>
        
        <p className="mb-12 max-w-md text-lg text-indigo-100">
          Monitor your favorite products and get notified instantly when prices drop to your target.
        </p>

        {/* Decorative Card */}
        <div className="relative max-w-sm rounded-2xl bg-white/10 p-6 shadow-2xl backdrop-blur-md border border-white/20">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-white">Apple iPhone 16 Pro</h3>
              <p className="text-sm text-indigo-200">Flipkart</p>
            </div>
            <span className="rounded-full bg-green-500/20 px-2.5 py-1 text-xs font-semibold text-green-300">
              Target Reached
            </span>
          </div>
          
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-white">₹59,999</span>
            <span className="mb-1 text-lg text-gray-400 line-through">₹69,999</span>
          </div>
          
          <div className="mt-4 flex items-center gap-1.5 font-medium text-green-400">
            <TrendingDown className="h-5 w-5" />
            <span>Dropped by 14% today</span>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex w-full items-center justify-center bg-gray-50 p-8 md:w-1/2">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please sign in to your account
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="rounded-md bg-red-50 p-4 border border-red-200">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Login Failed</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-4 rounded-md shadow-sm">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Email address</label>
                <input
                  type="email"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <Link to="/forgot-password" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    Forgot Password?
                  </Link>
                </div>
                <PasswordInput 
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-lg border border-transparent bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 shadow-md transition-all"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
            
            <p className="text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                Create an account
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
