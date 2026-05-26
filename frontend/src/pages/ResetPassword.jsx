import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import useStoreNavigate from '../hooks/useStoreNavigate';
import StoreLink from '../components/StoreLink';
import { Lock, ShieldCheck, ChevronLeft, ArrowRight } from 'lucide-react';

/**
 * ResetPassword Component.
 * Provides a form for users to enter a new password after verifying a reset token.
 */
const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useStoreNavigate();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const urlToken = searchParams.get('token');
        if (urlToken) {
            setToken(urlToken);
        } else {
            setError('לא נמצא מפתח (Token) לאיפוס סיסמה. הקישור אינו תקין.');
        }
    }, [searchParams]);

    /**
     * Handles the password reset form submission.
     * @param {Event} e - The form submission event.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (!token) {
            setError('שגיאה: מפתח איפוס חסר. אנא נסו לשחזר את הסיסמה שוב.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('הסיסמאות אינן תואמות.');
            return;
        }

        setIsLoading(true);
        try {
            await axios.post(`${__API_URL__}/auth/reset-password`, { token, newPassword });
            setMessage('הסיסמה אופסה בהצלחה! מועבר לדף ההתחברות...');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError('שגיאה באיפוס הסיסמה. אנא נסה שנית מאוחר יותר.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6 py-20 relative overflow-hidden" dir="rtl">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -mr-64 -mt-64" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -ml-64 -mb-64" />

            <div className="w-full max-w-[480px] animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="bg-white rounded-[3rem] shadow-[0_30px_80px_-15px_rgba(0,0,0,0.08)] border border-gray-50 p-10 lg:p-14 relative z-10 overflow-hidden">
                    <div className="text-center mb-10">
                        <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-3">איפוס סיסמה</h1>
                        <p className="text-gray-400 font-medium">הגדר סיסמה חדשה ומאובטחת לחשבונך</p>
                    </div>

                    {!token && error ? (
                        <div className="space-y-6 text-center">
                            <div className="bg-red-50 text-red-600 p-4 rounded-2xl font-bold text-sm">
                                {error}
                            </div>
                            <StoreLink to="/forgot-password" className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-bold shadow-md hover:bg-black transition-all">
                                <span>בקש קישור חדש</span>
                                <ChevronLeft size={16} />
                            </StoreLink>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-4">סיסמה חדשה</label>
                                <div className="relative group">
                                    <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                                    <input
                                        type="password"
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-gray-50 border border-gray-100 focus:border-primary focus:bg-white rounded-2xl py-4 pr-14 pl-6 outline-none font-bold text-gray-900 transition-all placeholder:text-gray-300"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-4">אימות סיסמה</label>
                                <div className="relative group">
                                    <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-gray-50 border border-gray-100 focus:border-primary focus:bg-white rounded-2xl py-4 pr-14 pl-6 outline-none font-bold text-gray-900 transition-all placeholder:text-gray-300"
                                    />
                                </div>
                            </div>

                            {message && (
                                <div className="bg-green-50 text-green-700 p-4 rounded-2xl font-bold text-center text-sm flex items-center justify-center gap-2">
                                    <ShieldCheck className="w-5 h-5 shrink-0" />
                                    <span>{message}</span>
                                </div>
                            )}

                            {error && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-2xl font-bold text-center text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:bg-gray-200 disabled:text-gray-400 cursor-pointer"
                            >
                                {isLoading ? 'מעדכן סיסמה...' : (
                                    <>
                                        <span>אפס סיסמה</span>
                                        <ChevronLeft size={20} />
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    <div className="mt-8 pt-8 border-t border-gray-50 text-center">
                        <StoreLink to="/login" className="text-gray-400 hover:text-gray-900 text-sm font-bold flex items-center justify-center gap-2">
                            <span>חזרה לדף ההתחברות</span>
                            <ArrowRight size={16} />
                        </StoreLink>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;