/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Puzzle, 
  Zap, 
  RefreshCw, 
  Gamepad2, 
  BookOpen, 
  Video, 
  ArrowLeft, 
  Star, 
  Award, 
  Moon, 
  Sun,
  Layout,
  Gift,
  CheckCircle2,
  XCircle,
  Shapes,
  Palette,
  Timer,
  Waves,
  Settings,
  ZapOff,
  Trophy,
  Shield,
  Sparkles,
  CloudRain,
  Archive,
  Eye,
  BarChart3
} from 'lucide-react';
import InfiniteRunnerGame from './games/InfiniteRunner';
import RacingGame from './games/RacingGame';
import RewardArcade from './components/RewardArcade';
import { useDDA } from './hooks/useDDA';
import RewardChoiceModal from './components/RewardChoiceModal';
import { rewardService, UnopenedReward } from './services/rewardService';
import { playCelebrationSound } from './lib/sounds';
import SensoryReport from './components/SensoryReport';
import { cn } from './lib/utils';

// --- Types & Constants ---

enum AppMode {
  IDLE = 'IDLE',
  AUTISM = 'AUTISM',
  ADHD = 'ADHD',
  AUDHD = 'AUDHD'
}

enum SubPage {
  HOME = 'HOME',
  GAMES = 'GAMES',
  STORIES = 'STORIES',
  VIDEOS = 'VIDEOS',
  GAME_DETAIL = 'GAME_DETAIL',
  QUIZ = 'QUIZ',
  ARCADE = 'ARCADE',
  REPORT = 'REPORT'
}

enum StyleState {
  CALM = 'CALM',
  ACTIVE = 'ACTIVE'
}

const YOUTUBE_STORIES = [
  { 
    id: '75NQK-Sm1YY', 
    title: "The Very Hungry Caterpillar", 
    description: "Follow the hungry caterpillar on his journey to become a butterfly after eating a big red apple.", 
    hotwords: ["hungry", "caterpillar", "butterfly", "apple", "red"],
    quizzes: {
      hungry: { q: "What does he do when hungry?", a: ["Eat", "Sleep", "Dance"], c: 0 },
      caterpillar: { q: "What does it become?", a: ["Worm", "Butterfly", "Bird"], c: 1 },
      butterfly: { q: "Do butterflies fly?", a: ["Yes", "No", "Maybe"], c: 0 },
      apple: { q: "Is an apple a fruit?", a: ["Yes", "No"], c: 0 },
      red: { q: "What else is red?", a: ["Strawberry", "Grass", "Sky"], c: 0 }
    }
  },
  { 
    id: 's8sUPpPc8Ws', 
    title: "The Gruffalo", 
    description: "A clever mouse walks through the deep dark wood and meets a scary creature called the Gruffalo.", 
    hotwords: ["mouse", "wood", "gruffalo", "scary", "creature"],
    quizzes: {
      mouse: { q: "Is the mouse big or small?", a: ["Big", "Small"], c: 1 },
      wood: { q: "Where is the mouse walking?", a: ["A beach", "A wood", "A city"], c: 1 },
      gruffalo: { q: "What is a Gruffalo?", a: ["A monster", "A cat", "A dog"], c: 0 },
      scary: { q: "Is the mouse scared of the snake?", a: ["Yes", "No"], c: 1 }
    }
  },
  { 
    id: 'QFORvXhub28', 
    title: "The Rainbow Fish", 
    description: "A beautiful fish with shiny scales lives in the deep blue sea.", 
    hotwords: ["fish", "shiny", "scales", "blue", "sea"],
    quizzes: {
      fish: { q: "Where do fish live?", a: ["Trees", "Water", "Clouds"], c: 1 },
      shiny: { q: "Are his scales shiny?", a: ["Yes", "No"], c: 0 },
      blue: { q: "What else is blue?", a: ["Sun", "Sky", "Fire"], c: 1 },
      sea: { q: "Is the sea big?", a: ["Yes", "No"], c: 0 }
    }
  },
  { 
    id: 'W6wIEpPgXjw', 
    title: "The Color Monster", 
    description: "A story about a monster who gets his emotions all mixed up and needs help sorting them into jars.", 
    hotwords: ["emotion", "monster", "yellow", "blue", "red", "green"],
    quizzes: {
      emotion: { q: "What are emotions?", a: ["Feelings", "Food", "Cars"], c: 0 },
      monster: { q: "Is the monster friendly?", a: ["Yes", "No"], c: 0 },
      yellow: { q: "What emotion is yellow in the book?", a: ["Sadness", "Happiness"], c: 1 }
    }
  },
  { 
    id: 'bt4m5p7M-R0', 
    title: "Pete the Cat and His Four Groovy Buttons", 
    description: "Pete the Cat has four groovy buttons, but they keep popping off. Does he cry? Goodness no!", 
    hotwords: ["cat", "buttons", "popping", "pete", "groovy"],
    quizzes: {
      cat: { q: "What is Pete's name?", a: ["Pete", "Bob"], c: 0 },
      buttons: { q: "How many buttons did he start with?", a: ["4", "3", "2"], c: 0 }
    }
  },
  { 
    id: 'fj_z6zGQzMY', 
    title: "Pete the Cat: I Love My White Shoes", 
    description: "Pete steps in strawberries, blueberries, and mud, but he keeps moving and grooving.", 
    hotwords: ["cat", "shoes", "white", "strawberry", "mud"],
    quizzes: {
      cat: { q: "What animal is Pete?", a: ["Dog", "Cat", "Bird"], c: 1 },
      shoes: { q: "Does Pete cry when his shoes get dirty?", a: ["Yes", "No"], c: 1 },
      white: { q: "What color were his shoes at first?", a: ["Blue", "White", "Red"], c: 1 }
    }
  }
];

const YOUTUBE_VIDEOS = [
  { id: 'hq3yfQnllfQ', title: "Solar System for Kids" },
  { id: 'DR-cfDsHCGA', title: "Learn Numbers 1-10" },
  { id: '75p-N9YKqNo', title: "ABC Phonics Song" },
  { id: 'tX8pYIvlO8U', title: "Learn Colors with Fruit" },
  { id: 'zEk48QQSPo4', title: "Feelings & Emotions" },
  { id: 'S_A9U64Z654', title: "Animals & Their Homes" }
];

const ALL_prizes_dict: Record<string, { icon: string, name: string }> = {
  'cat': { name: 'Magic Cat', icon: '🐱' },
  'dog': { name: 'Space Dog', icon: '🐶' },
  'bear': { name: 'Golden Bear', icon: '🧸' },
  'ufo': { name: 'Neon UFO', icon: '🛸' },
  'rocket': { name: 'Rocket Ship', icon: '🚀' },
  'robot': { name: 'Helping Robot', icon: '🤖' },
  'hammer': { name: 'Magic Hammer', icon: '🔨' },
  'rainbow': { name: 'Rainbow Prize', icon: '🌈' },
  'diamond': { name: 'Cosmic Gem', icon: '💎' }
};

// --- Utilities ---

function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleChange = () => setReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return reducedMotion;
}

