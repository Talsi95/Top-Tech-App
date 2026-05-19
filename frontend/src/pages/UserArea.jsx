import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext.jsx';
import useStoreNavigate from '../hooks/useStoreNavigate';
import { Package, User, LogOut, Settings, Calendar, CreditCard, ChevronLeft, MapPin } from 'lucide-react';
import axios from 'axios';
import Loader from '../components/Loader.jsx';

/**
 * UserArea Component.
 */
const UserArea = () => {
    const { isAuthenticated, getToken, logout } = useAuth();
    const navigate = useStoreNavigate();
    const [userData, setUserData] = useState(null);
    const [userOrders, setUserOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchUserDataAndOrders = useCallback(async () => {
        try {
            const token = getToken();
            if (!token) {
                navigate('/login');
                return;
            }
            const response = await axios.get(`${__API_URL__}/auth/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setUserData(response.data);
            setUserOrders(response.data.orders);
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.message || err.message);
            setLoading(false);
        }
    }, [getToken, navigate]);

    const handleCancelOrder = async (orderId) => {
        if (!window.confirm('האם אתה בטוח שברצונך לבטל את ההזמנה?')) {
            return;
        }

        try {
            const token = getToken();
            await axios.patch(`${__API_URL__}/orders/${orderId}/cancel`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
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
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500">
                    <User size={40} />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">אופס, משהו השתבש</h2>
                <p className="text-gray-500 mb-6">{error}</p>
                <button onClick={() => window.location.reload()} className="px-8 py-3 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20">נסה שוב</button>
            </div>
        );
    }

    return (
        <div className="max-w-[1440px] mx-auto px-6 py-12" dir="rtl">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 bg-white p-8 rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border border-gray-50">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary">
                        <User size={40} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tighter mb-1">
                            {userData?.isGuest ? 'מעקב הזמנות אורח' : `היי, ${userData?.username || 'משתמש'}`}
                        </h2>
                        <p className="text-gray-500 font-medium">{userData?.email}</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    {!userData?.isGuest && (
                        <button
                            onClick={() => navigate('/profile/edit')}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-gray-50 text-gray-700 rounded-2xl hover:bg-primary/10 hover:text-primary transition-all font-bold"
                        >
                            <Settings size={18} /> הגדרות
                        </button>
                    )}
                    <button
                        onClick={logout}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all font-bold"
                    >
                        <LogOut size={18} /> התנתק
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Stats/Details */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">פרטי חשבון</h3>
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400"><User size={20} /></div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase">שם מלא</p>
                                    <p className="font-bold text-gray-900">{userData?.isGuest ? 'אורח' : userData?.username}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400"><Settings size={20} /></div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase">טלפון</p>
                                    <p className="font-bold text-gray-900 text-left">{userData?.phone || 'לא הוזן'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-primary p-8 rounded-[2.5rem] shadow-xl shadow-primary/20 text-white relative overflow-hidden">
                        <Package className="absolute -bottom-4 -left-4 w-32 h-32 opacity-10 rotate-12" />
                        <h3 className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-2">סטטיסטיקה</h3>
                        <div className="relative z-10">
                            <p className="text-4xl font-black mb-1">{userOrders.length}</p>
                            <p className="font-bold opacity-80">הזמנות שבוצעו</p>
                        </div>
                    </div>
                </div>

                {/* Orders List */}
                <div className="lg:col-span-2">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50 min-h-[400px]">
                        <h3 className="text-2xl font-black text-gray-900 tracking-tighter mb-8">היסטוריית הזמנות</h3>
                        
                        {userOrders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <Package className="text-gray-100 mb-4" size={80} />
                                <p className="text-gray-500 font-bold">עדיין לא ביצעת הזמנות</p>
                                <button onClick={() => navigate('/')} className="mt-4 text-primary font-black hover:underline">התחל לקנות כעת</button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {userOrders.map((order) => (
                                    <div key={order._id} className="group bg-gray-50/50 hover:bg-white p-6 rounded-[2rem] border border-transparent hover:border-gray-100 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-500">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-primary border border-gray-100">
                                                    <Package size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase">הזמנה #{order._id.slice(-6)}</p>
                                                    <p className="font-black text-gray-900">{new Date(order.createdAt).toLocaleDateString('he-IL')}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 w-full md:w-auto">
                                                <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider ${
                                                    order.isCancelled ? 'bg-red-50 text-red-500' : 
                                                    order.isDelivered ? 'bg-green-50 text-green-500' : 'bg-blue-50 text-blue-500'
                                                }`}>
                                                    {order.isCancelled ? 'בוטל' : (order.isDelivered ? 'נשלח' : 'בטיפול')}
                                                </div>
                                                <div className="bg-white px-4 py-2 rounded-xl text-gray-900 font-black border border-gray-100 shadow-sm">
                                                    ₪{order.totalPrice.toFixed(2)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-white/50 p-4 rounded-2xl">
                                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                                <CreditCard size={16} className="text-gray-400" />
                                                <span>תשלום: {order.paymentMethod === 'cash' ? 'מזומן' : 'כרטיס אשראי'}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                                <MapPin size={16} className="text-gray-400" />
                                                <span>משלוח: {
                                                    order.shippingMethod === 'home-delivery' ? 'עד הבית' :
                                                    order.shippingMethod === 'pickup-point' ? 'נקודת איסוף' : 'איסוף עצמי'
                                                }</span>
                                            </div>
                                        </div>

                                        {/* Order Items Mini List */}
                                        <div className="space-y-4 mb-6">
                                            {order.orderItems.map((item, index) => (
                                                <div key={item._id || index} className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-gray-50">
                                                    <img 
                                                        src={item.product?.variants?.[0]?.imageUrls?.[0] || 'https://via.placeholder.com/150'} 
                                                        alt={item.product?.name} 
                                                        className="w-12 h-12 object-contain bg-gray-50 rounded-xl" 
                                                    />
                                                    <div className="flex-1">
                                                        <p className="text-sm font-black text-gray-900">{item.product?.name || 'מוצר הוסר'}</p>
                                                        <p className="text-[10px] text-gray-500 font-bold">כמות: {item.quantity}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {!order.isCancelled && !order.isDelivered && (
                                            <button
                                                onClick={() => handleCancelOrder(order._id)}
                                                className="w-full py-3 bg-white text-red-500 border border-red-100 rounded-2xl font-black hover:bg-red-500 hover:text-white transition-all text-sm"
                                            >
                                                ביטול הזמנה
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserArea;