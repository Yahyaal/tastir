// The global styles come first, so each page's own stylesheet, imported
// with its component, can override them.
import './styles.css';
import { RecoveryBoundary } from './app/RecoveryBoundary';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './app/app';
import { applyTheme, deviceTheme, savedTheme } from './app/theme';

// index.html has already done this before the first paint; doing it again
// here keeps the theme right if that early script could not run.
applyTheme(savedTheme() ?? deviceTheme());

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

root.render(
  <StrictMode>
    <RecoveryBoundary>
      <App />
    </RecoveryBoundary>
  </StrictMode>,
);
