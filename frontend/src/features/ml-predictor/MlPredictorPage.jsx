import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { TrendingUp, AlertTriangle, HelpCircle, Activity } from 'lucide-react';
import healthService from '../../services/healthService';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export const MlPredictorPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      age: '',
      sysBP: '',
      chol: '',
      heartRate: '',
      bmi: '',
    }
  });

  const mutation = useMutation({
    mutationFn: healthService.predictRisk,
  });

  const onSubmit = (data) => {
    // Parse values to float/int before posting to FastAPI API
    const formattedData = {
      age: parseInt(data.age, 10),
      sysBP: parseFloat(data.sysBP),
      chol: parseFloat(data.chol),
      heartRate: parseInt(data.heartRate, 10),
      bmi: parseFloat(data.bmi),
    };
    mutation.mutate(formattedData);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Cardiovascular Risk Predictor</h1>
        <p className="text-sm text-slate-500">Calculate probability indexes and view feature attribution scores via SHAP models.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Input Parameters */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Biometric Inputs</CardTitle>
            <p className="text-xs text-slate-400">Specify details for the predictive model pipeline.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                label="Age (Years)"
                type="number"
                placeholder="e.g. 52"
                error={errors.age?.message}
                id="age"
                {...register('age', { 
                  required: 'Age is required.', 
                  min: { value: 1, message: 'Invalid age' }
                })}
              />

              <Input
                label="Systolic Blood Pressure (mmHg)"
                type="number"
                placeholder="e.g. 135"
                error={errors.sysBP?.message}
                id="sysBP"
                {...register('sysBP', { 
                  required: 'Blood pressure is required.',
                  min: { value: 50, message: 'Value out of bounds' }
                })}
              />

              <Input
                label="Cholesterol Level (mg/dL)"
                type="number"
                placeholder="e.g. 210"
                error={errors.chol?.message}
                id="chol"
                {...register('chol', { 
                  required: 'Cholesterol level is required.',
                  min: { value: 50, message: 'Value out of bounds' }
                })}
              />

              <Input
                label="Max Heart Rate (bpm)"
                type="number"
                placeholder="e.g. 165"
                error={errors.heartRate?.message}
                id="heartRate"
                {...register('heartRate', { 
                  required: 'Heart rate is required.',
                  min: { value: 30, message: 'Value out of bounds' }
                })}
              />

              <Input
                label="Body Mass Index (BMI)"
                type="number"
                step="0.1"
                placeholder="e.g. 26.4"
                error={errors.bmi?.message}
                id="bmi"
                {...register('bmi', { 
                  required: 'BMI is required.',
                  min: { value: 10, message: 'Value out of bounds' }
                })}
              />

              <Button 
                type="submit" 
                className="w-full gap-2 bg-accent-500 hover:bg-accent-600 focus:ring-accent-500 shadow-md"
                loading={mutation.isPending}
              >
                <TrendingUp size={16} />
                Generate Prediction
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Prediction Outputs */}
        <div className="lg:col-span-2 space-y-6">
          {mutation.isIdle && (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-premium">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-4">
                <TrendingUp size={24} />
              </div>
              <h3 className="text-md font-bold text-slate-800">No Assessment Conducted</h3>
              <p className="mt-1 text-sm text-slate-500 max-w-sm">
                Provide health stats in the form. The system will consult the scikit-learn models and return a risk classification.
              </p>
            </div>
          )}

          {mutation.isPending && (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-premium">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-100 border-t-accent-500 mb-4" />
              <h3 className="text-md font-bold text-slate-800">FastAPI Pipeline Running...</h3>
              <p className="mt-1 text-sm text-slate-500 max-w-sm">
                Executing predictive models and calculating SHAP game-theory attributions.
              </p>
            </div>
          )}

          {mutation.isError && (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-premium">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500 mb-4">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-md font-bold text-slate-800">Model Execution Failed</h3>
              <p className="mt-1 text-sm text-slate-500 max-w-sm">
                {mutation.error?.message || 'The backend ML service failed to return predictive weights.'}
              </p>
            </div>
          )}

          {mutation.isSuccess && mutation.data && (
            <div className="space-y-6">
              {/* Header metrics card */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Card>
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Risk Classification</span>
                  <span className={`text-2xl font-extrabold mt-1 block ${
                    mutation.data.riskClass === 'High Risk' ? 'text-red-500' : 'text-emerald-500'
                  }`}>
                    {mutation.data.riskClass}
                  </span>
                </Card>
                <Card>
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Probability Score</span>
                  <span className="text-2xl font-extrabold text-slate-800 mt-1 block">
                    {(mutation.data.probability * 100).toFixed(1)}%
                  </span>
                </Card>
              </div>

              {/* SHAP attributions */}
              <Card>
                <CardHeader className="flex-row justify-between items-center pb-4 border-b border-slate-50 mb-6">
                  <div>
                    <CardTitle>Feature Attribution Analysis</CardTitle>
                    <p className="text-xs text-slate-400">SHAP values indicating individual contributions to the model decision</p>
                  </div>
                  <div className="text-[10px] text-slate-400 flex gap-4">
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-400" /> Increases Risk</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-400" /> Decreases Risk</span>
                  </div>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={mutation.data.shapValues}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                      <YAxis dataKey="feature" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <Tooltip />
                      <ReferenceLine x={0} stroke="#cbd5e1" strokeWidth={1.5} />
                      <Bar 
                        dataKey="value" 
                        radius={[0, 4, 4, 0]}
                        fill={({ value }) => (value > 0 ? '#fb7185' : '#60a5fa')} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Triage Guidance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-md">
                    <Activity size={18} className="text-brand-500" />
                    Biometrics Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {mutation.data.analysisSummary}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MlPredictorPage;
