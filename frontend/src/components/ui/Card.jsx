import React from 'react';
import { motion } from 'framer-motion';

export const Card = ({
  children,
  className = '',
  animate = false,
  onClick,
  ...props
}) => {
  const baseStyles = 'bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-premium p-6 overflow-hidden transition-colors duration-200';
  
  if (animate) {
    return (
      <motion.div
        whileHover={{ y: -4, boxShadow: '0 12px 30px -4px rgba(16, 185, 129, 0.12), 0 4px 16px -2px rgba(0, 0, 0, 0.04)' }}
        transition={{ duration: 0.2 }}
        onClick={onClick}
        className={`${baseStyles} ${onClick ? 'cursor-pointer' : ''} ${className}`}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className={`${baseStyles} ${onClick ? 'cursor-pointer hover:border-slate-200 dark:hover:border-slate-600' : ''} ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={`flex flex-col gap-1 pb-4 border-b border-slate-50 dark:border-slate-700/50 mb-4 ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight ${className}`}>
    {children}
  </h3>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={`text-slate-600 dark:text-slate-350 ${className}`}>{children}</div>
);

export default Card;
