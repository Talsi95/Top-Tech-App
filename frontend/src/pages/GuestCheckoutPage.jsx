import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Send, Lock, MapPin, Phone, LogIn, Mail } from 'lucide-react';
import { auth } from '../firebaseConfig';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { useAuth } from '../AuthContext';

const DetailsForm = ({ phone, setPhone, email, setEmail, handleRequestOTP, loading, navigate }) => (
    <form onSubmit={handleRequestOTP} className="space-y-6">
        <h3 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-4 mb-6">1. פרטים למעקב הזמנה</h3>

        <div className="space-y-4">
            <div className="relative group">
                <Phone className="absolute top-3 right-4 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                <input
                    type="tel"
                    placeholder="מספר טלפון"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full p-4 pr-12 bg-surface-container border-none rounded-xl focus:ring-2 focus:ring-primary transition-all text-right outline-none"
                    dir="rtl"
                />
            </div>

            <div className="relative group">
                <Mail className="absolute top-3 right-4 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                <input
                    type="email"
                    placeholder="מייל"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full p-4 pr-12 bg-surface-container border-none rounded-xl focus:ring-2 focus:ring-primary transition-all text-right outline-none"
                />
            </div>
        </div>

        <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center items-center py-4 rounded-xl text-white font-bold text-lg shadow-lg transform transition-all active:scale-95 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary-hover hover:shadow-primary/30'
                }`}
        >
            {loading ? <span className="animate-pulse">שולח...</span> : <><Send className="ml-2" size={20} /> שלח קוד אימות ב-SMS</>}
        </button>

        <div className="text-center pt-2">
            <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-primary font-semibold hover:text-primary-hover transition-colors flex items-center justify-center w-full group"
            >
                <LogIn className="ml-2 group-hover:translate-x-1 transition-transform" size={18} /> או התחבר לחשבון קיים
            </button>
        </div>
    </form>
);

const OTPForm = ({ phone, otp, setOtp, handleVerifyOTP, loading, setStep, showNotification }) => (
    <form onSubmit={handleVerifyOTP} className="space-y-6">
        <h3 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-4 mb-6">2. אימות קוד חד-פעמי</h3>

        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
            <p className="text-sm text-gray-700 text-right leading-relaxed">
                נא להזין את הקוד בן 6 הספרות שנשלח למספר <span className="font-bold text-primary">{phone}</span>.
            </p>
        </div>

        <div className="relative">
            <Lock className="absolute top-4 right-4 text-gray-400" size={22} />
            <input
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                required
                className="w-full p-4 pr-12 bg-surface-container border-none rounded-xl focus:ring-2 focus:ring-primary transition-all text-center tracking-[1rem] text-2xl font-bold outline-none"
            />
        </div>

        <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center items-center py-4 rounded-xl text-white font-bold text-lg shadow-lg transform transition-all active:scale-95 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 hover:shadow-green-500/30'
                }`}
        >
            {loading ? <span className="animate-pulse">מאמת...</span> : <><Lock className="ml-2" size={20} /> אמת והמשך לקופה</>}
        </button>

        <div className="text-center pt-2">
            <button
                type="button"
                onClick={() => {
                    setStep('details');
                    setOtp('');
                    showNotification('אנא שלח קוד חדש.', 'info');
                }}
                className="text-red-500 font-medium hover:text-red-600 transition-colors"
                disabled={loading}
            >
                שלח קוד חדש / שינוי מספר
            </button>
        </div>
    </form>
);

/**
 * GuestCheckoutPage Component.
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

    const handleRequestOTP = async (e) => {
        e.preventDefault();
        setLoading(true);

        const recaptchaContainer = document.getElementById('recaptcha-container');
        if (recaptchaContainer) {
            recaptchaContainer.innerHTML = '';
        }

        try {
            const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible'
            });

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
        <div className="min-h-screen bg-surface flex items-center justify-center p-4 md:p-12 lg:p-24" dir="rtl">
            <div className="w-full max-w-xl lg:max-w-[1440px] bg-white/70 backdrop-blur-xl rounded-[3rem] shadow-[0_40px_120px_rgba(0,0,0,0.15)] border border-white/60 overflow-hidden">
                <div className="flex flex-col lg:flex-row">
                    {/* Visual Section - Visible only on Desktop */}
                    <div className="hidden lg:flex lg:w-1/2 bg-primary p-16 flex-col justify-center text-white space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                <path d="M0 0 L100 100 M100 0 L0 100" stroke="currentColor" strokeWidth="0.5" />
                            </svg>
                        </div>
                        <h2 className="text-5xl font-black leading-tight">שמחים שאתה כאן!</h2>
                        <p className="text-xl opacity-90 leading-relaxed font-medium">
                            אנחנו ב-Top Tech מחויבים לחוויית הקנייה הטובה ביותר. הזן את פרטיך ונוכל לעדכן אותך בכל שלב בדרך.
                        </p>
                        <div className="pt-8 flex items-center space-x-4 space-x-reverse">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                                <Lock size={24} />
                            </div>
                            <span className="text-lg font-bold">אימות מאובטח ומהיר</span>
                        </div>
                    </div>

                    {/* Form Section */}
                    <div className="w-full lg:w-1/2 p-8 md:p-16">
                        <div className="text-center lg:text-right mb-12">
                            <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
                                פרטי התקשרות
                            </h1>
                            <p className="text-lg text-gray-600 font-medium">
                                נא להזין טלפון ומייל למעקב אחר ההזמנה
                            </p>
                        </div>

                        <div className="relative">
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
            </div>
        </div>
    );
};

export default GuestCheckoutPage;