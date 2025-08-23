// Load iOS polyfills first
import './polyfills';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Game } from './Game';
import './index.css';

// Note: Scroll and gesture prevention is now handled conditionally in Game.tsx
// Only prevents scrolling during actual gameplay, not on menus

// Prevent double-tap zoom globally (this is fine for all screens)
let lastTouchEnd = 0;
document.addEventListener('touchend', e => {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) {
    e.preventDefault();
  }
  lastTouchEnd = now;
}, { passive: false });

// Prevent context menu on long press (this is fine for all screens)
document.addEventListener('contextmenu', e => e.preventDefault());

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Game />
  </React.StrictMode>
);