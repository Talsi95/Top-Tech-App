import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Send, Lock, MapPin, Phone, LogIn } from 'lucide-react';

const DetailsForm = ({ phone, setPhone, email, setEmail, shippingAddress, handleAddressChange, handleRequestOTP, loading, navigate }) => (
    <form onSubmit={handleRequestOTP} className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">1. פרטי טלפון ומשלוח</h3>

        <div className="relative">
            <Phone className="absolute top-3 right-3 text-gray-400" size={20} />
            <input
                type="tel"
                placeholder="מספר טלפון (בפורמט בינלאומי +XXX)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-right"
                dir="rtl"
            />
        </div>

        <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
                כתובת אימייל (לקבלת אישור הזמנה)
            </label>
            <input
                id="email"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
        </div>

        <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
            <h4 className="font-medium flex items-center justify-end text-sm text-gray-700">
                פרטי משלוח <MapPin className="mr-2 text-blue-500" size={20} />
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                    type="text"
                    name="city"
                    placeholder="עיר"
                    value={shippingAddress.city}
                    onChange={handleAddressChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg text-right"
                    dir="rtl"
                />
                <input
                    type="text"
                    name="street"
                    placeholder="רחוב ומספר בית"
                    value={shippingAddress.street}
                    onChange={handleAddressChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg text-right"
                    dir="rtl"
                />
                <input
                    type="text"
                    name="zipCode"
                    placeholder="מיקוד"
                    value={shippingAddress.zipCode}
                    onChange={handleAddressChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg text-right"
                    dir="rtl"
                />
            </div>
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

const GuestCheckoutPage = ({ showNotification }) => {
    const navigate = useNavigate();

    const [step, setStep] = useState('details');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);

    const [shippingAddress, setShippingAddress] = useState({
        street: '',
        city: '',
        zipCode: '',
    });

    const handleAddressChange = (e) => {
        setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
    };

    const handleRequestOTP = async (e) => {
        e.preventDefault();

        const addressFields = [shippingAddress.street, shippingAddress.city, shippingAddress.zipCode];

        if (!phone.startsWith('+') || phone.length < 10) {
            showNotification('אנא הזן מספר טלפון בפורמט בינלאומי (+XXX...).', 'error');
            return;
        }

        if (addressFields.some(field => field.trim() === '')) {
            showNotification('אנא מלא את כל פרטי המשלוח.', 'error');
            return;
        }

        setLoading(true);
        showNotification('מבקש קוד אימות Twilio...', 'success');
        try {
            await axios.post(`${__API_URL__}/guest/request-verify-otp`, {
                phone,
                email,
                shippingAddress: { ...shippingAddress, phone }
            });

            showNotification(`קוד אימות נשלח לטלפון ${phone}.`, 'success');
            setStep('otp');

        } catch (error) {
            const message = error.response?.data?.message || 'שליחת ה-SMS נכשלה. נסה שוב.';
            showNotification(message, 'error');

            console.warn("Bypass activated: Continuing to OTP step despite API failure for testing purposes.");
            setStep('otp');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();

        if (otp.length !== 6) {
            showNotification('קוד האימות חייב להיות בן 6 ספרות.', 'error');
            return;
        }

        setLoading(true);
        showNotification('מאמת קוד Twilio...', 'success');
        try {
            const response = await axios.post(`${__API_URL__}/guest/verify-check-otp`, {
                phone,
                otp
            });
            const data = response.data;

            localStorage.setItem('guestEmailForOrder', email);

            showNotification('אימות הושלם בהצלחה! מנתב לקופה.', 'success');

            navigate('/checkout', {
                state: {
                    guestToken: data.guestToken,
                    guestShippingAddress: {
                        ...data.shippingAddress,
                        email: email
                    }
                }
            });

        } catch (error) {
            const message = error.response?.data?.message || 'אימות נכשל. הקוד לא תקין או פג תוקף.';
            showNotification(message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4" dir="rtl">
            <div className="w-full max-w-lg bg-white p-6 sm:p-8 rounded-xl shadow-2xl border-t-4 border-blue-600">
                <h1 className="text-3xl font-extrabold text-center mb-6 text-gray-900">
                    המשך הזמנה כאורח
                </h1>

                <div className="bg-white p-4 rounded-lg">
                    {step === 'details' ? (
                        <DetailsForm
                            phone={phone}
                            setPhone={setPhone}
                            email={email}
                            setEmail={setEmail}
                            shippingAddress={shippingAddress}
                            handleAddressChange={handleAddressChange}
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
            </div>
        </div>
    );
};

export default GuestCheckoutPage;