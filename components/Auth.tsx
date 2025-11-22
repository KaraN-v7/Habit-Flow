// components/Auth.tsx
import React, { useState } from 'react';
import { supabase } from '../services/supabase';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
      // Supabase will redirect to Google — nothing else to do here.
    } catch (err: any) {
      alert('Google sign-in failed: ' + (err.message || String(err)));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-xl border border-[#E0E0E0] shadow-xl overflow-hidden p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-[#37352F] text-white rounded-lg flex items-center justify-center text-xl font-bold mb-4 shadow-lg">H</div>
          <h1 className="text-2xl font-bold text-[#37352F]">HabitFlow</h1>
          <p className="text-[#787774] mt-2 text-center">Sign in with Google to sync your habits across devices.</p>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white border border-[#E0E0E0] hover:bg-[#FAFAFA] text-[#37352F] font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-3 shadow-sm mb-6"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
          <span>{loading ? 'Connecting...' : 'Continue with Google'}</span>
        </button>

        <p className="text-xs text-center text-[#9B9B9B]">
          By signing in you agree to store your habits in the cloud (Supabase) so they are available on any device.
        </p>
      </div>
    </div>
  );
};

export default Auth;
