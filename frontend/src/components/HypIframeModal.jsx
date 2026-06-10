import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Lock, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * HYP_DIGITAL_WALLETS_INTEGRATION
 * 
 * Digital Wallet Support (Apple Pay, Google Pay, bit):
 * - Google Pay and bit: Work automatically once enabled in your Hyp terminal.
 *   No extra integration steps needed. They display as buttons on Hyp's payment page.
 * 
 * - Apple Pay in iframe mode: Requires additional setup according to Hyp docs:
 *   1. TLS requirements – handled by nginx/infrastructure.
 *   2. .well-known/apple-developer-merchantid-domain-association file – served by backend.
 *   3. Registration with Hyp – contact Hyp representative to complete.
 *   4. Apple Pay script: <script src="https://ppsuat.creditguard.co.il/plugins/applePayOnIframe.js">
 *      This script is loaded dynamically when the iframe mounts (below).
 * 
 * Troubleshooting for iframe issues with digital wallets:
 * - The iframe has `allow="payment"` and `allowPaymentRequest` property set
 *   to resolve "top-level browser context" errors documented by Hyp.
 * - See: https://support.google.com/admanager/thread/241925081
 * - See: https://developer.mozilla.org/en-US/docs/Web/API/HTMLIFrameElement/allowPaymentRequest
 *
 * Tokenization note for digital wallets:
 * Digital wallet transactions return single-use tokens, not actual card numbers.
 * Do not store these tokens for business logic, analytics, or customer identification.
 * Use stable identifiers like Hyp transaction IDs or your internal order references instead.
 */

/**
 * Injects the Apple Pay iframe script required by Hyp for Apple Pay support
 * in iframe-based payment pages.
 * @param {'sandbox'|'production'} environment - The deployment environment
 */
