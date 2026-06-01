import { useEffect } from 'react';
import { useStore } from './StoreContext';

const AnalyticsManager = () => {
    const { store } = useStore();
    const slug = store?.slug;
    const integrations = store?.integrations;

    const injectGoogleAnalytics = (id) => {
        if (window.gtag || !id) return;

        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        window.gtag = function () { window.dataLayer.push(arguments); };
        window.gtag('js', new Date());
        window.gtag('config', id);
        console.log(`📊 Google Analytics initialized for ${id}`);
    };

    const injectFacebookPixel = (id) => {
        if (window.fbq || !id) return;

        !function (f, b, e, v, n, t, s) {
            if (f.fbq) return; n = f.fbq = function () {
                n.callMethod ?
                    n.callMethod.apply(n, arguments) : n.queue.push(arguments)
            }; if (!f._fbq) f._fbq = n;
            n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0;
            t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s)
        }(window,
            document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

        window.fbq('init', id);
        window.fbq('track', 'PageView');
        console.log(`🔵 Facebook Pixel initialized for ${id}`);
    };

    const checkConsentAndLoad = () => {
        if (!store) return;

        const requiresBanner = store.legal?.showCookieBanner;
        const hasConsented = localStorage.getItem(`cookie-consent-${slug}`) === 'true';

        if (!requiresBanner || hasConsented) {
            if (integrations?.googleAnalyticsId) injectGoogleAnalytics(integrations.googleAnalyticsId);
            if (integrations?.facebookPixelId) injectFacebookPixel(integrations.facebookPixelId);
        }
    };

    useEffect(() => {
        checkConsentAndLoad();

        const handleConsentGranted = () => {
            checkConsentAndLoad();
        };

        window.addEventListener(`cookie-consent-granted-${slug}`, handleConsentGranted);

        return () => {
            window.removeEventListener(`cookie-consent-granted-${slug}`, handleConsentGranted);
        };
    }, [store, slug, integrations]);

    return null;
};

export default AnalyticsManager;