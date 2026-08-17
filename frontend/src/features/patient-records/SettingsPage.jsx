import React from 'react';
import { Settings, ShieldAlert, BadgeCheck, FileText, Database } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import SEO from '../../components/common/SEO';

export const SettingsPage = () => {
  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <SEO title="Settings | HealthGuard AI" robots="noindex,nofollow" />
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Settings className="text-brand-500 dark:text-accent-500" size={26} />
          Hospital EMR Configurations Settings
        </h1>
        <p className="text-sm text-slate-505 dark:text-slate-400 mt-1">Configure clinic database integrations, security keys, and automated triggers.</p>
      </div>

      <Card className="border border-slate-200/50 dark:border-slate-800/80 shadow-premium">
        <CardHeader>
          <CardTitle>Clinical Integrations Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <div className="flex justify-between items-center p-3.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-xl">
            <span className="flex items-center gap-2">
              <Database size={16} /> PostgreSQL Supabase Database
            </span>
            <span className="flex items-center gap-1 font-bold">
              <BadgeCheck size={14} /> ACTIVE (SERVICE ROLE)
            </span>
          </div>

          <div className="flex justify-between items-center p-3.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-xl">
            <span className="flex items-center gap-2">
              <FileText size={16} /> Gemini LLM Report Generator Model
            </span>
            <span className="flex items-center gap-1 font-bold">
              <BadgeCheck size={14} /> ACTIVE (GEMINI-2.5-FLASH)
            </span>
          </div>

          <div className="flex justify-between items-center p-3.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-xl">
            <span className="flex items-center gap-2">
              <ShieldAlert size={16} /> FastAPI AllPrediction ML Engine
            </span>
            <span className="flex items-center gap-1 font-bold">
              <BadgeCheck size={14} /> ACTIVE (PORT 8000)
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
