import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ChevronLeft, 
  User, 
  MapPin, 
  Activity, 
  Clock, 
  Calendar, 
  Eye, 
  Download, 
  Printer, 
  Share2, 
  Trash2, 
  Copy, 
  FileText, 
  TrendingUp, 
  Heart,
  Droplets,
  Brain,
  Sliders,
  CheckCircle,
  AlertTriangle,
  ClipboardList,
  Flame,
  Plus
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  AreaChart,
  Area
} from 'recharts';
import healthService from '../../services/healthService';
import useAuth from '../../hooks/useAuth';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import MedicalReportView from './MedicalReportView';
import { generatePdfReport } from '../../utils/reportGenerator';

export const PatientProfilePage = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('trends');
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch EMR family members
  const { data: familyMembers = [], isLoading: isMembersLoading } = useQuery({
    queryKey: ['familyMembersList'],
    queryFn: healthService.getFamilyMembers,
  });

  // Find active member
  const member = familyMembers.find(m => m.member_id === patientId);

  // Fetch reports list to display history
  const { data: reports = [], isLoading: isReportsLoading } = useQuery({
    queryKey: ['emrReportsList'],
    queryFn: () => healthService.getAllReports(),
  });

  // Filter reports specifically for this family member
  const patientReports = reports.filter(r => r.member_id === patientId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Duplication Mutation
  const duplicateMutation = useMutation({
    mutationFn: healthService.duplicateReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emrReportsList'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      alert('Report duplicated successfully!');
    },
    onError: (err) => {
      alert('Failed to duplicate report: ' + err.message);
    }
  });

  // Deletion Mutation
  const deleteMutation = useMutation({
    mutationFn: healthService.deleteReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emrReportsList'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      alert('Report deleted successfully!');
    },
    onError: (err) => {
      alert('Failed to delete report: ' + err.message);
    }
  });

  if (isMembersLoading || isReportsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-slate-50 rounded-3xl">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-100 border-t-teal-600 mb-3" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Syncing EMR Dossier...</p>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white border border-slate-100 border-dashed border-red-200 rounded-3xl p-8 text-center max-w-2xl mx-auto mt-10">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-3 animate-bounce" />
        <h3 className="text-md font-bold text-slate-800">EMR Patient File Not Found</h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1">We could not pull the patient profile or the database has no records associated with this ID.</p>
        <Button onClick={() => navigate('/')} className="mt-6 gap-1.5 text-xs font-bold bg-teal-600 hover:bg-teal-700">
          <ChevronLeft size={16} /> Return to Dashboard
        </Button>
      </div>
    );
  }

  const latestReport = patientReports[0];
  const patientName = member.full_name;
  const age = member.age;
  const gender = member.gender;
  const bloodGroup = member.blood_group || 'N/A';
  const latestScore = latestReport ? (latestReport.health_score || latestReport.overall_health_score || 0) : 'N/A';
  const latestRisk = latestReport ? (latestReport.overall_risk || 'Low') : 'N/A';

  const getRiskColor = (risk) => {
    if (risk === 'Low' || risk === 'Normal') return 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30';
    if (risk === 'Moderate') return 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30';
    return 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30';
  };

  const isDark = document.documentElement.classList.contains('dark');
  const gridColor = isDark ? '#334155' : '#f1f5f9';
  const labelColor = isDark ? '#94a3b8' : '#64748b';

  // Compile trend analytics data (chronological order)
  const trendData = [...patientReports]
    .reverse()
    .map(r => {
      const dateStr = new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' });
      const bpSystolic = parseInt(r.personal_info?.blood_pressure?.split('/')[0] || '120');
      return {
        date: dateStr,
        healthScore: r.health_score || r.overall_health_score || 0,
        bmi: parseFloat(r.personal_info?.bmi || 0),
        weight: parseFloat(r.personal_info?.weight || 0),
        bloodSugar: parseFloat(r.personal_info?.blood_sugar || 90),
        bloodPressure: bpSystolic,
        diabetesRisk: r.disease_risks?.diabetesRisk || r.prediction_results?.diabetes_risk || 0,
        cardioRisk: r.disease_risks?.cardioRisk || r.prediction_results?.cardio_risk || 0,
        strokeRisk: r.disease_risks?.strokeRisk || r.prediction_results?.stroke_risk || 0,
        kidneyRisk: r.disease_risks?.kidneyRisk || 0,
        heartRisk: r.disease_risks?.cardioRisk || 0
      };
    });

  const handleDuplicate = (id) => {
    if (window.confirm('Duplicate this report? A new permanent entry will be generated.')) {
      duplicateMutation.mutate(id);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you absolutely sure you want to remove this medical report from EMR archives? This is permanent.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleDownloadPdf = async (r) => {
    try {
      const fullReport = await healthService.getReportById(r.id);
      await generatePdfReport(fullReport, user);
    } catch (e) {
      alert('Failed to generate PDF: ' + e.message);
    }
  };

  const handleShare = (id) => {
    navigator.clipboard.writeText(`HealthGuard AI EMR Link: ${window.location.origin}/reports?q=${id}`);
    alert('Secure report link copied to clipboard.');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Return Navigation control */}
      <div className="flex justify-between items-center print:hidden">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ChevronLeft size={16} /> Directory Directory
        </button>
        <Button
          onClick={() => navigate(`/assessment?memberId=${member.member_id}`)}
          className="bg-teal-600 hover:bg-teal-700 text-xs font-bold gap-1.5 py-2.5 rounded-xl shadow-sm"
        >
          <Plus size={16} /> New Assessment
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left side panel: Demographics Details, Lifestyle, History */}
        <div className="lg:col-span-4 space-y-6 print:hidden">
          
          {/* Patient Card */}
          <Card>
            <CardContent className="p-6 text-center">
              {member.photo ? (
                <img 
                  src={member.photo} 
                  alt={patientName} 
                  className="h-20 w-20 rounded-full object-cover border border-slate-200 shadow-sm mx-auto mb-3"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center font-extrabold text-2xl shadow-inner mx-auto mb-3">
                  {patientName.substring(0, 2).toUpperCase()}
                </div>
              )}
              <h2 className="text-md font-bold text-slate-800 leading-tight">{patientName}</h2>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 inline-block bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                {member.relationship}
              </span>
              
              <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 gap-y-3 gap-x-2 text-left text-xs font-semibold text-slate-500">
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase font-bold">Demographics</span>
                  <span className="text-slate-800">{gender}, {age} Years</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase font-bold">Blood Group</span>
                  <span className="text-slate-800">{bloodGroup}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase font-bold">Dimensions</span>
                  <span className="text-slate-800">{member.height ? `${member.height} cm` : 'N/A'}, {member.weight ? `${member.weight} kg` : 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase font-bold">Phone</span>
                  <span className="text-slate-850 truncate block">{member.phone || 'N/A'}</span>
                </div>
                {member.emergency_contact && (
                  <div className="col-span-2 border-t border-slate-50 pt-2">
                    <span className="text-[9px] text-slate-400 block uppercase font-bold">Emergency Contact</span>
                    <span className="text-slate-850 font-bold block">{member.emergency_contact}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Medical history details */}
          {latestReport && (
            <>
              <Card>
                <CardHeader className="pb-2 border-b border-slate-50">
                  <CardTitle className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Lifestyle Profile</CardTitle>
                </CardHeader>
                <CardContent className="p-4 text-xs space-y-2 font-semibold text-slate-650">
                  <div className="flex justify-between border-b border-slate-50 pb-1">
                    <span className="text-slate-400">Daily Exercise</span>
                    <span>{latestReport.lifestyle_info?.exercise || 'Moderate'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-1">
                    <span className="text-slate-400">Smoking Load</span>
                    <span>{latestReport.lifestyle_info?.smoking || 'No'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-1">
                    <span className="text-slate-400">Alcohol Load</span>
                    <span>{latestReport.lifestyle_info?.alcohol || 'No'}</span>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

        </div>

        {/* Right side panel: Tab panels */}
        <div className="lg:col-span-8 space-y-6 print:col-span-12 print:w-full">
          
          {/* Navigation Tabs (Hidden in print) */}
          <div className="flex border-b border-slate-200 print:hidden gap-1.5">
            <button
              onClick={() => setActiveTab('trends')}
              className={`px-5 py-3.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'trends'
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
              disabled={patientReports.length < 2}
              title={patientReports.length < 2 ? "Need at least 2 reports to compile trends" : ""}
            >
              <TrendingUp size={14} /> Health Trend Analytics
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-5 py-3.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'reports'
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <ClipboardList size={14} /> Report History ({patientReports.length})
            </button>
          </div>

          {/* Render Trend graphs */}
          {activeTab === 'trends' && patientReports.length >= 2 && (
            <div className="space-y-6 animate-fade-in print:hidden">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Health Score Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xs uppercase text-slate-400 font-extrabold tracking-wider">Health Index Score Trend</CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                        <XAxis dataKey="date" stroke={labelColor} fontSize={10} tickLine={false} />
                        <YAxis stroke={labelColor} fontSize={10} tickLine={false} domain={[0, 100]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="healthScore" stroke="#0d9488" strokeWidth={2.5} activeDot={{ r: 6 }} name="Health Index" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* BMI Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xs uppercase text-slate-400 font-extrabold tracking-wider">BMI / Body Mass Trend</CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                        <XAxis dataKey="date" stroke={labelColor} fontSize={10} tickLine={false} />
                        <YAxis stroke={labelColor} fontSize={10} tickLine={false} />
                        <Tooltip />
                        <Area type="monotone" dataKey="bmi" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} name="BMI (kg/m²)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Weight Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xs uppercase text-slate-400 font-extrabold tracking-wider">Weight Metric Trend (kg)</CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                        <XAxis dataKey="date" stroke={labelColor} fontSize={10} tickLine={false} />
                        <YAxis stroke={labelColor} fontSize={10} tickLine={false} />
                        <Tooltip />
                        <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={2.5} name="Weight" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* BP Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xs uppercase text-slate-400 font-extrabold tracking-wider">Blood Pressure (Systolic)</CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                        <XAxis dataKey="date" stroke={labelColor} fontSize={10} tickLine={false} />
                        <YAxis stroke={labelColor} fontSize={10} tickLine={false} />
                        <Tooltip />
                        <Line type="monotone" dataKey="bloodPressure" stroke="#ef4444" strokeWidth={2.5} name="BP Systolic" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Glucose Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xs uppercase text-slate-400 font-extrabold tracking-wider">Blood Sugar Vitals Trend</CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                        <XAxis dataKey="date" stroke={labelColor} fontSize={10} tickLine={false} />
                        <YAxis stroke={labelColor} fontSize={10} tickLine={false} />
                        <Tooltip />
                        <Line type="monotone" dataKey="bloodSugar" stroke="#f59e0b" strokeWidth={2.5} name="Glucose (mg/dL)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Heart Risk Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xs uppercase text-slate-400 font-extrabold tracking-wider">Cardiovascular Risk Trend</CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                        <XAxis dataKey="date" stroke={labelColor} fontSize={10} tickLine={false} />
                        <YAxis stroke={labelColor} fontSize={10} tickLine={false} />
                        <Tooltip />
                        <Line type="monotone" dataKey="heartRisk" stroke="#dc2626" strokeWidth={2.5} name="Heart Risk %" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

              </div>

              {/* Disease risks timelines */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xs uppercase text-slate-400 font-extrabold tracking-wider">Multi-organ AI Threat Probability Timeline</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                      <XAxis dataKey="date" stroke={labelColor} fontSize={10} tickLine={false} />
                      <YAxis stroke={labelColor} fontSize={10} tickLine={false} domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="diabetesRisk" stroke="#f59e0b" strokeWidth={2} name="Diabetes Risk" />
                      <Line type="monotone" dataKey="cardioRisk" stroke="#ef4444" strokeWidth={2} name="Cardio Risk" />
                      <Line type="monotone" dataKey="strokeRisk" stroke="#3b82f6" strokeWidth={2} name="Stroke Risk" />
                      <Line type="monotone" dataKey="kidneyRisk" stroke="#8b5cf6" strokeWidth={2} name="Kidney Risk" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

            </div>
          )}

          {/* Tab 2: Reports History List Table */}
          {(activeTab === 'reports' || patientReports.length < 2) && (
            <Card>
              <CardHeader>
                <CardTitle>Archived Health Reports ({patientReports.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {patientReports.length === 0 ? (
                  <div className="text-center py-8 text-xs font-bold text-slate-400">
                    No diagnostics reports logged for this patient profile. Start a New Assessment.
                  </div>
                ) : (
                  <div>
                    {/* Mobile Card List View */}
                    <div className="block sm:hidden p-4 space-y-4">
                      {patientReports.map((report) => {
                        const diseases = [];
                        if (report.disease_risks?.diabetesRisk > 50) diseases.push('Diabetes');
                        if (report.disease_risks?.cardioRisk > 50) diseases.push('Cardio');
                        if (report.disease_risks?.strokeRisk > 50) diseases.push('Stroke');
                        if (report.disease_risks?.kidneyRisk > 50) diseases.push('Kidney');

                        return (
                          <div key={report.id} className="bg-slate-50/60 rounded-2xl p-4 border border-slate-100 space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-slate-900 font-extrabold text-xs select-all block">{report.id}</span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">{report.assessment_date}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold border ${getRiskColor(report.overall_risk)}`}>
                                {report.overall_risk}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-650">
                              <div>
                                <span className="text-[9px] text-slate-400 block uppercase">Health Score</span>
                                <span className="text-slate-800 font-bold">{report.health_score || report.overall_health_score || 0}</span>
                              </div>
                              <div>
                                <span className="text-[9px] text-slate-400 block uppercase">Primary Threat</span>
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                  {diseases.length === 0 ? (
                                    <span className="text-slate-400 font-medium">None</span>
                                  ) : (
                                    diseases.map((d, i) => (
                                      <span key={i} className="bg-white border border-slate-100 text-slate-650 px-1.5 py-0.2 rounded text-[7px] font-extrabold">
                                        {d}
                                      </span>
                                    ))
                                  )}
                                </div>
                              </div>
                            </div>

                            {report.gemini_summary && (
                              <div className="text-[10px] text-slate-500 font-medium line-clamp-2 border-t border-slate-100/50 pt-2">
                                {report.gemini_summary}
                              </div>
                            )}

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100/50 flex-wrap">
                              <button
                                onClick={() => {
                                  setSelectedReport(report);
                                  setIsModalOpen(true);
                                }}
                                className="flex items-center gap-1 text-[10px] font-extrabold text-teal-600 hover:text-teal-700 bg-teal-50 px-2.5 py-1.5 rounded-lg border border-teal-100 transition-colors"
                              >
                                <Eye size={12} /> View File
                              </button>
                              <button
                                onClick={() => handleDownloadPdf(report)}
                                className="flex items-center gap-1 text-[10px] font-extrabold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2.5 py-1.5 rounded-lg border border-indigo-100 transition-colors"
                              >
                                <Download size={12} /> PDF
                              </button>
                              <button
                                onClick={() => handleShare(report.id)}
                                className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg border border-slate-200 transition-colors"
                                title="Share secure link"
                              >
                                <Share2 size={12} />
                              </button>
                              <button
                                onClick={() => handleDuplicate(report.id)}
                                className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg border border-slate-200 transition-colors"
                                title="Duplicate"
                              >
                                <Copy size={12} />
                              </button>
                              <button
                                onClick={() => handleDelete(report.id)}
                                className="p-1.5 bg-red-50 hover:bg-red-100 text-red-650 rounded-lg border border-red-200 transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full text-left text-xs font-semibold text-slate-650">
                        <thead className="text-[10px] uppercase tracking-wider text-slate-400 bg-slate-50 border-b border-slate-100">
                          <tr>
                            <th className="p-4 font-bold">Report ID</th>
                            <th className="p-4 font-bold">Date</th>
                            <th className="p-4 font-bold">Health Score</th>
                            <th className="p-4 font-bold">Overall Risk</th>
                            <th className="p-4 font-bold">Primary Diseases</th>
                            <th className="p-4 font-bold">Doctor Summary</th>
                            <th className="p-4 text-center font-bold">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {patientReports.map((report) => {
                            const diseases = [];
                            if (report.disease_risks?.diabetesRisk > 50) diseases.push('Diabetes');
                            if (report.disease_risks?.cardioRisk > 50) diseases.push('Cardio');
                            if (report.disease_risks?.strokeRisk > 50) diseases.push('Stroke');
                            if (report.disease_risks?.kidneyRisk > 50) diseases.push('Kidney');

                            return (
                              <tr key={report.id} className="hover:bg-slate-50/30 transition-all">
                                <td className="p-4 text-slate-900 font-extrabold select-all">{report.id}</td>
                                <td className="p-4 text-slate-500">{report.assessment_date}</td>
                                <td className="p-4 text-slate-800 font-bold">{report.health_score || report.overall_health_score || 0}</td>
                                <td className="p-4">
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold border ${getRiskColor(report.overall_risk)}`}>
                                    {report.overall_risk}
                                  </span>
                                </td>
                                <td className="p-4">
                                  {diseases.length === 0 ? (
                                    <span className="text-slate-400">None</span>
                                  ) : (
                                    <div className="flex flex-wrap gap-1">
                                      {diseases.map((d, i) => (
                                        <span key={i} className="bg-slate-100 text-slate-650 px-1.5 py-0.5 rounded text-[8px] font-bold">
                                          {d}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </td>
                                <td className="p-4 max-w-[120px] truncate text-slate-500 font-medium" title={report.gemini_summary}>
                                  {report.gemini_summary}
                                </td>
                                <td className="p-4 flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => {
                                      setSelectedReport(report);
                                      setIsModalOpen(true);
                                    }}
                                    className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-teal-600 rounded-lg transition-colors"
                                    title="View Report Details"
                                  >
                                    <Eye size={13} />
                                  </button>
                                  <button
                                    onClick={() => handleDownloadPdf(report)}
                                    className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded-lg transition-colors"
                                    title="Download PDF"
                                  >
                                    <Download size={13} />
                                  </button>
                                  <button
                                    onClick={() => handleShare(report.id)}
                                    className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-emerald-600 rounded-lg transition-colors"
                                    title="Share secure link"
                                  >
                                    <Share2 size={13} />
                                  </button>
                                  <button
                                    onClick={() => handleDuplicate(report.id)}
                                    className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded-lg transition-colors"
                                    title="Duplicate"
                                  >
                                    <Copy size={13} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(report.id)}
                                    className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-red-650 rounded-lg transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        </div>

      </div>

      {/* Embedded clinical modal preview sheet */}
      {isModalOpen && selectedReport && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-premium flex flex-col">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center z-10 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800">Hospital EMR Diagnostic File: {selectedReport.id}</h3>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedReport(null);
                }} 
                className="text-xs font-bold text-slate-400 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-100 transition-all"
              >
                Close File
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <MedicalReportView report={selectedReport} user={user} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PatientProfilePage;
