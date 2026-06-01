import { useState, useEffect } from 'react';
import useStoreNavigate from '../hooks/useStoreNavigate';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import { useStore } from '../StoreContext';

/**
 * CheckoutForm Component.
 * Collects shipping information and handles payment processing (Stripe or Cash on Delivery).
 * 
 * @param {Object} props - Component props.
 * @param {Array} props.cartItems - Items currently in the cart.
 * @param {Function} props.showNotification - Function to display a global notification.
 * @param {Function} props.onOrderComplete - Callback for successful order placement.
 * @param {string} props.guestToken - Authentication token for guest users.
 */
const CheckoutForm = ({ cartItems, showNotification, onOrderComplete, guestToken }) => {
    const navigate = useStoreNavigate();
    const { user, isGuest, getToken, logout } = useAuth();
    const { store } = useStore();

    const [formData, setFormData] = useState({
        fullName: !isGuest ? user?.username : '',
        street: '',
        city: '',
        phone: user?.phone || '',
        email: user?.email || '',
        paymentMethod: '',
        shippingMethod: ''
    });

    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
    const [couponError, setCouponError] = useState(null);

    useEffect(() => {
        if (store?.shippingOptions && store.shippingOptions.length > 0) {
            setFormData(prev => ({
                ...prev,
                shippingMethod: prev.shippingMethod || store.shippingOptions[0].name,
                paymentMethod: store.features?.hasCashPayment === false ? 'credit-card' : prev.paymentMethod
            }));
        } else if (store) {
            setFormData(prev => ({
                ...prev,
                shippingMethod: prev.shippingMethod || 'pickup-business',
                paymentMethod: store.features?.hasCashPayment === false ? 'credit-card' : prev.paymentMethod
            }));
        }
    }, [store]);

    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            if (user && !user.email && !isGuest) {
                try {
                    const token = localStorage.getItem('token');
                    const response = await axios.get(`${__API_URL__}/auth/profile`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const userData = response.data;
                    setFormData(prev => ({
                        ...prev,
                        email: userData.email || prev.email,
                        phone: userData.phone || prev.phone,
                        fullName: userData.username || prev.fullName
                    }));
                } catch (error) {
                    console.error("Failed to fetch user profile for auto-fill:", error);
                }
            } else if (user) {
                setFormData(prev => ({
                    ...prev,
                    phone: isGuest ? (user.phone || prev.phone) : prev.phone,
                    email: user.email || prev.email,
                    fullName: !isGuest ? (user.username || prev.fullName) : prev.fullName
                }));
            }
        };

        fetchUserData();
    }, [user, isGuest]);

    const handleApplyCoupon = async (e) => {
        e.preventDefault();
        if (!couponCode.trim()) return;

        setIsApplyingCoupon(true);
        setCouponError(null);

        try {
            const token = getToken();
            const formattedCartItems = cartItems.map(item => ({
                productId: item.product._id,
                variantId: item.variant?._id || null,
                quantity: item.quantity
            }));

            const response = await axios.post(`${__API_URL__}/checkout/apply-coupon`, {
                cartItems: formattedCartItems,
                couponCode: couponCode
            }, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            if (response.data.success) {
                setAppliedCoupon({
                    code: couponCode.toUpperCase(),
                    totalDiscount: response.data.totalDiscount
                });
                showNotification('הקופון הוחל בהצלחה!', 'success');
            }
        } catch (error) {
            setAppliedCoupon(null);
            const errorMessage = error.response?.data?.message || 'קוד קופון לא תקין או פג תוקף';
            setCouponError(errorMessage);
            showNotification(errorMessage, 'error');
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode('');
        setCouponError(null);
        showNotification('הקופון הוסר', 'info');
    };

    const calculateTotal = () => {
        return cartItems.reduce((acc, item) => {
            const regularPrice = item.variant?.price ?? item.product?.price ?? 0;
            const salePrice = item.variant?.salePrice;
            const isOnSale = item.variant?.isOnSale;

            const priceToUse =
                isOnSale && salePrice && salePrice > 0
                    ? salePrice
                    : regularPrice;

            if (typeof priceToUse === 'number' && typeof item.quantity === 'number') {
                return acc + priceToUse * item.quantity;
            }
            return acc;
        }, 0);
    };

    const getShippingCost = () => {
        if (store?.shippingOptions && store.shippingOptions.length > 0) {
            const selectedOpt = store.shippingOptions.find(opt => opt.name === formData.shippingMethod);
            return selectedOpt ? selectedOpt.price : (store.shippingOptions[0]?.price || 0);
        }
        switch (formData.shippingMethod) {
            case 'home-delivery':
                return 29;
            case 'pickup-point':
                return 15;
            default:
                return 0;
        }
    };

    const shippingCost = getShippingCost();
    const subtotal = calculateTotal();
    const discountAmount = appliedCoupon ? appliedCoupon.totalDiscount : 0;
    const totalToDisplay = Math.max(0, subtotal - discountAmount + shippingCost);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        setPaymentError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setPaymentError(null);
        setIsProcessing(true);

        if (cartItems.length === 0) {
            showNotification('העגלה שלך ריקה', 'error');
            setIsProcessing(false);
            return;
        }

        const authToken = getToken();

        if (!authToken) {
            showNotification('משתמש לא מזוהה. אנא התחבר או אמת את הזמנתך.', 'error');
            setIsProcessing(false);
            return;
        }

        const totalPrice = totalToDisplay;
        let paymentToken = null;


        const orderData = {
            orderItems: cartItems.map(item => {
                const regularPrice = item.variant?.price ?? item.product?.price ?? 0;
                const salePrice = item.variant?.salePrice;
                const isOnSale = item.variant?.isOnSale;
                const itemPrice = isOnSale && salePrice && salePrice > 0 ? salePrice : regularPrice;
                const optionsTotal = item.optionsTotal || 0;

                return {
                    product: item.product._id,
                    variant: item.variant ? item.variant._id : null,
                    quantity: item.quantity,
                    price: itemPrice + optionsTotal,
                    selectedOptions: item.selectedOptions || []
                };
            }),
            shippingAddress: {
                fullName: formData.fullName,
                street: formData.street,
                city: formData.city,
                email: formData.email,
                phone: formData.phone,
            },
            shippingMethod: formData.shippingMethod,
            shippingPrice: shippingCost,
            paymentMethod: formData.paymentMethod,
            totalPrice: totalPrice,
            couponCode: appliedCoupon ? appliedCoupon.code : null,
            paymentToken: null,
        };
        try {
            const result = await onOrderComplete(orderData, authToken);

            if (result.success) {
                const serverData = result.data;

                if (formData.paymentMethod === 'credit-card' && serverData.forwardToPayment) {
                    setIsProcessing(false);
                    if (isGuest && authToken) {
                        localStorage.setItem('guestTokenForOrder', authToken);
                    }
                    if (store?.slug) {
                        localStorage.setItem('currentStoreSlug', store.slug);
                    }
                    window.location.href = serverData.paymentUrl;
                    return;
                }

                setIsProcessing(false);
                showNotification('הזמנה בוצעה בהצלחה', 'success');

                navigate(`/order-confirmation/${serverData._id}`);
            } else {
                setIsProcessing(false);
            }

        } catch (error) {
            setIsProcessing(false);
            const errorMessage = error.response?.data?.message || error.message || 'שגיאה בעיבוד ההזמנה';
            setPaymentError(errorMessage);
            showNotification(errorMessage, 'error');
        }


    };

    const isFormIncomplete = !formData.fullName || !formData.street || !formData.city || !formData.phone || !formData.email || !formData.paymentMethod || !formData.shippingMethod;

    const isDisabled = isFormIncomplete || isProcessing;

    return (
        <div className="w-full mx-auto py-12" dir="rtl">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">פרטי הזמנה ותשלום</h1>
                <p className="text-lg text-gray-600 font-medium">השלם את הפרטים כדי לסיים את הרכישה</p>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Form Details */}
                <div className="lg:col-span-7 space-y-8">
                    <section className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold mb-6 flex items-center">
                            <span className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center ml-3 text-sm">1</span>
                            פרטים אישיים
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 mr-1">שם מלא</label>
                                <input className="w-full p-3 bg-surface-container border-none rounded-xl focus:ring-2 focus:ring-primary transition-all outline-none" type="text" name="fullName" value={formData.fullName} onChange={handleChange} required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 mr-1">מספר טלפון</label>
                                <input className="w-full p-3 bg-surface-container border-none rounded-xl focus:ring-2 focus:ring-primary transition-all outline-none" type="tel" name="phone" value={formData.phone} onChange={handleChange} required />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-sm font-semibold text-gray-700 mr-1">מייל</label>
                                <input className={`w-full p-3 bg-surface-container border-none rounded-xl focus:ring-2 focus:ring-primary transition-all outline-none ${isGuest ? 'opacity-70 cursor-not-allowed' : ''}`} type="email" name="email" value={formData.email} readOnly={true} required />
                            </div>
                        </div>
                    </section>

                    <section className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold mb-6 flex items-center">
                            <span className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center ml-3 text-sm">2</span>
                            כתובת למשלוח
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 mr-1">עיר</label>
                                <input className="w-full p-3 bg-surface-container border-none rounded-xl focus:ring-2 focus:ring-primary transition-all outline-none" type="text" name="city" value={formData.city} onChange={handleChange} required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 mr-1">רחוב ומספר בית</label>
                                <input className="w-full p-3 bg-surface-container border-none rounded-xl focus:ring-2 focus:ring-primary transition-all outline-none" type="text" name="street" value={formData.street} onChange={handleChange} required />
                            </div>
                        </div>
                    </section>

                    <section className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold mb-6 flex items-center">
                            <span className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center ml-3 text-sm">3</span>
                            שיטת משלוח
                        </h2>
                        <div className="grid grid-cols-1 gap-3">
                            {store?.shippingOptions && store.shippingOptions.length > 0 ? (
                                store.shippingOptions.map((option, oIdx) => (
                                    <label key={oIdx} className={`flex items-center p-4 rounded-xl border-2 transition-all cursor-pointer ${formData.shippingMethod === option.name ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`}>
                                        <input type="radio" name="shippingMethod" value={option.name} checked={formData.shippingMethod === option.name} onChange={handleChange} className="w-5 h-5 text-primary ml-4" />
                                        <div className="flex-1">
                                            <span className="block font-bold text-gray-900">{option.name}</span>
                                        </div>
                                        <span className="font-bold text-gray-900">
                                            {option.price === 0 ? 'חינם' : `₪${option.price.toFixed(2)}`}
                                        </span>
                                    </label>
                                ))
                            ) : (
                                <>
                                    <label className={`flex items-center p-4 rounded-xl border-2 transition-all cursor-pointer ${formData.shippingMethod === 'pickup-business' ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`}>
                                        <input type="radio" name="shippingMethod" value="pickup-business" checked={formData.shippingMethod === 'pickup-business'} onChange={handleChange} className="w-5 h-5 text-primary ml-4" />
                                        <div className="flex-1">
                                            <span className="block font-bold text-gray-900">איסוף מבית העסק</span>
                                            <span className="text-sm text-gray-500 italic">זמין מיידית</span>
                                        </div>
                                        <span className="font-bold text-green-600">חינם</span>
                                    </label>

                                    <label className={`flex items-center p-4 rounded-xl border-2 transition-all cursor-pointer ${formData.shippingMethod === 'home-delivery' ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`}>
                                        <input type="radio" name="shippingMethod" value="home-delivery" checked={formData.shippingMethod === 'home-delivery'} onChange={handleChange} className="w-5 h-5 text-primary ml-4" />
                                        <div className="flex-1">
                                            <span className="block font-bold text-gray-900">משלוח עד הבית</span>
                                            <span className="text-sm text-gray-500 italic">3-5 ימי עסקים</span>
                                        </div>
                                        <span className="font-bold text-gray-900">₪29</span>
                                    </label>

                                    <label className={`flex items-center p-4 rounded-xl border-2 transition-all cursor-pointer ${formData.shippingMethod === 'pickup-point' ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`}>
                                        <input type="radio" name="shippingMethod" value="pickup-point" checked={formData.shippingMethod === 'pickup-point'} onChange={handleChange} className="w-5 h-5 text-primary ml-4" />
                                        <div className="flex-1">
                                            <span className="block font-bold text-gray-900">נקודת איסוף (PUDO)</span>
                                            <span className="text-sm text-gray-500 italic">קרוב לביתך</span>
                                        </div>
                                        <span className="font-bold text-gray-900">₪15</span>
                                    </label>
                                </>
                            )}
                        </div>
                    </section>
                </div>

                {/* Right Column: Payment & Summary */}
                <div className="lg:col-span-5 space-y-8">
                    <div className="bg-white p-8 md:p-10 rounded-2xl shadow-lg border border-gray-100 sticky top-8">
                        <h2 className="text-xl font-bold mb-6 flex items-center">
                            <span className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center ml-3 text-sm">4</span>
                            תשלום וסיכום
                        </h2>

                        <div className="space-y-6 mb-8">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">בחר שיטת תשלום</label>
                                {store?.features?.hasCashPayment === false ? (
                                    <div className="w-full p-3 bg-surface-container rounded-xl font-bold text-gray-900 flex items-center gap-2">
                                        💳 כרטיס אשראי
                                    </div>
                                ) : (
                                    <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange}
                                        className="w-full p-3 bg-surface-container border-none rounded-xl focus:ring-2 focus:ring-primary transition-all outline-none font-medium appearance-none">
                                        <option value="">בחר שיטת תשלום...</option>
                                        <option value="credit-card">💳 כרטיס אשראי</option>
                                        <option value="cash">💵 מזומן (תשלום במקום)</option>
                                    </select>
                                )}
                            </div>

                            {/* {formData.paymentMethod === 'credit-card' && (
                                <div className="p-4 bg-surface-container rounded-xl border border-gray-200">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-3 mr-1">פרטי כרטיס אשראי</label>
                                    <div className="bg-white p-3 rounded-lg border border-gray-100">
                                        <CardElement options={CARD_ELEMENT_OPTIONS} />
                                    </div>
                                </div>
                            )} */}

                            <div className="space-y-2 pt-2 border-t border-gray-100">
                                <label className="text-sm font-semibold text-gray-700">יש לך קוד קופון?</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="הזן קוד קופון"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value)}
                                        disabled={!!appliedCoupon || isApplyingCoupon}
                                        className="flex-1 p-3 bg-surface-container border-none rounded-xl focus:ring-2 focus:ring-primary transition-all outline-none uppercase font-bold text-center tracking-wider disabled:opacity-60"
                                    />
                                    {appliedCoupon ? (
                                        <button
                                            type="button"
                                            onClick={handleRemoveCoupon}
                                            className="px-4 bg-red-50 text-red-500 rounded-xl font-bold border border-red-200 hover:bg-red-100 transition-all"
                                        >
                                            ביטול
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleApplyCoupon}
                                            disabled={!couponCode.trim() || isApplyingCoupon}
                                            className="px-5 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all disabled:bg-gray-200 disabled:text-gray-400"
                                        >
                                            {isApplyingCoupon ? 'בודק...' : 'החל'}
                                        </button>
                                    )}
                                </div>
                                {couponError && (
                                    <p className="text-xs font-semibold text-red-500 mr-1 mt-1">{couponError}</p>
                                )}
                                {appliedCoupon && (
                                    <p className="text-xs font-semibold text-green-600 mr-1 mt-1">
                                        קופון <strong>{appliedCoupon.code}</strong> הוחל בהצלחה!
                                    </p>
                                )}
                            </div>

                            {paymentError && (
                                <div className="p-3 bg-red-50 text-red-500 text-sm rounded-xl text-center font-medium border border-red-100">
                                    {paymentError}
                                </div>
                            )}
                        </div>

                        <div className="space-y-3 pt-6 border-t border-gray-100 mb-8">
                            <div className="flex justify-between text-gray-600">
                                <span>סיכום ביניים</span>
                                <span className="font-semibold">₪{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>דמי משלוח</span>
                                <span className="font-semibold">₪{shippingCost.toFixed(2)}</span>
                            </div>
                            {appliedCoupon && discountAmount > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span className="font-semibold">הנחת קופון ({appliedCoupon.code})</span>
                                    <span className="font-bold">- ₪{discountAmount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                <span className="text-xl font-extrabold text-gray-900">סה״כ לתשלום</span>
                                <span className="text-2xl font-black text-primary">₪{totalToDisplay.toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isDisabled}
                            className={`w-full py-4 rounded-xl text-white font-black text-lg shadow-xl transform transition-all active:scale-95 flex justify-center items-center ${isDisabled ? 'bg-gray-300 cursor-not-allowed' : 'bg-primary hover:bg-primary-hover hover:shadow-primary/30'
                                }`}
                        >
                            {isProcessing ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    מעבד תשלום...
                                </span>
                            ) : 'שלח הזמנה וסיים רכישה'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CheckoutForm;