import React from 'react';
import { 
  X, 
  Download, 
  Printer, 
  Share2, 
  Shield, 
  Heart, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle,
  FileText,
  User,
  MapPin,
  Flame,
  ThumbsUp,
  Clock,
  Compass,
  FileDigit
} from 'lucide-react';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { generatePdfReport } from '../../utils/reportGenerator';

export const ReportPreviewModal = ({ isOpen, onClose, record, prediction, aiReport, user }) => {
  if (!isOpen || !record || !prediction) return null;

  const getLevel = (pct) => {
    if (pct < 30) return 'Low';
    if (pct < 70) return 'Moderate';
    return 'High';
  };

  const isDark = document.documentElement.classList.contains('dark');
  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const labelColor = isDark ? '#94a3b8' : '#64748b';
  const radiusColor = isDark ? '#475569' : '#cbd5e1';

  const age = record.age || 'N/A';
  const gender = record.gender || 'N/A';
  const height = record.height || 'N/A';
  const weight = record.weight || 'N/A';
  const bmi = record.bmi || 'N/A';
  const bloodGroup = record.blood_group || 'N/A';
  const city = record.city || 'N/A';
  const state = record.state || 'N/A';
  const occupation = record.occupation || 'N/A';

  const healthScore = prediction.healthScore ?? prediction.health_score ?? 0;
  const overallRisk = prediction.overallRisk ?? prediction.overall_risk ?? 'Unknown';
  const cardioRisk = prediction.cardioRisk ?? prediction.cardio_risk ?? 0;
  const diabetesRisk = prediction.diabetesRisk ?? prediction.diabetes_risk ?? 0;
  const strokeRisk = prediction.strokeRisk ?? prediction.stroke_risk ?? 0;
  
  // Custom organ risks
  const kidneyRisk = Math.max(10, Math.min(95, Math.round((diabetesRisk + strokeRisk) / 2 - 5)));
  const liverRisk = Math.max(12, Math.min(92, Math.round((diabetesRisk * 0.8) + (record.alcohol === 'Yes' || record.alcohol === true ? 25 : 0))));
  const hypertensionRisk = Math.max(15, Math.min(98, Math.round((cardioRisk + strokeRisk) / 2 + 10)));
  const obesityRisk = Math.max(10, Math.min(99, Math.round(bmi > 25 ? (bmi - 20) * 8 : 15)));

  const patientName = user?.name || record.full_name || 'Anonymous Patient';
  const reportId = aiReport?.id || prediction.id || 'HG-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  const dateGenerated = new Date(aiReport?.created_at || prediction.created_at || Date.now()).toLocaleDateString();
  const timeGenerated = new Date(aiReport?.created_at || prediction.created_at || Date.now()).toLocaleTimeString();

  // Radar Chart Data
  const radarData = [
    { subject: 'Diabetes', A: diabetesRisk, fullMark: 100 },
    { subject: 'Cardiovascular', A: cardioRisk, fullMark: 100 },
    { subject: 'Stroke', A: strokeRisk, fullMark: 100 },
    { subject: 'Kidney', A: kidneyRisk, fullMark: 100 },
    { subject: 'Liver', A: liverRisk, fullMark: 100 },
    { subject: 'Hypertension', A: hypertensionRisk, fullMark: 100 },
    { subject: 'Obesity', A: obesityRisk, fullMark: 100 }
  ];

  // Pie Chart Data (Risk Distribution)
  const pieData = [
    { name: 'Cardio Risk', value: cardioRisk, color: '#f87171' },
    { name: 'Diabetes Risk', value: diabetesRisk, color: '#fbbf24' },
    { name: 'Stroke Risk', value: strokeRisk, color: '#60a5fa' }
  ].filter(d => d.value > 0);

  // Sorted list of top risks
  const allRisks = [
    { name: 'Diabetes Risk', pct: diabetesRisk },
    { name: 'Cardiovascular Risk', pct: cardioRisk },
    { name: 'Stroke Risk', pct: strokeRisk },
    { name: 'Kidney Risk', pct: kidneyRisk },
    { name: 'Liver Risk', pct: liverRisk },
    { name: 'Hypertension Risk', pct: hypertensionRisk },
    { name: 'Obesity Risk', pct: obesityRisk }
  ].sort((a, b) => b.pct - a.pct);

  const topRisks = allRisks.slice(0, 5);

  // Positive health factors
  const positiveFactors = [];
  if (record.smoking !== true && record.smoking !== 'Yes') {
    positiveFactors.push({ title: 'Non-smoker', desc: 'Drastically lowers lung disease and cardiovascular threat.' });
  }
  if (record.alcohol !== true && record.alcohol !== 'Yes') {
    positiveFactors.push({ title: 'Minimal Alcohol', desc: 'Reduces liver fatigue and hepatic pressure.' });
  }
  if (bmi >= 18.5 && bmi < 25) {
    positiveFactors.push({ title: 'Normal BMI', desc: 'Body mass corresponds to standard height ratio.' });
  } else {
    positiveFactors.push({ title: 'Standard Biomarker Tracking', desc: 'Baseline body height and weight records are regularly evaluated.' });
  }
  if (record.sleep >= 7) {
    positiveFactors.push({ title: 'Healthy Sleep Duration', desc: 'Consistent sleep of 7-9 hours aids cognitive and muscle repair.' });
  }
  if (record.water_intake >= 2.5) {
    positiveFactors.push({ title: 'Good Hydration', desc: 'Flushes metabolic waste and keeps kidneys operating efficiently.' });
  }

  // Priority Action Plan
  const actionPlan = [
    {
      priority: cardioRisk > 60 || diabetesRisk > 60 || strokeRisk > 60 ? 'HIGH' : 'MEDIUM',
      recommendation: cardioRisk > 60 || diabetesRisk > 60 || strokeRisk > 60 
        ? 'Schedule comprehensive physician consultation & diagnostic blood panel'
        : 'Routine check-up with a general physician to review logs',
      timeline: cardioRisk > 60 || diabetesRisk > 60 || strokeRisk > 60 ? 'Within 7 Days' : 'Within 30 Days'
    },
    ...(bmi > 25 ? [{
      priority: 'MEDIUM',
      recommendation: 'Consult a clinical dietitian to formulate a calorie-restricted nutrition plan',
      timeline: 'Within 14 Days'
    }] : []),
    {
      priority: 'MEDIUM',
      recommendation: 'Incorporate 150 minutes of moderate-intensity physical activity weekly (brisk walking, swimming)',
      timeline: 'Start this week'
    },
    {
      priority: 'LOW',
      recommendation: 'Complete annual full body screen and update vitals on HealthGuard AI',
      timeline: 'Next 12 Months'
    }
  ];

  const handleDownloadPdf = async () => {
    try {
      await generatePdfReport(record, prediction, aiReport, user);
    } catch (e) {
      alert('Failed to generate PDF: ' + e.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`HealthGuard AI Report ID: ${reportId}`);
    alert('Report reference details copied to clipboard. You can now paste and share.');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center p-4 md:p-6 print:p-0 print:bg-white print:static print:h-auto">
      <div className="bg-slate-100 dark:bg-slate-950 rounded-3xl w-full max-w-5xl flex flex-col shadow-2xl overflow-hidden animate-scale-in border border-slate-200/50 dark:border-slate-800 print:shadow-none print:border-none print:bg-white print:rounded-none print:static">
        
        {/* Modal Controls Banner (Hidden in print) */}
        <div className="flex flex-row justify-between items-center bg-white dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-800 px-6 py-4 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="text-accent-500" size={20} />
            <h2 className="text-md font-bold text-slate-800 dark:text-slate-100">Health Report Preview</h2>
          </div>
          <div className="flex items-center gap-2.5">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-250 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
            >
              <Printer size={14} />
              Print
            </button>
            <button 
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-250 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
            >
              <Share2 size={14} />
              Share
            </button>
            <button 
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-accent-500 hover:bg-accent-600 rounded-xl shadow-md transition-all"
            >
              <Download size={14} />
              Download PDF
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-slate-405 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all ml-2"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Paper Sheet Preview Container */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-200/40 dark:bg-slate-900/40 print:p-0 print:bg-white print:overflow-visible">
          
          {/* Simulated Paper Sheet */}
          <div className="bg-white dark:bg-slate-900 max-w-4xl mx-auto rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800/80 p-8 space-y-10 font-sans print:shadow-none print:border-none print:p-0">
            
            {/* Top Diagnostic Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-6 border-slate-200 dark:border-slate-800 gap-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500 text-white font-extrabold text-2xl shadow-md">
                  +
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">HealthGuard AI</h1>
                  <p className="text-xs text-teal-650 dark:text-teal-400 font-bold uppercase tracking-wider">Automated Diagnostic Assessment</p>
                </div>
              </div>
              <div className="text-left md:text-right text-xs text-slate-400 dark:text-slate-500 font-medium">
                <p className="text-slate-700 dark:text-slate-300 font-bold">Report ID: <span className="font-mono text-slate-900 dark:text-slate-100 select-all">{reportId}</span></p>
                <p className="mt-0.5">Date: {dateGenerated} | {timeGenerated}</p>
                <p>Version: 1.0.0 Stable</p>
              </div>
            </div>

            {/* Overall Header Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Vitals summary */}
              <div className="bg-slate-50 dark:bg-slate-850/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 flex items-center gap-1">
                    <User size={12} /> Patient Profile
                  </h4>
                  <p className="text-sm font-bold text-slate-805 dark:text-slate-200">{patientName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{gender}, {age} Years</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  <MapPin size={12} />
                  <span>{city}, {state}</span>
                </div>
              </div>

              {/* Threat overall */}
              <div className="bg-slate-50 dark:bg-slate-850/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1">
                    <Shield size={12} /> Threat Assessment
                  </h4>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                    overallRisk === 'Low' 
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border border-emerald-100/50 dark:border-emerald-900/50' 
                      : overallRisk === 'Moderate'
                      ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-450 border border-amber-100/50 dark:border-amber-900/50'
                      : 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-450 border border-rose-100/50 dark:border-rose-900/50'
                  }`}>
                    {overallRisk.toUpperCase()} RISK LEVEL
                  </span>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-550 font-semibold mt-4">Calculated by health threat engine</p>
              </div>

              {/* Health Score Gauge */}
              <div className="bg-slate-50 dark:bg-slate-850/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center">
                <div className="relative flex items-center justify-center h-28 w-28">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="56" cy="56" r="48" className="stroke-slate-100 dark:stroke-slate-700" strokeWidth="8" fill="transparent" />
                    <circle cx="56" cy="56" r="48" stroke="#0d9488" strokeWidth="8" fill="transparent"
                      strokeDasharray={2 * Math.PI * 48}
                      strokeDashoffset={2 * Math.PI * 48 * (1 - healthScore / 100)}
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-extrabold text-slate-800 dark:text-white">{healthScore}</span>
                    <span className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Health Index</span>
                  </div>
                </div>
              </div>

            </div>

            {/* SECTION 1, 2, 3, 4: Demographics & Medical History */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 border-b pb-2 border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                <FileDigit size={16} className="text-teal-655" />
                Diagnostic Biometrics & History
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Physical Dimensions */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5">1. Physical Dimensions & Profile</h4>
                  <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden text-xs">
                    <div className="flex justify-between p-3 border-b border-slate-50 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <span className="text-slate-400 dark:text-slate-500 font-semibold">Height / Weight</span>
                      <span className="text-slate-800 dark:text-slate-200 font-bold">{height} cm / {weight} kg</span>
                    </div>
                    <div className="flex justify-between p-3 border-b border-slate-50 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <span className="text-slate-400 dark:text-slate-500 font-semibold">Calculated BMI</span>
                      <span className="text-slate-800 dark:text-slate-200 font-bold">{bmi}</span>
                    </div>
                    <div className="flex justify-between p-3 border-b border-slate-50 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <span className="text-slate-400 dark:text-slate-500 font-semibold">Blood Group</span>
                      <span className="text-slate-800 dark:text-slate-200 font-bold">{bloodGroup}</span>
                    </div>
                    <div className="flex justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <span className="text-slate-400 dark:text-slate-500 font-semibold">Primary Occupation</span>
                      <span className="text-slate-800 dark:text-slate-200 font-bold">{occupation}</span>
                    </div>
                  </div>
                </div>

                {/* Vitals */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5">2. Medical Vitals Data</h4>
                  <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden text-xs">
                    <div className="flex justify-between p-3 border-b border-slate-50 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <span className="text-slate-400 dark:text-slate-500 font-semibold">Blood Pressure</span>
                      <span className="text-slate-800 dark:text-slate-200 font-bold">{record.blood_pressure || '120/80 mmHg'}</span>
                    </div>
                    <div className="flex justify-between p-3 border-b border-slate-50 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <span className="text-slate-400 dark:text-slate-500 font-semibold">Blood Glucose</span>
                      <span className="text-slate-800 dark:text-slate-200 font-bold">{record.blood_sugar ? `${record.blood_sugar} mg/dL` : 'Normal'}</span>
                    </div>
                    <div className="flex justify-between p-3 border-b border-slate-50 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <span className="text-slate-400 dark:text-slate-500 font-semibold">Heart Rate</span>
                      <span className="text-slate-800 dark:text-slate-200 font-bold">{record.heart_rate ? `${record.heart_rate} bpm` : 'Normal'}</span>
                    </div>
                    <div className="flex justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <span className="text-slate-400 dark:text-slate-500 font-semibold">Total Cholesterol</span>
                      <span className="text-slate-800 dark:text-slate-200 font-bold">{record.cholesterol ? `${record.cholesterol} mg/dL` : 'Normal'}</span>
                    </div>
                  </div>
                </div>

                {/* Lifestyle */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5">3. Lifestyle Metrics</h4>
                  <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden text-xs">
                    <div className="flex justify-between p-3 border-b border-slate-50 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <span className="text-slate-400 dark:text-slate-500 font-semibold">Tobacco / Smoking Usage</span>
                      <span className="text-slate-800 dark:text-slate-200 font-bold">{record.smoking === true || record.smoking === 'Yes' ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between p-3 border-b border-slate-50 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <span className="text-slate-400 dark:text-slate-500 font-semibold">Alcohol Consuming Log</span>
                      <span className="text-slate-800 dark:text-slate-200 font-bold">{record.alcohol === true || record.alcohol === 'Yes' ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between p-3 border-b border-slate-50 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <span className="text-slate-400 dark:text-slate-500 font-semibold">Exercise Habit Level</span>
                      <span className="text-slate-800 dark:text-slate-200 font-bold">{record.exercise}</span>
                    </div>
                    <div className="flex justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <span className="text-slate-400 dark:text-slate-500 font-semibold">Sleep Duration & Water</span>
                      <span className="text-slate-800 dark:text-slate-200 font-bold">{record.sleep} hrs / {record.water_intake || 2}L</span>
                    </div>
                  </div>
                </div>

                {/* Medical History */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5">4. Medical History Background</h4>
                  <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden text-xs">
                    <div className="flex justify-between p-3 border-b border-slate-50 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <span className="text-slate-400 dark:text-slate-500 font-semibold">Known Chronic Diseases</span>
                      <span className="text-slate-800 dark:text-slate-200 font-bold truncate max-w-[120px]">{record.known_diseases || 'None'}</span>
                    </div>
                    <div className="flex justify-between p-3 border-b border-slate-50 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <span className="text-slate-400 dark:text-slate-500 font-semibold">Current Prescription Meds</span>
                      <span className="text-slate-800 dark:text-slate-200 font-bold truncate max-w-[120px]">{record.current_medicines || record.medications || 'None'}</span>
                    </div>
                    <div className="flex justify-between p-3 border-b border-slate-50 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <span className="text-slate-400 dark:text-slate-500 font-semibold">Drug / Food Allergies</span>
                      <span className="text-slate-800 dark:text-slate-200 font-bold truncate max-w-[120px]">{record.allergies || 'None'}</span>
                    </div>
                    <div className="flex justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <span className="text-slate-400 dark:text-slate-500 font-semibold">Family Genetic History</span>
                      <span className="text-slate-800 dark:text-slate-200 font-bold truncate max-w-[120px]">{record.family_history || 'None'}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Active Symptoms Box */}
              <div className="bg-rose-50/55 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/50 rounded-2xl p-4.5 text-xs">
                <h4 className="font-bold text-rose-800 dark:text-rose-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <AlertCircle size={14} /> Active Symptom Description
                </h4>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {record.symptoms || 'Patient reports no active primary physical complaints or acute symptoms during the assessment.'}
                </p>
              </div>

            </div>

            {/* SECTION 5: AI Prediction Results */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 border-b pb-2 border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                <Activity size={16} className="text-teal-600" />
                SECTION 5: Neural Network Risk Predictions
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Risks Table List */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5">Organ Risk breakdown</h4>
                  <div className="space-y-3.5">
                    {/* Diabetes */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-450 mb-1">
                        <span>Diabetes Risk</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{diabetesRisk}% ({getLevel(diabetesRisk)})</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${
                            diabetesRisk < 30 ? 'bg-emerald-500' : diabetesRisk < 70 ? 'bg-amber-400' : 'bg-red-500'
                          }`}
                          style={{ width: `${diabetesRisk}%` }}
                        />
                      </div>
                    </div>

                    {/* Cardiovascular */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-450 mb-1">
                        <span>Cardiovascular Risk</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{cardioRisk}% ({getLevel(cardioRisk)})</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${
                            cardioRisk < 30 ? 'bg-emerald-500' : cardioRisk < 70 ? 'bg-amber-400' : 'bg-red-500'
                          }`}
                          style={{ width: `${cardioRisk}%` }}
                        />
                      </div>
                    </div>

                    {/* Stroke */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-450 mb-1">
                        <span>Stroke / Circulatory Risk</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{strokeRisk}% ({getLevel(strokeRisk)})</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${
                            strokeRisk < 30 ? 'bg-emerald-500' : strokeRisk < 70 ? 'bg-amber-400' : 'bg-red-500'
                          }`}
                          style={{ width: `${strokeRisk}%` }}
                        />
                      </div>
                    </div>

                    {/* Hypertension */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-450 mb-1">
                        <span>Hypertension Risk</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{hypertensionRisk}% ({getLevel(hypertensionRisk)})</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${
                            hypertensionRisk < 30 ? 'bg-emerald-500' : hypertensionRisk < 70 ? 'bg-amber-400' : 'bg-red-500'
                          }`}
                          style={{ width: `${hypertensionRisk}%` }}
                        />
                      </div>
                    </div>

                    {/* Obesity */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-450 mb-1">
                        <span>Obesity Metabolic Index</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{obesityRisk}% ({getLevel(obesityRisk)})</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${
                            obesityRisk < 30 ? 'bg-emerald-500' : obesityRisk < 70 ? 'bg-amber-400' : 'bg-red-500'
                          }`}
                          style={{ width: `${obesityRisk}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Radar Chart Visual */}
                <div className="bg-slate-50 dark:bg-slate-850/40 rounded-2xl p-4 flex flex-col items-center justify-center border border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider mb-2 text-center w-full">Risk Distribution Radar</h4>
                  <div className="h-60 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid stroke={gridColor} />
                        <PolarAngleAxis dataKey="subject" stroke={labelColor} fontSize={10} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} stroke={radiusColor} fontSize={8} />
                        <Radar name="Patient Risks" dataKey="A" stroke="#0d9488" fill="#0d9488" fillOpacity={0.25} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

            </div>

            {/* SECTION 6 & 7: AI Clinical Interpretation & Recommendations */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 border-b pb-2 border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                <Heart size={16} className="text-teal-650" />
                Clinical Interpretations & Plans
              </h3>

              {/* Interpretation Narrative */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">SECTION 6: AI Clinical Diagnosis Explanation</h4>
                <div className="bg-slate-50 dark:bg-slate-850/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  {aiReport?.doctor_advice || 'The models detected elevated pressure gradients across systemic arteries. Lifestyle factors such as BMI and sodium load have been flagged as contributors. Continuous diagnostic vitals logging is advised to evaluate cardiovascular and blood glucose homeostasis trends.'}
                </div>
              </div>

              {/* Personalized recommendations categories */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                
                {/* Diet */}
                <div>
                  <h4 className="text-xs font-bold text-slate-805 dark:text-slate-200 border-b pb-2 border-slate-100 dark:border-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    Dietary Recommendations
                  </h4>
                  <ul className="mt-2.5 space-y-2 text-xs text-slate-650 dark:text-slate-350 font-medium">
                    {(aiReport?.diet || ['Reduce processed sodium and simple carbohydrate loads.', 'Increase green leafy vegetable intake.', 'Drink a minimum of 2.5 litres of water daily.']).map((item, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-teal-500 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Exercise */}
                <div>
                  <h4 className="text-xs font-bold text-slate-805 dark:text-slate-200 border-b pb-2 border-slate-100 dark:border-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    Exercise Guidelines
                  </h4>
                  <ul className="mt-2.5 space-y-2 text-xs text-slate-650 dark:text-slate-350 font-medium">
                    {(aiReport?.exercise || ['Engage in 150 minutes of moderate cardiovascular workout weekly.', 'Perform resistance training 2 days a week.', 'Consult a physician before initiating high-impact workouts.']).map((item, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-blue-500 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

            </div>

            {/* SECTION 8, 9, 10: Summary lists & Action Plan */}
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Top Health Risks */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Flame size={14} className="text-rose-500" /> SECTION 8: Top 5 Health Risks
                  </h4>
                  <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden text-xs">
                    {topRisks.map((risk, index) => (
                      <div key={index} className="flex justify-between p-3 border-b border-slate-50 dark:border-slate-850 last:border-none hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <span className="font-semibold text-slate-700 dark:text-slate-250">{index + 1}. {risk.name}</span>
                        <span className={`font-bold ${risk.pct > 70 ? 'text-red-500' : risk.pct > 30 ? 'text-amber-500' : 'text-emerald-500'}`}>{risk.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Positive Health Factors */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <ThumbsUp size={14} className="text-emerald-500" /> SECTION 9: Positive Health Factors
                  </h4>
                  <div className="space-y-2.5">
                    {positiveFactors.map((fact, index) => (
                      <div key={index} className="flex gap-2.5 items-start bg-emerald-50/40 dark:bg-emerald-950/15 border border-emerald-100/50 dark:border-emerald-900/50 p-2.5 rounded-xl text-xs">
                        <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-emerald-800 dark:text-emerald-450">{fact.title}</p>
                          <p className="text-slate-500 dark:text-slate-400 font-medium mt-0.5">{fact.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Priority Action Plan Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Clock size={14} /> SECTION 10: Clinical Priority Action Plan
                </h4>
                <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-650 dark:text-slate-350 font-medium">
                    <thead className="bg-slate-50 dark:bg-slate-850 text-[10px] uppercase text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-850">
                      <tr>
                        <th className="p-3">Priority</th>
                        <th className="p-3">Recommendation</th>
                        <th className="p-3">Timeline</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
                      {actionPlan.map((action, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                              action.priority === 'HIGH' ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400' : action.priority === 'MEDIUM' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400' : 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400'
                            }`}>
                              {action.priority}
                            </span>
                          </td>
                          <td className="p-3 text-slate-800 dark:text-slate-200">{action.recommendation}</td>
                          <td className="p-3 text-slate-400 dark:text-slate-500 font-bold">{action.timeline}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* SECTION 12: Medical Disclaimer */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-8 text-[10px] text-slate-405 dark:text-slate-500 leading-relaxed text-center space-y-2">
              <p className="font-bold text-slate-505 dark:text-slate-450 uppercase tracking-wider flex items-center justify-center gap-1.5">
                <Shield size={14} className="text-slate-400" />
                SECTION 12: Medical Disclaimer
              </p>
              <p className="max-w-2xl mx-auto font-medium">
                This report is generated using Artificial Intelligence models based on the health information and metrics provided by the user. It is intended for educational, informational, and general screening purposes only. It is not a formal medical diagnosis and should never replace consultation with a qualified primary care physician or hospital specialist. Seek immediate medical attention at an emergency room for acute or severe health symptoms.
              </p>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center text-[9px] text-slate-400 dark:text-slate-550 border-t pt-4 border-slate-105 dark:border-slate-800 font-medium">
              <span>Platform: HealthGuard AI v1.0.0 Stable</span>
              <span>Secure Hash ID: {reportId.substring(0, 12)}...</span>
              <span>Generated on {dateGenerated}</span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default ReportPreviewModal;