// --- Components ---

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [mode, setMode] = useState<AppMode>(AppMode.IDLE);
  const [subPage, setSubPage] = useState<SubPage>(SubPage.HOME);
  const [style, setStyle] = useState<StyleState>(StyleState.CALM);
  const [stars, setStars] = useState(0);
  const [badges, setBadges] = useState<string[]>([]);
  const [ownedPrizes, setOwnedPrizes] = useState<string[]>([]); // New persistence for Arcade items
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  const [showReward, setShowReward] = useState<{ type: string, value: string | number } | null>(null);
  const [rewardQueue, setRewardQueue] = useState<{ type: string, value: string | number }[]>([]);
  const pendingReward = rewardQueue[0] || null;
  const [unopenedRewards, setUnopenedRewards] = useState<UnopenedReward[]>([]);
  const [starsCollectedToday, setStarsCollectedToday] = useState(0);
  
  // DDA Engine
  const dda = useDDA();

  // Accessibility
  const systemReducedMotion = useReducedMotion();
  const [manualSensorySafety, setManualSensorySafety] = useState(false);
  const reducedMotion = systemReducedMotion || manualSensorySafety || dda.difficultyMultiplier < 1;

  // Persistence & Reward Service
  useEffect(() => {
    rewardService.init().then(() => {
      loadUnopened();
    });

    const saved = localStorage.getItem('senselink-data');
    if (saved) {
      const { stars, badges, sensorySafety, ownedPrizes, starsToday } = JSON.parse(saved);
      setStars(stars || 0);
      setBadges(badges || []);
      setManualSensorySafety(!!sensorySafety);
      setOwnedPrizes(ownedPrizes || []);
      setStarsCollectedToday(starsToday || 0);
    }
  }, []);

  const loadUnopened = async () => {
    const rewards = await rewardService.getRewards();
    setUnopenedRewards(rewards);
  };

  useEffect(() => {
    localStorage.setItem('senselink-data', JSON.stringify({ 
      stars, 
      badges, 
      sensorySafety: manualSensorySafety,
      ownedPrizes,
      starsToday: starsCollectedToday
    }));
  }, [stars, badges, manualSensorySafety, ownedPrizes, starsCollectedToday]);

  // Handle Mode Selection
  const selectMode = (newMode: AppMode) => {
    setMode(newMode);
    setSubPage(SubPage.HOME);
    if (newMode === AppMode.AUTISM) setStyle(StyleState.CALM);
    if (newMode === AppMode.ADHD) setStyle(StyleState.ACTIVE);
    if (newMode === AppMode.AUDHD) setStyle(StyleState.CALM);
  };

  const addReward = (type: 'star' | 'badge', value: string | number) => {
    setRewardQueue(prev => [...prev, { type, value }]);
  };

  const handleOpenNow = () => {
    if (!pendingReward) return;
    const { type, value } = pendingReward;
    
    if (type === 'star') {
      setStars(prev => prev + (value as number));
      setStarsCollectedToday(prev => prev + (value as number));
    }
    if (type === 'badge' && !badges.includes(value as string)) {
      setBadges(prev => [...prev, value as string]);
    }

    // Adaptive Feedback
    playCelebrationSound(mode);
    if (mode === AppMode.AUTISM) {
      if ('vibrate' in navigator) navigator.vibrate(200);
    }
    
    setShowReward({ type, value });
    setRewardQueue(prev => prev.slice(1));
    setTimeout(() => setShowReward(null), 3000);
  };

  const handleSaveLater = async () => {
    if (!pendingReward) return;
    const reward: UnopenedReward = {
      id: Math.random().toString(36).substr(2, 9),
      type: pendingReward.type as 'star' | 'badge',
      value: pendingReward.value,
      timestamp: Date.now()
    };
    await rewardService.saveReward(reward);
    await loadUnopened();
    setRewardQueue(prev => prev.slice(1));
  };

  const openTreasure = async (reward: UnopenedReward) => {
    if (reward.type === 'star') {
      setStars(prev => prev + (reward.value as number));
      setStarsCollectedToday(prev => prev + (reward.value as number));
    }
    if (reward.type === 'badge' && !badges.includes(reward.value as string)) {
      setBadges(prev => [...prev, reward.value as string]);
    }
    
    await rewardService.removeReward(reward.id);
    await loadUnopened();
    playCelebrationSound(mode);
    setShowReward({ type: reward.type, value: reward.value });
    setTimeout(() => setShowReward(null), 3000);
  };

  const resetToMenu = () => {
    setMode(AppMode.IDLE);
    setSubPage(SubPage.HOME);
    setSelectedGame(null);
  };

  const currentThemeClass = 
    mode === AppMode.AUDHD ? 'theme-mixed' :
    style === StyleState.CALM ? 'theme-calm' : 'theme-active';

  return (
    <div className={cn("min-h-screen font-sans transition-all duration-500 relative overflow-hidden", currentThemeClass, "bg-canvas")}>
      <FloatingBackground style={style} mode={mode} reducedMotion={reducedMotion} />
      
      <AnimatePresence mode="wait">
        {showIntro && (
          <IntroScreen key="intro" onComplete={() => setShowIntro(false)} reducedMotion={reducedMotion} />
        )}

        {!showIntro && mode === AppMode.IDLE && (
          <MainMenu key="menu" onSelect={selectMode} reducedMotion={reducedMotion} />
        )}

        {!showIntro && mode !== AppMode.IDLE && (
          <ModeDashboard 
            key="dashboard"
            mode={mode}
            subPage={subPage}
            style={style}
            stars={stars}
            badges={badges}
            unopenedRewards={unopenedRewards}
            openTreasure={openTreasure}
            onSetSubPage={setSubPage}
            onToggleStyle={() => setStyle(prev => prev === StyleState.CALM ? StyleState.ACTIVE : StyleState.CALM)}
            onBack={resetToMenu}
            addReward={(s: number, b: string, rt?: number) => {
              addReward('star', s);
              if (b) addReward('badge', b);
              if (selectedGame) dda.recordAttempt(selectedGame, 'WIN', mode, rt);
            }}
            onLoss={() => dda.recordAttempt(selectedGame || 'unknown', 'LOSS', mode)}
            dda={dda}
            setStars={setStars}
            ownedPrizes={ownedPrizes}
            setOwnedPrizes={setOwnedPrizes}
            selectedGame={selectedGame}
            setSelectedGame={setSelectedGame}
            reducedMotion={reducedMotion}
            manualSensorySafety={manualSensorySafety}
            onToggleSensorySafety={() => setManualSensorySafety(p => !p)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReward && (
          <RewardCelebration 
            type={showReward.type} 
            value={showReward.value} 
            reducedMotion={reducedMotion}
            mode={mode}
            onClose={() => setShowReward(null)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {dda.showPracticePrompt && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
          >
             <motion.div 
               initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
               className="bg-white rounded-[56px] p-12 max-w-lg w-full text-center shadow-2xl border-b-[12px] border-emerald-100"
             >
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8">
                   <Shield size={48} className="text-emerald-500" />
                </div>
                <h2 className="text-4xl font-display font-black text-slate-800 mb-4">Hard time?</h2>
                <p className="text-slate-500 text-lg mb-10 leading-relaxed font-medium">
                   We noticed things are a bit tricky. We've slowed the game down for you. Would you like to enter <b>Practice Mode</b>?
                </p>
                <div className="flex flex-col gap-4">
                   <button 
                     onClick={() => { dda.setIsPracticeMode(true); dda.setShowPracticePrompt(false); }}
                     className="bg-emerald-500 text-white px-10 py-5 rounded-[32px] font-black text-xl shadow-xl hover:scale-105 active:scale-95 transition-all"
                   >
                     YES, SLOW DOWN! 🧘‍♂️
                   </button>
                   <button 
                     onClick={() => dda.setShowPracticePrompt(false)}
                     className="text-slate-400 font-bold py-2 hover:text-slate-600 transition-colors"
                   >
                     I'll keep trying!
                   </button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pendingReward && (
          <RewardChoiceModal 
            mode={mode}
            reward={pendingReward}
            onOpenNow={handleOpenNow}
            onSaveLater={handleSaveLater}
            starsCollectedToday={starsCollectedToday}
            reducedMotion={reducedMotion}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function FloatingBackground({ style, mode, reducedMotion }: { style: StyleState, mode?: AppMode, reducedMotion: boolean }) {
  const isMixed = mode === AppMode.AUDHD;
  const isAutism = mode === AppMode.AUTISM;
  const isPaused = reducedMotion; // DDA already affects reducedMotion
  
  const shapes = useMemo(() => Array.from({ length: reducedMotion ? 5 : 15 }).map((_, i) => ({
    id: i,
    size: Math.random() * (reducedMotion ? 150 : 300) + 100,
    top: Math.random() * 100,
    left: Math.random() * 100,
    duration: Math.random() * 15 + 15,
    delay: Math.random() * 5,
    opacity: isAutism ? Math.random() * 0.2 + 0.1 : Math.random() * 0.15 + 0.05,
    color: isAutism 
      ? ['#B4E4D3', '#D6B4E4', '#9DC8E8', '#F9E4B7'][Math.floor(Math.random() * 4)]
      : null
  })), [isAutism, reducedMotion]);

  const stars = useMemo(() => Array.from({ length: reducedMotion ? 10 : 40 }).map((_, i) => ({
    id: i,
    top: Math.random() * 100,
    left: Math.random() * 100,
    size: Math.random() * 4 + 2,
    delay: Math.random() * 5,
  })), [reducedMotion]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Background Dots Pattern for Autism/Calm */}
      {isAutism && <div className="absolute inset-0 bg-dots" />}

      {/* Background Blobs */}
      {shapes.map((s) => (
        <motion.div
          key={s.id}
          className={cn(
            "absolute rounded-full blur-[80px]",
            isMixed ? "bg-mixed-primary" : 
            isAutism ? "" :
            style === StyleState.CALM ? "bg-primary-theme" : "bg-active-primary"
          )}
          initial={{ scale: 0, opacity: 0 }}
          animate={reducedMotion ? {
             scale: 1,
             opacity: s.opacity
          } : { 
            scale: [1, 1.1, 1], 
            opacity: s.opacity,
            y: [0, -40, 0],
            x: [0, 20, 0]
          }}
          transition={reducedMotion ? { duration: 1.5 } : {
            scale: { duration: s.duration, repeat: Infinity, ease: "easeInOut" },
            opacity: { duration: 2 },
            y: { duration: s.duration, repeat: Infinity, ease: "easeInOut", delay: s.delay },
            x: { duration: s.duration * 1.2, repeat: Infinity, ease: "easeInOut", delay: s.delay }
          }}
          style={{
            width: s.size,
            height: s.size,
            top: `${s.top}%`,
            left: `${s.left}%`,
            backgroundColor: s.color || undefined
          }}
        />
      ))}

      {/* Tiny Twinkling Stars for Mixed/ADHD modes */}
      {(mode === AppMode.ADHD || mode === AppMode.AUDHD) && stars.map((star) => (
        <div
          key={star.id}
          className={cn("absolute bg-white rounded-full", !reducedMotion && "animate-twinkle")}
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
            width: star.size,
            height: star.size,
            animationDelay: `${star.delay}s`,
            opacity: 0.6
          }}
        />
      ))}
    </div>
  );
}

function RewardCelebration({ type, value, reducedMotion, onClose, mode }: any) {
  const isAutism = mode === AppMode.AUTISM;
  const isADHD = mode === AppMode.ADHD;
  
  const particles = useMemo(() => Array.from({ length: reducedMotion ? 10 : (isADHD ? 80 : 40) }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    color: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A7D0CD', '#6C5CE7'][Math.floor(Math.random() * 5)],
    delay: Math.random() * 0.5,
    duration: isAutism ? (Math.random() * 5 + 5) : (Math.random() * 2 + 1), // Slower for Autism
    size: Math.random() * 8 + (isADHD ? 12 : 8) // Larger for ADHD
  })), [reducedMotion, isADHD, isAutism]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[500] flex items-center justify-center bg-[#1A1A1A]/40 backdrop-blur-md p-4"
      onClick={onClose}
    >
      {/* Explosive effect for ADHD only */}
      {!isAutism && particles.map(p => (
        <motion.div 
          key={p.id} 
          className="absolute rounded-sm pointer-events-none" 
          initial={{ top: '50%', left: '50%', rotate: 0, scale: 0 }}
          animate={reducedMotion ? {
            top: '80%',
            opacity: [0, 1, 0]
          } : { 
            top: [`${50 + (Math.random() - 0.5) * 10}%`, `${Math.random() * 120}%`], 
            left: [`${50 + (Math.random() - 0.5) * 10}%`, `${Math.random() * 100}%`],
            rotate: 720,
            scale: [0, 1, 0.5],
            opacity: [0, 1, 0]
          }}
          transition={reducedMotion ? { duration: 2, delay: p.delay } : { 
            duration: p.duration, 
            delay: p.delay, 
            ease: "easeOut"
          }}
          style={{ 
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
          }} 
        />
      ))}

      {/* Gentle Fade for Autism only */}
      {isAutism && (
         <motion.div 
           initial={{ opacity: 0 }} animate={{ opacity: 1 }}
           className="absolute inset-0 bg-theme/5 pointer-events-none"
         />
      )}
      
      <motion.div
        initial={isAutism ? { opacity: 0, scale: 0.9 } : { scale: 0, rotate: -20 }}
        animate={{ scale: 1, y: 0, opacity: 1, rotate: 0 }}
        exit={{ scale: 0.8, y: 100, opacity: 0 }}
        transition={isAutism ? { duration: 1.5 } : { type: "spring", damping: 12, stiffness: 200 }}
        className="bg-white rounded-[48px] p-12 flex flex-col items-center gap-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] relative border-b-[12px] border-yellow-400"
      >
        <motion.div
          animate={isAutism ? { 
            scale: [1, 1.02, 1],
            opacity: [1, 0.8, 1]
          } : { 
            rotate: [0, 15, -15, 0],
            scale: [1, 1.1, 1] 
          }}
          transition={{ repeat: Infinity, duration: isAutism ? 4 : 2 }}
          className="bg-yellow-50 p-10 rounded-full"
        >
          {type === 'star' ? <Star size={100} className="text-yellow-500 fill-yellow-500" /> : <Award size={100} className="text-orange-500" />}
        </motion.div>
        
        <div className="text-center">
          <h2 className="text-5xl font-display font-black text-theme tracking-tight">
            {isAutism ? "Beautiful Discovery" : "Spectacular! 🚀"}
          </h2>
          <p className="text-2xl font-bold text-theme/60 mt-3 font-sans">
            {type === 'star' ? `You collected ${value} Stars!` : `New Badge unlocked: ${value}!`}
          </p>
        </div>

        <motion.button
          whileHover={reducedMotion ? {} : { scale: 1.05 }}
          whileTap={reducedMotion ? {} : { scale: 0.95 }}
          className="bg-theme text-white px-10 py-4 rounded-3xl font-bold text-xl shadow-lg mt-2"
          onClick={onClose}
        >
          {isAutism ? "Continue" : "Keep Going! ⚡"}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

function IntroScreen({ onComplete, reducedMotion }: { onComplete: () => void, reducedMotion: boolean, key?: string }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, reducedMotion ? 1500 : 3500);
    return () => clearTimeout(timer);
  }, [onComplete, reducedMotion]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: reducedMotion ? 1 : 1.1, filter: reducedMotion ? "none" : "blur(10px)" }}
      onClick={onComplete}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FDF8F3] cursor-pointer"
    >
      {/* Decorative Bubbles */}
      {!reducedMotion && (
        <>
          <motion.div 
            animate={{ scale: [1, 1.2, 1], x: [0, 30, 0] }}
            transition={{ repeat: Infinity, duration: 8 }}
            className="absolute top-20 left-20 w-32 h-32 bg-[#A7D0CD]/30 rounded-full blur-xl" 
          />
          <motion.div 
            animate={{ scale: [1, 1.5, 1], x: [0, -40, 0] }}
            transition={{ repeat: Infinity, duration: 10 }}
            className="absolute bottom-40 right-20 w-48 h-48 bg-[#FFB347]/30 rounded-full blur-2xl" 
          />
        </>
      )}

      <div className="relative group">
        {!reducedMotion && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-tr from-[#A7D0CD] to-[#FFB347] rounded-full opacity-20 group-hover:opacity-40 blur-3xl scale-150"
          />
        )}
        
        <motion.h1 
          initial={reducedMotion ? { opacity: 0 } : { scale: 0.5, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={reducedMotion ? { duration: 0.5 } : { 
            type: "spring", 
            stiffness: 200, 
            damping: 12 
          }}
          className="text-8xl md:text-[10rem] font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-[#4A5D5E] to-[#A7D0CD] tracking-tighter"
        >
          SenseLink
        </motion.h1>
      </div>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reducedMotion ? 0.2 : 1 }}
        className={cn("mt-8 text-2xl font-bold text-[#A7D0CD]", !reducedMotion && "animate-pulse-soft")}
      >
        Click to Start your Adventure!
      </motion.p>
    </motion.div>
  );
}

