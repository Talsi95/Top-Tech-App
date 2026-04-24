import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useNavigate } from 'react-router-dom';
import CheckoutForm from '../components/CheckoutForm';
import { useEffect } from 'react';
import { useAuth } from '../AuthContext';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_YOUR_FALLBACK_KEY');

/**
 * CheckoutPage Component.
 * Orchestrates the payment process using Stripe. Verifies cart contents and guest authentication.
 * 
 * @param {Object} props - Component props.
 * @param {Array} props.cartItems - Items currently in the cart.
 * @param {Function} props.showNotification - Function to display a global notification.
 * @param {Function} props.onOrderComplete - Callback function called after a successful order.
 */
const CheckoutPage = ({ cartItems, showNotification, onOrderComplete }) => {
    const navigate = useNavigate();
    const { isAuthenticated, isGuest } = useAuth();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const guestToken = localStorage.getItem('guestToken');

        if (!isAuthenticated && !isGuest && !token && !guestToken) {
            navigate('/guest-checkout');
        }
    }, [isAuthenticated, isGuest, navigate]);

    const hasAccess = isAuthenticated || isGuest || localStorage.getItem('token') || localStorage.getItem('guestToken');

    if (!hasAccess) return null;



    if (!cartItems || cartItems.length === 0) {
        return (
            <div className="text-center p-12 mt-10 bg-white rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">העגלה שלך ריקה</h1>
                <p className="text-gray-600">אנא הוסף מוצרים לעגלה לפני המעבר לקופה.</p>
            </div>
        );
    }

    const guestToken = localStorage.getItem('guestToken');

    return (
        <div className="container mx-auto max-w-lg">
            <Elements stripe={stripePromise}>
                <CheckoutForm
                    cartItems={cartItems}
                    showNotification={showNotification}
                    onOrderComplete={onOrderComplete}
                    guestToken={guestToken}
                />
            </Elements>
        </div>
    );
};

export default CheckoutPage;
