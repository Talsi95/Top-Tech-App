import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css'
import App from './App.jsx'
import PlatformLanding from './pages/PlatformLanding.jsx'
import SuperAdminDashboard from './pages/SuperAdminDashboard.jsx'
import { AuthProvider } from './AuthContext.jsx'
import { StoreProvider } from './StoreContext.jsx'
import Notification from './components/Notification'
import { useState } from 'react'

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
 * Application Entry Point.
 * Renders the React application, wraps it with authentication and routing providers.
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <StoreProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<PlatformLanding />} />
            <Route path="/super-admin" element={<SuperAdminWrapper />} />
            <Route path="/store/:slug/*" element={<App />} />
          </Routes>
        </AuthProvider>
      </StoreProvider>
    </BrowserRouter>
  </StrictMode>,
)
