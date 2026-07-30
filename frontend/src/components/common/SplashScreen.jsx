import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ShieldAlert, Heart, Activity } from 'lucide-react';

export const SplashScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    let start = Date.now();
    const duration = 2800; // Total duration ~ 2.8 seconds
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / duration) * 100, 100);
      
      // Introduce step pauses to make EMR validation look real
      let displayPct = pct;
      if (pct > 15 && pct < 35) {
        displayPct = 15 + ((pct - 15) * 0.2); // Slow down at 15%
      } else if (pct > 47 && pct < 65) {
        displayPct = 47 + ((pct - 47) * 0.15); // Slow down at 47%
      } else if (pct > 83 && pct < 95) {
        displayPct = 83 + ((pct - 83) * 0.2); // Slow down at 83%
      }
      
      setProgress(Math.floor(displayPct));
      
      if (elapsed >= duration) {
        clearInterval(interval);
        setProgress(100);
        setTimeout(() => {
          onComplete();
        }, 300); // Small delay to show 100% progress
      }
    }, 30);

    return () => clearInterval(interval);
  }, [onComplete]);

  // Reduced motion variants
  const containerVariants = {
    exit: { opacity: 0, transition: { duration: 0.5 } }
  };

  const logoVariants = shouldReduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 1 } }
      }
    : {
        initial: { opacity: 0, scale: 0.8 },
        animate: {
          opacity: 1,
          scale: 1,
          y: [0, -4, 0],
          transition: {
            opacity: { duration: 0.6 },
            scale: { type: 'spring', stiffness: 100, damping: 10 },
            y: {
              repeat: Infinity,
              duration: 3,
              ease: 'easeInOut'
            }
          }
        }
      };

  const textVariants = {
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 10 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { delay: 0.4, duration: 0.8, ease: 'easeOut' }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      exit="exit"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-tr from-slate-50 via-teal-50/20 to-slate-100 overflow-hidden"
    >
      {/* Background Floating Decorative Blurred Orbs */}
      {!shouldReduceMotion && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-teal-300/10 blur-[100px]"
            animate={{
              x: [0, 40, 0],
              y: [0, 20, 0],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-emerald-300/10 blur-[120px]"
            animate={{
              x: [0, -30, 0],
              y: [0, -40, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      )}

      {/* Main Glassmorphic Display Card */}
      <div className="relative flex flex-col items-center justify-center p-8 sm:p-12 rounded-[32px] border border-white/40 bg-white/30 backdrop-blur-md shadow-premium max-w-sm sm:max-w-md w-[90%] mx-auto text-center">
        
        {/* Animated Circle Ring behind Logo */}
        {!shouldReduceMotion && (
          <motion.div
            className="absolute -z-10 h-28 w-28 rounded-full border border-teal-500/20 bg-teal-500/5 blur-xs"
            animate={{
              scale: [1, 1.25, 1],
              opacity: [0.4, 0.8, 0.4]
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        )}

        {/* DNA / Particles Layer around the Logo */}
        {!shouldReduceMotion && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Soft pulse circles */}
            <motion.div
              className="absolute h-36 w-36 rounded-full border border-emerald-500/10"
              animate={{ scale: [0.8, 1.4], opacity: [0.8, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
            />
            <motion.div
              className="absolute h-36 w-36 rounded-full border border-teal-500/10"
              animate={{ scale: [0.8, 1.4], opacity: [0.8, 0] }}
              transition={{ duration: 2.5, delay: 1.25, repeat: Infinity, ease: 'easeOut' }}
            />
          </div>
        )}

        {/* Central Logo */}
        <motion.div
          variants={logoVariants}
          initial="initial"
          animate="animate"
          className="relative flex h-16 w-16 items-center justify-center rounded-[22px] bg-brand-500 text-white shadow-premium z-10 mb-6"
        >
          <ShieldAlert size={32} />
        </motion.div>

        {/* Application Name & Subtitle */}
        <motion.div
          variants={textVariants}
          initial="initial"
          animate="animate"
          className="space-y-2 mb-8"
        >
          <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
            HealthGuard <span className="text-teal-600">AI</span>
          </h1>
          <p className="text-xs text-slate-500 font-semibold tracking-normal px-2">
            Your Intelligent Family Healthcare Companion
          </p>
        </motion.div>

        {/* Loading Progress Bar & Percentage Indicators */}
        <div className="w-full max-w-[240px] space-y-3">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Activity size={10} className="text-teal-500 animate-pulse" />
              Syncing EMR Index...
            </span>
            <span>{progress}%</span>
          </div>

          {/* Thin Glowing Loader Bar */}
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 shadow-inner">
            <motion.div
              className="h-full bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-500 rounded-full shadow-[0_0_8px_rgba(20,184,166,0.4)]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default SplashScreen;
