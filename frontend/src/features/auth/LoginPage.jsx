import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, AlertCircle, CheckCircle } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import Card, { CardContent } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import supabase from '../../lib/supabase';

import SEO from '../../components/common/SEO';

const getFriendlyErrorMessage = (error) => {
  if (!error) return 'Operation failed. Please try again.';
  const msg = String(error.message || error).toLowerCase();
  
  if (msg.includes('rate limit') || msg.includes('429')) {
    return 'Too many signup or sign-in attempts. Please wait a few minutes before trying again.';
  }
  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return 'Incorrect email or password. Please verify your details.';
  }
  if (msg.includes('email_not_confirmed') || msg.includes('email not confirmed') || msg.includes('verified') || msg.includes('confirm your email') || msg.includes('email confirmation')) {
    return 'Email verification required. Please check your inbox and verify your email address to log in.';
  }
  if (msg.includes('user already exists') || msg.includes('already registered')) {
    return 'This email address is already registered. Please log in instead.';
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('connection')) {
    return 'Network connection error. Please verify your internet connectivity.';
  }
  return error.message || 'An unexpected authentication error occurred.';
};

export const LoginPage = () => {
  const { login, register: signUp, forgotPassword } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [apiError, setApiError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
    }
  });

  const handleModeChange = (newMode) => {
    setApiError(null);
    setSuccessMsg(null);
    reset();
    setMode(newMode);
  };

  const onSubmit = async (data) => {
    setApiError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(data.email, data.password);
        navigate('/');
      } else if (mode === 'signup') {
        const user = await signUp(data.name, data.email, data.password);
        
        // Detect if email confirmation is disabled (which auto-creates active session)
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          setSuccessMsg('Account registered successfully! Redirecting to dashboard...');
          setTimeout(() => {
            navigate('/');
          }, 1500);
        } else {
          setSuccessMsg('Account registered successfully! A verification link has been sent to your email. Please verify your email before logging in.');
          reset();
        }
      } else if (mode === 'forgot') {
        await forgotPassword(data.email);
        setSuccessMsg('Password recovery link has been dispatched to your email address.');
        reset();
      }
    } catch (error) {
      setApiError(getFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="HealthGuard AI | AI-Powered Preventive Health Assessment"
        description="HealthGuard AI provides AI-powered preventive health assessments, risk insights, BMI analysis, and personalized health guidance in one platform."
        robots="index,follow"
      />
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "HealthGuard AI",
          "applicationCategory": "HealthApplication",
          "description": "HealthGuard AI provides AI-powered preventive health assessments, risk insights, BMI analysis, and personalized health guidance in one platform.",
          "operatingSystem": "Web",
          "offers": {
            "@type": "Offer",
            "price": "0.00",
            "priceCurrency": "USD"
          }
        })}
      </script>
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors duration-200 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-premium">
            <ShieldAlert size={26} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              {mode === 'login' && 'Access HealthGuard AI'}
              {mode === 'signup' && 'Register HealthGuard AI'}
              {mode === 'forgot' && 'Reset Security Session'}
            </h1>
            <p className="text-sm text-slate-400 dark:text-slate-500">
              {mode === 'login' && 'Enterprise Clinician & Biometrics Management Portal'}
              {mode === 'signup' && 'Create your provider account to access dashboards'}
              {mode === 'forgot' && 'Provide your account email to receive a password reset link'}
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-2">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {apiError && (
                <div className="flex gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 text-xs text-red-600 dark:text-red-400 font-medium">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{apiError}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex gap-2.5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              {mode === 'signup' && (
                <Input
                  label="Full Name"
                  placeholder="Dr. Jordan Carter"
                  error={errors.name?.message}
                  id="name"
                  {...register('name', { 
                    required: mode === 'signup' ? 'Full name is required.' : false 
                  })}
                />
              )}

              <Input
                label="Registered Email"
                type="email"
                placeholder="clinician@healthguard.ai"
                error={errors.email?.message}
                id="email"
                {...register('email', { 
                  required: 'Email address is required.',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address syntax'
                  }
                })}
              />

              {mode !== 'forgot' && (
                <Input
                  label="Security Key / Password"
                  type="password"
                  placeholder="••••••••••••"
                  error={errors.password?.message}
                  id="password"
                  {...register('password', { 
                    required: 'Password credential is required.',
                    minLength: {
                      value: 6,
                      message: 'Password must contain at least 6 characters'
                    }
                  })}
                />
              )}

              <Button 
                type="submit" 
                className="w-full mt-2" 
                loading={loading}
              >
                {mode === 'login' && 'Establish Secure Session'}
                {mode === 'signup' && 'Create Secure Account'}
                {mode === 'forgot' && 'Send Recovery Email'}
              </Button>
            </form>

            {/* Toggle state links */}
            <div className="mt-6 flex flex-col gap-2 items-center text-xs font-semibold text-slate-500 dark:text-slate-400">
              {mode === 'login' && (
                <>
                  <button 
                    onClick={() => handleModeChange('signup')}
                    className="hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
                  >
                    Don't have an account? Sign Up
                  </button>
                  <button 
                    onClick={() => handleModeChange('forgot')}
                    className="hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
                  >
                    Forgot password?
                  </button>
                </>
              )}

              {mode === 'signup' && (
                <button 
                  onClick={() => handleModeChange('login')}
                  className="hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
                >
                  Already have an account? Log In
                </button>
              )}

              {mode === 'forgot' && (
                <button 
                  onClick={() => handleModeChange('login')}
                  className="hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
                >
                  Return to login portal
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
};

export default LoginPage;
