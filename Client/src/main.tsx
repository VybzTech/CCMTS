import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/ui/Toast/ToastProvider';
import { ConfirmDialogProvider } from './components/ui/Modal/ConfirmDialogProvider';

// Provider order matters a little: Theme wraps everything (charts/UI
// need it), Auth needs Toast/Confirm to be available to children that
// might use them, so those two sit innermost-but-still-above <App/>.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <ConfirmDialogProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </ConfirmDialogProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
