import React from 'react';
import { Award } from 'lucide-react';

export const CertificationCard = ({ name }) => {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 rounded-xl p-3.5 flex items-center gap-3 hover:bg-slate-100/50 dark:hover:bg-slate-800/80 transition-colors">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
        <Award size={16} />
      </div>
      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
        {name}
      </span>
    </div>
  );
};

export default CertificationCard;
