import React, { useEffect, useRef, useState } from 'react';
import { X, Lock, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * VerifoneIframeModal - Embedded Version
 * מטמיע את קוד הסליקה המאובטח של וריפון ישירות בתוך קומפוננטת האתר
 * ומאזין לאירועי סיום העסקה בצורה מאובטחת.
 */
const VerifoneIframeModal = ({ isOpen, paymentUrl, onClose }) => {
    const containerRef = useRef(null);
    const [status, setStatus] = useState('idle'); // idle | loading | success | error

    // 1. הזרקת הסקריפט הדינמי של וריפון לתוך ה-Container
    useEffect(() => {
        if (isOpen && paymentUrl && containerRef.current) {
            setStatus('loading');

            // ניקוי תוכן קודם ליתר ביטחון
            containerRef.current.innerHTML = '';

            // יצירת אלמנט סקריפט דינמי
            const script = document.createElement('script');
            script.src = paymentUrl; // ה-URL שמכיל את ה-loader.js?checkoutId=...
            script.async = true;

            // כאשר הסקריפט מסיים להיטען, וריפון מייצרת את ה-Iframe באופן אוטומטי
            script.onload = () => {
                setStatus('idle');
                console.log('Verifone Checkout Loader initialized successfully.');
            };

            script.onerror = () => {
                setStatus('error');
                console.error('Failed to load Verifone payment script.');
            };

            // הזרקה לקונטיינר
            containerRef.current.appendChild(script);
        }
    }, [isOpen, paymentUrl]);

    // 2. האזנה לאירועים (postMessage) הנשלחים מה-Iframe של וריפון
    useEffect(() => {
        const handleVerifoneMessages = (event) => {
            // אבטחה: מוודאים שהודעות מגיעות אך ורק מהדומיינים המורשים של וריפון
            const isVerifoneOrigin =
                event.origin.includes('verifone.cloud') ||
                event.origin.includes('vficloud.net') ||
                event.origin.includes('vfims.com');

            if (!isVerifoneOrigin) return;

            const data = event.data;
            console.log('Verifone Event Received:', data);

            // זיהוי סגירת הטופס או סיום תהליך (וריפון שולחת לרוב אובייקט עם גלובל אקשן)
            if (data && (data.action === 'close' || data.type === 'vfi-checkout-close')) {
                // כאן אתה יכול לבחור האם לסגור מיד או לבדוק סטטוס בשרת
                onClose();
            }

            // במידה ווריפון מעבירה סטטוס הצלחה ישיר דרך ה-postMessage
            if (data && (data.status === 'success' || data.event === 'payment_success')) {
                setStatus('success');
            }
        };

        window.addEventListener('message', handleVerifoneMessages);
        return () => window.removeEventListener('message', handleVerifoneMessages);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">

                {/* כפתור סגירה עליון */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10 transition-colors p-1 rounded-full hover:bg-gray-100"
                >
                    <X size={20} />
                </button>

                {/* כותרת המודל */}
                <div className="p-6 border-b border-gray-100">
                    <h3 className="font-bold text-lg text-gray-800">תשלום מאובטח באשראי</h3>
                    <p className="text-xs text-gray-400 mt-0.5">נא לא לסגור חלון זה עד לסיום העסקה</p>
                </div>

                {/* אזור התצוגה והסליקה */}
                <div className="flex-1 overflow-y-auto p-4 min-h-[480px] flex flex-col justify-center items-center relative bg-gray-50/50">

                    {/* אינדיקטור טעינה */}
                    {status === 'loading' && (
                        <div className="flex flex-col items-center gap-3 absolute inset-0 bg-white z-10 justify-center">
                            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm text-gray-500 font-medium">טוען מסוף תשלום מאובטח...</p>
                        </div>
                    )}

                    {/* שגיאה בטעינת המסוף */}
                    {status === 'error' && (
                        <div className="flex flex-col items-center text-center p-6 gap-3">
                            <AlertCircle size={40} className="text-red-500" />
                            <p className="text-base font-bold text-gray-800">שגיאה בחיבור למסוף</p>
                            <p className="text-xs text-gray-500 max-w-xs">לא הצלחנו לטעון את עמוד התשלום המאובטח. אנא נסה שוב או פנה לתמיכה.</p>
                        </div>
                    )}

                    {/* הצלחה חריגה (אם זוהתה ישירות ב-Frontend) */}
                    {status === 'success' && (
                        <div className="flex flex-col items-center text-center p-6 gap-3 absolute inset-0 bg-white z-10 justify-center">
                            <CheckCircle size={50} className="text-green-500 animate-bounce" />
                            <p className="text-lg font-bold text-gray-800">התשלום בוצע בהצלחה!</p>
                            <p className="text-xs text-gray-500">מיד תועבר לדף אישור ההזמנה...</p>
                        </div>
                    )}

                    {/* 💡 הקונטיינר החשוב ביותר: לתוכו ה-loader.js יזריק את ה-Iframe באופן אוטומטי */}
                    <div
                        ref={containerRef}
                        className="w-full flex justify-center items-center"
                        style={{ minHeight: '450px' }}
                    />

                </div>

                {/* פוטר אבטחה קבוע */}
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-2">
                    <Lock size={12} className="text-gray-400" />
                    <p className="text-[11px] text-gray-400 font-medium">חיבור מוצפן SSL | עומד בתקן האבטחה המחמיר PCI-DSS</p>
                </div>
            </div>
        </div>
    );
};

export default VerifoneIframeModal;

// import React, { useEffect, useRef, useState, useCallback } from 'react';
// import { X, Lock, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';

// /**
//  * VerifoneIframeModal
//  * Opens the Verifone payment page in a centered popup window.
//  * This avoids X-Frame-Options restrictions and CSP issues with the sandbox environment.
//  * The parent page shows an overlay while waiting for payment to complete.
//  */
// const VerifoneIframeModal = ({ isOpen, paymentUrl, onClose }) => {
//     const popupRef = useRef(null);
//     const pollRef = useRef(null);
//     const [status, setStatus] = useState('idle'); // idle | waiting | success | cancelled | blocked

//     const stopPolling = useCallback(() => {
//         if (pollRef.current) {
//             clearInterval(pollRef.current);
//             pollRef.current = null;
//         }
//     }, []);

//     const openPopup = useCallback(() => {
//         if (!paymentUrl) return;

//         // Close any existing popup first
//         if (popupRef.current && !popupRef.current.closed) {
//             popupRef.current.close();
//         }

//         // Open centered popup
//         const width = 820;
//         const height = 700;
//         const left = Math.max(0, (window.screen.width - width) / 2);
//         const top = Math.max(0, (window.screen.height - height) / 2);

//         const popup = window.open(
//             paymentUrl,
//             'verifone_checkout',
//             `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
//         );

//         if (!popup || popup.closed) {
//             setStatus('blocked');
//             return;
//         }

//         popupRef.current = popup;
//         setStatus('waiting');

//         // Track that the popup has been on Verifone's domain before checking for our return URL
//         let hasReachedVerifone = false;

//         // Poll the popup every 600ms
//         pollRef.current = setInterval(() => {
//             // If user closed the popup
//             if (popup.closed) {
//                 stopPolling();
//                 setStatus(hasReachedVerifone ? 'cancelled' : 'idle');
//                 return;
//             }

//             try {
//                 const popupUrl = popup.location.href;

//                 // Skip the initial about:blank before Verifone loads
//                 if (!popupUrl || popupUrl === 'about:blank' || popupUrl === '') {
//                     return;
//                 }

//                 // We can read the URL → popup is on our domain (same-origin)
//                 // Only act if we previously crossed to Verifone's domain
//                 if (hasReachedVerifone) {
//                     if (popupUrl.includes('/order-confirmation/')) {
//                         stopPolling();
//                         popup.close();
//                         if (popupUrl.includes('status=success') || popupUrl.includes('CCode=0')) {
//                             setStatus('success');
//                             setTimeout(() => { window.location.href = popupUrl; }, 1200);
//                         } else {
//                             setStatus('cancelled');
//                         }
//                     }
//                 }
//             } catch (_) {
//                 // Cross-origin error = popup is on Verifone's domain — mark and keep polling
//                 hasReachedVerifone = true;
//             }
//         }, 600);
//     }, [paymentUrl, stopPolling]);

//     // Open popup when modal opens
//     useEffect(() => {
//         if (isOpen && paymentUrl) {
//             setStatus('idle');
//             // Small delay to ensure the overlay renders first
//             const t = setTimeout(() => openPopup(), 300);
//             return () => clearTimeout(t);
//         }
//         return () => {
//             stopPolling();
//         };
//     }, [isOpen, paymentUrl]);

//     // Cleanup on unmount
//     useEffect(() => {
//         return () => {
//             stopPolling();
//             if (popupRef.current && !popupRef.current.closed) {
//                 popupRef.current.close();
//             }
//         };
//     }, []);

//     const handleClose = () => {
//         stopPolling();
//         if (popupRef.current && !popupRef.current.closed) {
//             popupRef.current.close();
//         }
//         popupRef.current = null;
//         setStatus('idle');
//         onClose?.();
//     };

//     if (!isOpen || !paymentUrl) return null;

//     return (
//         <div
//             className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
//             dir="rtl"
//         >
//             <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">

//                 {/* Header */}
//                 <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/60">
//                     <div className="flex items-center gap-3">
//                         <div className="p-2 bg-primary/10 text-primary rounded-xl">
//                             <Lock size={20} />
//                         </div>
//                         <div>
//                             <h3 className="text-base font-black text-gray-900">תשלום מאובטח</h3>
//                             <p className="text-xs text-gray-500">מופעל על-ידי Verifone</p>
//                         </div>
//                     </div>
//                     {status !== 'success' && (
//                         <button
//                             onClick={handleClose}
//                             className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
//                             aria-label="סגור"
//                         >
//                             <X size={20} />
//                         </button>
//                     )}
//                 </div>

//                 {/* Body */}
//                 <div className="p-8 flex flex-col items-center text-center gap-5">

//                     {/* Waiting for popup */}
//                     {(status === 'idle' || status === 'waiting') && (
//                         <>
//                             <div className="relative w-16 h-16">
//                                 <div className="absolute inset-0 border-4 border-gray-100 rounded-full" />
//                                 <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
//                             </div>
//                             <div>
//                                 <p className="font-bold text-gray-800 text-sm mb-1">חלון תשלום נפתח</p>
//                                 <p className="text-xs text-gray-500 leading-relaxed">
//                                     השלם את פרטי התשלום בחלון שנפתח.<br />
//                                     חלון זה יסגר אוטומטית לאחר השלמת התשלום.
//                                 </p>
//                             </div>
//                             <button
//                                 onClick={openPopup}
//                                 className="flex items-center gap-2 text-xs text-primary font-bold hover:opacity-70 transition border border-primary/20 px-4 py-2 rounded-xl bg-primary/5"
//                             >
//                                 <ExternalLink size={14} />
//                                 לא רואה את החלון? לחץ לפתוח שוב
//                             </button>
//                         </>
//                     )}

//                     {/* Popup blocked */}
//                     {status === 'blocked' && (
//                         <>
//                             <AlertCircle size={40} className="text-amber-500" />
//                             <div>
//                                 <p className="font-bold text-gray-800 text-sm mb-1">החלון נחסם על-ידי הדפדפן</p>
//                                 <p className="text-xs text-gray-500 leading-relaxed">
//                                     הדפדפן חסם את חלון התשלום.<br />
//                                     לחץ "אפשר" בהודעת הדפדפן או לחץ על הכפתור:
//                                 </p>
//                             </div>
//                             <button
//                                 onClick={openPopup}
//                                 className="flex items-center gap-2 bg-primary text-white font-bold text-sm px-6 py-3 rounded-xl hover:opacity-90 transition"
//                             >
//                                 <ExternalLink size={16} />
//                                 פתח חלון תשלום
//                             </button>
//                             <button onClick={handleClose} className="text-xs text-gray-400 hover:text-gray-600 transition">
//                                 ביטול
//                             </button>
//                         </>
//                     )}

//                     {/* Success */}
//                     {status === 'success' && (
//                         <>
//                             <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
//                                 <CheckCircle size={36} className="text-green-500" />
//                             </div>
//                             <div>
//                                 <p className="font-black text-gray-900 text-base mb-1">התשלום אושר!</p>
//                                 <p className="text-xs text-gray-500">מעביר לדף אישור ההזמנה...</p>
//                             </div>
//                             <div className="w-8 h-1 bg-green-200 rounded-full overflow-hidden">
//                                 <div className="h-full bg-green-500 animate-pulse" />
//                             </div>
//                         </>
//                     )}

//                     {/* Cancelled */}
//                     {status === 'cancelled' && (
//                         <>
//                             <AlertCircle size={40} className="text-gray-400" />
//                             <div>
//                                 <p className="font-bold text-gray-800 text-sm mb-1">התשלום בוטל</p>
//                                 <p className="text-xs text-gray-500">סגרת את חלון התשלום לפני השלמתו.</p>
//                             </div>
//                             <div className="flex gap-3 w-full">
//                                 <button
//                                     onClick={openPopup}
//                                     className="flex-1 bg-primary text-white font-bold text-sm px-4 py-2.5 rounded-xl hover:opacity-90 transition"
//                                 >
//                                     נסה שוב
//                                 </button>
//                                 <button
//                                     onClick={handleClose}
//                                     className="flex-1 border border-gray-200 text-gray-600 font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-gray-50 transition"
//                                 >
//                                     ביטול
//                                 </button>
//                             </div>
//                         </>
//                     )}
//                 </div>

//                 {/* Security footer */}
//                 <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-2">
//                     <Lock size={11} className="text-gray-400" />
//                     <p className="text-[10px] text-gray-400 font-medium">חיבור מוצפן SSL | עומד בתקן PCI-DSS</p>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default VerifoneIframeModal;
