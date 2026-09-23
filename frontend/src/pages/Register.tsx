import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { getApiErrorMessage } from '../utils/errorHandler';
import PasswordInput from '../components/PasswordInput';
import { Activity, ShieldCheck } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Password strength calculation
  const calculateStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (pass.match(/[A-Z]/)) score++;
    if (pass.match(/[0-9]/)) score++;
    if (pass.match(/[^A-Za-z0-9]/)) score++;
    return score;
  };

  const strength = calculateStrength(password);
  
  const getStrengthDisplay = () => {
    if (password.length === 0) return { text: '', color: 'bg-gray-200', width: 'w-0' };
    if (strength <= 1) return { text: 'Weak', color: 'bg-red-500', width: 'w-1/4' };
    if (strength === 2) return { text: 'Fair', color: 'bg-amber-500', width: 'w-2/4' };
    if (strength === 3) return { text: 'Good', color: 'bg-blue-500', width: 'w-3/4' };
    return { text: 'Strong', color: 'bg-green-500', width: 'w-full' };
  };

  const strengthDetails = getStrengthDisplay();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Frontend validation
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
      await api.post('/auth/register', { name, email, password });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(getApiErrorMessage(err) || 'An unexpected error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row-reverse">
      {/* RIGHT PANEL - BRANDING (Reversed on desktop for variety) */}
      <div className="flex w-full flex-col justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 p-8 text-white md:w-1/2 lg:p-16">
        <div className="mb-12 flex items-center gap-2">
          <Activity className="h-8 w-8 text-purple-400" />
          <span className="text-2xl font-bold tracking-tight">PriceTracker</span>
        </div>
        
        <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight lg:text-5xl">
          Start saving today.
        </h1>
        
        <p className="mb-12 max-w-md text-lg text-purple-100">
          Join thousands of smart shoppers tracking their favorite products across multiple stores.
        </p>

        {/* Feature List */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
              <ShieldCheck className="h-6 w-6 text-purple-300" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Secure by design</h3>
              <p className="text-sm text-purple-200">Your data is encrypted and safe.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
              <Activity className="h-6 w-6 text-purple-300" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Real-time alerts</h3>
              <p className="text-sm text-purple-200">Instant notifications when prices drop.</p>
            </div>
          </div>
        </div>
      </div>

      {/* LEFT PANEL - FORM */}
      <div className="flex w-full items-center justify-center bg-gray-50 p-8 md:w-1/2">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
              Create an account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Let's get you set up with PriceTracker
            </p>
          </div>
          
          <form className="mt-8 space-y-5" onSubmit={handleRegister}>
            {error && (
              <div className="rounded-md bg-red-50 p-4 border border-red-200">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Registration failed</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {success && (
              <div className="rounded-md bg-green-50 p-4 border border-green-200">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Account created successfully!</h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>Redirecting you to login...</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

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
                <PasswordInput 
                  label="Password"
                  required
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                
                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500">Password strength:</span>
                      <span className={`font-medium ${strengthDetails.text === 'Weak' ? 'text-red-500' : strengthDetails.text === 'Strong' ? 'text-green-500' : 'text-gray-700'}`}>
                        {strengthDetails.text}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                      <div className={`h-full ${strengthDetails.color} ${strengthDetails.width} transition-all duration-300`}></div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <PasswordInput 
                  label="Confirm Password"
                  required
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || success}
                className="group relative flex w-full justify-center rounded-lg border border-transparent bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 shadow-md transition-all"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </div>
            
            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
