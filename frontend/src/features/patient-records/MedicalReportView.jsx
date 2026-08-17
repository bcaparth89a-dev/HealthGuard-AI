import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Shield, 
  Activity, 
  Heart, 
  User, 
  ClipboardList, 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle, 
  Sparkles, 
  Dumbbell, 
  Brain, 
  Download, 
  Printer, 
  Compass, 
  Thermometer,
  Database,
  FileText
} from 'lucide-react';
import { 
  LineChart,
  Line,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import healthService from '../../services/healthService';
import { generatePdfReport } from '../../utils/reportGenerator';
import Button from '../../components/ui/Button';

export const MedicalReportView = ({ report, user }) => {
  const reportId = typeof report === 'string' ? report : report?.id;

  // 1. Fetch Complete EMR Data
  const { data: fullReport, isLoading, isError, error } = useQuery({
    queryKey: ['fullEmrReportDetails', reportId],
    queryFn: () => healthService.getReportById(reportId),
    enabled: !!reportId,
  });

  // 2. Fetch sibling reports to plot historical trends
  const memberId = fullReport?.member_id;
  const { data: siblingReports = [] } = useQuery({
    queryKey: ['emrSiblingReportsForView', memberId],
    queryFn: () => healthService.getAllReports({ memberId }),
    enabled: !!memberId,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-100 border-t-teal-650 mb-3" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Syncing EMR Dossier...</p>
      </div>
    );
  }

  if (isError || !fullReport) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl text-center border border-red-100">
        <AlertTriangle className="h-10 w-10 text-red-500 mb-3 animate-bounce" />
        <h3 className="text-sm font-bold text-slate-800">EMR Scan Failed</h3>
        <p className="text-xs text-slate-400 mt-1">{error?.message || 'Database connection error'}</p>
      </div>
    );
  }

  const {
    patient_info: pInfo = {},
    lifestyle = {},
    symptoms_details: symInfo = {},
    vitals = {},
    lab_values: labs = {},
    prediction_results: pred = {},
    ai_analysis: ai = {}
  } = fullReport;

  const organRisks = pred.disease_risks || {};

  const getRiskBadge = (risk) => {
    if (risk === 'Low' || risk === 'Normal') return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
    if (risk === 'Moderate') return 'bg-amber-50 text-amber-700 border border-amber-100';
    return 'bg-rose-50 text-rose-700 border border-rose-100';
  };

  const getProgressColor = (pct) => {
    if (pct < 30) return 'bg-emerald-500';
    if (pct < 70) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const renderValue = (val) => {
    if (val === null || val === undefined || val === '' || val === 'Not Provided') {
      return <span className="text-slate-400 italic text-[11px] font-medium">Not Provided</span>;
    }
    return <span className="text-slate-800 font-bold">{val}</span>;
  };

  const renderList = (data, defaultText = "None recorded.") => {
    if (Array.isArray(data)) {
      if (data.length === 0) return <li className="list-none text-slate-400 italic">{defaultText}</li>;
      return data.map((item, idx) => <li key={idx}>{item}</li>);
    }
    if (typeof data === 'string' && data.trim()) {
      return <li>{data}</li>;
    }
    if (data && typeof data === 'object') {
      const vals = Object.values(data).filter(Boolean);
      if (vals.length > 0) {
        return vals.map((v, i) => <li key={i}>{typeof v === 'string' ? v : JSON.stringify(v)}</li>);
      }
    }
    return <li className="list-none text-slate-400 italic">{defaultText}</li>;
  };

  // Compile local trends
  const trendData = [...siblingReports]
    .reverse()
    .map(r => {
      const dateStr = new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const bpSystolic = parseInt(r.personal_info?.blood_pressure?.split('/')[0] || '120');
      return {
        date: dateStr,
        healthScore: r.health_score || r.overall_health_score || 0,
        bmi: parseFloat(r.personal_info?.bmi || 0),
        weight: parseFloat(r.personal_info?.weight || 0),
        bloodSugar: parseFloat(r.personal_info?.blood_sugar || 90),
        bloodPressure: bpSystolic,
        diabetesRisk: r.disease_risks?.diabetesRisk || 0,
        cardioRisk: r.disease_risks?.cardioRisk || 0,
        strokeRisk: r.disease_risks?.strokeRisk || 0,
        kidneyRisk: r.disease_risks?.kidneyRisk || 0,
        liverRisk: r.disease_risks?.liverRisk || 0
      };
    });

  const handleDownloadPdf = async () => {
    try {
      await generatePdfReport(fullReport, user);
    } catch (e) {
      alert('Failed to generate PDF: ' + e.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter positive lifestyle findings dynamically
  const positiveHabits = [];
  if (lifestyle.smoking === 'No' || lifestyle.smoking === false) {
    positiveHabits.push('Non-Smoker: Zero active tobacco load.');
  }
  if (lifestyle.alcohol === 'No' || lifestyle.alcohol === false) {
    positiveHabits.push('Non-Drinker: Minimal liver strain.');
  }
  if (pInfo.bmi && parseFloat(pInfo.bmi) >= 18.5 && parseFloat(pInfo.bmi) < 25) {
    positiveHabits.push('Healthy BMI: Body mass index meets target clinical baselines.');
  }
  if (lifestyle.exercise && lifestyle.exercise !== 'None') {
    positiveHabits.push(`Active Exercise: Participates in ${lifestyle.exercise} routines.`);
  }

  // Compile top clinical risk factors checklist
  const clinicalRisks = [];
  if (pInfo.bmi && parseFloat(pInfo.bmi) > 25) clinicalRisks.push(`Elevated BMI score: ${pInfo.bmi}`);
  if (lifestyle.smoking === 'Yes') clinicalRisks.push('Active Tobacco Smoking loads');
  if (lifestyle.alcohol === 'Yes') clinicalRisks.push('Alcohol consumption loads');
  if (vitals.blood_pressure && parseInt(vitals.blood_pressure.split('/')[0]) >= 130) clinicalRisks.push(`Hypertensive Systolic Blood Pressure: ${vitals.blood_pressure}`);
  if (labs.blood_sugar && parseFloat(labs.blood_sugar) >= 100) clinicalRisks.push(`Elevated Blood Sugar indicator: ${labs.blood_sugar} mg/dL`);
  if (labs.cholesterol && parseFloat(labs.cholesterol) >= 200) clinicalRisks.push(`Elevated Serum Cholesterol: ${labs.cholesterol} mg/dL`);
  
  if (clinicalRisks.length === 0) {
    clinicalRisks.push('Normal baseline profile risks.');
  }

  return (
    <div className="space-y-8 bg-white p-2 rounded-2xl print:p-0 print:shadow-none EMR-container">
      
      {/* Clinical EMR Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-5 gap-4 print:hidden">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
            <Compass size={20} className="animate-spin" />
          </div>
          <div>
            <h2 className="text-md font-extrabold text-slate-800">Hospital EMR Diagnostic Chart</h2>
            <p className="text-[10px] text-slate-400 font-semibold uppercase">ID: {fullReport.id} • Auth Record File</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={handleDownloadPdf}
            className="bg-teal-600 hover:bg-teal-700 text-xs font-bold gap-1.5 py-2 px-3 rounded-xl shadow-sm"
          >
            <Download size={14} /> Download EMR
          </Button>
          <Button 
            onClick={handlePrint}
            variant="outline"
            className="text-xs font-bold gap-1.5 py-2 px-3 rounded-xl border-slate-200"
          >
            <Printer size={14} /> Print Chart
          </Button>
        </div>
      </div>

      {/* Patient Demographic Profile section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        
        {/* Patient card */}
        <div className="border border-slate-150 rounded-2xl p-5 bg-slate-50/50 flex flex-col items-center text-center">
          {pInfo.photo && pInfo.photo !== 'Not Provided' ? (
            <img 
              src={pInfo.photo} 
              alt={pInfo.patient_name} 
              className="h-16 w-16 rounded-full object-cover border border-slate-200 shadow-sm mb-2"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-teal-55 text-teal-700 flex items-center justify-center font-extrabold text-xl shadow-inner mb-2">
              {(pInfo.patient_name || 'AN').substring(0, 2).toUpperCase()}
            </div>
          )}
          <h3 className="text-sm font-bold text-slate-800">{pInfo.patient_name}</h3>
          <span className="text-[9px] font-extrabold uppercase bg-slate-100 text-slate-550 border border-slate-200 px-2 py-0.5 rounded mt-1">
            {pInfo.relationship}
          </span>
          <div className="w-full mt-4 pt-3 border-t border-slate-150 text-left text-xs font-semibold text-slate-500 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Gender/Age:</span>
              <span>{pInfo.gender}, {pInfo.age} Yrs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Height:</span>
              <span>{renderValue(pInfo.height ? `${pInfo.height} cm` : null)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Weight:</span>
              <span>{renderValue(pInfo.weight ? `${pInfo.weight} kg` : null)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">BMI:</span>
              <span>{renderValue(pInfo.bmi)}</span>
            </div>
          </div>
        </div>

        {/* EMR Registry, Vitals indicators */}
        <div className="md:col-span-3 space-y-6">
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 border border-slate-150 rounded-2xl bg-white text-center">
              <span className="text-[9px] uppercase font-bold text-slate-400">Health Index</span>
              <p className="text-xl font-extrabold text-teal-600 mt-1">{pred.overall_health_score}/100</p>
            </div>
            <div className="p-4 border border-slate-150 rounded-2xl bg-white text-center">
              <span className="text-[9px] uppercase font-bold text-slate-400">Risk Severity</span>
              <p className={`text-xs font-extrabold mt-1.5 py-0.5 rounded px-2 inline-block border ${getRiskBadge(pred.overall_risk)}`}>
                {pred.overall_risk}
              </p>
            </div>
            <div className="p-4 border border-slate-150 rounded-2xl bg-white text-center">
              <span className="text-[9px] uppercase font-bold text-slate-400">Registered Phone</span>
              <p className="text-xs font-bold text-slate-800 mt-2 truncate">{renderValue(pInfo.phone)}</p>
            </div>
            <div className="p-4 border border-slate-150 rounded-2xl bg-white text-center">
              <span className="text-[9px] uppercase font-bold text-slate-400">Emergency contact</span>
              <p className="text-xs font-bold text-slate-800 mt-2 truncate">{renderValue(pInfo.emergency_contact)}</p>
            </div>
          </div>

          {/* Vitals Signs Card Grid */}
          <div className="border border-slate-150 rounded-2xl p-5 bg-white">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-2 mb-3 flex items-center gap-1.5">
              <Thermometer size={14} className="text-teal-600" />
              1. EMR Baseline Vital Signs
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-650">
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Blood Pressure</span>
                <span className="mt-0.5 block">{renderValue(vitals.blood_pressure)}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Heart Rate</span>
                <span className="mt-0.5 block">{renderValue(vitals.heart_rate)}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Body Mass Index (BMI)</span>
                <span className="mt-0.5 block">{renderValue(vitals.bmi)}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Lab Values investigations section */}
      <div className="border border-slate-150 rounded-2xl p-5 bg-white">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-2 mb-4 flex items-center gap-1.5">
          <Database size={14} className="text-teal-650" />
          2. Laboratory Investigations Panel
        </h4>
        <div className="grid grid-cols-2 gap-5 text-xs font-semibold text-slate-650">
          <div>
            <span className="text-[9px] text-slate-400 uppercase font-bold block">Blood Glucose</span>
            <span className="mt-0.5 block">{renderValue(labs.blood_sugar)}</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-400 uppercase font-bold block">Total Serum Cholesterol</span>
            <span className="mt-0.5 block">{renderValue(labs.cholesterol)}</span>
          </div>
        </div>
      </div>

      {/* Symptoms & Medical History grid section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Symptoms Assessment Card */}
        <div className="border border-slate-150 rounded-2xl p-5 bg-white">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-2 mb-3 flex items-center gap-1.5">
            <AlertCircle size={14} className="text-rose-500" />
            3. Active Symptoms complaints
          </h4>
          <div className="space-y-3 text-xs font-semibold text-slate-650">
            <div>
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Chief Complaint Description</span>
              <p className="mt-0.5 text-slate-850 font-bold bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                {renderValue(symInfo.symptom_description)}
              </p>
            </div>
          </div>
        </div>

        {/* Lifestyle Grid */}
        <div className="border border-slate-150 rounded-2xl p-5 bg-white">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-2 mb-3 flex items-center gap-1.5">
            <Dumbbell size={14} className="text-teal-650" />
            4. Lifestyle Factors & Social History
          </h4>
          <div className="grid grid-cols-3 gap-y-2.5 gap-x-2 text-xs font-semibold text-slate-650">
            <div>
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Smoking habit</span>
              <span className="block">{renderValue(lifestyle.smoking)}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Alcohol load</span>
              <span className="block">{renderValue(lifestyle.alcohol)}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Exercise frequency</span>
              <span className="block">{renderValue(lifestyle.exercise)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* AI Organ Disease predictions sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Organ risks progress bars */}
        <div className="md:col-span-2 border border-slate-150 rounded-2xl p-5 bg-white space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-2 flex items-center gap-1.5">
            <Heart size={14} className="text-rose-500 animate-pulse" />
            5. Multi-organ AI Risk Probability Predictions
          </h4>
          <div className="space-y-3">
            {[
              { label: 'Cardiovascular Heart Disease', pct: organRisks.cardioRisk },
              { label: 'Endocrine Diabetes', pct: organRisks.diabetesRisk },
              { label: 'Neurological Stroke', pct: organRisks.strokeRisk },
              { label: 'Kidney Filtration Deficit', pct: organRisks.kidneyRisk },
              { label: 'Hepatocyte Liver Strain', pct: organRisks.liverRisk },
              { label: 'Hypertension Pressure Load', pct: organRisks.hypertensionRisk },
              { label: 'Obesity Index Probability', pct: organRisks.obesityRisk }
            ].map((item, idx) => {
              const score = item.pct || 0;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-650">
                     <span>{item.label}</span>
                     <span>{score}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${getProgressColor(score)}`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top risk factors checklist */}
        <div className="border border-slate-150 rounded-2xl p-5 bg-white space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-2 flex items-center gap-1.5">
            <Shield size={14} className="text-indigo-650" />
            6. AI Diagnostic Warnings Checklist
          </h4>
          
          <div className="space-y-3.5">
            {clinicalRisks.map((risk, index) => (
              <div key={index} className="flex gap-2 text-xs font-semibold text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                <span>{risk}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Gemini summary care plans */}
      <div className="border border-slate-150 rounded-2xl p-5 bg-teal-50/10 border-teal-500/20">
        <h4 className="text-xs font-bold uppercase tracking-wider text-teal-650 border-b border-teal-500/20 pb-2 mb-3 flex items-center gap-1.5">
          <Sparkles size={14} className="text-teal-600" />
          7. Physician Clinical review Summary
        </h4>
        <p className="text-xs font-medium text-slate-700 leading-relaxed bg-white/70 p-4 rounded-2xl border border-slate-100/50">
          {ai.gemini_summary}
        </p>
      </div>

      {/* Grouped Recommendations sheet */}
      <div className="border border-slate-150 rounded-2xl p-5 bg-white">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-2 mb-4 flex items-center gap-1.5">
          <CheckCircle size={14} className="text-emerald-600" />
          8. Grouped Care Plan Guidelines
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-semibold text-slate-650">
          <div>
            <span className="text-teal-700 font-bold border-b pb-1 block mb-2">Diet & Nutrition</span>
            <ul className="list-disc list-inside space-y-1 text-slate-700 font-medium">
              {renderList(ai.gemini_recommendations?.diet, "No diet recorded.")}
            </ul>
          </div>
          <div>
            <span className="text-indigo-700 font-bold border-b pb-1 block mb-2">Exercises Guidelines</span>
            <ul className="list-disc list-inside space-y-1 text-slate-700 font-medium">
              {renderList(ai.gemini_recommendations?.exercise, "No physical activity recorded.")}
            </ul>
          </div>
          <div>
            <span className="text-amber-700 font-bold border-b pb-1 block mb-2">Medications protocol</span>
            <ul className="list-disc list-inside space-y-1 text-slate-700 font-medium">
              {renderList(ai.gemini_recommendations?.medication, "None recorded.")}
            </ul>
          </div>
          <div>
            <span className="text-blue-700 font-bold border-b pb-1 block mb-2">Daily Hydration</span>
            <ul className="list-disc list-inside space-y-1 text-slate-700 font-medium">
              {renderList(ai.gemini_recommendations?.hydration, "Drink water daily.")}
            </ul>
          </div>
          <div>
            <span className="text-purple-700 font-bold border-b pb-1 block mb-2">Sleep Advice</span>
            <ul className="list-disc list-inside space-y-1 text-slate-700 font-medium">
              {renderList(ai.gemini_recommendations?.sleep, "Maintain regular schedules.")}
            </ul>
          </div>
          <div>
            <span className="text-rose-700 font-bold border-b pb-1 block mb-2">Stress Management</span>
            <ul className="list-disc list-inside space-y-1 text-slate-700 font-medium">
              {renderList(ai.gemini_recommendations?.stress, "Practice meditation.")}
            </ul>
          </div>
          <div>
            <span className="text-pink-700 font-bold border-b pb-1 block mb-2">Preventive Care Checkups</span>
            <ul className="list-disc list-inside space-y-1 text-slate-700 font-medium">
              {renderList(ai.gemini_recommendations?.preventive_care, "Routine diagnostic scanning.")}
            </ul>
          </div>
          <div>
            <span className="text-emerald-700 font-bold border-b pb-1 block mb-2">Lifestyle modification</span>
            <ul className="list-disc list-inside space-y-1 text-slate-700 font-medium">
              {renderList(ai.gemini_recommendations?.lifestyle, "Reduce sitting time.")}
            </ul>
          </div>
          <div>
            <span className="text-red-700 font-bold border-b pb-1 block mb-2">Physician followups</span>
            <ul className="list-disc list-inside space-y-1 text-slate-700 font-medium">
              {renderList(ai.gemini_recommendations?.medical_followup, "Consult in case of distress.")}
            </ul>
          </div>
        </div>
      </div>

      {/* EMR Historical Trends section */}
      <div className="border border-slate-150 rounded-2xl p-5 bg-white space-y-6">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-2 flex items-center gap-1.5">
          <Activity size={14} className="text-teal-650" />
          9. Chronological Patient Health Trends
        </h4>
        {trendData.length >= 2 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Health Score line chart */}
            <div className="h-56">
              <span className="text-[10px] font-bold text-slate-400 block mb-2 text-center uppercase">Health score Index Trend</span>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="healthScore" stroke="#0d9488" strokeWidth={2} activeDot={{ r: 4 }} name="Score" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Glucose blood sugar trend */}
            <div className="h-56">
              <span className="text-[10px] font-bold text-slate-400 block mb-2 text-center uppercase">Circulating Glucose Trend (mg/dL)</span>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="bloodSugar" stroke="#f59e0b" strokeWidth={2} activeDot={{ r: 4 }} name="Sugar" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Organ Risks timelines */}
            <div className="md:col-span-2 h-64">
              <span className="text-[10px] font-bold text-slate-400 block mb-2 text-center uppercase">Multi-organ AI Risk timelines (%)</span>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} domain={[0, 100]} />
                  <Tooltip />
                  <Legend fontSize={9} />
                  <Line type="monotone" dataKey="diabetesRisk" stroke="#f59e0b" strokeWidth={1.5} name="Diabetes" />
                  <Line type="monotone" dataKey="cardioRisk" stroke="#ef4444" strokeWidth={1.5} name="Heart" />
                  <Line type="monotone" dataKey="strokeRisk" stroke="#3b82f6" strokeWidth={1.5} name="Stroke" />
                  <Line type="monotone" dataKey="kidneyRisk" stroke="#8b5cf6" strokeWidth={1.5} name="Kidney" />
                  <Line type="monotone" dataKey="liverRisk" stroke="#10b981" strokeWidth={1.5} name="Liver" />
                </LineChart>
              </ResponsiveContainer>
            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-2xl text-center border border-dashed border-slate-200">
            <Activity className="h-8 w-8 text-slate-400 mb-2 animate-pulse" />
            <p className="text-xs font-bold text-slate-600">More assessments are required to generate trends.</p>
            <p className="text-[10px] text-slate-400 mt-1">EMR requires at least 2 historical diagnostic records to construct trend lines.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default MedicalReportView;
