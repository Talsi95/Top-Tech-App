import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Send, Lock, MapPin, Phone, LogIn, Mail } from 'lucide-react';
import { auth } from '../firebaseConfig';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { useAuth } from '../AuthContext';

const DetailsForm = ({ phone, setPhone, email, setEmail, shippingAddress, handleAddressChange, handleRequestOTP, loading, navigate }) => (
    <form onSubmit={handleRequestOTP} className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">1. פרטים למעקב הזמנה</h3>

        <div className="relative">
            <Phone className="absolute top-3 right-3 text-gray-400" size={20} />
            <input
                type="tel"
                placeholder="מספר טלפון"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-right"
                dir="rtl"
            />
        </div>

        <div className="relative">
            <Mail className="absolute top-3 right-3 text-gray-400" size={20} />
            <input
                type="email"
                placeholder="מייל"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-right"
            />
        </div>

        <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center items-center py-3 rounded-lg text-white font-bold transition-colors ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
        >
            {loading ? 'שולח...' : <><Send className="ml-2" size={20} /> שלח קוד אימות ב-SMS</>}
        </button>
        <div className="text-center text-sm text-gray-600 mt-2">
            <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-blue-600 hover:underline flex items-center justify-center w-full"
            >
                <LogIn className="ml-1" size={16} /> או התחבר לחשבון קיים
            </button>
        </div>
    </form>
);

