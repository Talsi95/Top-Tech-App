import React, { useState, useEffect } from 'react';
import { useStore } from '../StoreContext';
import StoreLink from './StoreLink';

const CookieBanner = () => {
    const { store } = useStore();
    const [isVisible, setIsVisible] = useState(false);
    const slug = store?.slug;

    useEffect(() => {
        if (store?.legal?.showCookieBanner) {
            const hasConsented = localStorage.getItem(`cookie-consent-${slug}`);
            if (!hasConsented) {
                setIsVisible(true);
            }
        }
    }, [store, slug]);

    const handleAccept = () => {
        localStorage.setItem(`cookie-consent-${slug}`, 'true');
        setIsVisible(false);

        const consentEvent = new Event(`cookie-consent-granted-${slug}`);
        window.dispatchEvent(consentEvent);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:max-w-md bg-white border border-gray-100 shadow-2xl p-5 rounded-2xl z-50 animate-in fade-in slide-in-from-bottom-8 duration-500 text-right" dir="rtl">
            <h4 className="text-base font-black text-gray-800 mb-2">🍪 שומרים על הפרטיות שלך</h4>
            <p className="text-xs text-gray-500 leading-relaxed mb-4">
                אתר זה משתמש בקבצי עוגיות (Cookies) כדי להבטיח שתקבל את חווית השימוש הטובה ביותר, לניתוח תנועת הגולשים ולהתאמת תוכן שיווקי. למידע נוסף עיין ב
                <StoreLink to="/privacy" className="text-gray-700 underline font-bold mr-1 hover:text-black">במדיניות הפרטיות</StoreLink> שלנו.
            </p>
            <div className="flex gap-3 justify-end">
                <button
                    onClick={() => setIsVisible(false)}
                    className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-gray-600 rounded-xl transition-all"
                >
                    התעלם
                </button>
                <button
                    onClick={handleAccept}
                    style={{ backgroundColor: store?.design?.primaryColor || '#0058be' }}
                    className="px-5 py-2 text-xs font-black text-white rounded-xl shadow-md hover:opacity-90 transition-all"
                >
                    מאשר וממשיך
                </button>
            </div>
        </div>
    );
};

export default CookieBanner;