import { hydrateRoot, createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import './index.css';
import App from './App.jsx';
import PlatformLanding from './pages/PlatformLanding.jsx';
import SuperAdminDashboard from './pages/SuperAdminDashboard.jsx';
import { AuthProvider } from './AuthContext.jsx';
import { StoreProvider } from './StoreContext.jsx';
import Notification from './components/Notification';
import { useState } from 'react';

const SuperAdminWrapper = () => {
  const [notification, setNotification] = useState({ message: '', type: '' });
  const showNotification = (message, type) => setNotification({ message, type });

  return (
    <>
      <SuperAdminDashboard showNotification={showNotification} />
      <Notification
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ message: '', type: '' })}
      />
    </>
  );
};

/**
 * Application Client Entry Point.
 * Hydrates the server-rendered HTML or creates a fresh root if SSR is not available.
 */
const rootElement = document.getElementById('root');
const initialStoreData = typeof window !== 'undefined' ? window.__INITIAL_DATA__ : undefined;

const AppTree = (
  <HelmetProvider>
    <BrowserRouter>
      <StoreProvider initialData={initialStoreData}>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<PlatformLanding />} />
            <Route path="/super-admin" element={<SuperAdminWrapper />} />
            <Route path="/store/:slug/*" element={<App />} />
          </Routes>
        </AuthProvider>
      </StoreProvider>
    </BrowserRouter>
  </HelmetProvider>
);

// Use hydrateRoot if the server has pre-rendered content, otherwise createRoot
if (rootElement.innerHTML.trim() !== '') {
  hydrateRoot(rootElement, AppTree);
} else {
  createRoot(rootElement).render(AppTree);
}
