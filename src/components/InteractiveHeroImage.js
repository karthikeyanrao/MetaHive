import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin } from 'lucide-react';

const IMAGES = [
  {
    src: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80',
    location: 'Beverly Hills, CA'
  },
  {
    src: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80',
    location: 'Miami, FL'
  },
  {
    src: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80',
    location: 'Austin, TX'
  },
  {
    src: 'https://images.unsplash.com/photo-1600607687931-ce8e0026e632?w=1200&q=80',
    location: 'Aspen, CO'
  },
  {
    src: 'https://images.unsplash.com/photo-1628624747186-a941c476b7ef?w=1200&q=80',
    location: 'San Francisco, CA'
  }
];

const InteractiveHeroImage = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    
    // Calculate mouse position relative to container width
    const { left, width } = containerRef.current.getBoundingClientRect();
    const x = e.clientX - left;
    
    // Map x position to index array (0 to IMAGES.length - 1)
    // Add a tiny buffer so reaching the extreme right edge doesn't overshoot
    const percentage = Math.max(0, Math.min(1, x / width));
    const newIndex = Math.min(Math.floor(percentage * IMAGES.length), IMAGES.length - 1);
    
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  };

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => {
    setIsHovering(false);
    // Optional: reset to first image on leave, or keep last state
    // setCurrentIndex(0); 
  };

  return (
    <motion.div 
      className="relative overflow-hidden bg-dark min-h-[50vh] lg:min-h-screen cursor-ew-resize"
      initial={{ x: 30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.9, ease: 'easeOut' }}
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Images with crossfade */}
      <AnimatePresence initial={false}>
        <motion.img 
          key={currentIndex}
          src={IMAGES[currentIndex].src}
          alt={"Property " + (currentIndex + 1)}
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }} // Fast crossfade
        />
      </AnimatePresence>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
      
      {/* Tooltip hint on hover */}
      <AnimatePresence>
        {!isHovering && (
          <motion.div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-black/40 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-full text-sm font-body tracking-wide flex items-center gap-3">
              <span className="animate-pulse">↔</span> 
              Hover to explore
              <span className="animate-pulse">↔</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Location Badge */}
      <div className="absolute bottom-8 left-8 right-8 pointer-events-none z-10">
        <div className="text-white/60 text-xs uppercase tracking-widest mb-2">
          ⛓ Blockchain Verified
        </div>
        <AnimatePresence mode="popLayout">
          <motion.div 
            key={IMAGES[currentIndex].location}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white/10 backdrop-blur border border-white/10 text-white text-xs px-3 py-1 rounded-full inline-flex items-center gap-1 shadow-lg"
          >
            <MapPin size={12} />
            {IMAGES[currentIndex].location}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Segment indicators */}
      <div className="absolute bottom-0 left-0 right-0 h-1 flex gap-0.5 bg-black/20 pointer-events-none">
        {IMAGES.map((_, i) => (
          <div 
            key={i} 
            className={"h-full flex-1 transition-colors duration-300 " + (i === currentIndex ? "bg-white/80" : "bg-white/20")}
          ></div>
        ))}
      </div>
    </motion.div>
  );
};

export default InteractiveHeroImage;
