import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, MapPin, Receipt, Package } from 'lucide-react';
import { useAuth } from '../AuthContext.jsx';
import Loader from '../components/Loader.jsx';

/**
 * OrderConfirmationPage Component.
 * Displays a success message and detailed receipt information after an order is placed.
 * 
 * @param {Object} props - Component props.
 * @param {Function} props.showNotification - Function to display a global notification.
 */
const OrderConfirmationPage = ({ showNotification }) => {
    const { orderId } = useParams();
    const location = useLocation();
    const { getToken, isGuest } = useAuth();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const authToken = getToken() || location.state?.guestToken || localStorage.getItem('guestTokenForOrder');

    /**
     * Fetches details for a specific order by ID.
     * @param {string} token - Authorization token (user or guest).
     */
    const fetchOrder = async (token) => {
        if (!token) {
            setError('טוקן אימות חסר. לא ניתן לאחזר את ההזמנה.');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.get(`${__API_URL__}/orders/${orderId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setOrder(response.data);
            localStorage.setItem('guestTokenForOrder', token);
        } catch (err) {
            const msg = err.response?.data?.message || 'שגיאה באחזור ההזמנה.';
            setError(msg);
            showNotification(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (orderId) {
            fetchOrder(authToken);
        }
        return () => localStorage.removeItem('guestTokenForOrder');
    }, [orderId, authToken]);


    if (loading) return <Loader text="טוען פרטי הזמנה" />;

    if (error) {
        return <div className="text-center p-12 mt-10 text-red-600">שגיאה: {error}</div>;
    }

    if (!order) {
        return <div className="text-center p-12 mt-10">הזמנה לא נמצאה.</div>;
    }

    return (
        <div className="container mx-auto max-w-2xl p-6 mt-10 bg-white rounded-xl shadow-2xl border-t-4 border-green-500" dir="rtl">
            <div className="text-center mb-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
                <h1 className="text-3xl font-bold text-gray-800">הזמנתך אושרה בהצלחה!</h1>
                <p className="text-lg text-gray-600">תודה רבה על הקנייה.</p>
            </div>

            <div className="border-t pt-4 space-y-4">
                <div className="flex justify-between items-center text-xl font-semibold bg-gray-50 p-3 rounded-lg">
                    <span>מספר הזמנה:</span>
                    <span className="text-blue-600">{order._id}</span>
                </div>

                <div className="flex justify-between items-center text-xl font-semibold p-3">
                    <span>סה"כ לתשלום:</span>
                    <span className="text-green-600">₪{order.totalPrice.toFixed(2)}</span>
                </div>

                <div className="bg-white p-4 border rounded-lg shadow-inner">
                    <h3 className="text-lg font-bold flex items-center mb-3">
                        <MapPin className="ml-2 text-blue-500" size={20} /> כתובת ופרטי משלוח
                    </h3>
                    <p className="text-gray-700">רחוב: {order.shippingAddress.street}</p>
                    <p className="text-gray-700">עיר: {order.shippingAddress.city}</p>
                    <p className="text-gray-700">טלפון: {order.shippingAddress.phone}</p>
                    <div className="mt-3 pt-3 border-t">
                        <p className="text-gray-700"><strong>שיטת משלוח:</strong> {
                            order.shippingMethod === 'home-delivery' ? 'משלוח עד הבית' :
                                order.shippingMethod === 'pickup-point' ? 'משלוח לנקודת איסוף' :
                                    order.shippingMethod === 'pickup-business' ? 'איסוף מבית העסק' :
                                        'לא נבחר'
                        }</p>
                        <p className="text-gray-700"><strong>דמי משלוח:</strong> ₪{order.shippingPrice?.toFixed(2) || '0.00'}</p>
                    </div>
                </div>

                <h3 className="text-xl font-bold border-b pb-2 mt-6 mb-4 flex items-center">
                    <Receipt className="ml-2 text-gray-700" size={20} /> פריטי ההזמנה
                </h3>
                {order.orderItems.map((item, index) => (
                    <div key={index} className="flex justify-between border-b py-2 text-sm text-gray-700">
                        <span>{item.quantity} x {item.product.name}</span>
                        <span>₪{(item.quantity * item.price).toFixed(2)}</span>
                    </div>
                ))}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                <button
                    onClick={() => showNotification('פונקציית שליחה במייל טרם מומשה.', 'info')}
                    className="bg-blue-500 text-white py-2 px-6 rounded-lg hover:bg-blue-600 transition-colors font-semibold"
                >
                    שלח את פרטי ההזמנה במייל
                </button>

                {!isGuest && (
                    <button
                        onClick={() => navigate('/profile')}
                        className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center"
                    >
                        <Package className="ml-2" size={20} /> לצפייה בכל ההזמנות שלי
                    </button>
                )}
            </div>
        </div>
    );
};

export default OrderConfirmationPage;