import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';

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

const CheckoutForm = ({ cartItems, showNotification, onOrderComplete }) => {
    const navigate = useNavigate();

    const stripe = useStripe();
    const elements = useElements();

    const [formData, setFormData] = useState({
        name: '',
        street: '',
        city: '',
        zipCode: '',
        phone: '',
        paymentMethod: '',
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState(null);

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

    const totalToDisplay = calculateTotal();

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
                street: formData.street,
                city: formData.city,
                zipCode: formData.zipCode,
                phone: formData.phone,
            },
            paymentMethod: formData.paymentMethod,
            totalPrice: totalPrice,
            paymentToken: paymentToken,
        };

        const result = await onOrderComplete(orderData);

        if (result.success) {
            showNotification('הזמנה בוצעה בהצלחה', 'success');
            navigate('/profile');
        } else {
            showNotification(result.message || 'הזמנה נכשלה. נסה שוב.', 'error');
        }

        setIsProcessing(false);
    };

    const isFormIncomplete = !formData.name || !formData.street || !formData.city || !formData.zipCode || !formData.phone || !formData.paymentMethod;

    const isDisabled = isFormIncomplete || isProcessing || (formData.paymentMethod === 'credit-card' && !stripe);

    return (
        <div className="p-8 max-w-lg mx-auto bg-white rounded-lg shadow-md mt-10">
            <h2 className="text-2xl font-bold mb-6 text-center">פרטי הזמנה ותשלום</h2>
            <form onSubmit={handleSubmit}>

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">שם מלא</label>
                    <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight" type="text" name="name" value={formData.name} onChange={handleChange} required />
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
                    <label className="block text-gray-700 text-sm font-bold mb-2">מיקוד</label>
                    <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight" type="tel" name="zipCode" value={formData.zipCode} onChange={handleChange} required />
                </div>
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2">מספר טלפון</label>
                    <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight" type="tel" name="phone" value={formData.phone} onChange={handleChange} required />
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

                <div className="flex justify-between items-center bg-gray-100 p-4 rounded-md mb-6">
                    <h3 className="text-xl font-bold text-gray-800">סה״כ: </h3>
                    <p className="text-xl font-bold text-green-600">₪{totalToDisplay.toFixed(2)}</p>
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