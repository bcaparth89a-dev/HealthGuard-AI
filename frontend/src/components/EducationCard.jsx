import React from 'react';
import { BookOpen } from 'lucide-react';

export const EducationCard = ({ degree, institution, gpa, details }) => {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-5 flex gap-4 hover:shadow-sm transition-all">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
        <BookOpen size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
          {degree}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
          {institution}
        </p>
        <div className="flex flex-wrap items-center gap-2.5 mt-2.5">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-750 dark:text-indigo-350">
            {gpa}
          </span>
          {details && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
              {details}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default EducationCard;
