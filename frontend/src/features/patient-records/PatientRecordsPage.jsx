import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  User, 
  MapPin, 
  TrendingUp, 
  ShieldAlert, 
  ClipboardList, 
  AlertTriangle,
  FolderHeart,
  Calendar,
  Layers,
  ArrowUpDown,
  Activity,
  Heart,
  ChevronRight
} from 'lucide-react';
import healthService from '../../services/healthService';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export const PatientRecordsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  // Query all EMR reports
  const { data: reports = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['emrReports', searchTerm, sortOrder],
    queryFn: () => healthService.getAllReports({ q: searchTerm, sort: sortOrder }),
  });

  // Group reports by unique user_id to compile patient profiles
  const patientsMap = {};
  reports.forEach(report => {
    const pId = report.user_id;
    if (!pId) return;

    if (!patientsMap[pId] || new Date(report.created_at) > new Date(patientsMap[pId].latestReportDate)) {
      const prevReports = patientsMap[pId]?.allReports || [];
      patientsMap[pId] = {
        id: pId,
        name: report.patient_name || 'Anonymous Patient',
        latestReportId: report.id,
        latestReportDate: report.created_at,
        latestRisk: report.overall_risk || 'Low',
        latestScore: report.health_score || 0,
        reportCount: (patientsMap[pId]?.reportCount || 0) + 1,
        gender: report.personal_info?.gender || 'N/A',
        age: report.personal_info?.age || 'N/A',
        city: report.personal_info?.city || 'N/A',
        state: report.personal_info?.state || 'N/A',
        allReports: [...prevReports, report].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      };
    } else {
      patientsMap[pId].reportCount += 1;
      patientsMap[pId].allReports.push(report);
      patientsMap[pId].allReports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  });

  const patients = Object.values(patientsMap);

  // Statistics summaries
  const totalPatients = patients.length;
  const totalReports = reports.length;
  const highRiskCount = patients.filter(p => p.latestRisk === 'High').length;
  const moderateRiskCount = patients.filter(p => p.latestRisk === 'Moderate').length;
  const lowRiskCount = patients.filter(p => p.latestRisk === 'Low' || p.latestRisk === 'Normal').length;

  const getRiskColor = (risk) => {
    if (risk === 'Low' || risk === 'Normal') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (risk === 'Moderate') return 'bg-amber-50 text-amber-700 border-amber-100';
    return 'bg-rose-50 text-rose-700 border-rose-100';
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 flex items-center gap-2">
          <FolderHeart className="text-teal-600" size={26} />
          Hospital Directory: Electronic Health Records (EHR)
        </h1>
        <p className="text-sm text-slate-500">Clinician database of patient baseline assessments, organ diagnostics, and Gemini AI health records.</p>
      </div>

      {/* Hospital Metrics Summary Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Total Patients */}
        <Card animate>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Patient Profiles</p>
              <h4 className="mt-2 text-2xl font-extrabold text-slate-800">{totalPatients}</h4>
            </div>
            <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl">
              <User size={18} />
            </div>
          </div>
        </Card>

        {/* Total EMR Files */}
        <Card animate>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total EMR Reports</p>
              <h4 className="mt-2 text-2xl font-extrabold text-slate-800">{totalReports}</h4>
            </div>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <ClipboardList size={18} />
            </div>
          </div>
        </Card>

        {/* High Risk Alerts */}
        <Card animate>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Critical Warnings (High)</p>
              <h4 className="mt-2 text-2xl font-extrabold text-rose-600">{highRiskCount}</h4>
            </div>
            <div className="p-2.5 bg-rose-50 text-rose-500 rounded-xl">
              <ShieldAlert size={18} />
            </div>
          </div>
        </Card>

        {/* Normal/Stable Index */}
        <Card animate>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Stable Index (Low/Mod)</p>
              <h4 className="mt-2 text-2xl font-extrabold text-emerald-600">{lowRiskCount + moderateRiskCount}</h4>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle size={18} />
            </div>
          </div>
        </Card>

      </div>

      {/* Search and Sort controls */}
      <Card>
        <CardContent className="flex flex-col sm:flex-row gap-4 p-4 items-center">
          
          {/* Search bar */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search EMRs by Patient Name, ID, Disease, Report Reference or Risk Level..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Sort selection */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <ArrowUpDown size={14} className="text-slate-400 shrink-0" />
            <select 
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full sm:w-44 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="score_desc">Health Index (High)</option>
              <option value="score_asc">Health Index (Low)</option>
            </select>
          </div>

        </CardContent>
      </Card>

      {/* Patient Directory Grid List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-slate-100 border-t-teal-600 mb-3" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Scanning Patient Databases...</p>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] bg-white border border-slate-100 border-dashed border-red-200 rounded-3xl p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-red-500 mb-3 animate-bounce" />
          <h3 className="text-md font-bold text-slate-800">Database Connection Refused</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1">{error?.message || 'Failed to query Supabase reports logs.'}</p>
          <Button onClick={refetch} variant="outline" className="mt-4 text-xs font-bold">
            Retry Connection
          </Button>
        </div>
      ) : patients.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] bg-white border border-slate-100 border-dashed border-slate-200 rounded-3xl p-8 text-center">
          <Activity className="h-10 w-10 text-slate-300 mb-3 animate-pulse" />
          <h3 className="text-md font-bold text-slate-700">No Patient Files Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1">No historical diagnostic evaluations match the filters. Run a baseline health assessment to register patients.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patients.map((patient) => (
            <div 
              key={patient.id}
              onClick={() => navigate(`/patient-records/${patient.id}`)}
              className="bg-white border border-slate-200/70 hover:border-teal-500/40 rounded-3xl p-5 shadow-sm hover:shadow-premium cursor-pointer transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Header Profile Details */}
                <div className="flex justify-between items-start border-b border-slate-50 pb-3 mb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-sm shadow-inner group-hover:bg-teal-500 group-hover:text-white transition-all">
                      {patient.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 group-hover:text-teal-600 transition-colors">{patient.name}</h3>
                      <span className="text-[10px] text-slate-400 font-medium">ID: {patient.id.substring(0, 12)}...</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 group-hover:text-teal-500 transition-all mt-1" />
                </div>

                {/* Patient Vitals metrics */}
                <div className="grid grid-cols-2 gap-y-2.5 gap-x-2 text-xs font-semibold text-slate-500">
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase font-bold">Demographics</span>
                    <span className="text-slate-700 mt-0.5 block">{patient.gender}, {patient.age} Yrs</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase font-bold">Location</span>
                    <span className="text-slate-700 mt-0.5 block flex items-center gap-0.5">
                      <MapPin size={10} className="text-slate-400 shrink-0" />
                      <span className="truncate max-w-[90px]">{patient.city}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase font-bold">Health Score</span>
                    <span className="text-slate-800 font-bold block">{patient.latestScore} Index</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase font-bold">Risk Assessment</span>
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold border mt-0.5 ${getRiskColor(patient.latestRisk)}`}>
                      {patient.latestRisk}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reports status footer */}
              <div className="mt-5 pt-3.5 border-t border-slate-50 flex justify-between items-center text-[10px] font-bold text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar size={12} className="text-slate-300" />
                  Last Scan: {new Date(patient.latestReportDate).toLocaleDateString()}
                </span>
                <span className="bg-slate-50 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-100">
                  {patient.reportCount} {patient.reportCount === 1 ? 'Report' : 'Reports'}
                </span>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default PatientRecordsPage;
