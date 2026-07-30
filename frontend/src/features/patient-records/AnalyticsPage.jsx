import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Users, FileText, ChevronRight, Activity } from 'lucide-react';
import healthService from '../../services/healthService';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

export const AnalyticsPage = () => {
  const navigate = useNavigate();

  const { data: familyMembers = [] } = useQuery({
    queryKey: ['familyMembers'],
    queryFn: healthService.getFamilyMembers,
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 flex items-center gap-2">
          <TrendingUp className="text-teal-600" size={26} />
          Family EMR Health Analytics
        </h1>
        <p className="text-sm text-slate-500">Cross-patient biometric trending and clinical indexes timeline.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Patient to View Chronological Trends</CardTitle>
          <p className="text-xs text-slate-400">Detailed health scoring, BP systolic values, blood sugars, and organ threat matrices are computed on individual profiles.</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {familyMembers.length === 0 ? (
              <div className="col-span-2 text-center py-8 text-xs font-bold text-slate-400">
                No family members found. Add profiles on the Dashboard to track medical history trends.
              </div>
            ) : (
              familyMembers.map((member) => (
                <div
                  key={member.member_id}
                  onClick={() => navigate(`/family-members/${member.member_id}`)}
                  className="p-4 border border-slate-200 hover:border-teal-500/40 rounded-2xl flex justify-between items-center cursor-pointer hover:shadow-premium transition-all group bg-white"
                >
                  <div className="flex items-center gap-3">
                    {member.photo ? (
                      <img src={member.photo} alt={member.full_name} className="h-10 w-10 rounded-full object-cover border border-slate-100 shadow-inner" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-sm shadow-inner group-hover:bg-teal-500 group-hover:text-white transition-colors">
                        {member.full_name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 group-hover:text-teal-600 transition-colors">{member.full_name}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">{member.relationship} • {member.age} yrs • {member.gender}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 group-hover:text-teal-500 transition-all" />
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsPage;
