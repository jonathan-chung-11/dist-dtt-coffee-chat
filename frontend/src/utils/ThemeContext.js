import React, { createContext, useContext, useState, useEffect } from 'react';

export const themes = {
  coffee: {
    name: 'Coffee House',
    emoji: '☕',
    '--bg-primary': '#0F0A07',
    '--bg-secondary': '#1A0F0A',
    '--bg-card': '#1F1209',
    '--border-color': '#3D2314',
    '--text-primary': '#F5E6D3',
    '--text-secondary': '#C8956C',
    '--text-muted': '#8B6E5A',
    '--accent-1': '#C8956C',
    '--accent-2': '#D97706',
    '--accent-3': '#6B4F3A',
    '--glow': '107, 79, 58',
    '--particle': '☕',
    '--gradient-a': '#C8956C',
    '--gradient-b': '#6B4F3A',
  },
  midnight: {
    name: 'Midnight Blue',
    emoji: '🌙',
    '--bg-primary': '#050B18',
    '--bg-secondary': '#0A1628',
    '--bg-card': '#0D1F3C',
    '--border-color': '#1A3A6C',
    '--text-primary': '#E8F4FD',
    '--text-secondary': '#60A5FA',
    '--text-muted': '#3B6FA0',
    '--accent-1': '#60A5FA',
    '--accent-2': '#818CF8',
    '--accent-3': '#1D4ED8',
    '--glow': '96, 165, 250',
    '--particle': '✦',
    '--gradient-a': '#60A5FA',
    '--gradient-b': '#818CF8',
  },
  neon: {
    name: 'Neon Nights',
    emoji: '⚡',
    '--bg-primary': '#050508',
    '--bg-secondary': '#0A0A12',
    '--bg-card': '#0F0F1A',
    '--border-color': '#2D1B69',
    '--text-primary': '#F0E6FF',
    '--text-secondary': '#A78BFA',
    '--text-muted': '#6B4EAF',
    '--accent-1': '#A78BFA',
    '--accent-2': '#F472B6',
    '--accent-3': '#34D399',
    '--glow': '167, 139, 250',
    '--particle': '◆',
    '--gradient-a': '#A78BFA',
    '--gradient-b': '#F472B6',
  },
  forest: {
    name: 'Forest Zen',
    emoji: '🌿',
    '--bg-primary': '#050E08',
    '--bg-secondary': '#071510',
    '--bg-card': '#091A11',
    '--border-color': '#14432A',
    '--text-primary': '#E8F5EC',
    '--text-secondary': '#4ADE80',
    '--text-muted': '#2D6A4F',
    '--accent-1': '#4ADE80',
    '--accent-2': '#34D399',
    '--accent-3': '#059669',
    '--glow': '74, 222, 128',
    '--particle': '🌿',
    '--gradient-a': '#4ADE80',
    '--gradient-b': '#059669',
  },
  sunset: {
    name: 'Sunset Glow',
    emoji: '🌅',
    '--bg-primary': '#0A0508',
    '--bg-secondary': '#150A0F',
    '--bg-card': '#1A0A12',
    '--border-color': '#4A1030',
    '--text-primary': '#FFF0F5',
    '--text-secondary': '#FB7185',
    '--text-muted': '#9F4056',
    '--accent-1': '#FB7185',
    '--accent-2': '#F97316',
    '--accent-3': '#FBBF24',
    '--glow': '251, 113, 133',
    '--particle': '★',
    '--gradient-a': '#FB7185',
    '--gradient-b': '#F97316',
  },
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState(() => localStorage.getItem('cc-theme') || 'coffee');
  const [animLevel, setAnimLevel] = useState(() => localStorage.getItem('cc-anim') || 'high');
  const [particlesOn, setParticlesOn] = useState(() => localStorage.getItem('cc-particles') !== 'false');
  const [compactMode, setCompactMode] = useState(() => localStorage.getItem('cc-compact') === 'true');
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('cc-accent') || '');

  const theme = themes[themeName] || themes.coffee;

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(theme).forEach(([k, v]) => {
      if (k.startsWith('--')) root.style.setProperty(k, v);
    });
    if (accentColor) {
      root.style.setProperty('--accent-1', accentColor);
      root.style.setProperty('--gradient-a', accentColor);
    }
    document.body.dataset.theme = themeName;
    document.body.dataset.compact = compactMode;
  }, [theme, themeName, accentColor, compactMode]);

  const saveTheme = (name) => { setThemeName(name); localStorage.setItem('cc-theme', name); };
  const saveAnim = (level) => { setAnimLevel(level); localStorage.setItem('cc-anim', level); };
  const saveParticles = (on) => { setParticlesOn(on); localStorage.setItem('cc-particles', on); };
  const saveCompact = (on) => { setCompactMode(on); localStorage.setItem('cc-compact', on); };
  const saveAccent = (color) => { setAccentColor(color); localStorage.setItem('cc-accent', color); };

  return (
    <ThemeContext.Provider value={{ themeName, theme, animLevel, particlesOn, compactMode, accentColor, saveTheme, saveAnim, saveParticles, saveCompact, saveAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
