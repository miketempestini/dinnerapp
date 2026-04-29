import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { useStore } from './store/useStore';
import { SEED_MEALS, SEED_RESTAURANTS, SEED_SIDES } from './lib/seedData';

useStore.getState().applySeed(SEED_MEALS, SEED_RESTAURANTS, SEED_SIDES);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
