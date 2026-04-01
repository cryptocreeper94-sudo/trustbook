import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const HERO_SLIDES = [
  '/images/trust-book-hero-1.png',
  '/images/trust-book-hero-2.png',
  '/images/trust-book-hero-3.png',
];

const KB_VARIANTS = [
  { scale: [1, 1.15], x: ['0%', '3%'], y: ['0%', '2%'] },
  { scale: [1.1, 1], x: ['2%', '-2%'], y: ['-1%', '1%'] },
  { scale: [1, 1.12], x: ['-2%', '1%'], y: ['1%', '-1%'] },
];

export function KenBurnsHero({ children }: { children: React.ReactNode }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIdx(p => (p + 1) % HERO_SLIDES.length), 8000);
    return () => clearInterval(timer);
  }, []);

  const kb = KB_VARIANTS[idx % KB_VARIANTS.length];

  return (
    <section className="relative w-full min-h-[85vh] overflow-hidden" data-testid="hero-ken-burns">
      {/* Ken Burns background slides */}
      <AnimatePresence mode="sync">
        <motion.div
          key={idx}
          className="absolute inset-0 w-full h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        >
          <motion.img
            src={HERO_SLIDES[idx]}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            animate={{ scale: kb.scale, x: kb.x, y: kb.y }}
            transition={{ duration: 8, ease: 'linear' }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Gradient overlay — subtle to keep image visible */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/50 to-slate-950/90 z-[1]" />
      
      {/* Vignette edges */}
      <div className="absolute inset-0 z-[2]" style={{
        boxShadow: 'inset 0 0 150px 60px rgba(2,6,23,0.7)',
      }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-end min-h-[85vh] px-6 pb-12 pt-20">
        {children}
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`w-2 h-2 rounded-full transition-all duration-500 ${idx === i ? 'bg-white scale-125' : 'bg-white/30'}`}
          />
        ))}
      </div>
    </section>
  );
}
