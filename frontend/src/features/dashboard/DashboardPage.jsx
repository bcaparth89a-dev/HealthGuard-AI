import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { 
  Activity, 
  FileText, 
  Heart, 
  ShieldAlert, 
  AlertTriangle,
  RotateCw
} from 'lucide-react';
import healthService from '../../services/healthService';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export const DashboardPage = () => {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: healthService.getDashboardSummary,
  });

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-64 bg-slate-200 rounded-lg" />
        
        {/* Grid Skeletons */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl" />
          ))}
        </div>

        {/* Chart Skeleton */}
        <div className="h-96 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-premium">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500 mb-4">
          <AlertTriangle size={24} />
        </div>
        <h3 className="text-md font-bold text-slate-800">Failed to load dashboard data</h3>
        <p className="mt-1 text-sm text-slate-500 max-w-sm">
          {error?.message || 'We encountered an error connecting to the health api service.'}
        </p>
        <Button onClick={refetch} variant="outline" className="mt-4 gap-2">
          <RotateCw size={16} />
          Retry Connection
        </Button>
      </div>
    );
  }

  // Handle case where API response contains no data elements (Empty state)
  const hasNoData = !data || Object.keys(data).length === 0;

  if (hasNoData) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-premium">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-4">
          <Activity size={24} />
        </div>
        <h3 className="text-md font-bold text-slate-800">No Patient Activity Recorded</h3>
        <p className="mt-1 text-sm text-slate-500 max-w-sm">
          Welcome to HealthGuard AI! Start logging symptoms or uploading medical records to build your health profile.
        </p>
      </div>
    );
  }

  // Destructure real parameters from API payload
  const { metrics, trends, alerts } = data;

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Patient Dashboard</h1>
        <p className="text-sm text-slate-500">Real-time biometrics evaluation and AI threat modeling reports.</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card animate>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cardiovascular Risk</p>
              <h4 className="mt-2 text-2xl font-bold text-slate-800">{metrics.cardioRisk}%</h4>
            </div>
            <div className="p-3 bg-rose-50 text-rose-500 rounded-xl">
              <Heart size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs">
            <span className={`font-semibold ${metrics.riskTrend === 'up' ? 'text-red-500' : 'text-emerald-500'}`}>
              {metrics.riskTrend === 'up' ? '↑' : '↓'} {metrics.riskDelta}%
            </span>
            <span className="text-slate-400 ml-2">since last examination</span>
          </div>
        </Card>

        <Card animate>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Alert Level</p>
              <h4 className="mt-2 text-2xl font-bold text-slate-800">{metrics.alertStatus}</h4>
            </div>
            <div className={`p-3 rounded-xl ${metrics.alertStatus === 'Critical' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'}`}>
              <ShieldAlert size={20} />
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-400">
            Based on current vitals & diagnostic records
          </div>
        </Card>

        <Card animate>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Logged Symptoms</p>
              <h4 className="mt-2 text-2xl font-bold text-slate-800">{metrics.symptomCount}</h4>
            </div>
            <div className="p-3 bg-brand-50 text-brand-500 rounded-xl">
              <Activity size={20} />
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-400">
            Last logged: {metrics.lastSymptomDate}
          </div>
        </Card>

        <Card animate>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Clinical Documents</p>
              <h4 className="mt-2 text-2xl font-bold text-slate-800">{metrics.recordCount}</h4>
            </div>
            <div className="p-3 bg-accent-50 text-accent-500 rounded-xl">
              <FileText size={20} />
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-400">
            Fully digitized files
          </div>
        </Card>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Health Indicator Timeline</CardTitle>
            <p className="text-xs text-slate-400">Biometric trend aggregation and risk indexing</p>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRisk)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Anomalies Matrix</CardTitle>
            <p className="text-xs text-slate-400">Critical trigger occurrences count</p>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={alerts.distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="category" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Diagnostic Triggers</CardTitle>
          <p className="text-xs text-slate-400">Vitals and clinical records scanned for anomaly patterns.</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="pb-3 font-semibold">Incident</th>
                  <th className="pb-3 font-semibold">Severity</th>
                  <th className="pb-3 font-semibold">Timestamp</th>
                  <th className="pb-3 font-semibold">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium">
                {alerts.list.map((alert, index) => (
                  <tr key={index} className="hover:bg-slate-50/50">
                    <td className="py-3.5 text-slate-800">{alert.message}</td>
                    <td className="py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        alert.severity === 'Critical' 
                          ? 'bg-red-50 text-red-700' 
                          : alert.severity === 'Warning'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-400 text-xs">{alert.timestamp}</td>
                    <td className="py-3.5 text-slate-500 text-xs">{alert.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
