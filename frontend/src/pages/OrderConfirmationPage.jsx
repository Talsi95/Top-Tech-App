import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Check, MapPin, Receipt, Package, Calendar, Phone, CreditCard, ChevronRight, User } from 'lucide-react';
import { useAuth } from '../AuthContext.jsx';
import Loader from '../components/Loader.jsx';
import useStoreNavigate from '../hooks/useStoreNavigate';
import StoreLink from '../components/StoreLink';

/**
 * OrderConfirmationPage Component.
 * A premium success receipt view with consistent design system tokens and beautiful animations.
 */
const OrderConfirmationPage = ({ showNotification }) => {
    const { orderId } = useParams();
    const location = useLocation();
    const { getToken, isGuest } = useAuth();
    const navigate = useStoreNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const authToken = getToken() || location.state?.guestToken || localStorage.getItem('guestTokenForOrder');

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
        return (
            <div className="min-h-screen bg-gray-50/50 flex items-center justify-center p-6" dir="rtl">
                <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl max-w-md w-full text-center space-y-4">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
                        <Check className="rotate-45" size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900">אירעה שגיאה בטעינה</h2>
                    <p className="text-gray-500 font-medium">{error}</p>
                    <StoreLink to="/" className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all w-full justify-center">
                        חזרה לחנות
                    </StoreLink>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-gray-50/50 flex items-center justify-center p-6" dir="rtl">
                <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl max-w-md w-full text-center space-y-4">
                    <h2 className="text-2xl font-black text-gray-900">ההזמנה לא נמצאה</h2>
                    <StoreLink to="/" className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all w-full justify-center">
                        חזרה לחנות
                    </StoreLink>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 py-16 px-6" dir="rtl">
            <div className="max-w-3xl mx-auto bg-white rounded-[3rem] border border-gray-100 p-8 md:p-12 shadow-2xl shadow-gray-200/50 animate-in fade-in zoom-in-95 duration-500">
                
                {/* Success Banner */}
                <div className="text-center mb-12 space-y-3">
                    <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/10 animate-bounce duration-[1500ms]">
                        <Check size={40} className="stroke-[3]" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter">הזמנתך אושרה בהצלחה!</h1>
                    <p className="text-lg text-gray-500 font-medium">שמחים לעדכן שקיבלנו את ההזמנה שלך והיא בטיפול.</p>
                </div>

                <div className="space-y-8">
                    
                    {/* Order Reference Box */}
                    <div className="bg-gray-50/60 rounded-3xl p-6 border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <span className="text-xs font-black text-gray-400 uppercase tracking-wider block">מספר הזמנה במערכת</span>
                            <span className="text-lg font-black text-primary select-all">{order._id}</span>
                        </div>
                        <div className="h-px sm:h-8 w-full sm:w-px bg-gray-200"></div>
                        <div>
                            <span className="text-xs font-black text-gray-400 uppercase tracking-wider block">תאריך ביצוע</span>
                            <span className="text-sm font-bold text-gray-700 flex items-center gap-1.5 mt-0.5">
                                <Calendar size={14} className="text-gray-400" />
                                <span>{new Date(order.createdAt).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            </span>
                        </div>
                        <div className="h-px sm:h-8 w-full sm:w-px bg-gray-200"></div>
                        <div>
                            <span className="text-xs font-black text-gray-400 uppercase tracking-wider block">סה״כ לתשלום</span>
                            <span className="text-xl font-black text-green-600">₪{order.totalPrice.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Delivery & Shipping Info */}
                    <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4">
                        <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-50">
                            <MapPin className="text-primary" size={18} />
                            <span>פרטי אספקה ומשלוח</span>
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-gray-500">
                                    <User size={14} className="text-gray-400" />
                                    <span className="font-bold text-gray-700">רחוב ומספר בית:</span>
                                </div>
                                <p className="text-gray-800 font-medium pr-5">{order.shippingAddress.street}</p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-gray-500">
                                    <MapPin size={14} className="text-gray-400" />
                                    <span className="font-bold text-gray-700">עיר / יישוב:</span>
                                </div>
                                <p className="text-gray-800 font-medium pr-5">{order.shippingAddress.city}</p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-gray-500">
                                    <Phone size={14} className="text-gray-400" />
                                    <span className="font-bold text-gray-700">טלפון ליצירת קשר:</span>
                                </div>
                                <p className="text-gray-800 font-medium pr-5">{order.shippingAddress.phone}</p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-gray-500">
                                    <CreditCard size={14} className="text-gray-400" />
                                    <span className="font-bold text-gray-700">שיטת משלוח ועלות:</span>
                                </div>
                                <div className="text-gray-800 font-medium pr-5 space-y-0.5">
                                    <p>{
                                        order.shippingMethod === 'home-delivery' ? 'משלוח מהיר עד הבית' :
                                        order.shippingMethod === 'pickup-point' ? 'משלוח לנקודת איסוף (קרוב לבית)' :
                                        order.shippingMethod === 'pickup-business' ? 'איסוף עצמי מבית העסק' :
                                        order.shippingMethod || 'לא נבחר'
                                    }</p>
                                    <p className="text-xs text-gray-400">דמי משלוח: ₪{order.shippingPrice?.toFixed(2) || '0.00'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order items List */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
                            <Receipt className="text-gray-400" size={18} />
                            <span>פירוט פריטי הקנייה</span>
                        </h3>
                        
                        <div className="divide-y divide-gray-50">
                            {order.orderItems.map((item, index) => {
                                const attributes = item.attributes;
                                const variantText = attributes && Object.entries(attributes).length > 0
                                    ? Object.entries(attributes).map(([key, value]) => `${key === 'color' ? 'צבע' : key === 'storage' ? 'נפח' : key === 'size' ? 'גודל' : key}: ${value}`).join(', ')
                                    : '';

                                const itemImage = (() => {
                                    const variantId = item.variant?._id || item.variant;
                                    const variantObj = item.product?.variants?.find(v => (v._id || v.id).toString() === variantId?.toString());
                                    
                                    if (variantObj) {
                                        if (variantObj.imageUrls && variantObj.imageUrls.length > 0) return variantObj.imageUrls[0];
                                        if (variantObj.imageUrl) return variantObj.imageUrl;
                                    }
                                    return item.product?.imageUrl || 'https://placehold.co/100x100?text=Product';
                                })();

                                return (
                                    <div key={index} className="py-4 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <img
                                            src={itemImage}
                                            alt={item.product?.name || 'מוצר'}
                                            className="w-16 h-16 object-cover rounded-2xl border border-gray-100 shadow-sm"
                                        />
                                        <div className="flex-grow flex justify-between items-center">
                                            <div className="space-y-0.5">
                                                <span className="font-bold text-gray-900 block text-base">
                                                    {item.product?.name || 'מוצר'}
                                                </span>
                                                <span className="text-xs text-gray-500 flex items-center gap-2">
                                                    <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-bold">כמות: {item.quantity}</span>
                                                    {variantText && <span>• {variantText}</span>}
                                                </span>
                                                {item.selectedOptions && item.selectedOptions.length > 0 && (
                                                    <div className="text-xs text-gray-500 mt-1 space-y-0.5 pr-2 border-r-2 border-primary/20">
                                                        {item.selectedOptions.map((opt, oIdx) => (
                                                            <div key={oIdx} className="flex items-center gap-1.5">
                                                                <span className="font-semibold text-gray-700">{opt.name}:</span>
                                                                <span className="text-gray-600">{opt.choice}</span>
                                                                {opt.priceAddition > 0 && (
                                                                    <span className="text-green-600 font-medium font-mono text-[10px]">
                                                                        (+₪{opt.priceAddition.toFixed(2)})
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="font-black text-gray-900 text-base">
                                                ₪{(item.quantity * item.price).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>

                {/* Actions Footer */}
                <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col sm:flex-row justify-center gap-4">
                    <button
                        onClick={() => showNotification('פונקציית שליחה במייל טרם מומשה.', 'info')}
                        className="bg-gray-50 text-gray-700 py-3.5 px-6 rounded-2xl hover:bg-gray-100 transition-colors font-black text-sm border border-gray-200/40"
                    >
                        שלח את פרטי ההזמנה במייל
                    </button>

                    {!isGuest && (
                        <button
                            onClick={() => navigate('/profile')}
                            className="bg-primary text-white py-3.5 px-6 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all font-black text-sm shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                        >
                            <Package size={16} />
                            <span>לצפייה בכל ההזמנות שלי</span>
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
};

export default OrderConfirmationPage;