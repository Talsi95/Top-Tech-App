import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, MapPin, Receipt, Loader } from 'lucide-react';

const OrderConfirmationPage = ({ showNotification }) => {
    const { orderId } = useParams();
    const location = useLocation();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const guestToken = location.state?.guestToken || localStorage.getItem('guestTokenForOrder');

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
            fetchOrder(guestToken);
        }
        return () => localStorage.removeItem('guestTokenForOrder');
    }, [orderId]);


    if (loading) {
        return <div className="text-center p-12 mt-10"><Loader className="animate-spin inline mr-2" /> טוען פרטי הזמנה...</div>;
    }

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
                        <MapPin className="ml-2 text-blue-500" size={20} /> כתובת למשלוח
                    </h3>
                    <p className="text-gray-700">רחוב: {order.shippingAddress.street}</p>
                    <p className="text-gray-700">עיר: {order.shippingAddress.city}, מיקוד: {order.shippingAddress.zipCode}</p>
                    <p className="text-gray-700">טלפון: {order.shippingAddress.phone}</p>
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

            <div className="mt-8 text-center">
                <button
                    onClick={() => showNotification('פונקציית שליחה במייל טרם מומשה.', 'info')}
                    className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                >
                    שלח את פרטי ההזמנה במייל
                </button>
            </div>
        </div>
    );
};

export default OrderConfirmationPage;