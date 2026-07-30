import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X } from 'lucide-react';

export const TeamCard = ({ member, onClick }) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Close preview on ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsPreviewOpen(false);
    };
    if (isPreviewOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isPreviewOpen]);

  const handleImageClick = (e) => {
    e.stopPropagation(); // Prevent the parent card click navigation
    setIsPreviewOpen(true);
  };

  return (
    <>
      <motion.div
        whileHover={{ y: -6, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="group relative cursor-pointer overflow-hidden rounded-[24px] bg-slate-50 dark:bg-slate-800/40 border border-slate-150/60 dark:border-slate-800/70 p-8 flex flex-col items-center justify-between hover:border-brand-500/50 dark:hover:border-brand-500/40 transition-all duration-300 min-h-[480px] shadow-sm text-center"
      >
        {/* Hover Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Content Wrapper */}
        <div className="flex flex-col items-center flex-grow w-full">
          
          {/* Circular Profile Image (Clickable for zoom viewer) */}
          <div className="relative group/img mb-6">
            {/* Pulsating Gradient border ring */}
            <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-teal-400 via-brand-500 to-indigo-500 opacity-60 blur-sm group-hover/img:opacity-100 group-hover/img:scale-105 transition-all duration-300" />
            <div 
              onClick={handleImageClick}
              role="button"
              aria-label={`Preview photo of ${member.name}`}
              className="relative h-[100px] w-[100px] sm:h-[120px] sm:w-[120px] md:h-[140px] md:w-[140px] rounded-full overflow-hidden border-4 border-white dark:border-slate-900 shadow-md cursor-zoom-in"
            >
              <img
                src={member.image}
                alt={member.name}
                loading="lazy"
                className="h-full w-full object-cover group-hover/img:scale-108 transition-transform duration-300"
              />
            </div>
          </div>

          {/* Badge */}
          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-350 border border-brand-100/50 dark:border-brand-900/30 uppercase tracking-widest mb-3 select-none">
            {member.badge}
          </span>

          {/* Name */}
          <h3 className="text-md md:text-lg font-extrabold text-slate-800 dark:text-slate-100 tracking-tight mb-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            {member.name}
          </h3>

          {/* Role */}
          <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mb-5 leading-none">
            {member.role}
          </p>

          <hr className="w-full border-slate-150/60 dark:border-slate-800/80 mb-5" />

          {/* Contribution Statement */}
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-5 flex-grow">
            {member.contribution}
          </p>

          <hr className="w-full border-slate-150/60 dark:border-slate-800/80 mb-5" />
        </div>

        {/* View Profile Action Link */}
        <div className="w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors shrink-0 select-none">
          <span>View Full Profile</span>
          <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </div>
      </motion.div>

      {createPortal(
        <AnimatePresence>
          {isPreviewOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              
              {/* Backdrop Dark Mask */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/90 backdrop-blur-md"
                onClick={() => setIsPreviewOpen(false)}
              />

              {/* Close Button */}
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="absolute top-6 right-6 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all z-[110]"
                aria-label="Close image preview"
                title="Close"
              >
                <X size={20} />
              </button>

              {/* Centered Portfolio Image Sheet */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative z-10 flex flex-col items-center max-w-full text-center"
              >
                {/* Perfectly Circular Large Zoomed Profile image */}
                <div className="h-[285px] w-[285px] sm:h-[360px] sm:w-[360px] md:h-[500px] md:w-[500px] rounded-full overflow-hidden border-4 border-white/20 dark:border-slate-800/40 shadow-2xl mb-6 aspect-square shrink-0">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="h-full w-full object-cover select-none pointer-events-none"
                  />
                </div>

                {/* Developer Details */}
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  {member.name}
                </h2>
                <p className="text-xs text-slate-400 font-semibold mt-1">
                  {member.role}
                </p>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default TeamCard;
