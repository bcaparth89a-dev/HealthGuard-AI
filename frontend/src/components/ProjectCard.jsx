import React from 'react';
import { motion } from 'framer-motion';
import { Code } from 'lucide-react';

export const ProjectCard = ({ name, description, tech }) => {
  return (
    <motion.div
      whileHover={{ y: -4, shadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)" }}
      className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-5 flex flex-col justify-between h-full transition-all"
    >
      <div>
        <div className="flex items-center gap-2 mb-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-400">
            <Code size={14} />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {name}
          </h4>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>

      {tech && tech.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          {tech.map((t, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-350"
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default ProjectCard;
