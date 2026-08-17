import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Bot, AlertCircle, HeartHandshake, CheckCircle } from 'lucide-react';
import healthService from '../../services/healthService';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import SEO from '../../components/common/SEO';

export const SymptomCheckerPage = () => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      symptoms: '',
      severity: 5,
      duration: '1',
    }
  });

  const mutation = useMutation({
    mutationFn: healthService.checkSymptoms,
    onSuccess: () => {
      reset();
    }
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  return (
    <div className="space-y-8 transition-colors duration-200">
      <SEO title="AI Health Assistant | HealthGuard AI" robots="noindex,nofollow" />
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">AI Symptom Evaluator</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Describe physical anomalies for real-time triage guidance.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Form Container */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Symptom Log Form</CardTitle>
            <p className="text-xs text-slate-400 dark:text-slate-500">Please provide precise metrics about your condition.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Input
                label="Symptom Description"
                placeholder="e.g. Sharp chest discomfort spreading to arm"
                error={errors.symptoms?.message}
                id="symptoms"
                {...register('symptoms', { 
                  required: 'Please state the symptoms you are experiencing.' 
                  })}
              />

              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Severity Rating ({register('severity').value || 'Scale'})
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-500 focus:outline-none"
                  {...register('severity')}
                />
                <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  <span>Mild</span>
                  <span>Severe</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 w-full">
                <label htmlFor="duration" className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Duration (Days)
                </label>
                <select
                  id="duration"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-white transition-all duration-200 outline-none text-sm focus:border-brand-500"
                  {...register('duration')}
                >
                  <option value="1">Less than 24 hours</option>
                  <option value="3">1 - 3 days</option>
                  <option value="7">4 - 7 days</option>
                  <option value="14">Over 1 week</option>
                </select>
              </div>

              <Button 
                type="submit" 
                className="w-full gap-2"
                loading={mutation.isPending}
              >
                <Bot size={16} />
                Analyze Vitals
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {mutation.isIdle && (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-8 text-center shadow-premium">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-500 mb-4 animate-bounce">
                <Bot size={24} />
              </div>
              <h3 className="text-md font-bold text-slate-800 dark:text-slate-100">Waiting for Form Submission</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                Enter your physiological data in the form to generate an evaluation via the Gemini AI pipeline.
              </p>
            </div>
          )}

          {mutation.isPending && (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-8 text-center shadow-premium">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-100 dark:border-slate-700 border-t-brand-500 mb-4" />
              <h3 className="text-md font-bold text-slate-800 dark:text-slate-100">Gemini LLM Processing...</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                Scanning symptoms database, resolving ontology hierarchies, and modeling recommendations.
              </p>
            </div>
          )}

          {mutation.isError && (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-8 text-center shadow-premium">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/20 text-red-505 mb-4">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-md font-bold text-slate-800 dark:text-slate-100">Triage Evaluation Failed</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                {mutation.error?.message || 'We could not complete the diagnostic check at this time.'}
              </p>
            </div>
          )}

          {mutation.isSuccess && mutation.data && (
            <Card>
              <CardHeader className="flex-row justify-between items-center pb-4 border-b border-slate-50 dark:border-slate-700/50 mb-6">
                <div>
                  <CardTitle>AI Evaluation Report</CardTitle>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Generated dynamically by Gemini 1.5</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  mutation.data.triagePriority === 'Immediate Action'
                    ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/50'
                    : mutation.data.triagePriority === 'Clinical Visit'
                    ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50'
                    : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50'
                }`}>
                  {mutation.data.triagePriority}
                </span>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Clinical summary section */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2">
                    <HeartHandshake size={16} className="text-brand-500" />
                    Clinical Analysis Summary
                  </h4>
                  <p className="text-sm text-slate-650 dark:text-slate-300 leading-relaxed">
                    {mutation.data.summary}
                  </p>
                </div>

                {/* Risk scoring details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                    <span className="text-xs text-slate-400 dark:text-slate-550 font-semibold block">Confidence Level</span>
                    <span className="text-xl font-bold text-slate-800 dark:text-white">{mutation.data.confidence}%</span>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                    <span className="text-xs text-slate-400 dark:text-slate-550 font-semibold block">Identified Domain</span>
                    <span className="text-xl font-bold text-slate-800 dark:text-white">{mutation.data.domain}</span>
                  </div>
                </div>

                {/* Patient Action Items */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <CheckCircle size={16} className="text-accent-500" />
                    Recommended Actions
                  </h4>
                  <ul className="space-y-2">
                    {mutation.data.recommendations?.map((rec, index) => (
                      <li key={index} className="flex gap-2.5 items-start text-sm text-slate-650 dark:text-slate-350">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent-500 mt-2 shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SymptomCheckerPage;
