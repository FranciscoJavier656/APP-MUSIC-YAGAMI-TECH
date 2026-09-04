import React, { useRef, useLayoutEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Home, Search, Library, Download, Settings as SettingsIcon } from 'lucide-react';

interface Tab {
  id: string;
  icon: React.ElementType;
  label: string;
}

const TABS: Tab[] = [
  { id: 'home', icon: Home, label: 'Inicio' },
  { id: 'search', icon: Search, label: 'Buscar' },
  { id: 'library', icon: Library, label: 'Librería' },
  { id: 'downloads', icon: Download, label: 'Descargas' },
  { id: 'settings', icon: SettingsIcon, label: 'Ajustes' },
];

export const LiquidTabBar = ({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: (id: string) => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [bubbleStyle, setBubbleStyle] = useState<{ x: number; width: number }>({ x: 0, width: 0 });

  // Measure active tab position for the floating bubble
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const measure = () => {
      const container = containerRef.current;
      if (!container) return;
      const activeIdx = TABS.findIndex((t) => t.id === activeTab);
      const btns = container.querySelectorAll<HTMLElement>('.ltb-tab');
      const btn = btns[activeIdx];
      if (!btn) return;
      const containerRect = container.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      setBubbleStyle({
        x: btnRect.left - containerRect.left + btnRect.width / 2,
        width: btnRect.width,
      });
    };
    measure();
    // Remeasure on resize
    const ro = new ResizeObserver(measure);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [activeTab]);

  return (
    <div
      className="fixed left-0 w-full flex justify-center z-[100] pointer-events-none"
      style={{ bottom: 'max(env(safe-area-inset-bottom, 8px), 8px)' }}
    >
      <nav
        className="relative w-[92%] max-w-[420px] pointer-events-auto"
        style={{ height: 72 }}
      >
        {/* ── Main Pill Background ── */}
        <div
          className="absolute inset-0 rounded-[36px] overflow-hidden"
          style={{
            background: 'rgba(28,28,30,0.55)',
            backdropFilter: 'blur(40px) saturate(180%) brightness(1.1)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%) brightness(1.1)',
            boxShadow: `
              0 8px 40px rgba(0,0,0,0.45),
              0 1.5px 0 rgba(255,255,255,0.08) inset,
              0 -0.5px 0 rgba(255,255,255,0.04) inset
            `,
          }}
        />

        {/* Chromatic edge highlight - top */}
        <div
          className="absolute inset-0 rounded-[36px] pointer-events-none"
          style={{
            border: '0.5px solid rgba(255,255,255,0.18)',
            maskImage: 'linear-gradient(to bottom, black 0%, transparent 60%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 60%)',
          }}
        />

        {/* ── Active Tab Bubble (protrudes above the bar) ── */}
        {bubbleStyle.width > 0 && (
          <motion.div
            className="absolute pointer-events-none"
            style={{
              width: 62,
              height: 62,
              borderRadius: '50%',
              top: -14,
            }}
            animate={{
              left: bubbleStyle.x - 31,
            }}
            transition={{
              type: 'spring',
              stiffness: 340,
              damping: 28,
              mass: 0.8,
            }}
          >
            {/* Bubble glass surface */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(24px) saturate(200%) brightness(1.15)',
                WebkitBackdropFilter: 'blur(24px) saturate(200%) brightness(1.15)',
                boxShadow: `
                  0 4px 20px rgba(0,0,0,0.35),
                  0 0 0 0.5px rgba(255,255,255,0.2) inset,
                  0 1px 0 rgba(255,255,255,0.15) inset
                `,
              }}
            />

            {/* Chromatic fringe - subtle RGB edge lighting */}
            <div
              className="absolute inset-[-0.5px] rounded-full pointer-events-none"
              style={{
                border: '0.75px solid transparent',
                background: `
                  linear-gradient(135deg, 
                    rgba(0,255,255,0.25) 0%, 
                    rgba(255,255,255,0.1) 25%, 
                    rgba(255,0,255,0.2) 50%, 
                    rgba(255,255,255,0.1) 75%, 
                    rgba(0,200,255,0.25) 100%
                  )
                `,
                maskImage: 'radial-gradient(circle, transparent 60%, black 100%)',
                WebkitMaskImage: 'radial-gradient(circle, transparent 60%, black 100%)',
              }}
            />
          </motion.div>
        )}

        {/* ── Tab Icons & Labels ── */}
        <div
          ref={containerRef}
          className="relative flex items-center justify-around w-full h-full px-1 z-10"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                className="ltb-tab flex flex-col items-center justify-center gap-[3px] flex-1 h-full bg-transparent border-none outline-none cursor-pointer relative"
                style={{ WebkitTapHighlightColor: 'transparent' }}
                onClick={() => setActiveTab(tab.id)}
              >
                <motion.div
                  animate={{
                    y: isActive ? -13 : 0,
                    scale: isActive ? 1.18 : 1,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 360,
                    damping: 26,
                    mass: 0.7,
                  }}
                  className="flex flex-col items-center gap-[3px]"
                >
                  <Icon
                    size={isActive ? 24 : 22}
                    strokeWidth={isActive ? 2.4 : 1.8}
                    className="transition-colors duration-200"
                    style={{
                      color: isActive ? '#ffffff' : 'rgba(255,255,255,0.45)',
                      filter: isActive
                        ? 'drop-shadow(0 0 6px rgba(255,255,255,0.3))'
                        : 'none',
                    }}
                  />
                  <span
                    className="text-[10px] font-semibold tracking-wide transition-colors duration-200 leading-none"
                    style={{
                      color: isActive ? '#ffffff' : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    {tab.label}
                  </span>
                </motion.div>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
