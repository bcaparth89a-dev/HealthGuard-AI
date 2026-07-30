import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { teamMembers } from '../data/teamMembers';
import TeamCard from './TeamCard';

export const TeamModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleCardClick = (slug) => {
    onClose();
    navigate(`/team/${slug}`);
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 lg:p-8">
          
          {/* Blur Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] w-[95%] md:w-full md:max-w-[1000px] max-h-[90vh] md:max-h-[85vh] flex flex-col shadow-2xl p-6 md:p-8 z-50 overflow-hidden"
          >
            {/* Background Light effects */}
            <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 h-44 w-44 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 h-44 w-44 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

            {/* Modal Header */}
            <div className="flex justify-between items-start mb-6 md:mb-8 relative z-10 shrink-0">
              <div>
                <h2 className="text-md md:text-lg font-extrabold tracking-tight text-slate-850 dark:text-slate-100 flex items-center gap-1.5 leading-none">
                  🚀 Meet the Team
                </h2>
                <p className="text-xs text-slate-450 dark:text-slate-505 mt-1 font-semibold leading-relaxed">
                  Meet the passionate developers and designers behind this application.
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650 dark:hover:text-slate-350 rounded-xl transition-all"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Grid layout of three cards (Scrollable) */}
            <div className="overflow-y-auto pr-1 flex-1 relative z-10 scrollbar-thin">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 p-1">
                {teamMembers.map((member) => (
                  <TeamCard
                    key={member.id}
                    member={member}
                    onClick={() => handleCardClick(member.slug)}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default TeamModal;
