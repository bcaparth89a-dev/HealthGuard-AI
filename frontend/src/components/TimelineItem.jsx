import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase } from 'lucide-react';

export const TimelineItem = ({ role, company, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative pl-8 pb-8 last:pb-0"
    >
      {/* Connector Line */}
      <div className="absolute left-[11px] top-2 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-750 group-last:hidden" />
      
      {/* Icon Circle */}
      <div className="absolute left-0 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white shadow-sm ring-4 ring-white dark:ring-slate-900">
        <Briefcase size={12} />
      </div>

      {/* Content Card */}
      <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4.5 hover:shadow-md transition-all">
        <span className="text-[10px] uppercase tracking-wider font-extrabold text-brand-600 dark:text-brand-400">
          {role}
        </span>
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-205 mt-0.5">
          {company}
        </h4>
      </div>
    </motion.div>
  );
};

export default TimelineItem;
