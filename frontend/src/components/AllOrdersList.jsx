import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext.jsx';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Loader from '../components/Loader.jsx';

/**
 * AllOrdersList Component.
 * A central administrative view for listing and managing all customer orders.
 * 
 * @param {Object} props - Component props.
 * @param {Function} props.showNotification - Function to display a global notification.
 */
const AllOrdersList = ({ showNotification }) => {
    const { getToken } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
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

    const handleDeliverOrder = async (orderId) => {
        try {
            const token = getToken();
            await axios.patch(`${__API_URL__}/orders/${orderId}/deliver`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            showNotification('ההזמנה סומנה כנשלחה', 'success');
            fetchAllOrders();
        } catch (err) {
            showNotification(err.response?.data?.message || 'שגיאה בעדכון ההזמנה', 'error');
        }
    };

    useEffect(() => {
        fetchAllOrders();
    }, [fetchAllOrders]);

    const filteredOrders = orders.filter(order => {
        const customerName = order.isGuestOrder
            ? (order.shippingAddress?.fullName || 'אורח')
            : (order.user?.username || 'משתמש לא ידוע');

        const phone = order.shippingAddress?.phone || '';
        const orderId = order._id || '';

        return customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            phone.includes(searchTerm) ||
            orderId.toLowerCase().includes(searchTerm.toLowerCase());
    });

    if (loading) return <Loader text="טוען הזמנות" />;

    if (error) {
        return <div className="text-center mt-10 text-red-600">שגיאה: {error}</div>;
    }

    const OrderDetails = ({ order }) => {
        let customerInfo;
        if (order.isGuestOrder) {
            const customerName = order.shippingAddress.fullName || 'אורח';
            const customerEmail = order.shippingAddress.email || order.contactEmail || 'לא סופק אימייל';
            customerInfo = (
                <>
                    <p><strong>לקוח:</strong> {customerName} (אורח)</p>
                    <p><strong>אימייל/מזהה:</strong> {customerEmail}</p>
                </>
            );
        } else {
            customerInfo = (
                <>
                    <p><strong>לקוח:</strong> {order.user?.username || 'משתמש לא ידוע'} ({order.user?.email || 'לא ידוע'})</p>
                </>
            );
        }
        return (
            <li key={order._id} className="mb-4 p-4 border rounded-md shadow-sm bg-gray-50">
                <p><strong>מספר הזמנה:</strong> {order._id}</p>
                <p><strong>תאריך:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                {customerInfo}
                <p><strong>טלפון:</strong> {order.shippingAddress.phone}</p>
                <p><strong>כתובת:</strong> {order.shippingAddress.street}, {order.shippingAddress.city}</p>
                <p><strong>שיטת משלוח:</strong> {
                    order.shippingMethod === 'home-delivery' ? 'משלוח עד הבית' :
                        order.shippingMethod === 'pickup-point' ? 'משלוח לנקודת איסוף' :
                            order.shippingMethod === 'pickup-business' ? 'איסוף מבית העסק' :
                                'לא נבחר'
                }</p>
                <p><strong>דמי משלוח:</strong> ₪{order.shippingPrice !== undefined ? order.shippingPrice.toFixed(2) : '0.00'}</p>
                <p><strong>סה״כ לתשלום:</strong> ₪{order.totalPrice.toFixed(2)}</p>
                <p><strong>סטטוס:</strong> <span className={`font-semibold ${order.isDelivered ? 'text-green-600' : 'text-orange-500'}`}>{order.isDelivered ? 'נשלח' : 'ממתין לטיפול'}</span></p>
                {!order.isDelivered && !order.isCancelled && (
                    <button
                        onClick={() => handleDeliverOrder(order._id)}
                        className="mt-2 px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm font-semibold"
                    >
                        סמן כנשלח
                    </button>
                )}

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

            <div className="mb-6">
                <input
                    type="text"
                    placeholder="חפש לפי שם לקוח, טלפון או מספר הזמנה..."
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-right"
                    dir="rtl"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {filteredOrders.length === 0 ? (
                <p className="text-center text-gray-500">לא נמצאו הזמנות התואמות לחיפוש</p>
            ) : (
                <ul className="space-y-6">
                    {filteredOrders.map((order) => <OrderDetails key={order._id} order={order} />)}
                </ul>
            )}
        </div>
    );
};

export default AllOrdersList;