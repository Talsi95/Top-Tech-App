import useStoreNavigate from '../hooks/useStoreNavigate';
import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { Link } from 'react-router-dom';;
import { auth } from '../firebaseConfig';
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { Mail, Phone, Lock, ChevronLeft, ArrowRight, ShieldCheck, UserPlus } from 'lucide-react';
import axios from 'axios';
import StoreLink from '../components/StoreLink';

const LoginPage = ({ showNotification }) => {
    const { login } = useAuth();
    const navigate = useStoreNavigate();

    const [loginMethod, setLoginMethod] = useState('password');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState(null);

    const errorMessages = {
        INVALID_PASSWORD: 'הסיסמה שגויה',
        USER_NOT_FOUND: 'המשתמש לא נמצא',
        VALIDATION_FAILED: 'הנתונים שהוזנו לא תקינים',
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await axios.post(`${__API_URL__}/auth/login`, { email, password });
            const { token } = response.data;
            login(token);
            showNotification('התחברת בהצלחה', 'success');
            
            // Decode token to check for super admin
            const decoded = JSON.parse(atob(token.split('.')[1]));
            if (decoded.isSuperAdmin) {
                window.location.href = '/super-admin';
            } else {
                navigate('/');
            }
        } catch (error) {
            handleError(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRequestOTP = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const recaptchaContainer = document.getElementById('recaptcha-container');
        if (recaptchaContainer) recaptchaContainer.innerHTML = '';

        try {
            const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { 'size': 'invisible' });
            let formattedPhone = phone.trim();
            if (formattedPhone.startsWith('0')) formattedPhone = '+972' + formattedPhone.substring(1);
            else if (!formattedPhone.startsWith('+')) formattedPhone = '+972' + formattedPhone;

            const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
            setConfirmationResult(confirmation);
            setIsOtpSent(true);
            showNotification('קוד אימות נשלח לנייד', 'success');
        } catch (error) {
            showNotification('שגיאה בשליחת הקוד', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const result = await confirmationResult.confirm(otp);
            const response = await axios.post(`${__API_URL__}/guest/verify-firebase`, {
                token: await result.user.getIdToken(),
            });
            login(response.data.guestToken, true);
            navigate('/');
        } catch (error) {
            showNotification(error.response?.data?.message || 'קוד שגוי או תקלה באימות', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleError = (error) => {
        const errorCode = error.response?.data?.errorCode;
        showNotification(errorMessages[errorCode] || error.response?.data?.message || 'אירעה שגיאה', 'error');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6 py-20 relative overflow-hidden" dir="rtl">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -mr-64 -mt-64" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -ml-64 -mb-64" />

            <div className="w-full max-w-[480px] animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="bg-white rounded-[3rem] shadow-[0_30px_80px_-15px_rgba(0,0,0,0.08)] border border-gray-50 p-10 lg:p-14 relative z-10 overflow-hidden">
                    <div className="text-center mb-10">
                        <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-3">ברוכים השבים</h1>
                        <p className="text-gray-400 font-medium">התחבר לחשבון שלך כדי להמשיך בחוויה</p>
                    </div>

                    {/* Login Method Tabs */}
                    <div className="flex bg-gray-50 p-1.5 rounded-2xl mb-8">
                        <button
                            onClick={() => { setLoginMethod('password'); setIsOtpSent(false); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${loginMethod === 'password' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <Mail size={18} />
                            <span>סיסמה</span>
                        </button>
                        <button
                            onClick={() => setLoginMethod('phone')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${loginMethod === 'phone' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <Phone size={18} />
                            <span>טלפון</span>
                        </button>
                    </div>

                    {loginMethod === 'password' ? (
                        <form onSubmit={handlePasswordSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-4">אימייל</label>
                                <div className="relative group">
                                    <Mail className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                                    <input
                                        type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        className="w-full bg-gray-50 border border-gray-100 focus:border-primary focus:bg-white rounded-2xl py-4 pr-14 pl-6 outline-none font-bold text-gray-900 transition-all placeholder:text-gray-300"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-4">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">סיסמה</label>
                                    <StoreLink to="/forgot-password" size="sm" className="text-xs font-bold text-primary hover:underline">שכחת סיסמה?</StoreLink>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                                    <input
                                        type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-gray-50 border border-gray-100 focus:border-primary focus:bg-white rounded-2xl py-4 pr-14 pl-6 outline-none font-bold text-gray-900 transition-all placeholder:text-gray-300"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit" disabled={isLoading}
                                className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:bg-gray-200 disabled:text-gray-400"
                            >
                                {isLoading ? 'מתחבר...' : (
                                    <>
                                        <span>התחברות למערכת</span>
                                        <ChevronLeft size={20} />
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={isOtpSent ? handleVerifyOTP : handleRequestOTP} className="space-y-6">
                            <div id="recaptcha-container" />
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-4">מספר טלפון</label>
                                <div className="relative group">
                                    <Phone className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                                    <input
                                        type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isOtpSent}
                                        placeholder="05X-XXXXXXX"
                                        className="w-full bg-gray-50 border border-gray-100 focus:border-primary focus:bg-white rounded-2xl py-4 pr-14 pl-6 outline-none font-bold text-gray-900 transition-all placeholder:text-gray-300 disabled:opacity-50"
                                    />
                                </div>
                            </div>
                            {isOtpSent && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-4">קוד אימות</label>
                                    <div className="relative group">
                                        <ShieldCheck className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                                        <input
                                            type="text" required value={otp} onChange={(e) => setOtp(e.target.value)}
                                            placeholder="הזן 6 ספרות"
                                            className="w-full bg-gray-50 border border-gray-100 focus:border-primary focus:bg-white rounded-2xl py-4 pr-14 pl-6 outline-none font-bold text-gray-900 tracking-[0.5em] transition-all text-center"
                                        />
                                    </div>
                                    <button type="button" onClick={() => setIsOtpSent(false)} className="text-xs font-bold text-primary mr-4">שינוי מספר טלפון</button>
                                </div>
                            )}
                            <button
                                type="submit" disabled={isLoading}
                                className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:bg-gray-200 disabled:text-gray-400"
                            >
                                {isLoading ? 'מעבד...' : (
                                    <>
                                        <span>{isOtpSent ? 'אימות קוד וכניסה' : 'שלח קוד אימות'}</span>
                                        <ChevronLeft size={20} />
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    <div className="mt-10 pt-10 border-t border-gray-50 text-center space-y-4">
                        <p className="text-gray-400 font-medium">עדיין אין לך חשבון?</p>
                        <StoreLink to="/register" className="flex items-center justify-center gap-2 w-full py-4 bg-gray-50 text-gray-900 rounded-2xl font-black hover:bg-gray-100 transition-all">
                            <UserPlus size={18} />
                            <span>צור חשבון חדש</span>
                        </StoreLink>
                    </div>
                </div>

                <div className="mt-8 flex items-center justify-center gap-6">
                    <StoreLink to="/" className="text-gray-400 hover:text-gray-900 text-sm font-bold flex items-center gap-2">
                        <ArrowRight size={16} />
                        <span>חזרה לדף הבית</span>
                    </StoreLink>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;