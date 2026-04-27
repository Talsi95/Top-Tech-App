import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import axios from 'axios';

const LoginPage = ({ showNotification }) => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [loginMethod, setLoginMethod] = useState('password'); // 'password' או 'phone'
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
        try {
            const response = await axios.post(`${__API_URL__}/auth/login`, { email, password });
            const { token } = response.data;
            login(token);
            showNotification('התחברת בהצלחה', 'success');
            navigate('/');
        } catch (error) {
            handleError(error);
        }
    };

    const handleRequestOTP = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const recaptchaContainer = document.getElementById('recaptcha-container');
        if (recaptchaContainer) {
            recaptchaContainer.innerHTML = '';
        }

        try {
            const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible',
                'callback': (response) => {
                }
            });

            let formattedPhone = phone.trim();
            if (formattedPhone.startsWith('0')) {
                formattedPhone = '+972' + formattedPhone.substring(1);
            } else if (!formattedPhone.startsWith('+')) {
                formattedPhone = '+972' + formattedPhone;
            }

            const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
            setConfirmationResult(confirmation);
            setIsOtpSent(true);
            showNotification('קוד אימות נשלח לנייד', 'success');

        } catch (error) {
            console.error("Firebase Auth Error", error);
            if (window.recaptchaWidgetId !== undefined) {
                window.grecaptcha.reset(window.recaptchaWidgetId);
            }
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
            const firebaseUser = result.user;

            const response = await axios.post(`${__API_URL__}/guest/verify-firebase`, {
                token: await firebaseUser.getIdToken(),
            });

            login(response.data.guestToken, true);
            navigate('/');
        } catch (error) {
            const serverMessage = error.response?.data?.message;

            if (serverMessage) {
                showNotification(serverMessage, 'error');
            } else {
                showNotification('קוד שגוי או תקלה באימות', 'error');
            }
            console.error("Verification error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleError = (error) => {
        if (error.response) {
            const { errorCode } = error.response.data;
            const errorMessage = errorMessages[errorCode] || error.response.data.message || 'אירעה שגיאה';
            showNotification(errorMessage, 'error');
        } else {
            showNotification(`אופס יש תקלה: ${error.message}`, 'error');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
                <h2 className="text-center text-3xl font-bold text-gray-900">
                    התחברות
                </h2>

                <div className="flex border-b">
                    <button
                        className={`flex-1 py-2 text-sm font-medium ${loginMethod === 'password' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500'}`}
                        onClick={() => { setLoginMethod('password'); setIsOtpSent(false); }}
                    >
                        מייל וסיסמה
                    </button>
                    <button
                        className={`flex-1 py-2 text-sm font-medium ${loginMethod === 'phone' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500'}`}
                        onClick={() => setLoginMethod('phone')}
                    >
                        מספר טלפון
                    </button>
                </div>

                {loginMethod === 'password' ? (
                    <form className="mt-8 space-y-6" onSubmit={handlePasswordSubmit}>
                        <div className="rounded-md shadow-sm -space-y-px">
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
                                כתובת אימייל:
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-green-500 focus:border-green-500 z-10 sm:text-sm"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">
                                סיסמה:
                            </label>
                            <input
                                id="password"
                                type="password"
                                required
                                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-green-500 focus:border-green-500 z-10 sm:text-sm"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-between items-center">
                            <Link to="/forgot-password" size="sm" className="text-xs text-green-600 hover:text-green-500">
                                שכחתי סיסמא?
                            </Link>
                        </div>
                        <button
                            type="submit"
                            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                        >
                            התחבר
                        </button>
                    </form>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={isOtpSent ? handleVerifyOTP : handleRequestOTP}>
                        <div id="recaptcha-container" className="rounded-md shadow-sm">
                            <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1">
                                מספר טלפון:
                            </label>
                            <input
                                id='phone'
                                type="tel"
                                required
                                disabled={isOtpSent}
                                className={`relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 ${isOtpSent ? 'rounded-t-md bg-gray-50' : 'rounded-md'} focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm`}
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                            {isOtpSent && (
                                <input
                                    type="text"
                                    required
                                    placeholder='הזן את קוד האימות'
                                    className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                />
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                        >
                            {isLoading ? 'טוען...' : (isOtpSent ? 'אמת קוד וכנס' : 'שלח קוד אימות')}
                        </button>
                        {isOtpSent && (
                            <button
                                type="button"
                                className="w-full text-xs text-gray-500 hover:text-gray-700"
                                onClick={() => { setIsOtpSent(false); setOtp(''); }}
                            >
                                שינוי מספר טלפון
                            </button>
                        )}
                    </form>
                )}

                <div className="text-center text-sm text-gray-600">
                    <Link to="/register" className="font-medium text-green-600 hover:text-green-500">
                        עדיין אין לך חשבון? הרשמה
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;