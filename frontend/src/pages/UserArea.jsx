import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { Package, User, LogOut, Settings } from 'lucide-react';
import axios from 'axios';
import Loader from '../components/Loader.jsx';

/**
 * UserArea Component.
 * Displays the logged-in user's profile information and their order history.
 */
const UserArea = () => {
    const { isAuthenticated, getToken, logout } = useAuth();
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [userOrders, setUserOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /**
     * Fetches user profile data and orders from the server.
     * Verifies authentication by checking the token.
     */
    const fetchUserDataAndOrders = useCallback(async () => {
        try {
            const token = getToken();
            if (!token) {
                navigate('/login');
                return;
            }
            const response = await axios.get(`${__API_URL__}/auth/profile`, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
            });

            setUserData(response.data);
            setUserOrders(response.data.orders);
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.message || err.message);
            setLoading(false);
        }
    }, [getToken, navigate]);

    /**
     * Handles the cancellation of an order.
     * Calls the backend API and refreshes the order list.
     * @param {string} orderId - The ID of the order to cancel.
     */
    const handleCancelOrder = async (orderId) => {
        if (!window.confirm('האם אתה בטוח שברצונך לבטל את ההזמנה?')) {
            return;
        }

        try {
            const token = getToken();
            await axios.patch(`${__API_URL__}/orders/${orderId}/cancel`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            alert('ההזמנה בוטלה בהצלחה');
            fetchUserDataAndOrders();
        } catch (err) {
            alert(err.response?.data?.message || 'שגיאה בביטול ההזמנה');
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchUserDataAndOrders();
        } else {
            navigate('/');
        }
    }, [isAuthenticated, navigate, fetchUserDataAndOrders]);

    if (loading) return <Loader text="טוען נתונים" />;

    if (error) {
        return <div className="text-center mt-10 text-red-600">שגיאה: {error}</div>;
    }

    return (
        <div className="container mx-auto p-8" dir="rtl">
            <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm border-r-4 border-blue-600">
                <h2 className="text-3xl font-bold flex items-center text-gray-800">
                    <User className="ml-3 text-blue-600" size={32} />
                    {userData?.isGuest ? 'מעקב הזמנות אורח' : 'האיזור האישי שלי'}
                </h2>
                <div className="flex gap-4">
                    {!userData?.isGuest && (
                        <button
                            onClick={() => navigate('/profile/edit')}
                            className="flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-semibold"
                        >
                            <Settings className="ml-2" size={20} /> עריכת פרופיל
                        </button>
                    )}
                    <button
                        onClick={logout}
                        className="flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-semibold"
                    >
                        <LogOut className="ml-2" size={20} /> התנתק
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h3 className="text-xl font-bold mb-4">פרטים</h3>
                <p><strong>שם מלא:</strong> {userData?.isGuest ? 'אורח' : userData?.username}</p>
                <p><strong>טלפון:</strong> {userData?.phone || 'לא הוזן'}</p>
                <p><strong>מייל למעקב:</strong> {userData?.email}</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-4">ההזמנות שלי</h3>
                {userOrders.length === 0 ? (
                    <p className="text-center text-gray-500">אין עדיין הזמנות</p>
                ) : (
                    <ul>
                        {userOrders.map((order) => (
                            <li key={order._id} className="mb-4 border-b pb-4">
                                <p><strong>מספר הזמנה:</strong> {order._id}</p>
                                <p><strong>תאריך:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                                <p><strong>סה״כ:</strong> ₪{order.totalPrice.toFixed(2)}</p>
                                <p><strong>שיטת משלוח:</strong> {
                                    order.shippingMethod === 'home-delivery' ? 'משלוח עד הבית' :
                                        order.shippingMethod === 'pickup-point' ? 'משלוח לנקודת איסוף' :
                                            order.shippingMethod === 'pickup-business' ? 'איסוף מבית העסק' :
                                                'לא נבחר'
                                }</p>
                                <p><strong>סטטוס:</strong> {order.isCancelled ? 'בוטל' : (order.isDelivered ? 'נשלח' : 'ממתין לטיפול')}</p>

                                {!order.isCancelled && !order.isDelivered && (
                                    <button
                                        onClick={() => handleCancelOrder(order._id)}
                                        className="mt-2 px-4 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-semibold"
                                    >
                                        ביטול הזמנה
                                    </button>
                                )}
                                {order.isDelivered && !order.isCancelled && (
                                    <p className="mt-2 text-sm text-red-600 font-semibold italic">לא ניתן לבטל (ההזמנה כבר נשלחה)</p>
                                )}

                                <ul className="pl-4 mt-2 space-y-4">
                                    {order.orderItems.map((item, index) => {
                                        if (!item.product) {
                                            return <p key={`deleted-${index}`} className="text-gray-500 italic">מוצר אינו קיים יותר (x{item.quantity})</p>;
                                        }

                                        const variantId = typeof item.variant === 'string' ? item.variant : item.variant?._id;
                                        let displayedVariant = item.variant;

                                        if (variantId && item.product && item.product.variants) {
                                            displayedVariant = item.product.variants.find(v => v._id?.toString() === variantId);
                                        }

                                        const imageUrl = displayedVariant?.imageUrl
                                            || item.product?.variants?.[0]?.imageUrl
                                            || 'https://via.placeholder.com/150';

                                        let variantText = '';
                                        if (displayedVariant) {
                                            const color = displayedVariant.color;
                                            const storage = displayedVariant.storage;

                                            if (color && storage) {
                                                variantText = `צבע: ${color}, נפח: ${storage}`;
                                            } else if (color) {
                                                variantText = `צבע: ${color}`;
                                            } else if (storage) {
                                                variantText = `נפח: ${storage}`;
                                            } else if (displayedVariant.name) {
                                                variantText = displayedVariant.name;
                                            }
                                        }

                                        return (
                                            <li key={item._id || `item-${index}`} className="flex items-start">
                                                <img src={imageUrl} alt={item.product.name} className="w-16 h-16 object-cover rounded-md ml-4" />
                                                <div className="flex-1">
                                                    <p className="font-semibold text-lg">{item.product.name}</p>
                                                    {variantText && <p className="text-sm text-gray-600">{variantText}</p>}
                                                    <p className="text-gray-500">כמות: {item.quantity}</p>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default UserArea;