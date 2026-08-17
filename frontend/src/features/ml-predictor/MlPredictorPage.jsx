import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  AlertTriangle, 
  Activity, 
  Heart, 
  User, 
  FileText,
  Sparkles,
  ClipboardList,
  CheckCircle,
  Download
} from 'lucide-react';
import healthService from '../../services/healthService';
import useAuth from '../../hooks/useAuth';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { ReportPreviewModal } from './ReportPreviewModal';
import { generatePdfReport } from '../../utils/reportGenerator';
import SEO from '../../components/common/SEO';

export const MlPredictorPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isReportOpen, setIsReportOpen] = React.useState(false);

  // Fetch the latest health assessment record logged in Supabase
  const { data: record, isLoading: isRecordLoading, isError, error, refetch } = useQuery({
    queryKey: ['latestHealthRecord'],
    queryFn: healthService.getLatestHealthRecord,
  });

  // Fetch the latest saved prediction from Supabase
  const { data: prediction, isLoading: isPredLoading } = useQuery({
    queryKey: ['latestPrediction'],
    queryFn: healthService.getLatestPrediction,
    enabled: !!record,
  });

  // Fetch the latest saved AI report from Supabase
  const { data: aiReport, isLoading: isReportLoading } = useQuery({
    queryKey: ['latestAiReport'],
    queryFn: healthService.getLatestAiReport,
    enabled: !!record,
  });

  // AI Report Generation Mutation
  const generateReportMutation = useMutation({
    mutationFn: async () => {
      if (!record || !prediction) return;
      return healthService.generateAiReport(record.id, prediction.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['latestAiReport'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    }
  });

  // FastAPI Prediction Mutation
  const mutation = useMutation({
    mutationFn: async () => {
      if (!record) return;

      // Extract systolic BP value if stored as slash string (e.g. 120/80)
      const bpStr = record.blood_pressure || '120';
      const bpValue = parseInt(bpStr.split('/')[0] || bpStr || '120', 10);
      const bsValue = parseInt(record.blood_sugar || '90', 10);

      const formattedPayload = {
        age: parseInt(record.age, 10),
        gender: record.gender,
        height: parseFloat(record.height),
        weight: parseFloat(record.weight),
        bmi: parseFloat(record.bmi),
        blood_pressure: bpValue,
        blood_sugar: bsValue,
        exercise: record.exercise || 'Moderate',
        smoking: record.smoking || 'No',
        alcohol: record.alcohol || 'No',
        symptoms: record.symptoms || '',
      };

      return healthService.predictRisk(record.id, formattedPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['latestPrediction'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    }
  });

  const isLoading = isRecordLoading || isPredLoading;

  // Auto-predict if no prediction exists
  React.useEffect(() => {
    if (record && !isPredLoading && !prediction && mutation.isIdle) {
      mutation.mutate();
    }
  }, [record, prediction, isPredLoading, mutation.isIdle]);

  const predictionData = prediction ? {
    overallRisk: prediction.overall_risk,
    cardioRisk: prediction.cardio_risk,
    diabetesRisk: prediction.diabetes_risk,
    strokeRisk: prediction.stroke_risk,
    healthScore: prediction.health_score,
    riskLevel: prediction.risk_level,
    recommendations: prediction.recommendations,
  } : mutation.data;

  const showResult = !!predictionData;

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <SEO title="Health Risk Assessment | HealthGuard AI" robots="noindex,nofollow" />
        <div className="h-10 w-64 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-48 bg-slate-200 rounded-2xl md:col-span-1" />
          <div className="h-80 bg-slate-200 rounded-2xl md:col-span-2" />
        </div>
      </div>
    );
  }

  // Handle case where no baseline health assessment exists
  if (isError || !record) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-premium max-w-2xl mx-auto">
        <SEO title="Health Risk Assessment | HealthGuard AI" robots="noindex,nofollow" />
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-500 mb-4">
          <ClipboardList size={24} />
        </div>
        <h3 className="text-md font-bold text-slate-800">No Baseline Health Record Found</h3>
        <p className="mt-1 text-sm text-slate-500 max-w-sm">
          Please log your physical dimensions, lifestyle habits, and symptoms in the assessment module first before running the AI risk models.
        </p>
        <Button onClick={() => navigate('/assessment')} className="mt-6 gap-2">
          Start Health Assessment
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto transition-colors duration-200">
      <SEO title="Health Risk Assessment | HealthGuard AI" robots="noindex,nofollow" />
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Sparkles className="text-accent-500" size={24} />
          AI Diagnostic Predictor
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Run risk calculations based on your latest recorded baseline health assessment.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Baseline Record Details */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-2 border-b border-slate-50 dark:border-slate-700/50 mb-4">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-405 dark:text-slate-500">Baseline Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-605 dark:text-slate-350 font-medium">
              <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-700/40">
                <span className="text-slate-400 dark:text-slate-500">Patient Age</span>
                <span className="text-slate-800 dark:text-slate-200">{record.age} years</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-700/40">
                <span className="text-slate-400 dark:text-slate-500">Gender</span>
                <span className="text-slate-800 dark:text-slate-200">{record.gender}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-700/40">
                <span className="text-slate-400 dark:text-slate-500">Dimensions</span>
                <span className="text-slate-800 dark:text-slate-200">{record.height}cm / {record.weight}kg</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-700/40">
                <span className="text-slate-400 dark:text-slate-500">Calculated BMI</span>
                <span className="text-slate-800 dark:text-slate-200">{record.bmi}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-700/40">
                <span className="text-slate-400 dark:text-slate-500">Blood Pressure</span>
                <span className="text-slate-800 dark:text-slate-200">{record.blood_pressure || '120/80'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-700/40">
                <span className="text-slate-400 dark:text-slate-500">Blood Sugar</span>
                <span className="text-slate-800 dark:text-slate-200">{record.blood_sugar ? `${record.blood_sugar} mg/dL` : 'Normal'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-700/40">
                <span className="text-slate-400 dark:text-slate-500">Exercise Habits</span>
                <span className="text-slate-800 dark:text-slate-200">{record.exercise}</span>
              </div>

              <div className="pt-2">
                <Button 
                  onClick={() => mutation.mutate()} 
                  className="w-full gap-2 bg-accent-500 hover:bg-accent-600 focus:ring-accent-500 shadow-md"
                  loading={mutation.isPending}
                >
                  <TrendingUp size={16} />
                  Predict Health Risk
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Prediction Results */}
        <div className="md:col-span-2 space-y-6">
          {!showResult && mutation.isIdle && (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-8 text-center shadow-premium h-full">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-500 mb-4 animate-pulse">
                <TrendingUp size={24} />
              </div>
              <h3 className="text-md font-bold text-slate-800 dark:text-slate-100">Waiting for Risk Calculation</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                Click the 'Predict Health Risk' button to parse your parameters via the FastAPI scikit-learn server.
              </p>
            </div>
          )}

          {mutation.isPending && (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-8 text-center shadow-premium h-full">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-100 dark:border-slate-700 border-t-accent-500 mb-4" />
              <h3 className="text-md font-bold text-slate-800 dark:text-slate-100">Processing Models...</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                Loading scikit-learn models and evaluating clinical risk parameters.
              </p>
            </div>
          )}

          {mutation.isError && (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-8 text-center shadow-premium h-full">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/20 text-red-500 mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-md font-bold text-slate-800 dark:text-slate-100">Prediction Engine Connection Refused</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                {mutation.error?.message || 'We could not connect to the machine learning prediction engine. Verify the service is online.'}
              </p>
              <Button onClick={() => mutation.mutate()} variant="outline" className="mt-4">
                Retry Connection
              </Button>
            </div>
          )}

          {showResult && predictionData && (
            <div className="space-y-6 animate-fade-in">
              <Card>
                <CardHeader className="flex-row justify-between items-center pb-4 border-b border-slate-50 dark:border-slate-700/50 mb-6">
                  <div>
                    <CardTitle>Health Risk Card</CardTitle>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Diagnostic prediction summary report</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    predictionData.overallRisk === 'Low' 
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400' 
                      : predictionData.overallRisk === 'Moderate'
                      ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400'
                      : 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400'
                  }`}>
                    Overall Risk: {predictionData.overallRisk}
                  </span>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Gauge */}
                  <div className="flex items-center justify-center">
                    <div className="relative flex items-center justify-center h-44 w-44">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="88" cy="88" r="74" className="stroke-slate-100 dark:stroke-slate-700" strokeWidth="10" fill="transparent" />
                        <circle cx="88" cy="88" r="74" stroke="currentColor" strokeWidth="10" fill="transparent"
                          strokeDasharray={2 * Math.PI * 74}
                          strokeDashoffset={2 * Math.PI * 74 * (1 - predictionData.healthScore / 100)}
                          className="text-brand-500 dark:text-accent-500 transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-4xl font-extrabold text-slate-800 dark:text-white">{predictionData.healthScore}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Health Index</span>
                      </div>
                    </div>
                  </div>
 
                  {/* Indicators progress */}
                  <div className="flex flex-col justify-center gap-5">
                    {/* Cardio */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 items-center">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Cardiovascular Risk</span>
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold border ${
                            predictionData.cardioRisk < 25 ? 'bg-emerald-50 text-emerald-700 dark:bg-slate-900 border-emerald-100 dark:border-emerald-900/30' :
                            predictionData.cardioRisk < 50 ? 'bg-amber-50 text-amber-700 dark:bg-slate-900 border-amber-100 dark:border-amber-900/30' :
                            'bg-rose-50 text-rose-700 dark:bg-slate-900 border-rose-100 dark:border-rose-900/30'
                          }`}>
                            {predictionData.cardioRisk < 25 ? 'Low' : predictionData.cardioRisk < 50 ? 'Moderate' : 'High'}
                          </span>
                          <span className="text-slate-800 dark:text-slate-200 font-extrabold">{predictionData.cardioRisk}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-rose-500 h-full rounded-full transition-all duration-1000"
                          style={{ width: `${predictionData.cardioRisk}%` }}
                        />
                      </div>
                    </div>
 
                    {/* Diabetes */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 items-center">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Diabetes Risk</span>
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold border ${
                            predictionData.diabetesRisk < 25 ? 'bg-emerald-50 text-emerald-700 dark:bg-slate-900 border-emerald-100 dark:border-emerald-900/30' :
                            predictionData.diabetesRisk < 50 ? 'bg-amber-50 text-amber-700 dark:bg-slate-900 border-amber-100 dark:border-amber-900/30' :
                            'bg-rose-50 text-rose-700 dark:bg-slate-900 border-rose-100 dark:border-rose-900/30'
                          }`}>
                            {predictionData.diabetesRisk < 25 ? 'Low' : predictionData.diabetesRisk < 50 ? 'Moderate' : 'High'}
                          </span>
                          <span className="text-slate-800 dark:text-slate-200 font-extrabold">{predictionData.diabetesRisk}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-amber-500 h-full rounded-full transition-all duration-1000"
                          style={{ width: `${predictionData.diabetesRisk}%` }}
                        />
                      </div>
                    </div>
 
                    {/* Stroke */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 items-center">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Stroke Risk</span>
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold border ${
                            predictionData.strokeRisk < 25 ? 'bg-emerald-50 text-emerald-700 dark:bg-slate-900 border-emerald-100 dark:border-emerald-900/30' :
                            predictionData.strokeRisk < 50 ? 'bg-amber-50 text-amber-700 dark:bg-slate-900 border-amber-100 dark:border-amber-900/30' :
                            'bg-rose-50 text-rose-700 dark:bg-slate-900 border-rose-100 dark:border-rose-900/30'
                          }`}>
                            {predictionData.strokeRisk < 25 ? 'Low' : predictionData.strokeRisk < 50 ? 'Moderate' : 'High'}
                          </span>
                          <span className="text-slate-800 dark:text-slate-200 font-extrabold">{predictionData.strokeRisk}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-accent-500 h-full rounded-full transition-all duration-1000"
                          style={{ width: `${predictionData.strokeRisk}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Report Section */}
              <Card>
                <CardHeader className="pb-2 border-b border-slate-50 dark:border-slate-700/50 mb-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles size={18} className="text-accent-500" />
                      AI Health Report
                    </CardTitle>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Professional hospital-style report generated by Gemini</p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isReportLoading ? (
                    <div className="flex flex-col items-center justify-center py-6">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-100 dark:border-slate-750 border-t-accent-500 mb-2" />
                      <p className="text-xs text-slate-500 dark:text-slate-450">Checking report status...</p>
                    </div>
                  ) : aiReport ? (
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="text-left">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <CheckCircle size={16} className="text-emerald-500" />
                          AI Report Ready
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">ID: {aiReport.id.substring(0, 15)}...</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => setIsReportOpen(true)}
                          className="px-4 py-2 text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-sm rounded-xl gap-1.5 animate-fade-in"
                        >
                          <FileText size={14} />
                          Preview Report
                        </Button>
                        <Button 
                          onClick={async () => {
                            try {
                              await generatePdfReport(record, prediction, aiReport, user);
                            } catch (e) {
                              alert('Failed to download PDF: ' + e.message);
                            }
                          }}
                          className="px-4 py-2 text-xs font-bold bg-accent-500 hover:bg-accent-600 text-white rounded-xl shadow-md gap-1.5"
                        >
                          <Download size={14} />
                          Download PDF
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-6 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
                      <p className="text-sm text-slate-650 dark:text-slate-300 font-bold">No AI Health Report Found</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm font-medium">Generate your personalized AI clinical analysis and dynamic health reports now.</p>
                      <Button 
                        onClick={() => generateReportMutation.mutate()}
                        loading={generateReportMutation.isPending}
                        className="mt-4 gap-2 bg-accent-500 hover:bg-accent-600 text-xs font-bold"
                      >
                        <Sparkles size={14} />
                        Generate AI Report
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          )}
        </div>
      </div>

      <ReportPreviewModal 
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        record={record}
        prediction={prediction}
        aiReport={aiReport}
        user={user}
      />
    </div>
  );
};

export default MlPredictorPage;