const OTPForm = ({ phone, otp, setOtp, handleVerifyOTP, loading, setStep, showNotification }) => (
    <form onSubmit={handleVerifyOTP} className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">2. אימות קוד חד-פעמי</h3>

        <p className="text-sm text-gray-600 text-right">
            נא להזין את הקוד בן 6 הספרות שנשלח למספר <span className="font-semibold text-blue-600">{phone}</span>.
        </p>

        <div className="relative">
            <Lock className="absolute top-3 right-3 text-gray-400" size={20} />
            <input
                type="text"
                placeholder="הזן קוד אימות (OTP)"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                required
                className="w-full p-3 pr-10 border border-gray-300 rounded-lg text-center tracking-widest text-lg font-mono"
            />
        </div>

        <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center items-center py-3 rounded-lg text-white font-bold transition-colors ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                }`}
        >
            {loading ? 'מאמת...' : <><Lock className="ml-2" size={20} /> אמת והמשך לקופה</>}
        </button>

        <div className="text-center text-sm text-gray-600 mt-2">
            <button
                type="button"
                onClick={() => {
                    setStep('details');
                    setOtp('');
                    showNotification('אנא שלח קוד חדש.', 'info');
                }}
                className="text-red-500 hover:underline"
                disabled={loading}
            >
                שלח קוד חדש / שינוי מספר
            </button>
        </div>
    </form>
);

/**
 * GuestCheckoutPage Component.
 * Manages the guest checkout flow, including phone/email collection, OTP verification, and redirection to payment.
 * 
 * @param {Object} props - Component props.
 * @param {Function} props.showNotification - Function to display a global notification.
 */
const GuestCheckoutPage = ({ showNotification }) => {
    const navigate = useNavigate();

    const { login } = useAuth();

    const [step, setStep] = useState('details');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState(null);


    /**
     * Sends a request to the backend to generate and send an OTP to the user's phone.
     * @param {Event} e - The form submission event.
     */
    // const handleRequestOTP = async (e) => {
    //     e.preventDefault();

    //     if (phone.length < 9) {
    //         showNotification('אנא הזן מספר טלפון תקין.', 'error');
    //         return;
    //     }

    //     setLoading(true);
    //     showNotification('מבקש קוד אימות Twilio...', 'success');
    //     try {
    //         await axios.post(`${__API_URL__}/guest/request-verify-otp`, {
    //             phone,
    //             email,
    //         });

    //         showNotification(`קוד אימות נשלח לטלפון ${phone}.`, 'success');
    //         setStep('otp');
    //         setLoading(false);

    //     } catch (error) {
    //         const message = error.response?.data?.message || 'שליחת ה-SMS נכשלה. נסה שוב.';
    //         showNotification(message, 'error');

    //         console.error("OTP Request failed:", message);
    //         setLoading(false);
    //     }
    // };

    const handleRequestOTP = async (e) => {
        e.preventDefault();
        setLoading(true);

        // 1. מציאת האלמנט וניקוי התוכן שלו כדי למנוע את השגיאה
        const recaptchaContainer = document.getElementById('recaptcha-container');
        if (recaptchaContainer) {
            recaptchaContainer.innerHTML = '';
        }

        try {
            // 2. יצירת ה-Verifier מחדש על אלמנט נקי
            const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible',
                'callback': (response) => {
                    // reCAPTCHA solved
                }
            });

            // פורמט מספר הטלפון (חשוב!)
            let formattedPhone = phone.trim();
            if (formattedPhone.startsWith('0')) {
                formattedPhone = '+972' + formattedPhone.substring(1);
            } else if (!formattedPhone.startsWith('+')) {
                formattedPhone = '+972' + formattedPhone;
            }

            const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
            setConfirmationResult(confirmation);

            setStep('otp');
            showNotification('קוד אימות נשלח לנייד', 'success');

        } catch (error) {
            console.error("Firebase Auth Error", error);
            showNotification('שגיאה בשליחת הקוד. וודא שהמספר תקין.', 'error');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Verifies the OTP entered by the user. If successful, stores the guest token and redirects to checkout.
     * @param {Event} e - The form submission event.
     */
    // const handleVerifyOTP = async (e) => {
    //     e.preventDefault();

    //     if (otp.length !== 6) {
    //         showNotification('קוד האימות חייב להיות בן 6 ספרות.', 'error');
    //         return;
    //     }

    //     setLoading(true);
    //     showNotification('מאמת קוד...', 'success');
    //     try {
    //         const response = await axios.post(`${__API_URL__}/guest/verify-otp`, {
    //             phone,
    //             otp
    //         });
    //         const data = response.data;

    //         localStorage.setItem('guestToken', data.guestToken);
    //         localStorage.setItem('guestEmail', data.email);

    //         showNotification('אימות הושלם בהצלחה! מנתב לקופה.', 'success');

    //         navigate('/checkout');

    //     } catch (error) {
    //         const message = error.response?.data?.message || 'אימות נכשל. הקוד לא תקין או פג תוקף.';
    //         showNotification(message, 'error');
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result = await confirmationResult.confirm(otp);
            const firebaseUser = result.user;

            const response = await axios.post(`${__API_URL__}/guest/verify-firebase`, {
                token: await firebaseUser.getIdToken(),
                email: email
            });
            const { guestToken } = response.data;
            login(guestToken, true);
            showNotification('אימות הושלם בהצלחה!', 'success');
            navigate('/checkout');
        } catch (error) {
            showNotification('קוד שגוי', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4" dir="rtl">
            <div className="w-full max-w-lg bg-white p-6 sm:p-8 rounded-xl shadow-2xl border-t-4 border-blue-600">
                <h1 className="text-3xl font-extrabold text-center mb-6 text-gray-900">
                    פרטי התקשרות ומעקב הזמנה
                </h1>

                <p className="text-center text-gray-600 mb-6 font-medium">
                    נא להזין טלפון ומייל שבאמצעותם תוכל לעקוב אחר סטטוס ההזמנה שלך
                </p>

                <div className="bg-white p-4 rounded-lg">
                    {step === 'details' ? (
                        <DetailsForm
                            phone={phone}
                            setPhone={setPhone}
                            email={email}
                            setEmail={setEmail}
                            handleRequestOTP={handleRequestOTP}
                            loading={loading}
                            navigate={navigate}
                        />
                    ) : (
                        <OTPForm
                            phone={phone}
                            otp={otp}
                            setOtp={setOtp}
                            handleVerifyOTP={handleVerifyOTP}
                            loading={loading}
                            setStep={setStep}
                            showNotification={showNotification}
                        />
                    )}
                </div>
                <div id="recaptcha-container"></div>
            </div>
        </div>
    );
};

export default GuestCheckoutPage;