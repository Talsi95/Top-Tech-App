import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import axios from 'axios';
import { useAuth } from '../AuthContext';

const CARD_ELEMENT_OPTIONS = {
    style: {
        base: {
            fontSize: '16px',
            color: '#424770',
            '::placeholder': {
                color: '#aab7c4',
            },
        },
        invalid: {
            color: '#9e2146',
        },
    },
};

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
    const navigate = useNavigate();
    const { user, isGuest, getToken } = useAuth();

    const stripe = useStripe();
    const elements = useElements();

    const [formData, setFormData] = useState({
        fullName: !isGuest ? user?.username : '',
        street: '',
        city: '',
        phone: user?.phone || '',
        email: user?.email || '',
        paymentMethod: '',
        shippingMethod: 'pickup-business'
    });

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
    const totalToDisplay = subtotal + shippingCost;

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

        if (formData.paymentMethod === 'credit-card') {
            if (!stripe || !elements) {
                setPaymentError("מערכת התשלומים אינה מוכנה עדיין.");
                setIsProcessing(false);
                return;
            }

            const cardElement = elements.getElement(CardElement);

            const { error, token } = await stripe.createToken(cardElement);

            if (error) {
                setPaymentError(error.message);
                setIsProcessing(false);
                return;
            }
            paymentToken = token.id;
        }

        const orderData = {
            orderItems: cartItems.map(item => ({
                product: item.product._id,
                variant: item.variant ? item.variant._id : null,
                quantity: item.quantity
            })),
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
            paymentToken: paymentToken,
        };

        const result = await onOrderComplete(orderData, authToken);

        if (result.success) {
            showNotification('הזמנה בוצעה בהצלחה', 'success');

            const isGuest = !!guestToken;
            const orderId = result.orderId;


            navigate(`/order-confirmation/${orderId}`, {
                state: { guestToken: authToken }
            });
            if (isGuest) {
                logout();
            }

        } else {
            showNotification(result.message || 'הזמנה נכשלה. נסה שוב.', 'error');
        }

        setIsProcessing(false);
    };

    const isFormIncomplete = !formData.fullName || !formData.street || !formData.city || !formData.phone || !formData.email || !formData.paymentMethod || !formData.shippingMethod;

    const isDisabled = isFormIncomplete || isProcessing || (formData.paymentMethod === 'credit-card' && !stripe);

    return (
        <div className="p-8 max-w-lg mx-auto bg-white rounded-lg shadow-md mt-10">
            <h2 className="text-2xl font-bold mb-6 text-center">פרטי הזמנה ותשלום</h2>
            <form onSubmit={handleSubmit}>

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">שם מלא</label>
                    <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight" type="text" name="fullName" value={formData.fullName} onChange={handleChange} required />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">רחוב</label>
                    <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight" type="text" name="street" value={formData.street} onChange={handleChange} required />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">עיר</label>
                    <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight" type="text" name="city" value={formData.city} onChange={handleChange} required />
                </div>
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2">אפשרויות משלוח</label>
                    <div className="space-y-2 border p-3 rounded-md bg-gray-50">
                        <label className="flex items-center space-x-3 space-x-reverse cursor-pointer">
                            <input type="radio" name="shippingMethod" value="pickup-business" checked={formData.shippingMethod === 'pickup-business'} onChange={handleChange} className="form-radio h-4 w-4 text-green-600" />
                            <span className="text-gray-700 mr-2">איסוף מבית העסק - חינם</span>
                        </label>
                        <label className="flex items-center space-x-3 space-x-reverse cursor-pointer">
                            <input type="radio" name="shippingMethod" value="home-delivery" checked={formData.shippingMethod === 'home-delivery'} onChange={handleChange} className="form-radio h-4 w-4 text-green-600" />
                            <span className="text-gray-700 mr-2">משלוח עד בית הלקוח - ₪29</span>
                        </label>
                        <label className="flex items-center space-x-3 space-x-reverse cursor-pointer">
                            <input type="radio" name="shippingMethod" value="pickup-point" checked={formData.shippingMethod === 'pickup-point'} onChange={handleChange} className="form-radio h-4 w-4 text-green-600" />
                            <span className="text-gray-700 mr-2">משלוח לנק׳ איסוף - ₪15</span>
                        </label>
                    </div>
                </div>
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2">מספר טלפון</label>
                    <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight" type="tel" name="phone" value={formData.phone} onChange={handleChange} required />
                </div>
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2">מייל</label>
                    <input className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight${isGuest ? 'bg-gray-100 cursor-not-allowed' : ''}`} type="email" name="email" value={formData.email} readOnly={true} required />
                </div>

                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2">שיטת תשלום</label>
                    <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange}
                        className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight">
                        <option value="">בחר שיטת תשלום</option>
                        <option value="credit-card">כרטיס אשראי (Stripe)</option>
                        <option value="cash">מזומן (תשלום במקום)</option>
                    </select>
                </div>

                {formData.paymentMethod === 'credit-card' && (
                    <div className="mb-6 p-4 border rounded-md bg-gray-50">
                        <label className="block text-gray-700 text-sm font-bold mb-2">פרטי כרטיס אשראי</label>
                        <CardElement options={CARD_ELEMENT_OPTIONS} />
                    </div>
                )}

                {paymentError && (
                    <div className="text-red-500 text-sm mb-4 text-center">{paymentError}</div>
                )}

                <div className="bg-gray-100 p-4 rounded-md mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">סיכום ביניים:</span>
                        <span className="font-semibold">₪{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2 border-b pb-2">
                        <span className="text-gray-600">דמי משלוח:</span>
                        <span className="font-semibold">₪{shippingCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                        <h3 className="text-xl font-bold text-gray-800">סה״כ: </h3>
                        <p className="text-xl font-bold text-green-600">₪{totalToDisplay.toFixed(2)}</p>
                    </div>
                </div>
                <div className="flex items-center justify-center">
                    <button type="submit" disabled={isDisabled}
                        className={`w-full text-white font-bold py-2 px-4 rounded-md transition-colors duration-300
                    ${isDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}`}>
                        {isProcessing ? 'מעבד תשלום...' : 'שלח הזמנה'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CheckoutForm;