function MainMenu({ onSelect, reducedMotion }: { onSelect: (m: AppMode) => void, reducedMotion: boolean, key?: string }) {
  return (
    <motion.div 
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-screen"
    >
      <motion.h2 
        initial={reducedMotion ? { opacity: 0 } : { y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-5xl md:text-6xl font-display font-black text-theme mb-16 text-center tracking-tight"
      >
        Hello Friend! 👋 <br/>
        <span className="text-3xl md:text-4xl text-theme/60">How shall we play today?</span>
      </motion.h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full max-w-6xl p-4">
        <MenuCard 
          title="Autism Mode" 
          icon={<Puzzle size={64} />} 
          color="bg-[#A7D0CD]"
          onClick={() => onSelect(AppMode.AUTISM)}
          description="Soft colors, calm sounds, and clear steps for peaceful discovery."
          badge="Calm & Sweet"
          reducedMotion={reducedMotion}
        />
        <MenuCard 
          title="ADHD Mode" 
          icon={<Zap size={64} />} 
          color="bg-[#FFB347]"
          onClick={() => onSelect(AppMode.ADHD)}
          description="High energy, fun challenges, and super fast-paced excitement!"
          badge="Fast & Fun"
          reducedMotion={reducedMotion}
        />
        <MenuCard 
          title="AuDHD Mode" 
          icon={<RefreshCw size={64} />} 
          color="bg-[#4A90E2]"
          onClick={() => onSelect(AppMode.AUDHD)}
          description="The perfect mix of pattern magic and energetic adventure."
          badge="Super Combo"
          reducedMotion={reducedMotion}
        />
      </div>
    </motion.div>
  );
}

function MenuCard({ title, icon, color, onClick, description, badge, reducedMotion }: any) {
  return (
    <motion.button
      whileHover={reducedMotion ? {} : { y: -15, scale: 1.02 }}
      whileTap={reducedMotion ? {} : { scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "flex flex-col items-center p-12 rounded-[56px] shadow-2xl text-white transition-all group relative overflow-hidden text-center",
        color
      )}
    >
      <div className="absolute top-6 right-8 bg-white/20 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md">
        {badge}
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {/* Decorative pulse ring */}
      {!reducedMotion && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border-4 border-white/5 rounded-full group-hover:scale-150 transition-transform duration-1000" />}
      
      <motion.div 
        animate={reducedMotion ? {} : { 
          rotate: [0, 5, -5, 0],
          scale: [1, 1.1, 1] 
        }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="mb-10 z-10 p-8 rounded-full bg-white/10 ring-8 ring-white/5 shadow-2xl"
      >
        {icon}
      </motion.div>
      
      <h3 className="text-3xl font-display font-black mb-4 z-10 tracking-tight drop-shadow-sm">{title}</h3>
      <p className="text-white/90 text-center text-base leading-relaxed z-10 font-medium">
        {description}
      </p>
      
      <motion.div 
        whileHover={reducedMotion ? {} : { scale: 1.05 }}
        className="mt-8 z-10 w-full py-4 bg-white/10 rounded-3xl font-bold group-hover:bg-white/20 transition-all border border-white/20 backdrop-blur-sm"
      >
        Enter Portal 🚀
      </motion.div>
    </motion.button>
  );
}

function ModeDashboard({ 
  mode, subPage, style, stars, badges, onSetSubPage, onToggleStyle, onBack, addReward, onLoss, selectedGame, setSelectedGame, 
  reducedMotion, manualSensorySafety, onToggleSensorySafety, setStars, ownedPrizes, setOwnedPrizes, dda,
  unopenedRewards = [], openTreasure
}: any) {
  const isCalm = style === StyleState.CALM;

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12 min-h-screen flex flex-col">
      {/* Header - Glassmorphic and Sharp */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-6 mb-16 glass-card p-6 rounded-[32px] border-white/50">
        <div className="flex items-center gap-6">
          <motion.button 
            whileHover={reducedMotion ? {} : { x: -5 }}
            onClick={subPage === SubPage.HOME ? onBack : () => onSetSubPage(SubPage.HOME)}
            className="flex items-center gap-2 p-4 bg-theme/5 rounded-2xl hover:bg-theme/10 transition-all text-theme font-black"
          >
            <ArrowLeft size={28} />
          </motion.button>
          
          <div>
            <h1 className="text-3xl font-display font-black text-theme tracking-tight">
              {subPage === SubPage.HOME ? `Welcome back! ✨` : subPage}
            </h1>
            <p className="text-theme/50 font-bold text-sm uppercase tracking-widest">{mode} Journey</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Sensory Safety Toggle */}
          <motion.button
            whileHover={reducedMotion ? {} : { scale: 1.05 }}
            whileTap={reducedMotion ? {} : { scale: 0.95 }}
            onClick={onToggleSensorySafety}
            className={cn(
               "flex items-center gap-3 px-5 py-3 rounded-2xl font-black transition-all border-b-4",
               manualSensorySafety 
                 ? "bg-slate-700 text-white border-slate-900" 
                 : "bg-white text-slate-400 border-slate-200"
            )}
            title="Sensory Safety Mode"
          >
            {manualSensorySafety ? <ZapOff size={24} /> : <Settings size={24} />}
            <span className="hidden sm:inline">{manualSensorySafety ? 'Safety ON' : 'Safety'}</span>
          </motion.button>

          {mode === AppMode.AUDHD && (
            <motion.button 
              whileHover={reducedMotion ? {} : { scale: 1.05 }}
              whileTap={reducedMotion ? {} : { scale: 0.95 }}
              onClick={onToggleStyle}
              className={cn(
                "flex items-center gap-3 px-6 py-3 rounded-2xl font-black transition-all shadow-lg border-b-4",
                isCalm 
                  ? "bg-calm-primary text-white border-calm-primary/30" 
                  : style === StyleState.ACTIVE 
                    ? "bg-active-primary text-white border-active-primary/30"
                    : "bg-mixed-primary text-white border-mixed-primary/30"
              )}
            >
              {isCalm ? <Moon size={24} /> : <Sun size={24} />}
              <span>{isCalm ? 'Calm' : 'Active'}</span>
            </motion.button>
          )}

          <div className="flex items-center gap-4 bg-white/40 backdrop-blur rounded-2xl p-2 pr-6 border border-white/20 shadow-inner">
            <div className="bg-yellow-400 p-2 rounded-xl shadow-lg animate-float">
               <Star size={24} className="text-white fill-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-display font-black text-theme leading-none">{stars}</span>
              <span className="text-[10px] font-black uppercase text-theme/40 tracking-widest">Stars</span>
            </div>
          </div>
          
          <button 
            onClick={() => onSetSubPage(SubPage.REPORT)}
            className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl hover:scale-105 transition-all mr-2"
          >
            <BarChart3 size={28} />
          </button>
          
          <button 
            onClick={() => onSetSubPage(SubPage.ARCADE)}
            className="p-4 bg-theme text-white rounded-2xl shadow-xl hover:scale-105 transition-all"
          >
            <Gift size={28} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="grow">
        <AnimatePresence mode="wait">
          {subPage === SubPage.HOME && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              <FeatureCard 
                id="games"
                title="Play Zone" 
                icon={<Gamepad2 />} 
                onClick={() => onSetSubPage(SubPage.GAMES)}
                isCalm={isCalm}
                index={0}
                mode={mode}
                reducedMotion={reducedMotion}
              />
              <FeatureCard 
                id="runner"
                title="Cosmic Runner" 
                icon={<Zap />} 
                onClick={() => { setSelectedGame('runner'); onSetSubPage(SubPage.GAME_DETAIL); }}
                isCalm={isCalm}
                index={1}
                mode={mode}
                reducedMotion={reducedMotion}
              />
              <FeatureCard 
                id="stories"
                title="Story World" 
                icon={<BookOpen />} 
                onClick={() => onSetSubPage(SubPage.STORIES)}
                isCalm={isCalm}
                index={2}
                mode={mode}
                reducedMotion={reducedMotion}
              />
              <FeatureCard 
                id="videos"
                title="Discovery" 
                icon={<Video />} 
                onClick={() => onSetSubPage(SubPage.VIDEOS)}
                isCalm={isCalm}
                index={3}
                mode={mode}
                reducedMotion={reducedMotion}
              />
              <FeatureCard 
                id="racing"
                title="Cosmic GP" 
                icon={<Trophy />} 
                onClick={() => { setSelectedGame('racing'); onSetSubPage(SubPage.GAME_DETAIL); }}
                isCalm={isCalm}
                index={4}
                mode={mode}
                reducedMotion={reducedMotion}
              />
              <FeatureCard 
                id="treasures"
                title="My Treasures" 
                icon={<Gift />} 
                onClick={() => onSetSubPage(SubPage.ARCADE)}
                isCalm={isCalm}
                index={5}
                mode={mode}
                reducedMotion={reducedMotion}
              />
            </motion.div>
          )}

          {subPage === SubPage.GAMES && (
            <GameList 
              mode={mode} 
              isCalm={isCalm} 
              reducedMotion={reducedMotion}
              onSelect={(g: string) => { setSelectedGame(g); onSetSubPage(SubPage.GAME_DETAIL); }} 
            />
          )}

          {subPage === SubPage.GAME_DETAIL && selectedGame && (
            <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto">
              {/* DDA Status Indicator */}
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between bg-white/5 backdrop-blur-sm px-8 py-4 rounded-[32px] border border-white/10"
              >
                 <div className="flex items-center gap-4 text-theme">
                    {dda.difficultyMultiplier < 1 ? (
                      <div className="flex items-center gap-3 text-emerald-500 font-black uppercase text-xs tracking-widest bg-emerald-500/10 px-4 py-2 rounded-full">
                        <Shield size={16} /> Guided Mode
                      </div>
                    ) : dda.isChallengeMode ? (
                      <div className="flex items-center gap-3 text-yellow-500 font-black uppercase text-xs tracking-widest bg-yellow-500/10 px-4 py-2 rounded-full">
                        <Sparkles size={16} /> Challenge Mode
                      </div>
                    ) : (
                      <div className="text-theme/40 font-black uppercase text-xs tracking-widest">Normal Pace</div>
                    )}
                 </div>
                 {dda.difficultyMultiplier !== 1 && (
                   <button 
                     onClick={dda.resetDifficulty}
                     className="text-[10px] font-black uppercase text-theme/20 hover:text-theme transition-colors flex items-center gap-2"
                   >
                     <RefreshCw size={12} /> Reset to Default
                   </button>
                 )}
              </motion.div>

              <div className="glass-card p-12 rounded-[56px] min-h-[60vh] flex items-center justify-center relative overflow-hidden">
                <GamePlayer 
                  gameId={selectedGame} 
                  isCalm={isCalm} 
                  mode={mode}
                  reducedMotion={reducedMotion}
                  ddaMultiplier={dda.difficultyMultiplier}
                  onComplete={(s: number, b: string, rt?: number) => { 
                    addReward(s, b); 
                    if (selectedGame) dda.recordAttempt(selectedGame, 'WIN', mode, rt);
                    onSetSubPage(SubPage.HOME); 
                  }} 
                  onLoss={() => {
                    if (selectedGame) dda.recordAttempt(selectedGame, 'LOSS', mode);
                    onLoss();
                    onSetSubPage(SubPage.HOME);
                  }}
                />
              </div>
            </div>
          )}

          {(subPage === SubPage.STORIES || subPage === SubPage.VIDEOS) && (
            <VideoGallery 
              items={subPage === SubPage.STORIES ? YOUTUBE_STORIES : YOUTUBE_VIDEOS} 
              isCalm={isCalm} 
              reducedMotion={reducedMotion}
              onSetStars={(num: number) => addReward('star', num)} 
            />
          )}

          {subPage === SubPage.ARCADE && (
            <RewardArcade 
              mode={mode} 
              stars={stars} 
              ownedPrizes={ownedPrizes}
              reducedMotion={reducedMotion}
              onSpend={(cost: number, prizeId: string) => {
                setStars((s: number) => s - cost);
                setOwnedPrizes((p: string[]) => [...p, prizeId]);
              }}
            />
          )}

          {subPage === SubPage.REPORT && (
            <SensoryReport 
              history={dda.history}
              ddaTriggerCount={dda.ddaTriggerCount}
              reducedMotion={reducedMotion}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Rewards Showcase - High-End Trophy Room */}
      <footer className="mt-24 pt-12 border-t border-theme/5">
         <div className="flex items-center justify-between mb-8">
            <h3 className="text-3xl font-display font-black text-theme tracking-tight flex items-center gap-4">
              <div className="p-3 bg-secondary-theme/20 rounded-2xl">
                <Gift size={32} className="text-theme" />
              </div> 
              Your Collection
            </h3>
            <span className="bg-theme/5 px-4 py-2 rounded-xl text-sm font-black text-theme/60 uppercase tracking-widest border border-theme/10">
              {badges.length + ownedPrizes.length + unopenedRewards.length} Rewards Earned
            </span>
         </div>

         {/* Unopened Treasures Section */}
         {unopenedRewards.length > 0 && (
           <div className="mb-12">
             <div className="flex items-center gap-4 mb-6">
                <Archive size={24} className="text-active-primary" />
                <h4 className="text-xl font-black text-theme uppercase tracking-tighter">My Treasures ({unopenedRewards.length})</h4>
             </div>
             <div className="flex gap-6 overflow-x-auto pb-4 mask-fade-right no-scrollbar">
                {unopenedRewards.map((r: any) => (
                  <motion.button
                    key={r.id}
                    whileHover={reducedMotion ? {} : { scale: 1.05 }}
                    whileTap={reducedMotion ? {} : { scale: 0.95 }}
                    onClick={() => openTreasure(r)}
                    className="flex-shrink-0 w-48 h-48 bg-white rounded-[40px] shadow-xl border-4 border-active-highlight/20 flex flex-col items-center justify-center gap-3 group"
                  >
                     <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-theme group-hover:text-white transition-all">
                        <Gift size={28} />
                     </div>
                     <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Unopened</span>
                     <div className="flex items-center gap-2 text-active-primary">
                        <Eye size={14} />
                        <span className="text-xs font-bold">Tap to Reveal</span>
                     </div>
                  </motion.button>
                ))}
             </div>
           </div>
         )}
         
         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
           {badges.length === 0 && ownedPrizes.length === 0 && (
             <div className="col-span-full py-12 glass-card rounded-[32px] flex flex-col items-center justify-center border-dashed border-2 opacity-40">
                < Award size={48} className="mb-4 text-theme" />
                <p className="font-bold text-theme">Play games to fill your trophy room!</p>
             </div>
           )}
           {badges.map((b, i) => (
             <motion.div 
               key={b}
               initial={{ scale: 0, rotate: -20 }}
               animate={{ scale: 1, rotate: 0 }}
               transition={{ delay: i * 0.1, type: "spring" }}
               className="glass-card p-6 rounded-[32px] flex flex-col items-center gap-4 group hover:bg-white transition-all shadow-theme"
             >
               <div className="w-16 h-16 bg-gradient-to-tr from-yellow-400 to-orange-400 rounded-2xl shadow-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
                 <Award size={32} className="text-white" />
               </div>
               <span className="font-black text-xs text-theme uppercase tracking-wider text-center">{b}</span>
             </motion.div>
           ))}
           {ownedPrizes.map((p, i) => {
             const prize = ALL_prizes_dict[p] || { icon: '🎁', name: 'Prize' };
             return (
               <motion.div 
                 key={p}
                 initial={{ scale: 0, scaleY: 0.5 }}
                 animate={{ scale: 1, scaleY: 1 }}
                 transition={{ delay: (badges.length + i) * 0.1, type: "spring" }}
                 className="glass-card p-6 rounded-[32px] flex flex-col items-center gap-4 group hover:bg-white transition-all shadow-theme"
               >
                 <div className="text-5xl group-hover:scale-110 transition-transform">
                   {prize.icon}
                 </div>
                 <span className="font-black text-xs text-theme uppercase tracking-wider text-center">{prize.name}</span>
               </motion.div>
             );
           })}
         </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, icon, onClick, isCalm, index, mode, reducedMotion, id }: any) {
  const calmAccents = ['#88CCEE', '#AADDCC', '#FFEECC', '#D6B4E4'];
  
  let accent = isCalm ? calmAccents[index % calmAccents.length] : 'var(--current-primary)';
  
  // Task 6.1: Adaptive icons for games
  if (id === 'runner' || id === 'racing') {
    if (mode === AppMode.AUTISM) accent = '#88CCEE';
    else if (mode === AppMode.ADHD) accent = '#FFB347';
    else if (mode === AppMode.AUDHD) accent = '#6C5CE7';
  }

  return (
    <motion.button
      whileHover={reducedMotion ? {} : (isCalm ? { y: -10, scale: 1.02 } : { scale: 1.05, rotate: [0, -1, 1, 0], y: -5 })}
      whileTap={reducedMotion ? {} : { scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center p-12 rounded-[48px] transition-all group relative overflow-hidden",
        "glass-card border-2 h-full min-h-[320px]",
        isCalm ? "border-white/50 text-theme" : "border-white text-theme shadow-active-shadow"
      )}
    >
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br transition-opacity opacity-0 group-hover:opacity-10",
        isCalm ? "" : "from-active-primary to-active-secondary"
      )} 
      style={isCalm ? { backgroundImage: `linear-gradient(to bottom right, ${accent}30, transparent)` } : {}}
      />
      
      <motion.div 
        animate={reducedMotion ? {} : { y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
        className={cn(
          "mb-8 p-10 rounded-full shadow-inner-lg transition-transform group-hover:scale-110",
          "bg-canvas"
        )}
        style={isCalm ? { backgroundColor: `${accent}20` } : {}}
      >
         {React.cloneElement(icon, { size: 64, color: accent })}
      </motion.div>
      
      <h3 className="text-4xl font-display font-black tracking-tight">{title}</h3>
      <div 
        className="mt-4 w-12 h-1.5 rounded-full opacity-30 group-hover:w-24 transition-all" 
        style={{ backgroundColor: accent }}
      />
    </motion.button>
  );
}

function GameList({ mode, isCalm, onSelect, reducedMotion }: any) {
  const games = useMemo(() => {
    if (mode === AppMode.AUTISM) {
      return [
        { id: 'shapes', title: 'Match the Shapes', icon: <Shapes size={32} />, accent: '#88CCEE' },
        { id: 'colors', title: 'Sort by Color', icon: <Palette size={32} />, accent: '#AADDCC' },
        { id: 'pattern', title: 'Complete Patterns', icon: <Layout size={32} />, accent: '#FFEECC' },
        { id: 'routine', title: 'Daily Routine', icon: <Timer size={32} />, accent: '#D6B4E4' },
        { id: 'emotions', title: 'Emotion Match', icon: <CheckCircle2 size={32} />, accent: '#B4E4D3' },
        { id: 'sensory', title: 'Magical Sand', icon: <Waves size={32} />, accent: '#FFD700' },
        { id: 'runner', title: 'Cosmic Runner', icon: <Zap size={32} />, accent: '#FF6B6B' },
        { id: 'racing', title: 'Cosmic Grand Prix', icon: <Trophy size={32} />, accent: '#EAB8E4' }
      ];
    }
    if (mode === AppMode.ADHD) {
      return [
        { id: 'runner', title: 'Cosmic Runner', icon: <Zap size={32} />, accent: '#FFB347' },
        { id: 'racing', title: 'Cosmic Grand Prix', icon: <Trophy size={32} />, accent: '#FF8F8F' },
        { id: 'kitchen', title: 'Kitchen Mess', icon: <Gift size={32} />, accent: '#4ECDC4' },
        { id: 'popper', title: 'Pet Popper', icon: <Zap size={32} />, accent: '#FFE66D' },
        { id: 'rocket', title: 'Rocket Blast', icon: <Zap size={32} />, accent: '#FF6B6B' },
        { id: 'speed', title: 'Rapid Tap', icon: <Timer size={32} />, accent: '#A29BFE' },
        { id: 'glow', title: 'Glow Doodle', icon: <Palette size={32} />, accent: '#F06292' },
        { id: 'whack', title: 'Mole Mash', icon: <Layout size={32} />, accent: '#9575CD' }
      ];
    }
    return [
      { id: 'dollhouse', title: 'Digital Dollhouse', icon: <Layout size={32} />, accent: '#6C5CE7' },
      { id: 'musiclab', title: 'Music Lab', icon: <Video size={32} />, accent: '#A29BFE' },
      { id: 'stars', title: 'Star Builder', icon: <Star size={32} />, accent: '#FDCB6E' },
      { id: 'blocks', title: 'Gravity Blocks', icon: <Shapes size={32} />, accent: '#00CEC9' },
      { id: 'runner', title: 'Cosmic Runner', icon: <Zap size={32} />, accent: '#FF7675' },
      { id: 'racing', title: 'Cosmic Grand Prix', icon: <Trophy size={32} />, accent: '#636E72' }
    ];
  }, [mode]);

  return (
    <motion.div 
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="bento-grid"
    >
      {games.map(g => (
        <motion.button 
          key={g.id}
          whileHover={reducedMotion ? {} : { scale: 1.03, y: -5 }}
          whileTap={reducedMotion ? {} : { scale: 0.97 }}
          onClick={() => onSelect(g.id)}
          className={cn(
            "p-8 rounded-[32px] glass-card flex flex-col items-center justify-center gap-6 text-center group transition-all",
            !isCalm && !reducedMotion && "animate-wiggle"
          )}
        >
          <div 
            style={{ backgroundColor: isCalm ? `${g.accent}40` : `${g.accent}15` }}
            className={cn(
              "p-6 rounded-3xl transition-all shadow-inner",
              !isCalm && "border-2 border-white backdrop-blur-sm"
            )}
          >
            {React.cloneElement(g.icon as React.ReactElement, { 
              color: g.accent, 
              strokeWidth: isCalm ? 2 : 2.5 
            })}
          </div>
          <span className="text-2xl font-bold tracking-tight text-theme">{g.title}</span>
        </motion.button>
      ))}
    </motion.div>
  );
}

// --- Mini Games Implementation ---

function GamePlayer({ gameId, isCalm, onComplete, mode, ddaMultiplier = 1.0, onLoss, reducedMotion }: any) {
  const commonProps = { 
    isCalm, 
    onComplete: (s: number, b: string, rt?: number) => onComplete(s, b, rt), 
    ddaMultiplier, 
    onLoss, 
    reducedMotion 
  };
  
  switch (gameId) {
    case 'shapes': return <MatchShapesGame {...commonProps} />;
    case 'colors': return <SortColorsGame {...commonProps} />;
    case 'pattern': return <PatternGame {...commonProps} />;
    case 'routine': return <DailyRoutineGame {...commonProps} />;
    case 'emotions': return <EmotionMatchGame {...commonProps} />;
    case 'sensory': return <SensorySandGame {...commonProps} />;
    case 'kitchen': return <KitchenMessGame {...commonProps} />;
    case 'popper': return <PetPopperGame {...commonProps} />;
    case 'rocket': return <RocketBlastGame {...commonProps} />;
    case 'speed': return <RapidTapGame {...commonProps} />;
    case 'glow': return <GlowDoodleGame {...commonProps} />;
    case 'whack': return <MoleMashGame {...commonProps} />;
    case 'dollhouse': return <DollhouseGame {...commonProps} />;
    case 'musiclab': return <MusicLabGame {...commonProps} />;
    case 'stars': return <StarBuilderGame {...commonProps} />;
    case 'blocks': return <GravityBlocksGame {...commonProps} />;
    case 'runner': return <InfiniteRunnerGame mode={mode} ddaMultiplier={ddaMultiplier} onComplete={onComplete} onLoss={onLoss} reducedMotion={reducedMotion} />;
    case 'racing': return <RacingGame mode={mode} ddaMultiplier={ddaMultiplier} onComplete={onComplete} onLoss={onLoss} reducedMotion={reducedMotion} />;
    default: return <div className="text-center p-20">Game coming soon!</div>;
  }
}

// Sensory Sand Game
function SensorySandGame({ onComplete, reducedMotion }: any) {
  const [points, setPoints] = useState<any[]>([]);
  const [cleaning, setCleaning] = useState(false);

  useEffect(() => {
    if (points.length > 200 && !cleaning) {
       onComplete(10, 'Sand Artist');
       setCleaning(true);
    }
  }, [points, onComplete, cleaning]);

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <h2 className="text-3xl font-bold text-theme">Draw in the Magic Sand</h2>
      <div 
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setPoints(p => [...p.slice(-300), { x: e.clientX - rect.left, y: e.clientY - rect.top }]);
        }}
        className="w-full h-[50vh] bg-[#F4D03F] rounded-[48px] relative overflow-hidden cursor-crosshair shadow-inner border-8 border-white/20"
      >
        <div className="absolute inset-0 bg-dots opacity-20" />
        {points.map((p, i) => (
          <div 
            key={i} 
            className="absolute rounded-full bg-[#D4AC0D]/40 blur-md"
            style={{ left: p.x, top: p.y, width: '40px', height: '40px', transform: 'translate(-50%, -50%)' }}
          />
        ))}
      </div>
      <p className="text-theme/50 italic">Move your hand to make patterns...</p>
    </div>
  );
}

