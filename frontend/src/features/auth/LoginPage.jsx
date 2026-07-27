import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, AlertCircle, CheckCircle } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import Card, { CardContent } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

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
        await signUp(data.name, data.email, data.password);
        setSuccessMsg('Account registered successfully! Please check your email to verify your session details.');
        reset();
      } else if (mode === 'forgot') {
        await forgotPassword(data.email);
        setSuccessMsg('Password recovery link has been dispatched to your email address.');
        reset();
      }
    } catch (error) {
      setApiError(error.message || 'Operation failed. Please check parameters and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-premium">
            <ShieldAlert size={26} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              {mode === 'login' && 'Access HealthGuard AI'}
              {mode === 'signup' && 'Register HealthGuard AI'}
              {mode === 'forgot' && 'Reset Security Session'}
            </h1>
            <p className="text-sm text-slate-400">
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
                <div className="flex gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-xs text-red-600 font-medium">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{apiError}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-600 font-medium">
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
            <div className="mt-6 flex flex-col gap-2 items-center text-xs font-semibold text-slate-500">
              {mode === 'login' && (
                <>
                  <button 
                    onClick={() => handleModeChange('signup')}
                    className="hover:text-brand-500 transition-colors"
                  >
                    Don't have an account? Sign Up
                  </button>
                  <button 
                    onClick={() => handleModeChange('forgot')}
                    className="hover:text-brand-500 transition-colors"
                  >
                    Forgot password?
                  </button>
                </>
              )}

              {mode === 'signup' && (
                <button 
                  onClick={() => handleModeChange('login')}
                  className="hover:text-brand-500 transition-colors"
                >
                  Already have an account? Log In
                </button>
              )}

              {mode === 'forgot' && (
                <button 
                  onClick={() => handleModeChange('login')}
                  className="hover:text-brand-500 transition-colors"
                >
                  Return to login portal
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
