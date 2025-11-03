import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext.jsx';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AllOrdersList = ({ showNotification }) => {
    const { getToken } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAllOrders = useCallback(async () => {
        try {
            const token = getToken();
            if (!token) {
                navigate('/login');
                return;
            }
            const response = await axios.get(`${__API_URL__}/orders`, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
            });

            setOrders(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch orders:', err);
            setError(err.response?.data?.message || 'שגיאה בטעינת ההזמנות');
            setLoading(false);
            if (err.response?.status === 401 || err.response?.status === 403) {
                showNotification('אין לך הרשאת מנהל לצפייה בהזמנות', 'error');
            }
        }
    }, [getToken, navigate, showNotification]);

    useEffect(() => {
        fetchAllOrders();
    }, [fetchAllOrders]);

    if (loading) {
        return <div className="text-center mt-10">טוען הזמנות...</div>;
    }

    if (error) {
        return <div className="text-center mt-10 text-red-600">שגיאה: {error}</div>;
    }

    const OrderDetails = ({ order }) => {
        return (
            <li key={order._id} className="mb-4 p-4 border rounded-md shadow-sm bg-gray-50">
                <p><strong>מספר הזמנה:</strong> {order._id}</p>
                <p><strong>תאריך:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                <p><strong>לקוח:</strong> {order.user.username} ({order.user.email})</p>
                <p><strong>טלפון:</strong> {order.shippingAddress.phone}</p>
                <p><strong>כתובת למשלוח:</strong> {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.zipCode}</p>
                <p><strong>סה״כ לתשלום:</strong> ₪{order.totalPrice.toFixed(2)}</p>
                <p><strong>סטטוס:</strong> <span className={`font-semibold ${order.isDelivered ? 'text-green-600' : 'text-orange-500'}`}>{order.isDelivered ? 'נשלח' : 'ממתין לטיפול'}</span></p>

                <h4 className="font-semibold mt-4 mb-2 border-t pt-2">פריטים:</h4>
                <ul className="pl-4 mt-2 space-y-4">
                    {order.orderItems.map((item, index) => {
                        const product = item.product;

                        if (!product) {
                            return <p key={`deleted-${index}`} className="text-gray-500 italic">מוצר אינו קיים יותר (x{item.quantity})</p>;
                        }

                        const variantId = typeof item.variant === 'string' ? item.variant : item.variant?._id;
                        let displayedVariant = product.variants?.find(v => v._id?.toString() === variantId);

                        let variantText = '';
                        if (displayedVariant) {
                            const color = displayedVariant.color;
                            const storage = displayedVariant.storage;
                            variantText = (color && storage) ? `צבע: ${color}, נפח: ${storage}` : color ? `צבע: ${color}` : storage ? `נפח: ${storage}` : '';
                        }

                        const imageUrl = displayedVariant?.imageUrl
                            || product?.variants?.[0]?.imageUrl
                            || 'https://via.placeholder.com/150';

                        return (
                            <li key={item._id || `item-${index}`} className="flex items-start">
                                <img src={imageUrl} alt={product.name} className="w-16 h-16 object-cover rounded-md ml-4" />
                                <div className="flex-1">
                                    <p className="font-semibold text-base">{product.name}</p>
                                    {variantText && <p className="text-sm text-gray-600">{variantText}</p>}
                                    <p className="text-gray-500">כמות: {item.quantity}</p>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </li>
        )
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mt-6">
            <h3 className="text-2xl font-bold mb-4">כל ההזמנות באתר ({orders.length})</h3>
            {orders.length === 0 ? (
                <p className="text-center text-gray-500">לא נמצאו הזמנות</p>
            ) : (
                <ul className="space-y-6">
                    {orders.map((order) => <OrderDetails key={order._id} order={order} />)}
                </ul>
            )}
        </div>
    );
};

export default AllOrdersList;