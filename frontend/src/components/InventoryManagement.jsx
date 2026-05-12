import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import Loader from './Loader';
import { Search, AlertCircle, Check, Save, Loader2, Plus, Minus, Package, LayoutGrid, Tag } from 'lucide-react';

/**
 * InventoryManagement Component.
 * A comprehensive administrative view for tracking and updating stock levels across all products and variants.
 * 
 * @param {Object} props - Component props.
 * @param {Function} props.showNotification - Function to display a global notification.
 */
const InventoryManagement = ({ showNotification }) => {
    const { getToken } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [lowStockOnly, setLowStockOnly] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [updatingVariants, setUpdatingVariants] = useState({}); // { variantId: true/false }
    const [editedStock, setEditedStock] = useState({}); // { variantId: value }

    const fetchProducts = useCallback(async (pageNum = 1, isInitial = false) => {
        try {
            if (pageNum === 1 && !isInitial) setLoading(true);
            else if (pageNum > 1) setLoadingMore(true);

            // Fetch products from backend with pagination and low stock filter
            const url = `${__API_URL__}/products?page=${pageNum}&limit=20&lowStock=${lowStockOnly}`;
            const response = await axios.get(url);
            
            const { products: newProducts, hasMore: moreExists } = response.data;

            setProducts(prev => isInitial || pageNum === 1 ? newProducts : [...prev, ...newProducts]);
            setHasMore(moreExists);
            
            // Initialize edited stock values with current values
            const newStockValues = {};
            newProducts.forEach(p => {
                p.variants.forEach(v => {
                    newStockValues[v._id] = v.stock;
                });
            });
            setEditedStock(prev => ({ ...prev, ...newStockValues }));

            setLoading(false);
            setLoadingMore(false);
        } catch (err) {
            console.error('Failed to fetch products:', err);
            showNotification('שגיאה בטעינת המוצרים', 'error');
            setLoading(false);
            setLoadingMore(false);
        }
    }, [lowStockOnly, showNotification]);

    useEffect(() => {
        fetchProducts(1, true);
        setPage(1);
    }, [lowStockOnly, fetchProducts]);

    /**
     * Handles manual input or button clicks to change the stock value in local state.
     */
    const handleStockChange = (variantId, value) => {
        setEditedStock(prev => ({
            ...prev,
            [variantId]: value
        }));
    };

    /**
     * Persists the updated stock level for a specific variant to the backend.
     */
    const updateStock = async (productId, variantId) => {
        const token = getToken();
        if (!token) return;

        setUpdatingVariants(prev => ({ ...prev, [variantId]: true }));
        try {
            const stockValue = parseInt(editedStock[variantId], 10);
            
            if (isNaN(stockValue)) {
                showNotification('נא להזין מספר תקין', 'error');
                return;
            }

            await axios.put(
                `${__API_URL__}/products/${productId}/variants/${variantId}`,
                { stock: stockValue },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            showNotification('מלאי עודכן בהצלחה', 'success');
            
            // Update the product list state with the new value
            setProducts(prevProducts => prevProducts.map(p => {
                if (p._id === productId) {
                    return {
                        ...p,
                        variants: p.variants.map(v => v._id === variantId ? { ...v, stock: stockValue } : v)
                    };
                }
                return p;
            }));
        } catch (err) {
            console.error('Failed to update stock:', err);
            showNotification('שגיאה בעדכון המלאי', 'error');
        } finally {
            setUpdatingVariants(prev => ({ ...prev, [variantId]: false }));
        }
    };

    // Basic local filtering for immediate feedback during typing
    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.subcategory.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <Loader text="טוען מלאי מוצרים..." />;

    return (
        <div className="space-y-8" dir="rtl">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="חיפוש מוצר, קטגוריה או תת-קטגוריה..."
                        className="w-full pr-12 pl-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <button
                    onClick={() => setLowStockOnly(!lowStockOnly)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${
                        lowStockOnly 
                        ? 'bg-red-50 text-red-600 border border-red-100 shadow-sm' 
                        : 'bg-white border border-gray-100 text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    <AlertCircle size={20} />
                    <span>מלאי נמוך בלבד (5 ומטה)</span>
                </button>
            </div>

            {/* Products List */}
            <div className="space-y-6">
                {filteredProducts.map(product => (
                    <div key={product._id} className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        {/* Product Header Row */}
                        <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-white rounded-xl border border-gray-100 text-primary">
                                    <Package size={20} />
                                </div>
                                <div>
                                    <h4 className="font-black text-gray-900 tracking-tight">{product.name}</h4>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                            <LayoutGrid size={12} />
                                            {product.category}
                                        </span>
                                        <span className="text-gray-200 text-xs">•</span>
                                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                            <Tag size={12} />
                                            {product.subcategory}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-left">
                                <span className="text-xs font-bold text-gray-400">וריאציות: {product.variants.length}</span>
                            </div>
                        </div>

                        {/* Variants Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-right text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                                        <th className="px-6 py-4">תמונה</th>
                                        <th className="px-6 py-4">מאפיינים</th>
                                        <th className="px-6 py-4 text-center">מחיר</th>
                                        <th className="px-6 py-4 text-center">מלאי</th>
                                        <th className="px-6 py-4 text-left whitespace-nowrap">פעולות</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {product.variants.map(variant => {
                                        const currentStock = editedStock[variant._id] ?? variant.stock;
                                        const isLowStock = currentStock <= 5;
                                        const isUpdating = updatingVariants[variant._id];
                                        const hasChanges = editedStock[variant._id] !== undefined && parseInt(editedStock[variant._id]) !== variant.stock;

                                        return (
                                            <tr key={variant._id} className="group hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <img 
                                                        src={variant.imageUrls?.[0] || variant.imageUrl || 'https://via.placeholder.com/150'} 
                                                        alt="" 
                                                        className="w-12 h-12 object-cover rounded-xl border border-gray-100 shadow-sm"
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                        {Object.entries(variant).map(([key, value]) => {
                                                            const standardFields = ['price', 'stock', 'imageUrls', 'imageUrl', 'isOnSale', 'salePrice', '_id', 'id', 'updatedAt', 'createdAt'];
                                                            if (!standardFields.includes(key) && value && typeof value === 'string') {
                                                                return (
                                                                    <span key={key} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold">
                                                                        {key === 'color' ? 'צבע' : key === 'storage' ? 'נפח' : key}: {value}
                                                                    </span>
                                                                );
                                                            }
                                                            return null;
                                                        })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center font-bold text-gray-700 whitespace-nowrap">
                                                    ₪{variant.salePrice || variant.price}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button 
                                                            onClick={() => handleStockChange(variant._id, Math.max(0, parseInt(currentStock || 0) - 1))}
                                                            className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-900 transition-colors"
                                                        >
                                                            <Minus size={14} />
                                                        </button>
                                                        <input
                                                            type="number"
                                                            value={currentStock}
                                                            onChange={(e) => handleStockChange(variant._id, e.target.value)}
                                                            className={`w-16 text-center py-1.5 rounded-xl border font-bold text-sm outline-none transition-all ${
                                                                isLowStock 
                                                                ? 'bg-red-50 border-red-200 text-red-600 focus:ring-red-100' 
                                                                : 'bg-white border-gray-100 text-gray-900 focus:ring-primary/10 focus:border-primary'
                                                            }`}
                                                        />
                                                        <button 
                                                            onClick={() => handleStockChange(variant._id, parseInt(currentStock || 0) + 1)}
                                                            className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-900 transition-colors"
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-left">
                                                    <button
                                                        onClick={() => updateStock(product._id, variant._id)}
                                                        disabled={!hasChanges || isUpdating}
                                                        className={`p-2.5 rounded-xl transition-all ${
                                                            hasChanges 
                                                            ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95' 
                                                            : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                                        }`}
                                                        title="שמור שינויים"
                                                    >
                                                        {isUpdating ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>

            {/* Infinite Scroll / Load More Trigger */}
            {hasMore && (
                <div className="flex justify-center pt-6">
                    <button
                        onClick={() => {
                            const nextPage = page + 1;
                            setPage(nextPage);
                            fetchProducts(nextPage);
                        }}
                        disabled={loadingMore}
                        className="px-8 py-4 bg-white border border-gray-100 rounded-[2rem] font-black text-gray-900 hover:bg-gray-50 hover:border-primary/20 transition-all shadow-sm flex items-center gap-3 disabled:opacity-50"
                    >
                        {loadingMore ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                <span>טוען מוצרים נוספים...</span>
                            </>
                        ) : (
                            <span>טען מוצרים נוספים</span>
                        )}
                    </button>
                </div>
            )}

            {!hasMore && products.length > 0 && (
                <div className="text-center py-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full text-gray-400 font-bold text-xs">
                        <Check size={14} />
                        <span>כל המוצרים נטענו בהצלחה</span>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {products.length === 0 && !loading && (
                <div className="text-center py-20 bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
                    <Package size={48} className="mx-auto text-gray-300 mb-4" />
                    <h4 className="text-xl font-black text-gray-900">לא נמצאו מוצרים</h4>
                    <p className="text-gray-500 font-medium">נסו לשנות את הסינון או החיפוש</p>
                </div>
            )}
        </div>
    );
};

export default InventoryManagement;
