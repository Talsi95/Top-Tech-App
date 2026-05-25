import { createContext, useContext, useState, useEffect } from 'react';

const AccessibilityContext = createContext(undefined);

export const AccessibilityProvider = ({ children }) => {
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('accessibility_settings');
        return saved ? JSON.parse(saved) : { fontSizeScale: 'normal', highContrast: false, underlineLinks: false };
    });

    useEffect(() => {
        localStorage.setItem('accessibility_settings', JSON.stringify(settings));

        const root = document.documentElement;

        if (settings.highContrast) {
            root.classList.add('high-contrast');
        } else {
            root.classList.remove('high-contrast');
        }

        root.classList.remove('text-scale-large', 'text-scale-xlarge');
        if (settings.fontSizeScale === 'large') root.classList.add('text-scale-large');
        if (settings.fontSizeScale === 'xlarge') root.classList.add('text-scale-xlarge');
        if (settings.underlineLinks) {
            root.classList.add('underline-links');
        } else {
            root.classList.remove('underline-links');
        }

    }, [settings]);

    const updateSetting = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };
    const resetSettings = () => {
        setSettings({ fontSizeScale: 'normal', highContrast: false, underlineLinks: false });
    };

    return (
        <AccessibilityContext.Provider value={{ settings, updateSetting, resetSettings }}>
            {children}
        </AccessibilityContext.Provider>
    );
};

export const useAccessibility = () => {
    const context = useContext(AccessibilityContext);
    if (!context) {
        throw new Error('useAccessibility must be used within an AccessibilityProvider');
    }
    return context;
};