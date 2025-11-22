import React, { useState } from 'react';
import { ArrowRight, Lock, KeyRound } from 'lucide-react';
import { supabase } from '../services/supabase';

interface AuthProps {
  onLogin: (username: string, pin: string, isRegistering: boolean) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().length < 3) {
      alert("Username must be at least 3 characters.");
      return;
    }
    if (pin.length !== 4) {
      alert("Please enter a valid 4-digit PIN.");
      return;
    }
    // Pass the mode: !isLogin means we are registering
    onLogin(username.trim(), pin, !isLogin);
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and max 4 digits
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(value);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Redirect to the current URL after login
          redirectTo: window.location.origin 
        }
      });
      if (error) throw error;
    } catch (error: any) {
      alert("Error logging in with Google: " + error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-xl border border-[#E0E0E0] shadow-xl overflow-hidden p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-[#37352F] text-white rounded-lg flex items-center justify-center text-xl font-bold mb-4 shadow-lg">
            H
          </div>
          <h1 className="text-2xl font-bold text-[#37352F]">Welcome to HabitFlow</h1>
          <p className="text-[#787774] mt-2 text-center">
            {isLogin ? "Enter your credentials to continue." : "Set up your secure profile."}
          </p>
        </div>

        {/* Google Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white border border-[#E0E0E0] hover:bg-[#FAFAFA] text-[#37352F] font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-3 shadow-sm mb-6 relative"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
          <span>{loading ? 'Connecting...' : 'Continue with Google'}</span>
        </button>

        <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-[#E0E0E0]"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">OR USE PIN</span>
            <div className="flex-grow border-t border-[#E0E0E0]"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#787774] uppercase mb-2">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#E0E0E0] focus:outline-none focus:border-[#37352F] focus:ring-1 focus:ring-[#37352F] transition-all bg-[#FAFAFA] focus:bg-white"
              />
              <Lock className="absolute left-3 top-3.5 text-[#9B9B9B]" size={18} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#787774] uppercase mb-2">
              {isLogin ? "Enter PIN" : "Set 4-Digit PIN"}
            </label>
            <div className="relative">
              <input
                type="password"
                value={pin}
                onChange={handlePinChange}
                placeholder="****"
                inputMode="numeric"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#E0E0E0] focus:outline-none focus:border-[#37352F] focus:ring-1 focus:ring-[#37352F] transition-all bg-[#FAFAFA] focus:bg-white tracking-widest font-bold"
              />
              <KeyRound className="absolute left-3 top-3.5 text-[#9B9B9B]" size={18} />
            </div>
            <p className="text-[10px] text-[#9B9B9B] mt-1 ml-1">
                {isLogin ? "Your 4-digit security code." : "This will be used to login to your account."}
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-[#37352F] hover:bg-black text-white font-medium py-3 rounded-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-md mt-2"
          >
            {isLogin ? 'Sign In' : 'Create Account'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => {
                setIsLogin(!isLogin);
                setPin('');
                setUsername('');
            }}
            className="text-sm text-[#787774] hover:text-[#37352F] underline decoration-dotted"
          >
            {isLogin ? "New here? Create an account" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;