const loadApplePayIframeScript = (environment = 'sandbox') => {
    return new Promise((resolve, reject) => {
        const scriptSrc = environment === 'production'
            ? 'https://pps.creditguard.co.il/plugins/applePayOnIframe.js'
            : 'https://ppsuat.creditguard.co.il/plugins/applePayOnIframe.js';

        // Check if script already exists
        if (document.querySelector(`script[src="${scriptSrc}"]`)) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = scriptSrc;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load Apple Pay script: ${scriptSrc}`));
        document.head.appendChild(script);
    });
};

/**
 * HypIframeModal - Embedded Payment Page for Hyp/CreditGuard
 * 
 * מציג את דף התשלום של Hyp בתוך iframe במודל.
 * Hyp מארחת את דף התשלום בדומיין חיצוני (cross-origin).
 * לאחר סיום התשלום, Hyp מפנה את ה-iframe לאחד מהנתיבים שהגדרנו:
 *   successUrl → /payment-success?Order=xxx
 *   errorUrl   → /checkout?Order=xxx&payment_error=true
 *   cancelUrl  → /checkout?Order=xxx&payment_error=true&cancelled=true
 * 
 * מכיוון שהנתיבים האלה הם באותו Origin שלנו,
 * נוכל לזהות מתי ה-iframe נותב אליהם על ידי פולינג (try/catch על iframe.location).
 */
const HypIframeModal = ({ isOpen, paymentUrl, onSuccess, onError, onCancel, production }) => {
    const iframeRef = useRef(null);
    const pollingRef = useRef(null);
    const [status, setStatus] = useState('idle'); // idle | loading | success | error | cancelled
    const [errorMessage, setErrorMessage] = useState('');
    const [applePayReady, setApplePayReady] = useState(false);

    // זיהוי מתי ה-iframe חוזר לדומיין שלנו (סיום תשלום)
    const detectRedirect = useCallback(() => {
        try {
            const iframe = iframeRef.current;
            if (!iframe || !iframe.contentWindow) return false;

            const iframeLocation = iframe.contentWindow.location.href;
            if (!iframeLocation || iframeLocation === 'about:blank') return false;

            // הצלחנו לקרוא את ה-location → ה-iframe בדומיין שלנו
            const url = new URL(iframeLocation);

            // זיהוי הפניה להצלחה
            if (url.pathname.includes('/payment-success')) {
                const orderId = url.searchParams.get('Order');
                setStatus('success');
                clearInterval(pollingRef.current);
                pollingRef.current = null;
                setTimeout(() => {
                    const allParams = Object.fromEntries(url.searchParams.entries());
                    onSuccess?.({ Order: orderId, ...allParams });
                    // Redirect the main window to process the payment verification
                    window.location.href = iframeLocation;
                }, 800);
                return true;
            }

            // זיהוי הפניה לשגיאה
            if (url.pathname.includes('/checkout') && url.searchParams.get('payment_error') === 'true') {
                const errorCode = url.searchParams.get('error_code');
                const cancelled = url.searchParams.get('cancelled') === 'true';

                clearInterval(pollingRef.current);
                pollingRef.current = null;

                if (cancelled) {
                    setStatus('cancelled');
                    setTimeout(() => onCancel?.(), 500);
                } else {
                    setStatus('error');
                    if (errorCode === '121') {
                        setErrorMessage('התשלום נדחה על ידי חברת האשראי (חריגה ממסגרת או כרטיס חסום). אנא נסה כרטיס אחר.');
                    } else {
                        setErrorMessage('התשלום נדחה. אנא נסה שוב עם כרטיס אחר.');
                    }
                    setTimeout(() => onError?.({ error_code: errorCode }), 500);
                }
                return true;
            }

            return false;
        } catch (e) {
            // Cross-origin error → ה-iframe עדיין בדומיין של Hyp
            return false;
        }
    }, [onSuccess, onError, onCancel]);

    // טעינת סקריפט Apple Pay לאינטגרציית iframe (כנדרש בתיעוד Hyp)
    // ראה: https://docs.hyp.co.il/enterprise/payment-page-integration/hypwallets/apple-pay
    useEffect(() => {
        if (!isOpen) return;

        const env = production ? 'production' : 'sandbox';
        loadApplePayIframeScript(env)
            .then(() => {
                console.log('[HypIframeModal] Apple Pay iframe script loaded successfully');
                setApplePayReady(true);
            })
            .catch((err) => {
                console.warn('[HypIframeModal] Apple Pay script not loaded (non-critical):', err);
                // Apple Pay script is only needed for Apple Pay to work in iframe.
                // Other payment methods (credit card, Google Pay, bit) work without it.
                setApplePayReady(true); // Continue anyway
            });
    }, [isOpen, production]);

    // טעינת ה-iframe והתחלת פולינג
    useEffect(() => {
        if (isOpen && paymentUrl) {
            setStatus('loading');
            setErrorMessage('');

            const iframe = iframeRef.current;
            if (iframe) {
                iframe.src = paymentUrl;
            }

            // התחלת פולינג כל 500ms לזיהוי הפנייה חזרה לדומיין שלנו
            pollingRef.current = setInterval(detectRedirect, 500);
        }

        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
        };
    }, [isOpen, paymentUrl, detectRedirect]);

    // האזנה להודעות postMessage מ-Hyp
    useEffect(() => {
        if (!isOpen) return;

        const handleMessage = (event) => {
            // סינון לפי אוריג'ינים מורשים של Hyp / CreditGuard
            const isHypOrigin = event.origin.includes('creditguard.co.il') ||
                event.origin.includes('hyp.co.il');

            if (!isHypOrigin) return;

            const data = event.data;
            console.log('Hyp Event Received:', data);

            if (data) {
                if (data.CCode === '0' || data.status === 'success' || data.event === 'payment_success') {
                    setStatus('success');
                    clearInterval(pollingRef.current);
                    pollingRef.current = null;
                    setTimeout(() => onSuccess?.(data), 500);
                } else if (data.CCode && data.CCode !== '0') {
                    setStatus('error');
                    setErrorMessage('התשלום נדחה. אנא נסה כרטיס אחר.');
                    clearInterval(pollingRef.current);
                    pollingRef.current = null;
                    setTimeout(() => onError?.(data), 500);
                } else if (data.action === 'cancel' || data.event === 'cancel') {
                    clearInterval(pollingRef.current);
                    pollingRef.current = null;
                    setStatus('cancelled');
                    onCancel?.();
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [isOpen, onSuccess, onError, onCancel]);

    const handleIframeLoad = () => {
        // כשהאייפרם נטען בהתחלה (דף Hyp) - עצרנו להראות לודר
        setStatus('idle');
    };

    const handleClose = () => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
        onCancel?.();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" dir="rtl">
            <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">

                {/* כפתור סגירה עליון */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10 transition-colors p-1 rounded-full hover:bg-gray-100"
                    aria-label="סגור"
                    disabled={status === 'success'}
                >
                    <X size={20} />
                </button>

                {/* כותרת המודל */}
                <div className="p-6 border-b border-gray-100">
                    <h3 className="font-bold text-lg text-gray-800">תשלום מאובטח באשראי</h3>
                    <p className="text-xs text-gray-400 mt-0.5">מופעל על-ידי Hyp / CreditGuard</p>
                </div>

                {/* אזור ה-iframe והטעינה */}
                <div className="flex-1 relative bg-gray-50/50 min-h-[520px] flex flex-col">

                    {/* אינדיקטור טעינה */}
                    {status === 'loading' && (
                        <div className="absolute inset-0 bg-white z-10 flex flex-col items-center justify-center gap-3">
                            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm text-gray-500 font-medium">טוען מסוף תשלום מאובטח...</p>
                        </div>
                    )}

                    {/* שגיאה */}
                    {status === 'error' && (
                        <div className="absolute inset-0 bg-white z-10 flex flex-col items-center justify-center p-8 text-center gap-3">
                            <AlertCircle size={40} className="text-red-500" />
                            <p className="text-base font-bold text-gray-800">התשלום לא התקבל</p>
                            <p className="text-sm text-gray-500 max-w-xs">{errorMessage}</p>
                            <button
                                onClick={handleClose}
                                className="mt-4 px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:opacity-90 transition"
                            >
                                חזור ונסה שוב
                            </button>
                        </div>
                    )}

                    {/* בוטל על ידי המשתמש */}
                    {status === 'cancelled' && (
                        <div className="absolute inset-0 bg-white z-10 flex flex-col items-center justify-center p-8 text-center gap-3">
                            <AlertCircle size={40} className="text-amber-500" />
                            <p className="text-base font-bold text-gray-800">התשלום בוטל</p>
                            <p className="text-sm text-gray-500">ביטלת את התשלום לפני השלמתו.</p>
                        </div>
                    )}

                    {/* הצלחה */}
                    {status === 'success' && (
                        <div className="absolute inset-0 bg-white z-10 flex flex-col items-center justify-center gap-3">
                            <CheckCircle size={50} className="text-green-500 animate-bounce" />
                            <p className="text-lg font-bold text-gray-800">התשלום בוצע בהצלחה!</p>
                            <p className="text-xs text-gray-500">מיד תועבר לדף אישור ההזמנה...</p>
                        </div>
                    )}

                    {/* ה-iframe עצמו */}
                    {/* 
                      HYP_DIGITAL_WALLETS_INTEGRATION:
                      - allow="payment" attribute is required for digital wallets (Apple Pay, Google Pay)
                        to work in iframe context. See Hyp troubleshooting:
                        https://support.google.com/admanager/thread/241925081
                      - allowPaymentRequest property (React-specific) enables payment request API in iframe
                        https://developer.mozilla.org/en-US/docs/Web/API/HTMLIFrameElement/allowPaymentRequest
                    */}
                    <iframe
                        ref={iframeRef}
                        src={paymentUrl || ''}
                        title="תשלום מאובטח באשראי"
                        className={`w-full flex-1 border-0 ${status === 'success' || status === 'error' || status === 'cancelled' ? 'opacity-30 pointer-events-none' : ''}`}
                        style={{ minHeight: '520px' }}
                        allow="payment; clipboard-read; clipboard-write; publickey-credentials-get 'src https://*.creditguard.co.il https://*.hyp.co.il'"
                        allowPaymentRequest={true}
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
                        onLoad={handleIframeLoad}
                    />
                </div>

                {/* פוטר אבטחה */}
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-2">
                    <Lock size={12} className="text-gray-400" />
                    <p className="text-[11px] text-gray-400 font-medium">חיבור מוצפן SSL | עומד בתקן האבטחה המחמיר PCI-DSS</p>
                </div>
            </div>
        </div>
    );
};

export default HypIframeModal;
