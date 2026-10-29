import React from 'react';

const COLORS = ['#C8956C','#D97706','#0D9488','#7C3AED','#DB2777','#059669','#2563EB','#DC2626','#CA8A04','#0891B2','#7C3AED','#F59E0B'];

export function getColor(name) {
  let hash = 0;
  for (let c of name) hash = (hash << 5) - hash + c.charCodeAt(0);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function Avatar({ name, size = 40 }) {
  const initials = name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  const color = getColor(name);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `${color}22`,
      border: `2px solid ${color}66`,
      boxShadow: `0 0 12px ${color}33`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.36, color, flexShrink: 0,
      fontFamily: "'Sora', sans-serif",
      transition: 'box-shadow 0.3s',
    }}>
      {initials}
    </div>
  );
}
