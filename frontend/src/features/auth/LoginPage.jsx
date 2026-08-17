import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, AlertCircle, CheckCircle, Activity, Sparkles, FileText } from 'lucide-react';
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
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
        
        {/* Left Column: Brand Showcase (Desktop only) */}
        <div className="hidden lg:flex lg:col-span-7 relative overflow-hidden bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-950 text-white flex-col justify-between p-12">
          {/* Decorative background glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_30%,rgba(14,165,233,0.12),transparent)] pointer-events-none" />
          
          {/* Logo & Header */}
          <div className="flex items-center gap-3 relative z-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white">
              <Activity size={20} className="animate-pulse text-accent-500" />
            </div>
            <div>
              <h2 className="text-md font-extrabold tracking-tight">HealthGuard AI</h2>
              <span className="text-[9px] text-accent-500 font-extrabold tracking-wider uppercase">Preventive EMR Portal</span>
            </div>
          </div>

          {/* Value Props Showcase */}
          <div className="my-auto max-w-lg space-y-8 relative z-10">
            <div className="space-y-4">
              <h3 className="text-4xl font-extrabold tracking-tight leading-tight">
                AI-Powered Preventive Health & Risk Estimation
              </h3>
              <p className="text-sm text-slate-200/90 leading-relaxed font-medium">
                A secure clinical decision-support platform designed to calculate cardiac, stroke, and diabetes risk indexes using advanced machine learning models.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-4">
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-premium">
                <Sparkles className="text-accent-500 shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider mb-1">Machine Learning Diagnostics</h4>
                  <p className="text-xs text-slate-200 leading-relaxed">Predictive risk evaluation trained on extensive health indicator datasets with 84.78% accuracy.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-premium">
                <FileText className="text-accent-500 shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider mb-1">AI Clinical Summarization</h4>
                  <p className="text-xs text-slate-200 leading-relaxed">Extract biometrics, compile labs, and generate patient advice summaries automatically via Gemini LLM integrations.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Disclaimer */}
          <div className="text-[10px] text-slate-350 relative z-10 border-t border-white/10 pt-4 leading-relaxed font-semibold">
            <strong>Clinical Disclaimer:</strong> HealthGuard AI is an informational decision-support tool. It does not provide definitive medical diagnoses, treat diseases, or replace professional medical advice.
          </div>
        </div>

        {/* Right Column: Authentication Card (Mobile: Full screen, Desktop: Centered) */}
        <div className="lg:col-span-5 flex items-center justify-center p-6 sm:p-12 bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
          <div className="w-full max-w-md space-y-6">
            <div className="flex flex-col items-center gap-3 text-center lg:items-start lg:text-left">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-premium lg:hidden">
                <Activity size={26} className="animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-105 tracking-tight">
                  {mode === 'login' && 'Access EMR Portal'}
                  {mode === 'signup' && 'Register Provider'}
                  {mode === 'forgot' && 'Reset Security Session'}
                </h1>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 leading-relaxed font-semibold">
                  {mode === 'login' && 'Enter clinical email to manage EMR records and model diagnostics.'}
                  {mode === 'signup' && 'Create your provider account to access patient risk dashboards.'}
                  {mode === 'forgot' && 'Provide your account email to receive a password reset link.'}
                </p>
              </div>
            </div>

            <Card className="border border-slate-200/50 dark:border-slate-800/85 shadow-premium">
              <CardContent className="pt-6">
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
      </div>
    </>
  );
};

export default LoginPage;
