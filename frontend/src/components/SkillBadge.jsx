import React from 'react';
import { motion } from 'framer-motion';

export const SkillBadge = ({ skill }) => {
  return (
    <motion.span
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-50/50 dark:bg-brand-950/20 text-brand-700 dark:text-brand-350 border border-brand-100 dark:border-brand-900/50 shadow-sm cursor-default"
    >
      {skill}
    </motion.span>
  );
};

export default SkillBadge;
