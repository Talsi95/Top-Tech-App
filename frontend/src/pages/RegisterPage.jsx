import useStoreNavigate from '../hooks/useStoreNavigate';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { User, Mail, Phone, Lock, ChevronLeft, ArrowRight, LogIn, ShieldCheck } from 'lucide-react';
import StoreLink from '../components/StoreLink';

const RegisterPage = ({ showNotification }) => {
    const navigate = useStoreNavigate();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const isValidPhone = (phone) => {
        const phoneRegex = /^0(5\d|2|3|4|8|9)-?\d{7}$/;
        return phoneRegex.test(phone);
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        if (phone && !isValidPhone(phone)) {
            showNotification('אנא הזן מספר טלפון תקין (למשל 0501234567)', 'error');
            return;
        }

        setIsLoading(true);
        try {
            await axios.post(`${__API_URL__}/auth/register`, {
                username,
                email,
                phone,
                password,
            });

            showNotification('ההרשמה הסתיימה בהצלחה, כעת ניתן להתחבר', 'success');
            navigate('/login');
        } catch (error) {
            let errorMessage = 'אופס.. ההרשמה נכשלה';
            if (error.response?.data?.errors) {
                errorMessage = error.response.data.errors[0].msg;
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            showNotification(errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6 py-20 relative overflow-hidden" dir="rtl">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -ml-64 -mt-64" />
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -mr-64 -mb-64" />

            <div className="w-full max-w-[540px] animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="bg-white rounded-[3rem] shadow-[0_30px_80px_-15px_rgba(0,0,0,0.08)] border border-gray-50 p-10 lg:p-14 relative z-10 overflow-hidden">
                    <div className="text-center mb-10">
                        <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-3">הצטרפו אלינו</h1>
                        <p className="text-gray-400 font-medium">צרו חשבון חדש ותיהנו מחוויית קנייה מתקדמת</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-4">שם מלא</label>
                                <div className="relative group">
                                    <User className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                                    <input
                                        type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
                                        placeholder="ישראל ישראלי"
                                        className="w-full bg-gray-50 border border-gray-100 focus:border-primary focus:bg-white rounded-2xl py-4 pr-12 pl-4 outline-none font-bold text-gray-900 transition-all placeholder:text-gray-300"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-4">טלפון</label>
                                <div className="relative group">
                                    <Phone className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                                    <input
                                        type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
                                        placeholder="05X-XXXXXXX"
                                        className="w-full bg-gray-50 border border-gray-100 focus:border-primary focus:bg-white rounded-2xl py-4 pr-12 pl-4 outline-none font-bold text-gray-900 transition-all placeholder:text-gray-300"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-4">כתובת אימייל</label>
                            <div className="relative group">
                                <Mail className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="w-full bg-gray-50 border border-gray-100 focus:border-primary focus:bg-white rounded-2xl py-4 pr-12 pl-6 outline-none font-bold text-gray-900 transition-all placeholder:text-gray-300"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-4">סיסמה</label>
                            <div className="relative group">
                                <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                                    placeholder="לפחות 6 תווים"
                                    className="w-full bg-gray-50 border border-gray-100 focus:border-primary focus:bg-white rounded-2xl py-4 pr-12 pl-6 outline-none font-bold text-gray-900 transition-all placeholder:text-gray-300"
                                />
                            </div>
                        </div>

                        <div className="flex items-start gap-3 px-2 py-2">
                            <div className="mt-1">
                                <ShieldCheck size={16} className="text-primary" />
                            </div>
                            <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
                                בלחיצה על כפתור ההרשמה אני מאשר את <StoreLink to="/terms" className="text-primary font-bold hover:underline">תנאי השימוש</StoreLink> ו<StoreLink to="/privacy" className="text-primary font-bold hover:underline">מדיניות הפרטיות</StoreLink> של האתר.
                            </p>
                        </div>

                        <button
                            type="submit" disabled={isLoading}
                            className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:bg-gray-200 disabled:text-gray-400"
                        >
                            {isLoading ? 'יוצר חשבון...' : (
                                <>
                                    <span>הרשמה וסיום</span>
                                    <ChevronLeft size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-10 border-t border-gray-50 text-center space-y-4">
                        <p className="text-gray-400 font-medium">כבר רשום במערכת?</p>
                        <StoreLink to="/login" className="flex items-center justify-center gap-2 w-full py-4 bg-gray-50 text-gray-900 rounded-2xl font-black hover:bg-gray-100 transition-all">
                            <LogIn size={18} />
                            <span>כניסה לחשבון קיים</span>
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

export default RegisterPage;