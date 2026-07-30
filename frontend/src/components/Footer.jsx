import React, { useState } from 'react';
import { motion } from 'framer-motion';
import TeamModal from './TeamModal';

export const Footer = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <footer className="w-full py-6 mt-auto flex items-center justify-center shrink-0 border-t border-slate-150/40 dark:border-slate-800/40 bg-white/20 dark:bg-slate-900/10 backdrop-blur-sm">
      <motion.div
        whileHover={{ scale: 1.03, textShadow: "0 0 8px rgba(13, 148, 136, 0.2)" }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsModalOpen(true)}
        className="cursor-pointer text-xs font-bold text-slate-500 dark:text-slate-400 select-none flex items-center gap-1 hover:text-brand-600 dark:hover:text-brand-400 transition-colors duration-300"
      >
        <span>Made with</span>
        <motion.span
          animate={{ scale: [1, 1.25, 1] }}
          transition={{
            duration: 1.0,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          }}
          className="inline-block text-rose-500 mx-0.5"
        >
          ❤️
        </motion.span>
        <span>by Team</span>
      </motion.div>

      {/* Team Modal Popup */}
      <TeamModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </footer>
  );
};

export default Footer;
