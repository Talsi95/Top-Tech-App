import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext.jsx';
import axios from 'axios';
import useStoreNavigate from '../hooks/useStoreNavigate';
import Loader from '../components/Loader.jsx';
import {
    User,
    Phone,
    MapPin,
    Truck,
    CreditCard,
    Calendar,
    Check,
    Search,
    AlertCircle,
    ShoppingBag,
    Copy,
    DollarSign,
    Clock
} from 'lucide-react';

/**
 * AllOrdersList Component.
 * A central administrative view for listing and managing all customer orders.
 * Redesigned with premium aesthetics, status indicators, and detailed additions rendering.
 * 
 * @param {Object} props - Component props.
 * @param {Function} props.showNotification - Function to display a global notification.
 */
const AllOrdersList = ({ showNotification }) => {
    const { getToken } = useAuth();
    const navigate = useStoreNavigate();
    const [orders, setOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchAllOrders = useCallback(async (pageNum = 1, isInitial = false) => {
        try {
            const token = getToken();
            if (!token) {
                navigate('/login');
                return;
            }

            if (pageNum === 1 && !isInitial) setLoading(true);
            else if (pageNum > 1) setLoadingMore(true);

            const response = await axios.get(`${__API_URL__}/orders?page=${pageNum}&limit=20`, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
            });

            const { orders: newOrders, hasMore: moreExists } = response.data;

            setOrders(prev => isInitial || pageNum === 1 ? newOrders : [...prev, ...newOrders]);
            setHasMore(moreExists);
            setLoading(false);
            setLoadingMore(false);
        } catch (err) {
            console.error('Failed to fetch orders:', err);
            setError(err.response?.data?.message || 'שגיאה בטעינת ההזמנות');
            setLoading(false);
            setLoadingMore(false);
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
            // Refresh current list
            fetchAllOrders(1, true);
            setPage(1);
        } catch (err) {
            showNotification(err.response?.data?.message || 'שגיאה בעדכון ההזמנה', 'error');
        }
    };

    const handleCopyId = (e, orderId) => {
        e.stopPropagation();
        navigator.clipboard.writeText(orderId);
        showNotification('מספר ההזמנה הועתק ללוח', 'success');
    };

    useEffect(() => {
        fetchAllOrders(1, true);
    }, [fetchAllOrders]);

    // Handle Infinite Scroll
    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + document.documentElement.scrollTop + 50 >= document.documentElement.offsetHeight) {
                if (!loading && !loadingMore && hasMore) {
                    setPage(prev => {
                        const nextPage = prev + 1;
                        fetchAllOrders(nextPage);
                        return nextPage;
                    });
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loading, loadingMore, hasMore, fetchAllOrders]);

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
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4" dir="rtl">
                <AlertCircle className="text-red-500 w-16 h-16" />
                <h3 className="text-xl font-bold text-gray-900">אירעה שגיאה בטעינת ההזמנות</h3>
                <p className="text-gray-500">{error}</p>
                <button
                    onClick={() => fetchAllOrders(1, true)}
                    className="px-6 py-2 bg-primary text-white rounded-xl font-bold shadow-md hover:bg-primary-hover transition-colors"
                >
                    נסה שוב
                </button>
            </div>
        );
    }

    const OrderDetails = ({ order }) => {
        const customerName = order.isGuestOrder
            ? (order.shippingAddress?.fullName || 'אורח')
            : (order.user?.username || 'משתמש לא ידוע');

        const customerEmail = order.isGuestOrder
            ? (order.shippingAddress?.email || order.contactEmail || 'לא סופק אימייל')
            : (order.user?.email || 'לא ידוע');

        return (
            <li key={order._id} className="bg-white rounded-[2rem] border border-gray-100 p-6 md:p-8 shadow-lg shadow-gray-100/50 hover:shadow-xl hover:border-gray-200 transition-all duration-300 flex flex-col gap-6 text-right">

                {/* Order Header / Metadata */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-50">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-gray-400 uppercase tracking-wider block">מספר הזמנה</span>
                            <button
                                onClick={(e) => handleCopyId(e, order._id)}
                                className="text-gray-400 hover:text-primary transition-colors"
                                title="העתק מספר הזמנה"
                            >
                                <Copy size={12} />
                            </button>
                        </div>
                        <span className="text-base font-black text-gray-800 font-mono select-all">{order._id}</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right sm:text-left">
                            <span className="text-xs font-black text-gray-400 block">תאריך ביצוע</span>
                            <span className="text-sm font-bold text-gray-700 flex items-center gap-1.5 mt-0.5 justify-end">
                                <Calendar size={14} className="text-gray-400" />
                                <span>{new Date(order.createdAt).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            </span>
                        </div>

                        {/* Status Badge */}
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-black text-gray-400 block mb-0.5">סטטוס משלוח</span>
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black border ${order.isDelivered
                                ? 'bg-green-50 text-green-700 border-green-100'
                                : order.isCancelled
                                    ? 'bg-red-50 text-red-700 border-red-100'
                                    : 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse'
                                }`}>
                                {order.isDelivered ? (
                                    <>
                                        <Check size={12} className="stroke-[3]" />
                                        <span>נשלח</span>
                                    </>
                                ) : order.isCancelled ? (
                                    <span>בוטל</span>
                                ) : (
                                    <>
                                        <Clock size={12} />
                                        <span>ממתין לטיפול</span>
                                    </>
                                )}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50/50 rounded-2xl p-5 border border-gray-50/50 text-sm">
                    {/* Customer Info */}
                    <div className="space-y-2">
                        <h4 className="font-black text-gray-900 flex items-center gap-2 pb-1 border-b border-gray-100/50">
                            <User size={16} className="text-primary" />
                            <span>פרטי הלקוח</span>
                        </h4>
                        <div className="space-y-1 font-medium text-gray-600">
                            <p className="font-bold text-gray-800">{customerName} {order.isGuestOrder && <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full font-bold">אורח</span>}</p>
                            <p className="truncate" title={customerEmail}>{customerEmail}</p>
                            <p className="flex items-center gap-1.5 mt-1 text-gray-800 font-bold" dir="ltr">
                                <Phone size={12} className="text-gray-400" />
                                <span>{order.shippingAddress?.phone}</span>
                            </p>
                        </div>
                    </div>

                    {/* Shipping Info */}
                    <div className="space-y-2">
                        <h4 className="font-black text-gray-900 flex items-center gap-2 pb-1 border-b border-gray-100/50">
                            <Truck size={16} className="text-primary" />
                            <span>פרטי משלוח</span>
                        </h4>
                        <div className="space-y-1 font-medium text-gray-600">
                            <p className="flex items-center gap-1">
                                <MapPin size={12} className="text-gray-400" />
                                <span className="font-bold text-gray-800">{order.shippingAddress?.street}, {order.shippingAddress?.city}</span>
                            </p>
                            <p className="text-xs mt-1">
                                <strong>שיטה:</strong> {
                                    order.shippingMethod === 'home-delivery' ? 'משלוח עד הבית' :
                                        order.shippingMethod === 'pickup-point' ? 'משלוח לנקודת איסוף' :
                                            order.shippingMethod === 'pickup-business' ? 'איסוף עצמי מבית העסק' :
                                                order.shippingMethod || 'לא מוגדר'
                                }
                            </p>
                            <p className="text-xs text-gray-400">דמי משלוח: ₪{order.shippingPrice !== undefined ? order.shippingPrice.toFixed(2) : '0.00'}</p>
                        </div>
                    </div>

                    {/* Payment Info & Actions */}
                    <div className="space-y-2">
                        <h4 className="font-black text-gray-900 flex items-center gap-2 pb-1 border-b border-gray-100/50">
                            <CreditCard size={16} className="text-primary" />
                            <span>תשלום וסיכום</span>
                        </h4>
                        <div className="space-y-1 font-medium text-gray-600">
                            <p><strong>אמצעי:</strong> {order.paymentMethod === 'credit-card' ? '💳 כרטיס אשראי' : '💵 מזומן / במקום'}</p>
                            <p className="text-lg font-black text-green-600 flex items-center gap-1 mt-1">
                                <span>₪{order.totalPrice.toFixed(2)}</span>
                            </p>

                            {/* Deliver Action */}
                            {!order.isDelivered && !order.isCancelled && (
                                <button
                                    onClick={() => handleDeliverOrder(order._id)}
                                    className="w-full mt-3 py-2 px-4 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary-hover shadow-md shadow-primary/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <Check size={14} className="stroke-[3]" />
                                    <span>
                                        {order.shippingMethod === 'pickup-business' || 
                                         (order.shippingMethod && (
                                             order.shippingMethod.toLowerCase().includes('pickup') || 
                                             order.shippingMethod.includes('איסוף')
                                         )) ? 'סמן כמוכן לאיסוף' : 'סמן כנשלח'}
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Items List */}
                <div className="space-y-3">
                    <h4 className="font-black text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-100">
                        <ShoppingBag size={16} className="text-gray-400" />
                        <span>פריטי ההזמנה</span>
                    </h4>

                    <ul className="divide-y divide-gray-50">
                        {order.orderItems.map((item, index) => {
                            const product = item.product;

                            if (!product) {
                                return (
                                    <li key={`deleted-${index}`} className="py-3 text-gray-400 italic text-xs flex justify-between items-center">
                                        <span>מוצר אינו קיים יותר במערכת</span>
                                        <span className="font-bold">כמות: {item.quantity}</span>
                                    </li>
                                );
                            }

                            const variantId = typeof item.variant === 'string' ? item.variant : item.variant?._id;
                            let displayedVariant = product.variants?.find(v => v._id?.toString() === variantId);

                            let variantText = '';
                            if (item.attributes && Object.entries(item.attributes).length > 0) {
                                variantText = Object.entries(item.attributes)
                                    .map(([key, value]) => `${key === 'color' ? 'צבע' : key === 'storage' ? 'נפח' : key === 'size' ? 'גודל' : key}: ${value}`)
                                    .join(', ');
                            } else if (displayedVariant) {
                                const color = displayedVariant.color;
                                const storage = displayedVariant.storage;
                                variantText = (color && storage) ? `צבע: ${color}, נפח: ${storage}` : color ? `צבע: ${color}` : storage ? `נפח: ${storage}` : '';
                            }

                            const imageUrl = (displayedVariant?.imageUrls && displayedVariant.imageUrls.length > 0)
                                ? displayedVariant.imageUrls[0]
                                : (displayedVariant?.imageUrl
                                    || (product?.variants?.[0]?.imageUrls && product.variants[0].imageUrls.length > 0
                                        ? product.variants[0].imageUrls[0]
                                        : product?.variants?.[0]?.imageUrl)
                                    || 'https://placehold.co/100x100?text=Product');

                            return (
                                <li key={item._id || `item-${index}`} className="py-3 flex items-start gap-4 animate-in fade-in duration-300">
                                    <img src={imageUrl} alt={product.name} className="w-14 h-14 object-cover rounded-xl border border-gray-100 shadow-sm flex-shrink-0" />
                                    <div className="flex-1 space-y-1">
                                        <div className="flex justify-between items-start gap-2">
                                            <p className="font-bold text-gray-900 text-sm leading-tight">{product.name}</p>
                                            <span className="font-black text-gray-900 text-sm">₪{(item.quantity * item.price).toFixed(2)}</span>
                                        </div>

                                        <div className="flex flex-wrap gap-2 text-xs">
                                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">כמות: {item.quantity}</span>
                                            {variantText && <span className="text-gray-400 font-medium">• {variantText}</span>}
                                        </div>

                                        {/* Item Upgrades & Options */}
                                        {item.selectedOptions && item.selectedOptions.length > 0 && (
                                            <div className="text-xs text-gray-500 mt-2 space-y-0.5 pr-2 border-r-2 border-primary/20 bg-gray-50/50 p-2 rounded-lg inline-block">
                                                {item.selectedOptions.map((opt, oIdx) => (
                                                    <div key={oIdx} className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="font-bold text-gray-700">{opt.name}:</span>
                                                        <span className="text-gray-600">{opt.choice}</span>
                                                        {opt.priceAddition > 0 && (
                                                            <span className="text-green-600 font-bold">
                                                                (+₪{opt.priceAddition.toFixed(2)})
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </li>
        )
    };

    return (
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-xl shadow-gray-100 border border-gray-100 mt-6" dir="rtl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h3 className="text-3xl font-black text-gray-900 tracking-tight">ניהול הזמנות באתר</h3>
                    <p className="text-gray-500 font-medium mt-1">סה״כ במערכת: {orders.length} הזמנות</p>
                </div>
            </div>

            {/* Search Input */}
            <div className="relative mb-8 group">
                <Search className="absolute top-4 right-4 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                <input
                    type="text"
                    placeholder="חפש לפי שם לקוח, טלפון או מזהה הזמנה..."
                    className="w-full p-4 pr-12 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-primary outline-none text-right font-medium transition-all shadow-inner"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {filteredOrders.length === 0 ? (
                <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-100 rounded-[2rem] flex flex-col items-center justify-center gap-3">
                    <ShoppingBag size={48} className="text-gray-300 stroke-[1.5]" />
                    <p className="text-lg font-bold">לא נמצאו הזמנות</p>
                    <p className="text-sm text-gray-400">נסה לחפש משהו אחר או שהרשימה ריקה.</p>
                </div>
            ) : (
                <>
                    <ul className="space-y-8">
                        {filteredOrders.map((order) => <OrderDetails key={order._id} order={order} />)}
                    </ul>

                    {loadingMore && (
                        <div className="text-center py-6 mt-6 flex justify-center">
                            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent" role="status">
                                <span className="sr-only">טוען...</span>
                            </div>
                        </div>
                    )}

                    {!hasMore && orders.length > 0 && (
                        <p className="text-center text-gray-400 py-8 border-t border-gray-50 mt-8 italic text-sm">הגעת לסוף רשימת ההזמנות</p>
                    )}
                </>
            )}
        </div>
    );
};

export default AllOrdersList;