// Rapid Tap Game (ADHD)
function RapidTapGame({ onComplete, reducedMotion }: any) {
  const [taps, setTaps] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (started && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (started && timeLeft === 0) {
      onComplete(Math.floor(taps / 5), taps > 30 ? 'Turbo Fingers' : 'Fast Tapper');
    }
  }, [started, timeLeft, taps, onComplete]);

  return (
    <div className="flex flex-col items-center gap-10">
      <h2 className="text-4xl font-black text-theme uppercase">Tap Fast! ⚡</h2>
      <div className="text-6xl font-black text-theme bg-white shadow-xl px-12 py-6 rounded-full">
        {timeLeft}s
      </div>
      <div className="text-center">
        <div className="text-8xl font-black text-primary-theme mb-4">{taps}</div>
        <p className="text-theme/40 font-bold uppercase tracking-widest">Taps</p>
      </div>
      {!started ? (
        <button onClick={() => setStarted(true)} className="bg-active-primary text-white px-12 py-6 rounded-3xl font-black text-2xl shadow-xl">START!</button>
      ) : (
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => setTaps(t => t + 1)}
          className="w-48 h-48 bg-active-highlight rounded-full shadow-[0_15px_0_#D4AC0D] active:shadow-none active:translate-y-2 flex items-center justify-center text-4xl"
        >
          👆
        </motion.button>
      )}
    </div>
  );
}

