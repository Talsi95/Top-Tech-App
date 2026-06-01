import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import CouponForm from './CouponForm';
import Loader from './Loader';
import { Plus, Trash2, Edit, Tag, ToggleLeft, ToggleRight, Check, X, Calendar, Sparkles, ShoppingBag, FolderOpen } from 'lucide-react';

/**
 * CouponsList Component.
 * Administrative list and management dashboard for coupons.
 */
const CouponsList = ({ showNotification }) => {
    const { getToken } = useAuth();
    const [coupons, setCoupons] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);

    // Let's modify the top import first, or do it locally. Let's just update the top imports in the next step, or replace it here.
    // Let's wrap fetchData in useCallback:
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = getToken();
            const headers = { Authorization: `Bearer ${token}` };

            // Fetch coupons
            const couponRes = await axios.get(`${__API_URL__}/admin/coupons`, { headers });
            setCoupons(couponRes.data || []);

            // Fetch categories to resolve IDs to names
            const categoryRes = await axios.get(`${__API_URL__}/categories`, { headers });
            setCategories(categoryRes.data || []);
        } catch (error) {
            console.error('Error fetching coupon dashboard data:', error);
            showNotification('שגיאה בטעינת נתוני הקופונים', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [getToken, showNotification]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Toggle coupon activity status instantly
    const handleToggleActive = async (id, currentStatus) => {
        try {
            const token = getToken();
            const response = await axios.patch(
                `${__API_URL__}/admin/coupons/${id}/toggle`,
                { isActive: !currentStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Update local state
            setCoupons(prev => prev.map(c => c._id === id ? response.data : c));
            showNotification(
                `הקופון ${!currentStatus ? 'הופעל' : 'הושבת'} בהצלחה`,
                'success'
            );
        } catch (error) {
            console.error('Error toggling coupon status:', error);
            showNotification('שגיאה בעדכון סטטוס הקופון', 'error');
        }
    };

    // Delete a coupon
    const handleDeleteCoupon = async (id, code) => {
        if (!window.confirm(`האם אתה בטוח שברצונך למחוק את הקופון "${code}"?`)) {
            return;
        }

        try {
            const token = getToken();
            await axios.delete(`${__API_URL__}/admin/coupons/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setCoupons(prev => prev.filter(c => c._id !== id));
            showNotification(`הקופון "${code}" נמחק בהצלחה`, 'success');
        } catch (error) {
            console.error('Error deleting coupon:', error);
            showNotification('שגיאה במחיקת הקופון', 'error');
        }
    };

    // Helper to format date
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('he-IL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    // Helper to resolve target IDs to display labels
    const getTargetDisplay = (coupon) => {
        if (coupon.targetType === 'global') {
            return (
                <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-bold">
                    <ShoppingBag size={12} />
                    <span>כל האתר</span>
                </span>
            );
        }

        if (coupon.targetType === 'category') {
            const names = coupon.targetIds
                .map(id => categories.find(c => c._id === id)?.name)
                .filter(Boolean);

            if (names.length === 0) {
                return <span className="text-gray-400 text-xs">קטגוריות (לא נמצאו)</span>;
            }

            return (
                <div className="flex flex-wrap gap-1 items-center">
                    <span className="text-[10px] text-gray-400 font-bold ml-1">מחלקות:</span>
                    {names.map((name, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md font-black">
                            <FolderOpen size={10} />
                            <span>{name}</span>
                        </span>
                    ))}
                </div>
            );
        }

        if (coupon.targetType === 'product') {
            return (
                <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-600 px-3 py-1 rounded-full font-bold">
                    <Sparkles size={12} />
                    <span>{coupon.targetIds?.length || 0} מוצרים ספציפיים</span>
                </span>
            );
        }

        return coupon.targetType;
    };

    // Action handlers for navigation to form
    const startCreate = () => {
        setEditingCoupon(null);
        setIsEditing(true);
    };

    const startEdit = (coupon) => {
        setEditingCoupon(coupon);
        setIsEditing(true);
    };

    const handleSaveSuccess = () => {
        setIsEditing(false);
        setEditingCoupon(null);
        fetchData();
    };

    if (isLoading) return <Loader text="טוען קופונים..." />;

    // Render Edit/Create Form
    if (isEditing) {
        return (
            <CouponForm
                showNotification={showNotification}
                existingCoupon={editingCoupon}
                onSaveSuccess={handleSaveSuccess}
                onCancel={() => setIsEditing(false)}
            />
        );
    }

    return (
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-10" dir="rtl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-primary/10 text-primary rounded-2xl">
                        <Tag className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">ניהול קופונים</h2>
                        <p className="text-gray-500 font-medium mt-1">צור, ערוך ונהל קופוני הנחה מבוססי אחוזים או סכום קבוע</p>
                    </div>
                </div>
                <button
                    onClick={startCreate}
                    className="bg-primary text-white px-6 py-3.5 rounded-2xl font-black text-sm shadow-lg hover:shadow-primary/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer self-start md:self-auto"
                >
                    <Plus size={18} />
                    <span>קופון חדש</span>
                </button>
            </div>

            {/* Coupons List Grid/Table */}
            <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] border border-gray-50 p-6 md:p-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">קופונים קיימים בחנות</h3>
                    <span className="text-xs font-black text-primary bg-primary/5 px-3 py-1.5 rounded-full">
                        {coupons.length} קופונים פעילים ומתוזמנים
                    </span>
                </div>

                <div className="overflow-x-auto">
                    {coupons.length === 0 ? (
                        <div className="text-center py-16 text-gray-400 font-medium">
                            <Tag className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                            <p className="text-lg">אין עדיין קופונים במערכת.</p>
                            <p className="text-sm text-gray-400 mt-1">לחץ על כפתור ״קופון חדש״ כדי ליצור את הראשון שלך.</p>
                        </div>
                    ) : (
                        <table className="w-full text-right border-collapse">
                            <thead>
                                <tr className="border-b border-gray-50 text-xs font-black text-gray-400 uppercase tracking-widest pb-4">
                                    <th className="py-4 px-4">קוד קופון</th>
                                    <th className="py-4 px-4">סוג הנחה</th>
                                    <th className="py-4 px-4">ערך</th>
                                    <th className="py-4 px-4">טווח החלה</th>
                                    <th className="py-4 px-4">תקופת תוקף</th>
                                    <th className="py-4 px-4 text-center">ניצול</th>
                                    <th className="py-4 px-4 text-center">פעיל</th>
                                    <th className="py-4 px-4 text-center">פעולות</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50/50">
                                {coupons.map((coupon) => {
                                    const isExpired = new Date() > new Date(coupon.validTo);

                                    return (
                                        <tr key={coupon._id} className="hover:bg-gray-50/30 transition-colors text-sm font-bold text-gray-800">
                                            {/* Code */}
                                            <td className="py-5 px-4">
                                                <span className="font-black text-lg tracking-wider text-gray-900 select-all">
                                                    {coupon.code}
                                                </span>
                                            </td>

                                            {/* Discount Type */}
                                            <td className="py-5 px-4">
                                                {coupon.discountType === 'percentage' ? (
                                                    <span className="text-xs bg-primary/5 text-primary px-2.5 py-1 rounded-md">אחוזים</span>
                                                ) : (
                                                    <span className="text-xs bg-amber-50 text-amber-600 px-2.5 py-1 rounded-md">סכום קבוע</span>
                                                )}
                                            </td>

                                            {/* Discount Value */}
                                            <td className="py-5 px-4">
                                                <span className="text-base font-black text-gray-900">
                                                    {coupon.discountType === 'percentage'
                                                        ? `${coupon.discountValue}%`
                                                        : `₪${coupon.discountValue}`
                                                    }
                                                </span>
                                            </td>

                                            {/* Target Scope */}
                                            <td className="py-5 px-4">
                                                {getTargetDisplay(coupon)}
                                            </td>

                                            {/* Dates */}
                                            <td className="py-5 px-4 text-xs font-semibold text-gray-500">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar size={12} className="text-gray-400" />
                                                    <span>{formatDate(coupon.validFrom)} עד {formatDate(coupon.validTo)}</span>
                                                    {isExpired && (
                                                        <span className="text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded font-bold">
                                                            פג תוקף
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Usage count */}
                                            <td className="py-5 px-4 text-center">
                                                <div className="inline-block px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold text-gray-600">
                                                    <span>{coupon.usedCount}</span>
                                                    <span className="text-gray-400 mx-1">/</span>
                                                    <span>{coupon.usageLimit || '∞'}</span>
                                                </div>
                                            </td>

                                            {/* Active Switch */}
                                            <td className="py-5 px-4 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleActive(coupon._id, coupon.isActive)}
                                                    className="focus:outline-none transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                                                >
                                                    {coupon.isActive ? (
                                                        <span className="text-primary flex items-center justify-center"><ToggleRight size={36} /></span>
                                                    ) : (
                                                        <span className="text-gray-300 flex items-center justify-center"><ToggleLeft size={36} /></span>
                                                    )}
                                                </button>
                                            </td>

                                            {/* Actions */}
                                            <td className="py-5 px-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => startEdit(coupon)}
                                                        className="p-2 bg-white hover:bg-primary/5 text-gray-500 hover:text-primary rounded-xl transition-all border border-gray-100 shadow-sm active:scale-95 cursor-pointer"
                                                        title="ערוך קופון"
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCoupon(coupon._id, coupon.code)}
                                                        className="p-2 bg-white hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-xl transition-all border border-gray-100 shadow-sm active:scale-95 cursor-pointer"
                                                        title="מחק קופון"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CouponsList;
