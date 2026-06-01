import ReactDOMServer from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import { StoreProvider } from './StoreContext.jsx';
import { AuthProvider } from './AuthContext.jsx';
import { Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import PlatformLanding from './pages/PlatformLanding.jsx';
import SuperAdminDashboard from './pages/SuperAdminDashboard.jsx';
import Notification from './components/Notification.jsx';
import { useState } from 'react';

/**
 * SSR entry point.
 * Renders the application to a static HTML string for the given URL.
 * @param {string} url - The request URL path.
 * @param {Object} initialData - Server-side preloaded data (store, product, article).
 * @returns {{ html: string, helmetContext: Object }}
 */
export async function render(url, initialData = {}) {
    const helmetContext = {};

    const isCustomDomain = !!initialData?.store && !url.startsWith('/store/');

    const html = ReactDOMServer.renderToString(
        <HelmetProvider context={helmetContext}>
            <StaticRouter location={url}>
                <StoreProvider initialData={initialData}>
                    <AuthProvider>
                        <Routes>
                            {isCustomDomain ? (
                                <Route path="/*" element={<App />} />
                            ) : (
                                <>
                                    <Route path="/" element={<PlatformLanding />} />
                                    <Route path="/store/:slug/*" element={<App />} />
                                </>
                            )}
                        </Routes>
                    </AuthProvider>
                </StoreProvider>
            </StaticRouter>
        </HelmetProvider>
    );

    return { html, helmetContext };
}