// Mole Mash Game (ADHD)
function MoleMashGame({ onComplete, reducedMotion }: any) {
  const [score, setScore] = useState(0);
  const [activeMole, setActiveMole] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveMole(Math.floor(Math.random() * 9));
    }, 800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (score >= 10) onComplete(10, 'Mole Masher');
  }, [score, onComplete]);

  return (
    <div className="flex flex-col items-center gap-10">
      <h2 className="text-3xl font-bold text-theme">Mash 10 Moles! {score}/10</h2>
      <div className="grid grid-cols-3 gap-6 bg-theme/5 p-8 rounded-[48px]">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="w-24 h-24 bg-theme/10 rounded-full relative overflow-hidden">
            <AnimatePresence>
              {activeMole === i && (
                <motion.button
                  initial={reducedMotion ? { opacity: 0 } : { y: 100 }}
                  animate={reducedMotion ? { opacity: 1 } : { y: 0 }}
                  exit={reducedMotion ? { opacity: 0 } : { y: 100 }}
                  onClick={() => { setScore(s => s + 1); setActiveMole(null); }}
                  className="absolute inset-0 flex items-center justify-center text-5xl cursor-pointer"
                >
                  🐹
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

// Gravity Blocks Game (AuDHD)
function GravityBlocksGame({ onComplete, reducedMotion }: any) {
  const [blocks, setBlocks] = useState<any[]>([]);

  const addBlock = () => {
    setBlocks(b => [...b, { 
      id: Date.now(), 
      x: Math.random() * 80 + 10, 
      color: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A7D0CD'][Math.floor(Math.random() * 4)] 
    }]);
  };

  useEffect(() => {
    if (blocks.length >= 12) onComplete(15, 'Tower Builder');
  }, [blocks, onComplete]);

  return (
    <div className="flex flex-col items-center gap-8 w-full h-full">
      <h2 className="text-3xl font-bold text-theme">Stack 12 Blocks!</h2>
      <div className="relative w-full max-w-md h-[400px] border-b-8 border-theme/20 flex flex-col-reverse items-center overflow-visible">
        {blocks.map((b, i) => (
          <motion.div
            key={b.id}
            initial={reducedMotion ? { opacity: 0 } : { y: -500, rotate: 10 }}
            animate={reducedMotion ? { opacity: 1 } : { y: 0, rotate: 0 }}
            className="w-32 h-12 rounded-lg border-2 border-white shadow-lg flex items-center justify-center font-bold text-white mb-[-4px]"
            style={{ backgroundColor: b.color }}
          >
            BLOCK
          </motion.div>
        ))}
      </div>
      <button 
        onClick={addBlock}
        className="mt-10 bg-primary-theme text-white px-10 py-4 rounded-3xl font-black shadow-lg"
      >
        DROP BLOCK! 🏗️
      </button>
    </div>
  );
}
function MatchShapesGame({ onComplete, isCalm, reducedMotion }: any) {
  const [placed, setPlaced] = useState<string[]>([]);
  const [startTime] = useState(Date.now());
  const shapes = ['circle', 'square', 'triangle', 'heart'];

  const handlePlace = (s: string) => {
    if (!placed.includes(s)) {
      setPlaced(prev => [...prev, s]);
      if (placed.length + 1 === shapes.length) {
        const totalTime = Date.now() - startTime;
        const avgReaction = totalTime / shapes.length;
        setTimeout(() => onComplete(5, 'Shape Master', avgReaction), 1000);
      }
    }
  };

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-3xl font-bold text-theme mb-10">Match the Shapes!</h2>
      <div className="flex gap-10 mb-20">
        {shapes.map(s => (
          <div key={s} className="w-24 h-24 border-4 border-dashed border-theme/20 rounded-2xl flex items-center justify-center">
            {placed.includes(s) && <ShapeIcon type={s} color="var(--current-primary)" />}
          </div>
        ))}
      </div>
      <div className="flex gap-8">
        {shapes.filter(s => !placed.includes(s)).map(s => (
          <motion.button
            key={s}
            whileHover={reducedMotion ? {} : { scale: 1.1 }}
            onClick={() => handlePlace(s)}
            className="w-20 h-20 bg-white shadow-lg rounded-2xl flex items-center justify-center p-2"
          >
            <ShapeIcon type={s} color="var(--current-accent)" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// 2. Sort by Color
function SortColorsGame({ onComplete, isCalm, reducedMotion }: any) {
  const [score, setScore] = useState(0);
  const colors = ['red', 'blue', 'green'];
  const items = useMemo(() => [
    { color: 'red', id: 1 }, { color: 'blue', id: 2 }, { color: 'green', id: 3 },
    { color: 'red', id: 4 }, { color: 'blue', id: 5 }, { color: 'green', id: 6 }
  ], []);
  const [currentIdx, setCurrentIdx] = useState(0);

  const handleSort = (color: string) => {
    if (items[currentIdx].color === color) {
      setScore(s => s + 1);
      if (currentIdx === items.length - 1) {
        onComplete(5, 'Color Hero');
      } else {
        setCurrentIdx(c => c + 1);
      }
    }
  };

  return (
    <div className="flex flex-col items-center">
       <h2 className="text-3xl font-bold text-theme mb-10">Sort by Color!</h2>
       <motion.div 
         key={currentIdx}
         initial={reducedMotion ? { opacity: 0 } : { scale: 0.5 }}
         animate={reducedMotion ? { opacity: 1 } : { scale: 1 }}
         className={cn("w-32 h-32 rounded-3xl shadow-xl mb-12", `bg-${items[currentIdx].color}-400`)}
       />
       <div className="flex gap-6">
         {colors.map(c => (
           <button 
             key={c}
             onClick={() => handleSort(c)}
             className={cn("w-24 h-24 rounded-2xl border-4 border-white shadow-lg", `bg-${c}-400`)}
           />
         ))}
       </div>
    </div>
  );
}

// 3. Pattern Game
function PatternGame({ onComplete, reducedMotion }: any) {
  const pattern = ['🔴', '🟡', '🔴', '🟡'];
  const options = ['🔴', '🟡', '🔵'];
  
  const check = (opt: string) => {
    if (opt === '🔴') {
        onComplete(5, 'Pattern Pro');
    }
  };

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-3xl font-bold text-theme mb-10">What comes next?</h2>
      <div className="text-6xl flex gap-4 mb-20">
        {pattern.map((p, i) => <span key={i}>{p}</span>)}
        <span className="border-b-4 border-theme w-16 text-center">?</span>
      </div>
      <div className="flex gap-6">
        {options.map(o => (
          <button key={o} onClick={() => check(o)} className={cn("text-5xl bg-white p-6 rounded-3xl shadow-lg transition-transform", !reducedMotion && "hover:scale-110")}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

// 4. Kitchen Mess (ADHD)
function KitchenMessGame({ onComplete, reducedMotion }: any) {
  const foods = ['🍎', '🍕', '🥯', '🥦', '🍦'];
  const [inBlender, setInBlender] = useState<string[]>([]);
  
  const addFood = (f: string) => {
     setInBlender(p => [...p, f]);
  };

  return (
    <div className="flex flex-col items-center gap-10">
      <h2 className={cn("text-4xl font-black text-theme uppercase italic", !reducedMotion && "animate-wiggle")}>Kitchen Mess! 🌪️</h2>
      <div className="relative w-64 h-80 bg-blue-100/50 rounded-b-full border-x-8 border-b-8 border-blue-400 flex flex-col items-center justify-end p-4">
          <div className="flex flex-wrap justify-center gap-2">
            {inBlender.map((f, i) => (
              <motion.span 
                animate={reducedMotion ? {} : { rotate: 360 }} 
                transition={{ repeat: Infinity, duration: 0.2, ease: "linear" }} 
                key={i} 
                className="text-4xl"
              >
                {f}
              </motion.span>
            ))}
          </div>
          {inBlender.length > 5 && (
            <button onClick={() => onComplete(10, 'Chef Chaos')} className="mt-4 bg-red-500 text-white px-6 py-2 rounded-full font-black animate-pulse">BLEND!!!</button>
          )}
      </div>
      <div className="flex flex-wrap gap-4 justify-center">
        {foods.map(f => <button key={f} onClick={() => addFood(f)} className="text-5xl hover:scale-150 transition-transform">{f}</button>)}
      </div>
    </div>
  );
}

// 5. Pet Popper (ADHD)
function PetPopperGame({ onComplete, reducedMotion }: any) {
  const [pops, setPops] = useState(0);
  const bubbles = useMemo(() => Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    left: Math.random() * 80 + 10,
    top: Math.random() * 60 + 20,
    size: Math.random() * 40 + 40
  })), []);
  const [poppedIds, setPoppedIds] = useState<number[]>([]);

  const pop = (id: number) => {
    if (!poppedIds.includes(id)) {
      setPoppedIds(p => [...p, id]);
      setPops(p => p + 1);
      if (pops + 1 >= 10) setTimeout(() => onComplete(10, 'Bubble Popper'), 500);
    }
  };

  return (
    <div className="relative h-[60vh] w-full overflow-hidden">
        <h2 className="text-center text-4xl font-black text-theme">Pop 10 Bubbles! {pops}/10</h2>
        {bubbles.map(b => !poppedIds.includes(b.id) && (
            <motion.button
              key={b.id}
              initial={reducedMotion ? { opacity: 0 } : { scale: 0 }}
              animate={reducedMotion ? { opacity: 1 } : { scale: 1 }}
              whileTap={reducedMotion ? {} : { scale: 1.5, opacity: 0 }}
              onClick={() => pop(b.id)}
              style={{ left: `${b.left}%`, top: `${b.top}%`, width: `${b.size}px`, height: `${b.size}px` }}
              className="absolute bg-blue-300/40 border-2 border-white rounded-full shadow-inner"
            />
        ))}
    </div>
  );
}

// 6. Crazy Dress Up
function DressUpGame({ onComplete, reducedMotion }: any) {
  const accessories = ['🤠', '🕶️', '👑', '🎀', '🎧'];
  const [applied, setApplied] = useState<string[]>([]);

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="relative w-48 h-64 bg-secondary-theme rounded-full flex flex-col items-center justify-center">
          <div className="text-8xl">👶</div>
          <div className="absolute inset-0 flex flex-wrap justify-center items-center pointer-events-none">
             {applied.map((a, i) => <span key={i} className="text-5xl">{a}</span>)}
          </div>
      </div>
      <div className="flex gap-4">
        {accessories.map(a => (
          <button key={a} onClick={() => setApplied(p => [...p, a])} className={cn("text-4xl bg-white p-4 rounded-full shadow-lg h-20 w-20 flex items-center justify-center transition-transform", !reducedMotion && "hover:scale-125")}>
            {a}
          </button>
        ))}
      </div>
      {applied.length > 2 && (
        <button onClick={() => onComplete(5, 'Speed Star')} className="bg-primary-theme text-white px-8 py-3 rounded-full font-black text-xl">Looks Awesome!</button>
      )}
    </div>
  );
}

// 7. Dollhouse (AuDHD)
function DollhouseGame({ onComplete, isCalm, reducedMotion }: any) {
  const [items, setItems] = useState([
    { id: 1, char: '🧸', x: 20, y: 20 },
    { id: 2, char: '🪴', x: 70, y: 30 },
    { id: 3, char: '🐱', x: 40, y: 60 }
  ]);

  const move = (id: number) => {
     setItems(prev => prev.map(item => item.id === id ? { ...item, x: Math.random() * 80 + 10, y: Math.random() * 60 + 10 } : item));
  };

  return (
     <div className="relative h-[60vh] bg-white rounded-[40px] shadow-2xl border-8 border-primary-theme overflow-hidden">
        <div className="absolute top-4 left-4 p-4 bg-canvas rounded-2xl font-bold text-theme">Living Room</div>
        {items.map(item => (
          <motion.button
            key={item.id}
            drag
            dragMomentum={!isCalm && !reducedMotion}
            onDragEnd={() => move(item.id)}
            animate={{ left: `${item.x}%`, top: `${item.y}%` }}
            transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: isCalm ? 100 : 300 }}
            className="absolute text-7xl select-none cursor-grab active:cursor-grabbing"
          >
            {item.char}
          </motion.button>
        ))}
        <button onClick={() => onComplete(15, 'Master Decorator')} className="absolute bottom-6 right-6 bg-primary-theme text-white p-4 rounded-full shadow-lg">Done Playing</button>
     </div>
  );
}

// 3b. Daily Routine (Autism)
function DailyRoutineGame({ onComplete, reducedMotion }: any) {
  const steps = [
    { id: 1, text: "Wake up 🌅" },
    { id: 2, text: "Brush teeth 🦷" },
    { id: 3, text: "Eat breakfast 🥣" }
  ];
  const [order, setOrder] = useState<number[]>([]);

  const addStep = (id: number) => {
    if (order.includes(id)) return;
    const newOrder = [...order, id];
    setOrder(newOrder);
    if (newOrder.length === steps.length) {
      const isCorrect = newOrder.every((id, idx) => id === steps[idx].id);
      if (isCorrect) onComplete(5, 'Routine Master');
      else setTimeout(() => setOrder([]), 1000);
    }
  };

  return (
    <div className="flex flex-col items-center gap-10">
      <h2 className="text-3xl font-bold text-theme">Put the steps in order!</h2>
      <div className="flex gap-4">
        {order.map(id => (
          <div key={id} className="w-40 h-24 bg-white rounded-2xl shadow-md flex items-center justify-center font-bold text-theme">
            {steps.find(s => s.id === id)?.text}
          </div>
        ))}
        {Array.from({ length: steps.length - order.length }).map((_, i) => (
          <div key={i} className="w-40 h-24 border-4 border-dashed border-theme/10 rounded-2xl" />
        ))}
      </div>
      <div className="flex gap-4">
        {steps.map(s => !order.includes(s.id) && (
          <button key={s.id} onClick={() => addStep(s.id)} className="px-6 py-4 bg-white rounded-2xl shadow-lg font-bold text-theme">
            {s.text}
          </button>
        ))}
      </div>
    </div>
  );
}

// 3c. Emotion Match (Autism)
function EmotionMatchGame({ onComplete, reducedMotion }: any) {
  const [target, setTarget] = useState("Happy");
  const options = [
    { label: "Happy", emoji: "😊" },
    { label: "Sad", emoji: "😢" },
    { label: "Angry", emoji: "😠" }
  ];

  return (
    <div className="flex flex-col items-center gap-10">
      <h2 className="text-3xl font-bold text-theme">Find the {target} face!</h2>
      <div className="flex gap-8">
        {options.map(o => (
          <button 
            key={o.label} 
            onClick={() => o.label === target ? onComplete(5, 'Friend Finder') : null}
            className={cn("text-8xl bg-white p-8 rounded-full shadow-lg transition-transform", !reducedMotion && "hover:scale-110")}
          >
            {o.emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

// 6b. Rocket Blast (ADHD)
function RocketBlastGame({ onComplete, reducedMotion }: any) {
  const [power, setPower] = useState(0);
  
  useEffect(() => {
    if (power >= 100) onComplete(10, 'Rocket Ace');
  }, [power, onComplete]);

  return (
    <div className="flex flex-col items-center justify-end h-[60vh] gap-10">
       <motion.div 
         animate={{ y: power > 0 ? -power * 4 : 0 }} 
         className="text-9xl relative"
       >
         🚀
         {power > 80 && <motion.div animate={reducedMotion ? { opacity: 0.8 } : { opacity: [0, 1, 0] }} transition={reducedMotion ? {} : { repeat: Infinity }} className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-4xl">🔥</motion.div>}
       </motion.div>
       <div className="w-64 h-8 bg-canvas border-4 border-white rounded-full overflow-hidden">
          <motion.div animate={{ width: `${power}%` }} className="h-full bg-red-500" />
       </div>
       <button 
         onClick={() => setPower(p => p + 5)}
         className={cn("bg-active-highlight text-theme font-black p-10 rounded-full shadow-2xl text-2xl uppercase", !reducedMotion && "animate-bounce")}
       >
         Tap to Launch!
       </button>
    </div>
  );
}

// 6c. Glow Doodle (ADHD)
function GlowDoodleGame({ onComplete, reducedMotion }: any) {
  const [points, setPoints] = useState<any[]>([]);
  
  return (
    <div className="flex flex-col items-center gap-8">
       <div 
         onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setPoints(p => [...p.slice(-50), { x: e.clientX - rect.left, y: e.clientY - rect.top }]);
         }}
         className="w-full h-[50vh] bg-slate-900 rounded-[40px] relative overflow-hidden cursor-crosshair border-8 border-active-highlight shadow-[0_0_50px_rgba(255,230,109,0.3)]"
       >
          {points.map((p, i) => (
            <motion.div 
              key={i} 
              initial={reducedMotion ? { opacity: 0 } : { scale: 0 }} 
              animate={reducedMotion ? { opacity: 1 } : { scale: [1, 0] }} 
              style={{ left: p.x, top: p.y }}
              className="absolute w-6 h-6 bg-cyan-400 rounded-full shadow-[0_0_20px_#4ECDC4]"
            />
          ))}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white font-bold text-xl pointer-events-none">Wiggle your mouse!</div>
       </div>
       <button onClick={() => onComplete(10, 'Glow Artist')} className="bg-active-highlight text-theme px-8 py-3 rounded-full font-black">I done my art!</button>
    </div>
  );
}

// 8. Music Lab (AuDHD)
function MusicLabGame({ isCalm, onComplete, reducedMotion }: any) {
  const pads = [
    { sound: 'Ping', color: 'bg-blue-400' },
    { sound: 'Ting', color: 'bg-green-400' },
    { sound: 'Pong', color: 'bg-purple-400' },
    { sound: 'Boop', color: 'bg-red-400' }
  ];

  return (
    <div className="flex flex-col items-center gap-10">
       <h2 className="text-4xl font-black text-theme">Make some Noise! 🎵</h2>
       <div className="grid grid-cols-2 gap-8">
         {pads.map((p, i) => (
           <motion.button
             key={i}
             whileHover={reducedMotion ? {} : { scale: 1.1 }}
             whileTap={reducedMotion ? {} : { scale: 0.9, rotate: isCalm ? 0 : 15 }}
             className={cn("w-40 h-40 rounded-[40px] shadow-2xl flex items-center justify-center text-white font-black text-2xl", p.color)}
           >
             {p.sound}
           </motion.button>
         ))}
       </div>
       <button onClick={() => onComplete(15, 'Music Maker')} className="bg-primary-theme text-white px-10 py-4 rounded-full font-bold">Finish Concert</button>
    </div>
  );
}

// 9. Star Builder (AuDHD)
function StarBuilderGame({ isCalm, onComplete, reducedMotion }: any) {
  const [stars, setStars] = useState<{ x: number, y: number }[]>([]);

  return (
    <div className="flex flex-col items-center gap-8">
       <div 
         onClick={(e) => {
           const rect = e.currentTarget.getBoundingClientRect();
           setStars(s => [...s, { x: e.clientX - rect.left, y: e.clientY - rect.top }]);
         }}
         className="w-full h-[50vh] bg-slate-800 rounded-[40px] relative cursor-pointer border-4 border-white/20"
       >
          <svg className="absolute inset-0 w-full h-full">
            {stars.map((s, i) => i > 0 && (
              <line key={i} x1={stars[i-1].x} y1={stars[i-1].y} x2={s.x} y2={s.y} stroke="white" strokeWidth="2" strokeDasharray={isCalm ? "5,5" : "0"} />
            ))}
          </svg>
          {stars.map((s, i) => (
            <motion.div 
              key={i} 
              initial={reducedMotion ? { opacity: 0 } : { scale: 0 }} 
              animate={reducedMotion ? { opacity: 1 } : { scale: 1 }} 
              style={{ left: s.x, top: s.y }}
              className="absolute -translate-x-1/2 -translate-y-1/2 text-yellow-300 text-2xl"
            >
              ⭐
            </motion.div>
          ))}
          <div className="absolute top-4 left-4 text-white text-sm opacity-50">Tap to draw a constellation!</div>
       </div>
       <button onClick={() => onComplete(15, 'Master Astronomer')} className="bg-primary-theme text-white px-8 py-3 rounded-full font-black">All Done!</button>
    </div>
  );
}

function ShapeIcon({ type, color }: { type: string, color: string }) {
  const props = { size: 48, style: { color }, fill: color };
  switch (type) {
    case 'circle': return <div className="w-12 h-12 rounded-full" style={{ backgroundColor: color }} />;
    case 'square': return <div className="w-12 h-12 rounded-lg" style={{ backgroundColor: color }} />;
    case 'triangle': return <Shapes {...props} />;
    case 'heart': return <Star {...props} />;
    default: return null;
  }
}

function VideoGallery({ items, isCalm, reducedMotion, onSetStars }: any) {
  const [activeQuiz, setActiveQuiz] = useState<any>(null);

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bento-grid"
      >
        {items.map((v: any) => (
          <motion.div 
            key={v.id} 
            whileHover={reducedMotion ? {} : { y: -8 }}
            className={cn(
              "glass-card p-6 rounded-[40px] transition-all flex flex-col group",
              !isCalm && !reducedMotion && "hover:rotate-1"
            )}
          >
            <div className="aspect-video mb-6 overflow-hidden rounded-[32px] bg-slate-900 shadow-inner group-hover:shadow-2xl transition-all relative">
              <iframe 
                width="100%" 
                height="100%" 
                src={`https://www.youtube-nocookie.com/embed/${v.id}?rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&controls=1`}
                title={v.title}
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                className="opacity-90 group-hover:opacity-100 transition-opacity"
              />
              <div className="absolute inset-0 pointer-events-none border-4 border-white/10 rounded-[32px]" />
            </div>
            
            <h4 className="text-2xl font-display font-black text-theme mb-3 px-2 tracking-tight group-hover:text-primary-theme transition-colors">
              {v.title}
            </h4>
            
            {v.description && (
              <div className="mb-6 grow">
                 <InteractiveText 
                   text={v.description} 
                   hotwords={v.hotwords || []} 
                   isCalm={isCalm} 
                   reducedMotion={reducedMotion}
                   onWordClick={(word: string) => {
                     const clean = word.replace(/[.,]/g, '').toLowerCase();
                     if (v.quizzes && v.quizzes[clean]) {
                       setActiveQuiz(v.quizzes[clean]);
                     }
                   }}
                 />
              </div>
            )}

            <div className="flex items-center justify-between px-2 pt-4 border-t border-theme/5">
               <div className="flex gap-2">
                 {isCalm ? (
                   <span className="text-[10px] uppercase font-black tracking-widest text-theme/40 bg-theme/5 px-3 py-1 rounded-full">Calm Viewing</span>
                 ) : (
                   <button className="text-[10px] uppercase font-black tracking-widest bg-active-primary/20 text-active-text px-3 py-1 rounded-full group-hover:bg-active-primary/30 transition-all">
                     Turbo Mode
                   </button>
                 )}
               </div>
               <CheckCircle2 size={24} className="text-primary-theme opacity-20 group-hover:opacity-100 transition-opacity" />
            </div>
          </motion.div>
        ))}
      </motion.div>

      <AnimatePresence>
        {activeQuiz && (
          <WordQuizPopup 
            quiz={activeQuiz} 
            isCalm={isCalm} 
            onClose={() => setActiveQuiz(null)} 
            onCorrect={() => onSetStars(2)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function InteractiveText({ text, hotwords, isCalm, reducedMotion, onWordClick }: { text: string, hotwords: string[], isCalm: boolean, reducedMotion: boolean, onWordClick?: (w: string) => void }) {
  const words = text.split(' ');
  
  return (
    <p className="text-theme/70 text-sm leading-relaxed px-2">
      {words.map((word, i) => {
        const cleanWord = word.replace(/[.,]/g, '').toLowerCase();
        const isHot = hotwords.includes(cleanWord);
        
        if (isHot) {
          return (
            <motion.span 
              key={i}
              whileTap={reducedMotion ? {} : { scale: 1.4, rotate: isCalm ? 0 : 10 }}
              onClick={() => onWordClick?.(word)}
              className={cn(
                "inline-block font-bold cursor-pointer rounded px-1 transition-all mx-0.5",
                isCalm 
                  ? "text-[#A7D0CD] hover:bg-[#A7D0CD]/10 active:shadow-[0_0_15px_rgba(167,208,205,0.5)]" 
                  : "text-[#FF6B6B] hover:bg-[#FF6B6B]/10 underline decoration-wavy decoration-[#FF6B6B]/50 active:shadow-[0_0_20px_rgba(255,107,107,0.6)]"
              )}
              title="Touch me!"
            >
              {word}
            </motion.span>
          );
        }
        return <span key={i}>{word} </span>;
      })}
    </p>
  );
}

function WordQuizPopup({ quiz, isCalm, onClose, onCorrect }: any) {
  const [selected, setSelected] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelected(idx);
    setIsAnswered(true);
    if (idx === quiz.c) {
      onCorrect();
    }
    setTimeout(onClose, isCalm ? 2000 : 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/30 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className={cn(
          "max-w-md w-full p-8 rounded-[40px] shadow-2xl relative",
          isCalm ? "bg-white" : "bg-active-highlight border-4 border-white"
        )}
      >
        <h3 className="text-2xl font-bold text-theme mb-8 text-center">{quiz.q}</h3>
        <div className="space-y-4">
          {quiz.a.map((opt: string, idx: number) => (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              className={cn(
                "w-full p-4 rounded-2xl text-lg font-bold transition-all flex items-center justify-between",
                selected === idx
                  ? idx === quiz.c ? "bg-green-400 text-white" : "bg-red-400 text-white"
                  : isAnswered && idx === quiz.c ? "bg-green-200 text-green-800" : "bg-canvas text-theme hover:bg-white border-2 border-theme/10"
              )}
            >
              {opt}
              {isAnswered && idx === quiz.c && <CheckCircle2 size={24} />}
              {isAnswered && selected === idx && idx !== quiz.c && <XCircle size={24} />}
            </button>
          ))}
        </div>
        {isAnswered && selected === quiz.c && (
          <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }} 
            className="mt-6 flex flex-col items-center gap-2"
          >
             <Star className="text-yellow-500 fill-yellow-500 animate-bounce" size={40} />
             <p className="font-black text-theme text-xl uppercase italic">Correct! +2 Stars</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
