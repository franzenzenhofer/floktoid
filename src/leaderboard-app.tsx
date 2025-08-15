import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { StandaloneLeaderboard } from './components/StandaloneLeaderboard';

ReactDOM.createRoot(document.getElementById('leaderboard-root')!).render(
  <React.StrictMode>
    <StandaloneLeaderboard />
  </React.StrictMode>
);