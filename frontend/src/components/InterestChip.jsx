import React from 'react';
import { motion } from 'framer-motion';

export const InterestChip = ({ interest }) => {
  return (
    <motion.span
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 border border-slate-200/60 dark:border-slate-700/60 shadow-sm transition-colors hover:bg-slate-200 dark:hover:bg-slate-750"
    >
      <span>🎯</span>
      <span>{interest}</span>
    </motion.span>
  );
};

export default InterestChip;
