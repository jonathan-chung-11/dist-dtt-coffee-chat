import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../utils/ThemeContext';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'monthly', label: 'Monthly 1:1', icon: '☕' },
  { id: 'quarterly', label: 'Quarterly', icon: '👥' },
  { id: 'history', label: 'History', icon: '📅' },
  { id: 'people', label: 'People', icon: '🧑‍🤝‍🧑' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function Navbar({ activePage, setActivePage }) {
  const { theme } = useTheme();

  return (
    <nav style={{
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(24px)',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        maxWidth: 1440,
        margin: '0 auto',
        padding: '0 28px',
        height: 68,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Brand */}
        <motion.div
          style={{ display: 'flex', alignItems: 'center', gap: 12 }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div style={{ position: 'relative' }}>
            <motion.div
              style={{ fontSize: 30, lineHeight: 1 }}
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              {theme['--particle'] === '☕' || !theme['--particle'] ? '☕' : theme['--particle']}
            </motion.div>
            {/* steam */}
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: `${30 + i * 14}%`,
                  width: 3,
                  height: 12,
                  background: `linear-gradient(to top, var(--accent-1), transparent)`,
                  borderRadius: 2,
                  transformOrigin: 'bottom center',
                }}
                animate={{
                  y: [0, -14, -14],
                  opacity: [0, 0.7, 0],
                  scaleX: [1, 1.3, 0.6],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.35,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
          <div>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 900,
              fontSize: 18,
              background: `linear-gradient(135deg, var(--text-primary), var(--accent-1))`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Coffee Chats</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
              Pairing System
            </div>
          </div>
        </motion.div>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {navItems.map((item, i) => {
            const isActive = activePage === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '8px 14px',
                  background: isActive ? `rgba(var(--glow), 0.12)` : 'transparent',
                  border: isActive ? `1px solid rgba(var(--glow), 0.25)` : '1px solid transparent',
                  borderRadius: 10,
                  cursor: 'pointer',
                  color: isActive ? 'var(--accent-1)' : 'var(--text-muted)',
                  fontFamily: "'Sora', sans-serif",
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  transition: 'all 0.2s ease',
                  letterSpacing: '0.2px',
                }}
              >
                <span style={{ fontSize: 15 }}>{item.icon}</span>
                <span className="nav-label-text">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="nav-glow"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 10,
                      background: `radial-gradient(ellipse at center, rgba(var(--glow), 0.12), transparent)`,
                      pointerEvents: 'none',
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                {item.id === 'settings' && (
                  <motion.span
                    animate={{ rotate: isActive ? 180 : 0 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                    style={{ display: 'inline-block', fontSize: 14 }}
                  >
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) { .nav-label-text { display: none; } }
      `}</style>
    </nav>
  );
}
