import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  FileText, 
  Download, 
  Printer, 
  Share2, 
  Trash2, 
  Copy, 
  Eye, 
  AlertTriangle,
  ArrowUpDown,
  FileSpreadsheet,
  Activity,
  ChevronDown
} from 'lucide-react';
import healthService from '../../services/healthService';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import useAuth from '../../hooks/useAuth';
import MedicalReportView from './MedicalReportView';
import { generatePdfReport } from '../../utils/reportGenerator';

export const MedicalReportsPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { search } = useLocation();
  const memberId = new URLSearchParams(search).get('memberId');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [diseaseFilter, setDiseaseFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch reports from backend EMR reports API
  const { data: reports = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['emrReportsList', searchTerm, riskFilter, diseaseFilter, sortOrder, memberId],
    queryFn: () => healthService.getAllReports({
      q: searchTerm,
      risk: riskFilter,
      disease: diseaseFilter,
      sort: sortOrder,
      memberId: memberId || undefined
    }),
  });

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

  const getRiskColor = (risk) => {
    if (risk === 'Low' || risk === 'Normal') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (risk === 'Moderate') return 'bg-amber-50 text-amber-700 border-amber-100';
    return 'bg-rose-50 text-rose-700 border-rose-100';
  };

  const handleDuplicate = (id) => {
    if (window.confirm('Duplicate this report? A new permanent entry will be generated.')) {
      duplicateMutation.mutate(id);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to permanently delete this clinical report from EMR?')) {
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

  const handlePrint = (r) => {
    setSelectedReport(r);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 flex items-center gap-2">
          <FileSpreadsheet className="text-teal-600" size={26} />
          Hospital Clinical EMR Reports Explorer
        </h1>
        <p className="text-sm text-slate-500">Central archives database of patient assessments and AI predictions files.</p>
      </div>

      {/* Filter and search parameters */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search reports by Patient Name, ID, disease, symptom, or owner relationship..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            
            {/* Risk Filters */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Risk Severity</span>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="w-full text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="">All Risks</option>
                <option value="High">High Risk</option>
                <option value="Moderate">Medium Risk</option>
                <option value="Low">Low Risk</option>
              </select>
            </div>

            {/* Disease Indicators */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Disease Indicator</span>
              <select
                value={diseaseFilter}
                onChange={(e) => setDiseaseFilter(e.target.value)}
                className="w-full text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="">All Diseases</option>
                <option value="diabetes">Diabetes</option>
                <option value="cardio">Heart Disease</option>
                <option value="stroke">Stroke</option>
                <option value="kidney">Kidney Disease</option>
                <option value="liver">Liver Disease</option>
                <option value="hypertension">Hypertension</option>
              </select>
            </div>

            {/* Sort Selection */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Sort By</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="score_desc">Health Score (High)</option>
                <option value="score_asc">Health Score (Low)</option>
              </select>
            </div>

            {/* Reset Filters */}
            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full py-2.5 text-xs font-bold text-slate-600 border-slate-200 hover:bg-slate-50 rounded-xl"
                onClick={() => {
                  setSearchTerm('');
                  setRiskFilter('');
                  setDiseaseFilter('');
                  setSortOrder('newest');
                  if (memberId) {
                    navigate('/reports');
                  }
                }}
              >
                Clear Filters
              </Button>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Reports Table Card */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] p-8">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-slate-100 border-t-teal-600 mb-3" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Syncing EMR Index...</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
              <AlertTriangle className="h-10 w-10 text-red-500 mb-3 animate-bounce" />
              <h3 className="text-sm font-bold text-slate-800">Connection Failed</h3>
              <p className="text-xs text-slate-400 mt-1">{error?.message || 'Unable to scan EMR database'}</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
              <Activity className="h-10 w-10 text-slate-300 mb-3 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-700">No EMR Reports Found</h3>
              <p className="text-xs text-slate-400 mt-1">No health files match your selection filters.</p>
            </div>
          ) : (
            <div>
              {/* Mobile Card List View */}
              <div className="block sm:hidden p-4 space-y-4">
                {reports.map((report) => {
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
                          <span className="text-[10px] text-slate-800 font-bold mt-1 block">Patient: {report.patient_name || 'Anonymous'}</span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">{report.assessment_date}</span>
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

                      <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-100/50 flex-wrap">
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
                          onClick={() => handlePrint(report)}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg border border-slate-200 transition-colors"
                          title="Print Secure File"
                        >
                          <Printer size={12} />
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
                          title="Duplicate Entry"
                        >
                          <Copy size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(report.id)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-650 rounded-lg border border-red-200 transition-colors"
                          title="Delete Entry"
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
                <table className="w-full text-left text-xs font-semibold text-slate-600">
                  <thead className="text-[10px] uppercase tracking-wider text-slate-400 bg-slate-50/50 border-b border-slate-100">
                    <tr>
                      <th className="p-4 font-bold">Report ID</th>
                      <th className="p-4 font-bold">Patient Name</th>
                      <th className="p-4 font-bold">Assessment Date</th>
                      <th className="p-4 font-bold">Health Score</th>
                      <th className="p-4 font-bold">Risk Level</th>
                      <th className="p-4 font-bold">Primary Diseases</th>
                      <th className="p-4 font-bold">Doctor Summary</th>
                      <th className="p-4 font-bold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {reports.map((report) => {
                      const diseases = [];
                      if (report.disease_risks?.diabetesRisk > 50) diseases.push('Diabetes');
                      if (report.disease_risks?.cardioRisk > 50) diseases.push('Cardio');
                      if (report.disease_risks?.strokeRisk > 50) diseases.push('Stroke');
                      if (report.disease_risks?.kidneyRisk > 50) diseases.push('Kidney');

                      return (
                        <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 text-slate-900 font-extrabold select-all">{report.id}</td>
                          <td className="p-4 text-slate-800 font-bold">{report.patient_name || 'Anonymous'}</td>
                          <td className="p-4 text-slate-500 font-medium">{report.assessment_date}</td>
                          <td className="p-4 text-slate-800 font-bold">{report.health_score || report.overall_health_score || 0}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold border ${getRiskColor(report.overall_risk)}`}>
                              {report.overall_risk}
                            </span>
                          </td>
                          <td className="p-4">
                            {diseases.length === 0 ? (
                              <span className="text-slate-400 font-medium">None</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {diseases.map((d, i) => (
                                  <span key={i} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[8px] font-bold">
                                    {d}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="p-4 max-w-[160px] truncate text-slate-500 font-medium" title={report.gemini_summary}>
                            {report.gemini_summary}
                          </td>
                          <td className="p-4 flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setSelectedReport(report);
                                setIsModalOpen(true);
                              }}
                              className="p-2 hover:bg-slate-100 text-slate-500 hover:text-teal-600 rounded-lg transition-colors"
                              title="View EMR Report Sheet"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => handleDownloadPdf(report)}
                              className="p-2 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded-lg transition-colors"
                              title="Download PDF"
                            >
                              <Download size={14} />
                            </button>
                            <button
                              onClick={() => handlePrint(report)}
                              className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors"
                              title="Print Report"
                            >
                              <Printer size={14} />
                            </button>
                            <button
                              onClick={() => handleShare(report.id)}
                              className="p-2 hover:bg-slate-100 text-slate-500 hover:text-emerald-600 rounded-lg transition-colors"
                              title="Copy Secure Link"
                            >
                              <Share2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDuplicate(report.id)}
                              className="p-2 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded-lg transition-colors"
                              title="Duplicate Entry"
                            >
                              <Copy size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(report.id)}
                              className="p-2 hover:bg-slate-100 text-slate-500 hover:text-red-650 rounded-lg transition-colors"
                              title="Delete Entry"
                            >
                              <Trash2 size={14} />
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

      {/* Hospital EMR Report Modal View sheet */}
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

export default MedicalReportsPage;
