import { useState } from 'react';
import axios from 'axios';
import useStoreNavigate from '../hooks/useStoreNavigate';
import StoreLink from '../components/StoreLink';
import { Mail, ShieldCheck, ChevronLeft, ArrowRight } from 'lucide-react';

/**
 * ForgotPassword Component.
 * Allows users to request a password reset link by providing their email address.
 */
const ForgotPassword = () => {
    const navigate = useStoreNavigate();
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    /**
     * Handles the password reset request submission.
     * @param {Event} e - The form submission event.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setIsLoading(true);

        try {
            const response = await axios.post(`${__API_URL__}/auth/forgot-password`, { email });
            setMessage(response.data.message || 'קישור לאיפוס סיסמה נשלח לכתובת המייל שלך. אנא בדוק את תיבת הדואר הנכנס.');
        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError('שגיאה בשליחת הבקשה. אנא נסה שנית מאוחר יותר.');
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
                        <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-3">שחזור סיסמה</h1>
                        <p className="text-gray-400 font-medium">הזן את כתובת המייל שלך לקבלת קישור לאיפוס</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-4">כתובת אימייל</label>
                            <div className="relative group">
                                <Mail className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
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
                            {isLoading ? 'שולח קישור...' : (
                                <>
                                    <span>שלח קישור איפוס</span>
                                    <ChevronLeft size={20} />
                                </>
                            )}
                        </button>
                    </form>

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

export default ForgotPassword;