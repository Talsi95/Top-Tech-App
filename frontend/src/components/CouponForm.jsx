import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import { Tag, Percent, Calendar, Check, X, Search, Sparkles, AlertCircle, Save, Info } from 'lucide-react';

/**
 * CouponForm Component.
 * Premium, interactive form for creating/editing coupons.
 */
const CouponForm = ({ showNotification, existingCoupon, onSaveSuccess, onCancel }) => {
    const { getToken } = useAuth();
    
    const [formData, setFormData] = useState({
        code: '',
        discountType: 'percentage',
        discountValue: '',
        targetType: 'global',
        targetIds: [],
        validFrom: '',
        validTo: '',
        usageLimit: '',
        isActive: true
    });

    const [categories, setCategories] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // Load existing coupon data for editing
    useEffect(() => {
        if (existingCoupon) {
            const formatForInput = (dateStr) => {
                if (!dateStr) return '';
                const d = new Date(dateStr);
                return d.toISOString().split('T')[0];
            };

            setFormData({
                code: existingCoupon.code || '',
                discountType: existingCoupon.discountType || 'percentage',
                discountValue: existingCoupon.discountValue || '',
                targetType: existingCoupon.targetType || 'global',
                targetIds: existingCoupon.targetIds || [],
                validFrom: formatForInput(existingCoupon.validFrom),
                validTo: formatForInput(existingCoupon.validTo),
                usageLimit: existingCoupon.usageLimit || '',
                isActive: existingCoupon.isActive !== undefined ? existingCoupon.isActive : true
            });

            const fetchTargetProducts = async (ids) => {
                try {
                    const token = getToken();
                    const productPromises = ids.map(id =>
                        axios.get(`${__API_URL__}/products/${id}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        }).catch(() => null)
                    );
                    const results = await Promise.all(productPromises);
                    const validProducts = results.filter(r => r !== null).map(r => r.data);
                    setSelectedProducts(validProducts);
                } catch (error) {
                    console.error('Error fetching target products:', error);
                }
            };

            // If targetType is 'product' and we have targets, load their product info to display chips
            if (existingCoupon.targetType === 'product' && existingCoupon.targetIds && existingCoupon.targetIds.length > 0) {
                fetchTargetProducts(existingCoupon.targetIds);
            }
        }
    }, [existingCoupon, getToken]);

    // Fetch categories for category multi-select
    useEffect(() => {
        const fetchCategories = async () => {
            setIsLoadingCategories(true);
            try {
                const token = getToken();
                const response = await axios.get(`${__API_URL__}/categories`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCategories(response.data || []);
            } catch (error) {
                console.error('Error fetching categories:', error);
                showNotification('שגיאה בטעינת קטגוריות', 'error');
            } finally {
                setIsLoadingCategories(false);
            }
        };

        fetchCategories();
    }, [getToken, showNotification]);

    // Debounced Product Search
    useEffect(() => {
        if (!searchQuery.trim() || formData.targetType !== 'product') {
            setSearchResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsSearching(true);
            try {
                const token = getToken();
                const response = await axios.get(`${__API_URL__}/products/search?query=${encodeURIComponent(searchQuery)}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // Filter out already selected products
                const filteredResults = (response.data || []).filter(
                    prod => !formData.targetIds.includes(prod._id)
                );
                setSearchResults(filteredResults);
            } catch (error) {
                console.error('Error searching products:', error);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, formData.targetIds, formData.targetType, getToken]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Toggle Category in targetIds
    const handleCategoryToggle = (categoryId) => {
        const currentIds = [...formData.targetIds];
        const index = currentIds.indexOf(categoryId);
        if (index > -1) {
            currentIds.splice(index, 1);
        } else {
            currentIds.push(categoryId);
        }
        setFormData(prev => ({ ...prev, targetIds: currentIds }));
    };

    // Add Product to targets
    const handleProductSelect = (product) => {
        if (!formData.targetIds.includes(product._id)) {
            setFormData(prev => ({
                ...prev,
                targetIds: [...prev.targetIds, product._id]
            }));
            setSelectedProducts(prev => [...prev, product]);
        }
        setSearchQuery('');
        setSearchResults([]);
    };

    // Remove Product from targets
    const handleProductRemove = (productId) => {
        setFormData(prev => ({
            ...prev,
            targetIds: prev.targetIds.filter(id => id !== productId)
        }));
        setSelectedProducts(prev => prev.filter(p => p._id !== productId));
    };

    // Form Validation
    const validate = () => {
        const newErrors = {};
        if (!formData.code.trim()) newErrors.code = 'קוד קופון נדרש';
        if (formData.code.length < 3) newErrors.code = 'קוד הקופון חייב להכיל לפחות 3 תווים';
        
        const value = parseFloat(formData.discountValue);
        if (isNaN(value) || value <= 0) {
            newErrors.discountValue = 'ערך הנחה חייב להיות מספר חיובי גדול מאפס';
        }
        if (formData.discountType === 'percentage' && value > 100) {
            newErrors.discountValue = 'הנחה באחוזים לא יכולה לעלות על 100%';
        }

        if (!formData.validFrom) newErrors.validFrom = 'תאריך התחלה נדרש';
        if (!formData.validTo) newErrors.validTo = 'תאריך סיום נדרש';
        if (formData.validFrom && formData.validTo && new Date(formData.validFrom) > new Date(formData.validTo)) {
            newErrors.validTo = 'תאריך סיום חייב להיות אחרי תאריך התחלה';
        }

        if (formData.targetType === 'category' && formData.targetIds.length === 0) {
            newErrors.targetIds = 'יש לבחור לפחות קטגוריה אחת לקופון זה';
        }
        if (formData.targetType === 'product' && formData.targetIds.length === 0) {
            newErrors.targetIds = 'יש לבחור לפחות מוצר אחד לקופון זה';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const token = getToken();
            const method = existingCoupon ? 'PUT' : 'POST';
            const url = existingCoupon 
                ? `${__API_URL__}/admin/coupons/${existingCoupon._id}` 
                : `${__API_URL__}/admin/coupons`;

            // Prepare payload
            const payload = {
                ...formData,
                discountValue: parseFloat(formData.discountValue),
                usageLimit: formData.usageLimit ? parseInt(formData.usageLimit, 10) : null
            };

            const response = await axios({
                method,
                url,
                data: payload,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            showNotification(
                `קופון ${existingCoupon ? 'עודכן' : 'נוצר'} בהצלחה!`, 
                'success'
            );
            onSaveSuccess(response.data);
        } catch (error) {
            const message = error.response?.data?.message || 'שגיאה בשמירת הקופון';
            showNotification(message, 'error');
            console.error('Error saving coupon:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-2 animate-in fade-in slide-in-from-bottom-4 duration-500" dir="rtl">
            <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                        {existingCoupon ? 'עריכת קופון קיים' : 'יצירת קופון חדש'}
                    </h2>
                    <p className="text-gray-500 text-sm font-medium mt-1">
                        הגדר קופוני הנחה גלובליים, מחלקתיים או מוצרים ספציפיים ללקוחות החנות.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 bg-gray-50 text-gray-500 rounded-xl hover:bg-gray-100 hover:text-gray-900 font-bold transition-all text-xs"
                >
                    ביטול וחזרה
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Section 1: Basic Config */}
                <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
                        <div className="p-2 bg-primary/10 text-primary rounded-xl">
                            <Tag size={18} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">פרטי הקופון הבסיסיים</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Coupon Code */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-gray-700">קוד הקופון</label>
                            <input
                                type="text"
                                name="code"
                                value={formData.code}
                                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                                placeholder="לדוגמה: PESACH2026"
                                className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-black tracking-wider uppercase text-center"
                                required
                            />
                            {errors.code && (
                                <p className="text-red-500 text-xs font-semibold mt-1 flex items-center gap-1">
                                    <AlertCircle size={12} />
                                    <span>{errors.code}</span>
                                </p>
                            )}
                        </div>

                        {/* Usage Limit */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-gray-700">
                                מגבלת שימושים כוללת <span className="text-gray-400 font-normal">(אופציונלי)</span>
                            </label>
                            <input
                                type="number"
                                name="usageLimit"
                                value={formData.usageLimit}
                                onChange={handleChange}
                                placeholder="ללא הגבלה"
                                min="1"
                                className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                            />
                            <p className="text-[10px] text-gray-400">מספר השימושים הכולל המותר לקופון זה בכל האתר.</p>
                        </div>
                    </div>

                    {/* Discount Configuration */}
                    <div className="space-y-4 pt-4 border-t border-gray-50">
                        <label className="block text-sm font-bold text-gray-700">סוג ההנחה וערכה</label>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Percentage discount Card */}
                            <label className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                                formData.discountType === 'percentage' 
                                    ? 'border-primary bg-primary/5 text-primary' 
                                    : 'border-gray-100 hover:border-gray-200 bg-white text-gray-600'
                            }`}>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="radio" 
                                        name="discountType" 
                                        value="percentage" 
                                        checked={formData.discountType === 'percentage'} 
                                        onChange={handleChange} 
                                        className="w-4 h-4 text-primary" 
                                    />
                                    <div className="text-right">
                                        <span className="block font-black text-sm text-gray-900">אחוז מהסל (%)</span>
                                        <span className="text-xs text-gray-400">הנחה באחוזים מסך הפריטים</span>
                                    </div>
                                </div>
                                <Percent size={20} className={formData.discountType === 'percentage' ? 'text-primary' : 'text-gray-300'} />
                            </label>

                            {/* Fixed discount Card */}
                            <label className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                                formData.discountType === 'fixed' 
                                    ? 'border-primary bg-primary/5 text-primary' 
                                    : 'border-gray-100 hover:border-gray-200 bg-white text-gray-600'
                            }`}>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="radio" 
                                        name="discountType" 
                                        value="fixed" 
                                        checked={formData.discountType === 'fixed'} 
                                        onChange={handleChange} 
                                        className="w-4 h-4 text-primary" 
                                    />
                                    <div className="text-right">
                                        <span className="block font-black text-sm text-gray-900">סכום קבוע (₪)</span>
                                        <span className="text-xs text-gray-400">הנחה בסכום שקלי קבוע</span>
                                    </div>
                                </div>
                                <span className={`text-lg font-black ${formData.discountType === 'fixed' ? 'text-primary' : 'text-gray-300'}`}>₪</span>
                            </label>

                            {/* Discount Value Input */}
                            <div className="space-y-1">
                                <div className="relative flex items-center">
                                    <span className="absolute right-4 text-sm text-gray-400 font-bold">
                                        {formData.discountType === 'percentage' ? '%' : '₪'}
                                    </span>
                                    <input
                                        type="number"
                                        name="discountValue"
                                        value={formData.discountValue}
                                        onChange={handleChange}
                                        placeholder="ערך ההנחה"
                                        min="0.1"
                                        step="any"
                                        required
                                        className="w-full bg-gray-50/50 border border-gray-200 rounded-xl pr-9 pl-4 py-3 text-gray-800 placeholder-gray-400 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-bold"
                                    />
                                </div>
                                {errors.discountValue && (
                                    <p className="text-red-500 text-xs font-semibold mt-1 flex items-center gap-1">
                                        <AlertCircle size={10} />
                                        <span>{errors.discountValue}</span>
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2: Dates Validity */}
                <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
                        <div className="p-2 bg-primary/10 text-primary rounded-xl">
                            <Calendar size={18} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">תוקף הקופון</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-gray-700">תאריך התחלה</label>
                            <input
                                type="date"
                                name="validFrom"
                                value={formData.validFrom}
                                onChange={handleChange}
                                required
                                className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium cursor-pointer"
                            />
                            {errors.validFrom && (
                                <p className="text-red-500 text-xs font-semibold mt-1 flex items-center gap-1">
                                    <AlertCircle size={12} />
                                    <span>{errors.validFrom}</span>
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-gray-700">תאריך סיום</label>
                            <input
                                type="date"
                                name="validTo"
                                value={formData.validTo}
                                onChange={handleChange}
                                required
                                className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium cursor-pointer"
                            />
                            {errors.validTo && (
                                <p className="text-red-500 text-xs font-semibold mt-1 flex items-center gap-1">
                                    <AlertCircle size={12} />
                                    <span>{errors.validTo}</span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Section 3: Coupon Scope & Target Rendering */}
                <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
                        <div className="p-2 bg-primary/10 text-primary rounded-xl">
                            <Sparkles size={18} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">טווח החלת הקופון (Scope)</h3>
                    </div>

                    {/* Scope select */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700">בחר רמת החלה</label>
                        <select
                            name="targetType"
                            value={formData.targetType}
                            onChange={(e) => {
                                setFormData(prev => ({
                                    ...prev,
                                    targetType: e.target.value,
                                    targetIds: [] // reset target selection on type change
                                }));
                                setSelectedProducts([]);
                            }}
                            className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none cursor-pointer font-bold"
                        >
                            <option value="global">קופון גלובלי (תקף לכל המוצרים באתר)</option>
                            <option value="category">קופון מחלקתי (תקף לקטגוריות מסוימות)</option>
                            <option value="product">קופון מוצר (תקף למוצרים ספציפיים)</option>
                        </select>
                    </div>

                    {/* Conditional rendering based on targetType */}
                    {formData.targetType === 'category' && (
                        <div className="space-y-4 pt-4 border-t border-gray-50 animate-in fade-in duration-300">
                            <label className="block text-sm font-bold text-gray-700 flex items-center gap-1">
                                <span>בחר מחלקות / קטגוריות</span>
                                <Info size={12} className="text-gray-400" />
                            </label>
                            
                            {isLoadingCategories ? (
                                <div className="text-center py-4 text-xs font-semibold text-gray-400">טוען קטגוריות...</div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {categories.map(cat => {
                                        const isSelected = formData.targetIds.includes(cat._id);
                                        return (
                                            <button
                                                key={cat._id}
                                                type="button"
                                                onClick={() => handleCategoryToggle(cat._id)}
                                                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-black transition-all ${
                                                    isSelected
                                                        ? 'bg-primary text-white border-primary shadow-md shadow-primary/10'
                                                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                                }`}
                                            >
                                                {isSelected && <Check size={14} />}
                                                <span>{cat.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                            {errors.targetIds && (
                                <p className="text-red-500 text-xs font-semibold mt-1 flex items-center gap-1">
                                    <AlertCircle size={12} />
                                    <span>{errors.targetIds}</span>
                                </p>
                            )}
                        </div>
                    )}

                    {formData.targetType === 'product' && (
                        <div className="space-y-4 pt-4 border-t border-gray-50 animate-in fade-in duration-300">
                            <label className="block text-sm font-bold text-gray-700">חפש והוסף מוצרים לקופון</label>
                            
                            {/* Search Autocomplete Input */}
                            <div className="relative group">
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="הקלד שם מוצר לחיפוש מהשרת..."
                                    className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-3.5 pr-12 pl-4 outline-none font-bold text-gray-900 focus:bg-white focus:border-primary transition-all placeholder:text-gray-400 text-sm"
                                />
                                
                                {/* Search Results Dropdown */}
                                {searchQuery.trim() && (
                                    <div className="absolute z-30 left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-100 shadow-2xl max-h-60 overflow-y-auto divide-y divide-gray-50">
                                        {isSearching ? (
                                            <div className="p-4 text-center text-xs font-medium text-gray-400">מחפש מוצרים...</div>
                                        ) : searchResults.length === 0 ? (
                                            <div className="p-4 text-center text-xs font-medium text-gray-400">לא נמצאו מוצרים תואמים</div>
                                        ) : (
                                            searchResults.map(prod => (
                                                <button
                                                    key={prod._id}
                                                    type="button"
                                                    onClick={() => handleProductSelect(prod)}
                                                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-right"
                                                >
                                                    {prod.variants?.[0]?.imageUrls?.[0] ? (
                                                        <img 
                                                            src={prod.variants[0].imageUrls[0]} 
                                                            alt={prod.name} 
                                                            className="w-10 h-10 object-cover rounded-lg border border-gray-100" 
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400">ללא תמונה</div>
                                                    )}
                                                    <div className="flex-1">
                                                        <span className="block font-bold text-sm text-gray-800">{prod.name}</span>
                                                        <span className="block text-xs text-gray-400">קטגוריה: {prod.category}</span>
                                                    </div>
                                                    <span className="text-xs font-black text-primary bg-primary/5 px-2.5 py-1 rounded-full">
                                                        בחר +
                                                    </span>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Selected Products Chips */}
                            <div className="space-y-2 pt-2">
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-wider">מוצרים שנבחרו ({selectedProducts.length})</label>
                                {selectedProducts.length === 0 ? (
                                    <div className="text-sm italic text-gray-400 p-3 bg-gray-50/50 rounded-xl border border-dashed border-gray-100">טרם נבחרו מוצרים לקופון.</div>
                                ) : (
                                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
                                        {selectedProducts.map(prod => (
                                            <div
                                                key={prod._id}
                                                className="flex items-center gap-2 bg-gray-50 border border-gray-150 px-3 py-1.5 rounded-full shadow-sm text-xs font-bold text-gray-700 animate-in zoom-in duration-200"
                                            >
                                                <span>{prod.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleProductRemove(prod._id)}
                                                    className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors text-[9px]"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {errors.targetIds && (
                                <p className="text-red-500 text-xs font-semibold mt-1 flex items-center gap-1">
                                    <AlertCircle size={12} />
                                    <span>{errors.targetIds}</span>
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Section 4: Is Active Toggle */}
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex items-center justify-between">
                    <div className="space-y-0.5">
                        <span className="block text-sm font-bold text-gray-900">סטטוס קופון פעיל</span>
                        <span className="block text-xs text-gray-400">קופונים לא פעילים לא ניתנים להזנה על ידי לקוחות בקופה.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            name="isActive"
                            checked={formData.isActive}
                            onChange={handleChange}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>

                {/* Actions */}
                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-primary text-white rounded-2xl py-4 hover:scale-[1.01] active:scale-[0.99] transition-all font-black text-lg shadow-xl shadow-primary/20 flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        <Save size={20} />
                        <span>{isSubmitting ? 'שומר קופון...' : existingCoupon ? 'שמור שינויים' : 'צור קופון והפעל בחנות'}</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CouponForm;
