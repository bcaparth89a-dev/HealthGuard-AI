import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  FileText, 
  Heart, 
  ShieldAlert, 
  AlertTriangle,
  RotateCw,
  User,
  Users,
  Plus,
  Calendar,
  Phone,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  MapPin,
  Clock,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  BarChart,
  Bar
} from 'recharts';
import healthService from '../../services/healthService';
import useAuth from '../../hooks/useAuth';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';

// Avatar Presets list for EMR family members
const AVATAR_PRESETS = [
  { name: 'Physician / Professional', url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=150' },
  { name: 'Female Profile 1', url: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=150' },
  { name: 'Male Profile 1', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150' },
  { name: 'Female Profile 2', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150' },
  { name: 'Male Profile 2', url: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&q=80&w=150' },
  { name: 'Elderly Profile', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150' }
];

export const DashboardPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0].url);

  // Form states for family member adding
  const [fullName, setFullName] = useState('');
  const [relationship, setRelationship] = useState('Spouse');
  const [gender, setGender] = useState('Male');
  const [dob, setDob] = useState('');
  const [age, setAge] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  // Fetch family members list
  const { data: familyMembers = [], isLoading: isMembersLoading } = useQuery({
    queryKey: ['familyMembersList'],
    queryFn: healthService.getFamilyMembers,
  });

  // Fetch reports list to display latest scores on cards
  const { data: reports = [] } = useQuery({
    queryKey: ['allReportsForCards'],
    queryFn: () => healthService.getAllReports(),
  });

  // Fetch EMR statistics and graphs for EMR Control Panel
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: healthService.getDashboardSummary,
  });

  // Add Family Member Mutation
  const addMemberMutation = useMutation({
    mutationFn: healthService.addFamilyMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familyMembersList'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      setIsAddModalOpen(false);
      resetForm();
      alert('Family Member added successfully to EMR directory!');
    },
    onError: (err) => {
      alert('Failed to add family member: ' + err.message);
    }
  });

  const resetForm = () => {
    setFullName('');
    setRelationship('Spouse');
    setGender('Male');
    setDob('');
    setAge('');
    setBloodGroup('O+');
    setHeight('');
    setWeight('');
    setPhone('');
    setEmergencyContact('');
    setSelectedAvatar(AVATAR_PRESETS[0].url);
  };

  const handleAddMemberSubmit = (e) => {
    e.preventDefault();
    if (!fullName) return alert('Name is required.');

    addMemberMutation.mutate({
      full_name: fullName,
      gender,
      age: parseInt(age, 10) || 30,
      dob: dob || null,
      blood_group: bloodGroup,
      relationship,
      phone: phone || null,
      photo: selectedAvatar,
      height: height ? parseFloat(height) : null,
      weight: weight ? parseFloat(weight) : null,
      emergency_contact: emergencyContact || null
    });
  };

  const getRiskColor = (risk) => {
    if (risk === 'Low' || risk === 'Normal') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (risk === 'Moderate') return 'bg-amber-50 text-amber-700 border-amber-100';
    return 'bg-rose-50 text-rose-700 border-rose-100';
  };

  // Compile statistics
  const emrStats = data?.emrStats ?? {
    totalFamilyMembers: 0,
    totalReports: 0,
    todayReports: 0,
    highRiskMembers: 0,
    recentReports: [],
    recentAssessments: [],
    upcomingFollowUps: [],
    latestAiRecommendations: null
  };

  // Compile members stats for display
  const compiledMembers = familyMembers.map(m => {
    // Find latest report for this member
    const memberReports = reports.filter(r => r.member_id === m.member_id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const latestReport = memberReports[0];

    return {
      ...m,
      latestScore: latestReport ? (latestReport.health_score || latestReport.overall_health_score || 0) : 'N/A',
      latestRisk: latestReport ? (latestReport.overall_risk || 'Low') : 'N/A',
      lastAssessmentDate: latestReport ? new Date(latestReport.created_at).toLocaleDateString() : 'No scan yet'
    };
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto transition-colors duration-200">
      
      {/* Welcome Greeting Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Users className="text-teal-600 dark:text-teal-400 animate-pulse" size={26} />
            Welcome, {user?.name || 'User'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Family Electronic Medical Record (EMR) System. isolated histories, automated diagnostics.</p>
        </div>
        <Button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-teal-600 hover:bg-teal-700 text-xs font-bold gap-1.5 py-2.5 rounded-xl shadow-sm"
        >
          <Plus size={16} /> Add Family Member
        </Button>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Total Family Members */}
        <Card animate>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400">Total Family Members</p>
              <h4 className="mt-2 text-2xl font-extrabold text-slate-800 dark:text-slate-100">{emrStats.totalFamilyMembers}</h4>
            </div>
            <div className="p-2.5 bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-405 rounded-xl">
              <Users size={18} />
            </div>
          </div>
        </Card>

        {/* Total EMR Files */}
        <Card animate>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400">Total Reports</p>
              <h4 className="mt-2 text-2xl font-extrabold text-slate-800 dark:text-slate-100">{emrStats.totalReports}</h4>
            </div>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-405 rounded-xl">
              <FileText size={18} />
            </div>
          </div>
        </Card>

        {/* High Risk Members */}
        <Card animate>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400">High Risk Alerts</p>
              <h4 className="mt-2 text-2xl font-extrabold text-rose-600 dark:text-rose-550">{emrStats.highRiskMembers}</h4>
            </div>
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 text-rose-500 dark:text-rose-405 rounded-xl">
              <ShieldAlert size={18} />
            </div>
          </div>
        </Card>

        {/* Today's Evaluations */}
        <Card animate>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400">Today's Reports</p>
              <h4 className="mt-2 text-2xl font-extrabold text-slate-800 dark:text-slate-100">{emrStats.todayReports}</h4>
            </div>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-405 rounded-xl">
              <Activity size={18} />
            </div>
          </div>
        </Card>

      </div>

      {/* Family Directory grid section */}
      <div>
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-5">
          <h3 className="text-md font-bold text-slate-800 dark:text-slate-100">Family Members Directories</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Select a card to view their patient profile and diagnostics trends history.</p>
        </div>

        {isMembersLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[200px] bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/50 p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-slate-100 dark:border-slate-700 border-t-teal-600 mb-3" />
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Pulling EMR profiles...</p>
          </div>
        ) : compiledMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[200px] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 border-dashed rounded-3xl p-8 text-center">
            <Users className="h-10 w-10 text-slate-300 dark:text-slate-650 mb-3 animate-pulse" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Family Profiles Registered</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mt-1 mb-4">You have not registered any family members under your EMR dashboard directory.</p>
            <Button onClick={() => setIsAddModalOpen(true)} className="bg-teal-600 hover:bg-teal-700 text-xs font-bold">
              Add First Family Member
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {compiledMembers.map((member) => (
              <div 
                key={member.member_id}
                className="bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/60 hover:border-teal-500/40 dark:hover:border-teal-500/40 rounded-3xl p-5 shadow-sm hover:shadow-premium transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Demographics details */}
                  <div className="flex justify-between items-start border-b border-slate-50 dark:border-slate-700/50 pb-3 mb-4">
                    <div className="flex items-center gap-3">
                      {member.photo ? (
                        <img 
                          src={member.photo} 
                          alt={member.full_name} 
                          className="h-12 w-12 rounded-full object-cover border border-slate-100 dark:border-slate-700 shadow-inner"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-extrabold text-sm shadow-inner group-hover:bg-teal-500 group-hover:text-white transition-colors">
                          {member.full_name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors leading-tight">{member.full_name}</h4>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase mt-0.5 inline-block bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-700/40">
                          {member.relationship}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <div>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 block uppercase font-bold">Demographics</span>
                      <span className="text-slate-800 dark:text-slate-200 block">{member.gender}, {member.age} yrs</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 block uppercase font-bold">Blood Group</span>
                      <span className="text-slate-800 dark:text-slate-200 block">{member.blood_group || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 block uppercase font-bold">Latest Score</span>
                      <span className="text-slate-900 dark:text-slate-100 font-extrabold block">{member.latestScore}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 block uppercase font-bold">Latest Risk</span>
                      {member.latestRisk !== 'N/A' ? (
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-extrabold border mt-0.5 ${getRiskColor(member.latestRisk)} dark:bg-slate-900/60`}>
                          {member.latestRisk}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 font-medium block">N/A</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Patient cards action controls */}
                <div className="mt-6 pt-4 border-t border-slate-50 dark:border-slate-700/50">
                  <div className="grid grid-cols-3 gap-2">
                    <Button 
                      onClick={() => navigate(`/family-members/${member.member_id}`)}
                      variant="outline" 
                      className="text-[9px] font-extrabold py-2 px-1 border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl"
                    >
                      Open Profile
                    </Button>
                    <Button 
                      onClick={() => navigate(`/assessment?memberId=${member.member_id}`)}
                      className="bg-teal-600 hover:bg-teal-700 text-[9px] font-extrabold py-2 px-1 rounded-xl"
                    >
                      New Assess
                    </Button>
                    <Button 
                      onClick={() => navigate(`/reports?memberId=${member.member_id}`)}
                      variant="outline" 
                      className="text-[9px] font-extrabold py-2 px-1 border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl"
                    >
                      View Reports
                    </Button>
                  </div>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold text-center mt-3 flex items-center justify-center gap-1">
                    <Clock size={10} /> Last Assessment: {member.lastAssessmentDate}
                  </p>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* EMR Reports and Followups splits section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Recent EMR Reports */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Patient EMR Reports</CardTitle>
            <p className="text-xs text-slate-400 dark:text-slate-500">Newly archived health assessments and diagnostics records.</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold text-slate-650 dark:text-slate-350">
                <thead className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-550 border-b border-slate-100 dark:border-slate-700">
                  <tr>
                    <th className="pb-3">Report ID</th>
                    <th className="pb-3">Patient Name</th>
                    <th className="pb-3">Relationship</th>
                    <th className="pb-3">Risk Category</th>
                    <th className="pb-3">Index Score</th>
                    <th className="pb-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/40">
                  {emrStats.recentReports.map((report, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 text-slate-900 dark:text-slate-100 font-bold select-all">{report.id}</td>
                      <td className="py-3 text-slate-800 dark:text-slate-200 font-bold">{report.patientName}</td>
                      <td className="py-3 text-slate-400 dark:text-slate-500">{report.relationship}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold border ${
                          report.overallRisk === 'High' ? 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50' :
                          report.overallRisk === 'Moderate' ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50' :
                          'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50'
                        }`}>
                          {report.overallRisk}
                        </span>
                      </td>
                      <td className="py-3 text-slate-700 dark:text-slate-300 font-bold">{report.healthScore}</td>
                      <td className="py-3 text-slate-400 dark:text-slate-550 text-[10px]">{report.date} {report.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Followups */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Clinical Follow-ups</CardTitle>
            <p className="text-xs text-slate-400 dark:text-slate-500">Automated scheduling suggestions based on warning indicators.</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {emrStats.upcomingFollowUps.map((followUp, idx) => (
                <div key={idx} className="flex justify-between items-start border-b border-slate-50 dark:border-slate-700/50 pb-3 last:border-none last:pb-0">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">{followUp.patientName}</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">{followUp.activity} ({followUp.relationship})</p>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold block mt-1">{followUp.date}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold ${
                    followUp.status === 'High Priority' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                  }`}>
                    {followUp.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Latest AI Recommendations Column */}
      {emrStats.latestAiRecommendations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <Sparkles size={16} className="text-teal-600 dark:text-teal-400 animate-bounce" />
              Latest Physician EMR Recommendations ({emrStats.latestAiRecommendations.patientName})
            </CardTitle>
            <p className="text-xs text-slate-400 dark:text-slate-500">GenAI clinical synthesis derived from latest diagnostics records.</p>
          </CardHeader>
          <CardContent className="space-y-4 text-xs font-semibold text-slate-650 dark:text-slate-350">
            <div>
              <p className="text-slate-800 dark:text-slate-100 font-bold">Summary Review:</p>
              <p className="mt-1 font-medium bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-700">{emrStats.latestAiRecommendations.summary}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div>
                <p className="text-teal-700 dark:text-teal-400 font-bold border-b border-slate-100 dark:border-slate-700 pb-1">Diet modifications</p>
                <ul className="list-disc list-inside mt-2 space-y-1 font-medium">
                  {emrStats.latestAiRecommendations.diet.slice(0, 3).map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              </div>
              <div>
                <p className="text-indigo-700 dark:text-indigo-400 font-bold border-b border-slate-100 dark:border-slate-700 pb-1">Physical guidelines</p>
                <ul className="list-disc list-inside mt-2 space-y-1 font-medium">
                  {emrStats.latestAiRecommendations.exercise.slice(0, 3).map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
              <div>
                <p className="text-amber-700 dark:text-amber-400 font-bold border-b border-slate-100 dark:border-slate-700 pb-1">Precautions checklist</p>
                <ul className="list-disc list-inside mt-2 space-y-1 font-medium">
                  {emrStats.latestAiRecommendations.precautions.slice(0, 3).map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ADD FAMILY MEMBER MODAL DIALOG SLIDE */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-center items-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg shadow-premium border border-slate-100 dark:border-slate-700/60 overflow-hidden"
            >
              <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700/60 px-6 py-4 flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Plus size={16} className="text-teal-600 dark:text-teal-400" />
                  Add Family Member Profile
                </h3>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleAddMemberSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                
                {/* Name & Relationship */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Full Name *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Umesh Shah"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Relationship *</label>
                    <select
                      value={relationship}
                      onChange={(e) => setRelationship(e.target.value)}
                      className="px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-500"
                    >
                      <option value="Self">Self (Account Owner)</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Brother">Brother</option>
                      <option value="Sister">Sister</option>
                      <option value="Son">Son</option>
                      <option value="Daughter">Daughter</option>
                    </select>
                  </div>
                </div>

                {/* Gender & DOB */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Gender *</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Date of Birth</label>
                    <input 
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Age *</label>
                    <input 
                      type="number"
                      required
                      placeholder="e.g. 52"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                {/* Demographics Height/Weight/Blood */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Blood Group</label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none"
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Height (cm)</label>
                    <input 
                      type="number"
                      placeholder="e.g. 175"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Weight (kg)</label>
                    <input 
                      type="number"
                      placeholder="e.g. 70"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                {/* Contact numbers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Phone Number</label>
                    <input 
                      type="text"
                      placeholder="e.g. +12345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Emergency Contact</label>
                    <input 
                      type="text"
                      placeholder="e.g. Spouse Name - +987654"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      className="px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                {/* Photo selection presets */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Select Avatar Style</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {AVATAR_PRESETS.map((preset, idx) => (
                      <div 
                        key={idx}
                        onClick={() => setSelectedAvatar(preset.url)}
                        className={`h-11 w-11 rounded-full overflow-hidden cursor-pointer border-2 transition-all shadow-sm ${
                          selectedAvatar === preset.url ? 'border-teal-500 scale-105' : 'border-transparent'
                        }`}
                        title={preset.name}
                      >
                        <img src={preset.url} alt="preset" className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form submit button */}
                <Button 
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-700 text-xs font-bold py-3 mt-4 rounded-xl shadow-sm"
                  disabled={addMemberMutation.isPending}
                >
                  {addMemberMutation.isPending ? 'Registering...' : 'Register Family Member'}
                </Button>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default DashboardPage;
