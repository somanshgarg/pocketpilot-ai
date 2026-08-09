import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { Sparkles, Mail, Lock, LogIn, UserPlus, ArrowRight, ShieldCheck, Database, Key } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isDemoMode: boolean;
  signOut: () => Promise<void>;
  enterDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER: User = {
  id: '00000000-0000-0000-0000-000000000001',
  app_metadata: {},
  user_metadata: { full_name: 'Alex (Default User)' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'demo@pocketpilot.ai',
} as User;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(!isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setUser(DEMO_USER);
      setIsDemoMode(true);
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) setIsDemoMode(false);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    if (supabase && isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setIsDemoMode(true);
  };

  const enterDemoMode = () => {
    setUser(DEMO_USER);
    setIsDemoMode(true);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isDemoMode, signOut, enterDemoMode }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

// ----------------------------------------------------
// LOGIN & SIGNUP SCREEN COMPONENT
// ----------------------------------------------------
export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, enterDemoMode } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('demo@pocketpilot.ai');
  const [password, setPassword] = useState('password123');
  const [fullName, setFullName] = useState('Alex');
  const [authError, setAuthError] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#080c17] text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 animate-spin flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <p className="text-xs text-slate-400 font-medium">Connecting to PocketPilot Database...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <>{children}</>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthNotice('');

    if (!isSupabaseConfigured || !supabase) {
      enterDemoMode();
      return;
    }

    setAuthLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });

        if (error) throw error;

        if (data.session) {
          // Direct login success
          setAuthNotice('Account created successfully!');
        } else {
          // Confirmation required by Supabase project settings
          setAuthNotice('Account registered! If confirmation is required, check your email, or click "Continue as Guest" to test immediately.');
        }
      } else {
        // Try sign in
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          // If user does not exist yet in Supabase, auto-create the account!
          if (error.message.toLowerCase().includes('invalid login credentials') || error.message.toLowerCase().includes('user not found')) {
            console.log('User not found in Supabase Auth. Attempting auto-registration...');
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email,
              password,
              options: { data: { full_name: email === 'demo@pocketpilot.ai' ? 'Alex' : email.split('@')[0] } },
            });

            if (signUpError) {
              // If signup also fails or requires email confirmation, fallback to demo mode gracefully
              if (email === 'demo@pocketpilot.ai') {
                enterDemoMode();
                return;
              }
              throw signUpError;
            }

            if (!signUpData.session) {
              setAuthNotice('Created new user in Supabase! If email confirmation is enabled in your Supabase Dashboard, please confirm it, or use Guest mode.');
            }
          } else {
            throw error;
          }
        }
      }
    } catch (err: any) {
      // For demo email, automatically fall back to demo mode so the user is never blocked
      if (email === 'demo@pocketpilot.ai') {
        enterDemoMode();
        return;
      }
      setAuthError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-4" style={{ background: '#080c17' }}>
      <div className="w-full max-w-md space-y-6">

        {/* Brand Logo Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 shadow-xl shadow-indigo-500/20 mb-2">
            <Sparkles className="w-7 h-7 text-white animate-pulse" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            PocketPilot <span className="text-gradient-brand">AI</span>
          </h1>
          <p className="text-xs text-slate-400">
            Powered by PostgreSQL & Google Gemini AI
          </p>
        </div>

        {/* Credentials Card */}
        <div
          className="p-6 rounded-2xl space-y-5"
          style={{
            background: 'rgba(13,18,36,0.95)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          }}
        >
          {/* Default User Banner */}
          <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-indigo-300">
                <Key className="w-3.5 h-3.5" /> Quick Demo Login
              </div>
              <button
                type="button"
                onClick={enterDemoMode}
                className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 text-[10px] font-bold transition-all"
              >
                Instant Access →
              </button>
            </div>
            <div className="font-mono text-[11px] text-slate-300">
              Email: <strong className="text-white">demo@pocketpilot.ai</strong>
            </div>
            <div className="font-mono text-[11px] text-slate-300">
              Password: <strong className="text-white">password123</strong>
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-sm font-bold text-white">
              {isSignUp ? 'Create PostgreSQL Account' : 'Sign in to PostgreSQL DB'}
            </h2>
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setAuthError('');
                setAuthNotice('');
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
            >
              {isSignUp ? 'Already have an account?' : 'Need an account?'}
            </button>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
              {authError}
            </div>
          )}

          {authNotice && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
              {authNotice}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Sharma"
                  className="glass-input text-sm"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="demo@pocketpilot.ai"
                  className="glass-input pl-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="glass-input pl-9 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="btn btn-primary w-full py-2.5 justify-center text-sm font-bold shadow-lg shadow-indigo-500/25"
            >
              {authLoading ? (
                'Authenticating...'
              ) : isSignUp ? (
                <>
                  <UserPlus className="w-4 h-4" /> Create Account
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Sign In to Postgres DB
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access */}
          <div className="pt-2 border-t border-white/5 text-center">
            <button
              onClick={enterDemoMode}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg hover:bg-white/5 transition-all"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Continue as Default Guest User (Offline / Local DB)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* DB Status info */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Protected with Row-Level Security (RLS) & PostgreSQL</span>
        </div>
      </div>
    </div>
  );
};
