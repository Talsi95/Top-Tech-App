import React, { useState } from 'react';
import { useAccessibility } from '../AccessibilityContext';

export const AccessibilityMenu = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { settings, updateSetting, resetSettings } = useAccessibility();

    return (
        <div className="fixed bottom-5 left-5 z-50 font-sans" dir="rtl">
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label="פתח תפריט נגישות"
                aria-expanded={isOpen}
                className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-xl transition-all focus:ring-4 focus:ring-offset-2 focus:ring-blue-500"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            </button>

            {isOpen && (
                <div
                    role="dialog"
                    aria-label="תפריט אפשרויות נגישות"
                    className="absolute bottom-16 left-0 w-72 bg-white text-gray-900 border border-gray-200 rounded-2xl shadow-2xl p-4 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-200"
                >
                    <div className="flex justify-between items-center border-b pb-2">
                        <h2 className="text-lg font-bold text-gray-800">הגדרות נגישות</h2>
                        <button
                            onClick={() => setIsOpen(false)}
                            aria-label="סגור תפריט נגישות"
                            className="text-gray-400 hover:text-gray-600 text-sm font-medium"
                        >
                            סגור ✕
                        </button>
                    </div>

                    <div className="space-y-2">
                        <span className="text-sm font-semibold text-gray-700 block">גודל גופן האתר:</span>
                        <div className="grid grid-cols-3 gap-1">
                            {[
                                { id: 'normal', label: 'רגיל' },
                                { id: 'large', label: 'מוגדל' },
                                { id: 'xlarge', label: 'ענק' }
                            ].map((scale) => (
                                <button
                                    key={scale.id}
                                    onClick={() => updateSetting('fontSizeScale', scale.id)}
                                    className={`text-xs py-2 px-1 rounded-lg border transition-all ${settings.fontSizeScale === scale.id
                                        ? 'bg-blue-600 text-white border-blue-600 font-bold'
                                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                        }`}
                                >
                                    {scale.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-gray-100">
                        <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-gray-50">
                            <span className="text-sm font-medium text-gray-700">ניגודיות גבוהה (שחור/לבן)</span>
                            <input
                                type="checkbox"
                                checked={settings.highContrast}
                                onChange={(e) => updateSetting('highContrast', e.target.checked)}
                                className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                            />
                        </label>

                        <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-gray-50">
                            <span className="text-sm font-medium text-gray-700">קו תחתון לקישורים</span>
                            <input
                                type="checkbox"
                                checked={settings.underlineLinks}
                                onChange={(e) => updateSetting('underlineLinks', e.target.checked)}
                                className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                            />
                        </label>
                    </div>

                    <div className="pt-2 border-t border-gray-100">
                        <button
                            onClick={resetSettings}
                            className="w-full text-center text-xs py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium border border-dashed border-red-200"
                        >
                            איפוס כל ההגדרות
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};