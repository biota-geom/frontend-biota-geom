import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerAuthEventHandlers } from './features/auth/useAuth.ts';
import './styles/global.css';
import App from './App.tsx';

registerAuthEventHandlers();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
