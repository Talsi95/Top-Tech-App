import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useLocation, useNavigate } from 'react-router-dom';
import CheckoutForm from '../components/CheckoutForm';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_YOUR_FALLBACK_KEY');

const CheckoutPage = ({ cartItems, showNotification, onOrderComplete }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const guestToken = location.state?.guestToken;
    const guestShippingAddress = location.state?.guestShippingAddress;

    if (!guestToken) {
        showNotification('טוקן אורח לא נמצא. אנא התחל את תהליך הקופה מחדש.', 'error');
        return (
            <div className="text-center p-12 mt-10 bg-white rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">שגיאת הרשאה</h1>
                <p className="text-gray-600">הגישה נחסמה. אנא חזור לעמוד הקופה כדי להתחבר או לאמת את הזמנתך כאורח.</p>
                <button
                    onClick={() => navigate('/guest-checkout')}
                    className="mt-4 text-blue-600 hover:underline"
                >
                    חזור לאימות אורח
                </button>
            </div>
        );
    }

    if (!cartItems || cartItems.length === 0) {
        return (
            <div className="text-center p-12 mt-10 bg-white rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">העגלה שלך ריקה</h1>
                <p className="text-gray-600">אנא הוסף מוצרים לעגלה לפני המעבר לקופה.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-lg">
            <Elements stripe={stripePromise}>
                <CheckoutForm
                    cartItems={cartItems}
                    showNotification={showNotification}
                    onOrderComplete={onOrderComplete}
                    guestToken={guestToken}
                    guestShippingAddress={guestShippingAddress}
                />
            </Elements>
        </div>
    );
};

export default CheckoutPage;
