import React from 'react';
import { motion } from 'motion/react';
import { Gift, Archive, Star, Award, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

enum AppMode {
  IDLE = 'IDLE',
  AUTISM = 'AUTISM',
  ADHD = 'ADHD',
  AUDHD = 'AUDHD'
}

interface RewardChoiceModalProps {
  mode: AppMode;
  reward: { type: string; value: string | number };
  onOpenNow: () => void;
  onSaveLater: () => void;
  starsCollectedToday: number;
  reducedMotion?: boolean;
}

export default function RewardChoiceModal({ mode, reward, onOpenNow, onSaveLater, starsCollectedToday, reducedMotion = false }: RewardChoiceModalProps) {
  const isADHD = mode === AppMode.ADHD;
  const isAutism = mode === AppMode.AUTISM;
  const isAuDHD = mode === AppMode.AUDHD;

  const targetStars = isAutism ? 5 : 3;
  const progress = (starsCollectedToday / targetStars) * 100;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6"
    >
      <motion.div 
        initial={reducedMotion ? { opacity: 0 } : { scale: 0.8, y: 50 }}
        animate={reducedMotion ? { opacity: 1 } : { scale: 1, y: 0 }}
        className="bg-white rounded-[56px] overflow-hidden max-w-2xl w-full shadow-2xl flex flex-col items-center"
      >
        {/* Header/Reward Icon */}
        <div className="w-full bg-theme/5 p-12 flex flex-col items-center gap-6 border-b border-theme/10">
          <div className="w-32 h-32 bg-theme rounded-full flex items-center justify-center shadow-xl">
             {reward.type === 'star' ? <Star size={64} className="text-white fill-white" /> : <Award size={64} className="text-white" />}
          </div>
          <h2 className="text-4xl font-display font-black text-theme text-center">
            {reward.type === 'star' ? `${reward.value} Cosmic Stars!` : `New Badge: ${reward.value}`}
          </h2>
        </div>

        {/* Choices */}
        <div className="p-10 w-full flex flex-col md:flex-row gap-6">
          <button 
            onClick={onOpenNow}
            className={cn(
              "flex-1 group bg-active-primary text-white p-8 rounded-[40px] flex flex-col items-center gap-4 shadow-xl border-b-[8px] border-active-shadow active:border-b-0 active:translate-y-2 transition-all",
              !reducedMotion && "hover:scale-105"
            )}
          >
             <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform">
                <Gift size={32} />
             </div>
             <span className="text-2xl font-black uppercase tracking-tight">Open Now</span>
             <p className="text-white/60 text-sm font-bold">See your treasure instantly!</p>
          </button>

          <button 
            onClick={onSaveLater}
            className="flex-1 group bg-slate-100 text-slate-400 p-8 rounded-[40px] flex flex-col items-center gap-4 border-2 border-slate-200 hover:bg-slate-200 hover:text-slate-600 transition-all"
          >
             <div className="w-16 h-16 bg-slate-300/20 rounded-full flex items-center justify-center">
                <Archive size={32} />
             </div>
             <span className="text-2xl font-black uppercase tracking-tight">Save for Later</span>
             <p className="text-slate-400/60 text-sm font-bold">Add to your vault</p>
          </button>
        </div>

        {/* Mode-Specific Status */}
        <div className="w-full bg-slate-50 p-8 flex flex-col items-center border-t border-slate-200">
          {isADHD ? (
            <div className="w-full max-w-md">
              <div className="flex justify-between items-end mb-2">
                 <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Next Mega Reward</span>
                 <span className="text-lg font-black text-slate-900">{starsCollectedToday}/3 ⭐</span>
              </div>
              <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${Math.min(100, progress)}%` }}
                   transition={reducedMotion ? { duration: 0 } : {}}
                   className="h-full bg-gradient-to-r from-yellow-400 to-orange-400"
                 />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-6 bg-white px-8 py-4 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex -space-x-2">
                   {[...Array(targetStars)].map((_, i) => (
                     <div 
                       key={i} 
                       className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center ${i < starsCollectedToday ? 'bg-yellow-400 text-white' : 'bg-slate-100 text-slate-300'}`}
                     >
                       <Star size={14} fill={i < starsCollectedToday ? "currentColor" : "none"} />
                     </div>
                   ))}
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <span className="text-xl font-black text-slate-600">
                  {starsCollectedToday} / {targetStars} Stars Collected
                </span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
