import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useStore } from '../StoreContext';
import axios from 'axios';
import useStoreNavigate from '../hooks/useStoreNavigate';
import { Plus, Trash2, Image, Sparkles, AlertCircle, ArrowLeft, Save, FileText, Settings, Layers } from 'lucide-react';

/**
 * ProductForm Component.
 * A premium, comprehensive form for creating or updating products, featuring standard design tokens.
 */
const ProductForm = ({ showNotification, existingProduct, onUpdateSuccess, adminCategories, adminVariantFields, isLoadingCategories }) => {

    const safeAdminCategories = adminCategories || {};
    const safeAdminVariantFields = adminVariantFields || {};
    const { store } = useStore();
    const showStock = store?.features?.showStock !== false;

    const categoryKeys = Object.keys(safeAdminCategories);
    const initialMainCategory = categoryKeys.length > 0 ? categoryKeys[0] : '';
    const initialSubCategory = safeAdminCategories[initialMainCategory]?.[0] || '';

    const [validationErrors, setValidationErrors] = useState({});
    const { isAdmin, getToken } = useAuth();
    const navigate = useStoreNavigate();

    const [formData, setFormData] = useState(() => {
        if (existingProduct) {
            return {
                name: existingProduct.name || '',
                description: existingProduct.description || '',
                category: { main: existingProduct.category, sub: existingProduct.subcategory || '' },
                options: existingProduct.options || [],
                variants: existingProduct.variants.map(v => ({
                    ...v,
                    price: (v.price !== undefined && v.price !== null) ? v.price : '',
                    salePrice: (v.salePrice !== undefined && v.salePrice !== null) ? v.salePrice : '',
                    stock: (v.stock !== undefined && v.stock !== null) ? v.stock : '',
                    isOnSale: !!(v.isOnSale || (v.salePrice && v.salePrice > 0)),
                    imageUrls: v.imageUrls && v.imageUrls.length > 0 ? v.imageUrls : [v.imageUrl || ''],
                }))
            };
        }

        return {
            name: '',
            description: '',
            category: { main: initialMainCategory, sub: initialSubCategory },
            options: [],
            variants: [
                {
                    price: '',
                    salePrice: '',
                    isOnSale: false,
                    imageUrls: [''],
                    stock: ''
                }
            ]
        };
    });

    // Helpers for options management
    const addOption = () => {
        setFormData(prev => ({ ...prev, options: [...prev.options, { name: '', choices: [{ name: '', priceAddition: 0 }] }] }));
    };
    const removeOption = (oi) => {
        setFormData(prev => ({ ...prev, options: prev.options.filter((_, i) => i !== oi) }));
    };
    const updateOptionName = (oi, value) => {
        const opts = [...formData.options];
        opts[oi] = { ...opts[oi], name: value };
        setFormData(prev => ({ ...prev, options: opts }));
    };
    const addChoice = (oi) => {
        const opts = [...formData.options];
        opts[oi].choices = [...opts[oi].choices, { name: '', priceAddition: 0 }];
        setFormData(prev => ({ ...prev, options: opts }));
    };
    const removeChoice = (oi, ci) => {
        const opts = [...formData.options];
        opts[oi].choices = opts[oi].choices.filter((_, i) => i !== ci);
        setFormData(prev => ({ ...prev, options: opts }));
    };
    const updateChoice = (oi, ci, field, value) => {
        const opts = [...formData.options];
        opts[oi].choices[ci] = { ...opts[oi].choices[ci], [field]: field === 'priceAddition' ? parseFloat(value) || 0 : value };
        setFormData(prev => ({ ...prev, options: opts }));
    };

    useEffect(() => {
        if (existingProduct) {
            const { name, description, category, subcategory, variants, options } = existingProduct;
            setFormData(prevData => ({
                ...prevData,
                name,
                description,
                category: { main: category, sub: subcategory || '' },
                options: options || [],
                variants: variants.map(v => ({
                    ...v,
                    price: (v.price !== undefined && v.price !== null) ? v.price : '',
                    salePrice: (v.salePrice !== undefined && v.salePrice !== null) ? v.salePrice : '',
                    stock: (v.stock !== undefined && v.stock !== null) ? v.stock : '',
                    isOnSale: !!(v.isOnSale || (v.salePrice && v.salePrice > 0)),
                    imageUrls: v.imageUrls && v.imageUrls.length > 0 ? v.imageUrls : [v.imageUrl || ''],
                }))
            }));
        }
    }, [existingProduct]);

    const handleMainChange = (e) => {
        const main = e.target.value;
        setFormData(prevData => ({
            ...prevData,
            category: { main: main, sub: safeAdminCategories[main]?.[0] || '' }
        }));
    };

    const handleSubChange = (e) => {
        setFormData(prevData => ({
            ...prevData,
            category: { ...prevData.category, sub: e.target.value }
        }));
    };

    const handleVariantChange = (index, e) => {
        const { name, value, type, checked } = e.target;
        const newVariants = [...formData.variants];
        newVariants[index] = {
            ...newVariants[index],
            [name]: type === 'checkbox' ? checked : value,
        };
        setFormData({ ...formData, variants: newVariants });
    };

    const addVariant = () => {
        setFormData({
            ...formData,
            variants: [...formData.variants, {
                price: '',
                salePrice: '',
                isOnSale: false,
                imageUrls: [''],
                stock: ''
            }]
        });
    };

    const removeVariant = (index) => {
        const newVariants = [...formData.variants];
        newVariants.splice(index, 1);
        setFormData({ ...formData, variants: newVariants });
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.name.trim()) errors.name = 'שם מוצר נדרש';
        if (!formData.description.trim()) errors.description = 'תיאור נדרש';
        if (!formData.category.main) errors.category = 'קטגוריה ראשית נדרשת';

        const productRequiredFields = safeAdminVariantFields[formData.category.main] || [];

        const variantErrors = formData.variants.map((v, index) => {
            const vErrors = {};
            const parsedPrice = parseFloat(v.price);
            const parsedSalePrice = parseFloat(v.salePrice);
            const parsedStock = parseInt(v.stock, 10);

            // productRequiredFields.forEach(field => {
            //     if (!v[field] || (typeof v[field] === 'string' && !v[field].trim())) {
            //         vErrors[field] = `${field === 'color' ? 'צבע' : field === 'storage' ? 'נפח' : field === 'size' ? 'גודל' : field} נדרש`;
            //     }
            // });

            if (isNaN(parsedPrice) || parsedPrice <= 0) vErrors.price = 'מחיר חייב להיות מספר חיובי';
            if (showStock && (isNaN(parsedStock) || parsedStock < 0)) vErrors.stock = 'מלאי חייב להיות מספר חיובי או אפס';

            const filteredImages = v.imageUrls.filter(url => url.trim() !== '');
            if (filteredImages.length === 0) vErrors.imageUrls = 'לפחות תמונה אחת נדרשת';
            if (v.isOnSale && (isNaN(parsedSalePrice) || parsedSalePrice <= 0 || parsedSalePrice >= parsedPrice)) {
                vErrors.salePrice = 'מחיר מבצע חייב להיות מספר חיובי וקטן מהמחיר המקורי';
            }
            return vErrors;
        });

        if (variantErrors.some(e => Object.keys(e).length > 0)) {
            errors.variants = variantErrors;
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            showNotification('אנא תקן את השגיאות בטופס', 'error');
            return;
        }

        const isUpdating = !!existingProduct;
        const url = `${__API_URL__}/products/${existingProduct ? existingProduct._id : ''}`;
        const method = isUpdating ? 'PUT' : 'POST';

        const cleanedVariants = formData.variants.map(v => {
            const filteredUrls = v.imageUrls.filter(url => url && url.trim() !== '');
            const primaryUrl = filteredUrls[0] || '';
            const { imageUrl, ...rest } = v;
            return {
                ...rest,
                price: parseFloat(v.price),
                stock: showStock ? parseInt(v.stock, 10) : 0,
                salePrice: v.isOnSale ? parseFloat(v.salePrice) : null,
                imageUrls: filteredUrls,
                imageUrl: primaryUrl
            };
        });

        const productData = {
            ...existingProduct,
            name: formData.name,
            description: formData.description,
            category: formData.category.main,
            subcategory: formData.category.sub || undefined,
            options: formData.options,
            variants: cleanedVariants,
        };

        try {
            const token = getToken();
            if (!token) {
                showNotification('Authentication token is missing.', 'error');
                return;
            }

            await axios({
                method,
                url,
                data: productData,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            showNotification(`מוצר ${isUpdating ? 'עודכן' : 'נוצר'} בהצלחה`, 'success');
            onUpdateSuccess();
        } catch (err) {
            if (err.response) {
                showNotification(err.response.data.message || `Failed to ${isUpdating ? 'update' : 'create'} product`, 'error');
            } else {
                showNotification('An error occurred.', 'error');
            }
            console.error("Failed to process product:", err);
        }
    };

    if (isLoadingCategories) {
        return (
            <div className="bg-white/80 backdrop-blur-md p-12 rounded-[2rem] border border-gray-100 shadow-sm max-w-lg mx-auto text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <h2 className="text-xl font-black text-gray-900">טוען נתוני קטגוריות...</h2>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto mb-16 animate-in fade-in duration-500" dir="rtl">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 pb-6 border-b border-gray-100">
                <div>
                    <h1 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tighter">
                        {existingProduct ? 'עריכת מוצר קיים' : 'הוספת מוצר חדש'}
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">
                        נהל את פרטי המוצר, המלאי, הוריאציות והתוספות של החנות שלך.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate('/admin')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 hover:text-gray-900 font-bold transition-all text-sm self-start md:self-auto"
                >
                    <ArrowLeft size={16} />
                    <span>חזרה ללוח הבקרה</span>
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">

                {/* Section 1: Basic Info */}
                <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
                        <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                            <FileText size={20} />
                        </div>
                        <h2 className="text-xl font-black text-gray-900">פרטי מוצר בסיסיים</h2>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">שם המוצר</label>
                            <input
                                className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300 outline-none"
                                type="text"
                                name="name"
                                placeholder="לדוג׳: אייפון 15 פרו מקס"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            {validationErrors.name && (
                                <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                                    <AlertCircle size={12} />
                                    <span>{validationErrors.name}</span>
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">תיאור קצר</label>
                            <textarea
                                className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300 outline-none min-h-[100px]"
                                name="description"
                                placeholder="תיאור קצר ומזמין של המוצר שיוצג ללקוח..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                required
                            />
                            {validationErrors.description && (
                                <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                                    <AlertCircle size={12} />
                                    <span>{validationErrors.description}</span>
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">קטגוריה ראשית</label>
                                <select
                                    className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300 outline-none cursor-pointer"
                                    value={formData.category.main}
                                    onChange={handleMainChange}
                                    required
                                >
                                    <option value="">בחר קטגוריה</option>
                                    {categoryKeys.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                                {validationErrors.category && (
                                    <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                                        <AlertCircle size={12} />
                                        <span>{validationErrors.category}</span>
                                    </p>
                                )}
                            </div>

                            {formData.category.main && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">תת-קטגוריה</label>
                                    <select
                                        className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300 outline-none cursor-pointer"
                                        value={formData.category.sub}
                                        onChange={handleSubChange}
                                        required
                                    >
                                        <option value="">בחר תת-קטגוריה</option>
                                        {safeAdminCategories[formData.category.main]?.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Section 2: Variants */}
                <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-gray-50">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                                <Layers size={20} />
                            </div>
                            <h2 className="text-xl font-black text-gray-900">וריאציות ומחירים</h2>
                        </div>
                        <button
                            type="button"
                            onClick={addVariant}
                            className="text-xs bg-primary/10 text-primary px-4 py-2 rounded-xl font-black hover:bg-primary hover:text-white transition-all flex items-center gap-1.5"
                        >
                            <Plus size={14} />
                            <span>הוסף וריאציה</span>
                        </button>
                    </div>

                    <div className="space-y-6">
                        {formData.variants.map((variant, index) => (
                            <div key={index} className="bg-gray-50/30 rounded-2xl border border-gray-100 p-6 relative group animate-in fade-in duration-300">
                                {formData.variants.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeVariant(index)}
                                        className="absolute top-4 left-4 text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-all duration-300"
                                        title="הסר וריאציה"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}

                                <div className="text-xs font-black text-primary mb-4 bg-primary/10 px-3 py-1 rounded-lg inline-block">
                                    וריאציה #{index + 1}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                                    {/* Category Specific Custom Fields */}
                                    {formData.category.main && (safeAdminVariantFields[formData.category.main] || []).map(field => (
                                        <div key={field}>
                                            <label className="block text-sm font-bold text-gray-700 mb-1.5 capitalize">
                                                {field === 'color' ? 'צבע' : field === 'storage' ? 'נפח אחסון' : field === 'size' ? 'גודל / מפרט' : field}
                                            </label>
                                            <input
                                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                                type="text"
                                                name={field}
                                                placeholder={field === 'color' ? 'שחור, כסף...' : field === 'storage' ? '128GB, 256GB...' : 'הזן ערך...'}
                                                value={variant[field] || ''}
                                                onChange={(e) => handleVariantChange(index, e)}
                                            />
                                            {validationErrors.variants && validationErrors.variants[index]?.[field] && (
                                                <p className="text-red-500 text-xs font-semibold mt-1 flex items-center gap-1">
                                                    <AlertCircle size={10} />
                                                    <span>{validationErrors.variants[index][field]}</span>
                                                </p>
                                            )}
                                        </div>
                                    ))}

                                    {/* Price */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">מחיר (₪)</label>
                                        <input
                                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                            type="number"
                                            name="price"
                                            placeholder="0.00"
                                            value={variant.price}
                                            onChange={(e) => handleVariantChange(index, e)}
                                            required
                                        />
                                        {validationErrors.variants && validationErrors.variants[index]?.price && (
                                            <p className="text-red-500 text-xs font-semibold mt-1 flex items-center gap-1">
                                                <AlertCircle size={10} />
                                                <span>{validationErrors.variants[index].price}</span>
                                            </p>
                                        )}
                                    </div>

                                    {/* Stock (Conditional) */}
                                    {showStock && (
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1.5">מלאי במחסן</label>
                                            <input
                                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                                type="number"
                                                name="stock"
                                                placeholder="כמות במלאי"
                                                value={variant.stock}
                                                onChange={(e) => handleVariantChange(index, e)}
                                                required
                                            />
                                            {validationErrors.variants && validationErrors.variants[index]?.stock && (
                                                <p className="text-red-500 text-xs font-semibold mt-1 flex items-center gap-1">
                                                    <AlertCircle size={10} />
                                                    <span>{validationErrors.variants[index].stock}</span>
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Is On Sale Toggle */}
                                    <div className="flex items-center gap-3 pt-6 col-span-1 md:col-span-3 border-t border-gray-100/50 mt-2">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="isOnSale"
                                                checked={variant.isOnSale}
                                                onChange={(e) => handleVariantChange(index, e)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                            <span className="mr-3 text-sm font-bold text-gray-700">הנח מבצע מיוחד לווריאציה זו</span>
                                        </label>
                                    </div>

                                    {/* Sale Price Input */}
                                    {variant.isOnSale && (
                                        <div className="col-span-1 md:col-span-3 animate-in slide-in-from-top-2 duration-300">
                                            <label className="block text-sm font-bold text-gray-700 mb-1.5">מחיר מבצע (₪)</label>
                                            <input
                                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                                type="number"
                                                name="salePrice"
                                                placeholder="מחיר מבצע נמוך מהמחיר המקורי"
                                                value={variant.salePrice}
                                                onChange={(e) => handleVariantChange(index, e)}
                                                required={variant.isOnSale}
                                            />
                                            {validationErrors.variants && validationErrors.variants[index]?.salePrice && (
                                                <p className="text-red-500 text-xs font-semibold mt-1 flex items-center gap-1">
                                                    <AlertCircle size={10} />
                                                    <span>{validationErrors.variants[index].salePrice}</span>
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Image URLs management */}
                                    <div className="col-span-1 md:col-span-3 border-t border-gray-100/50 pt-4 mt-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                                            <Image size={16} className="text-gray-400" />
                                            <span>גלריית תמונות לווריאציה זו</span>
                                        </label>

                                        <div className="space-y-3">
                                            {variant.imageUrls.map((url, imgIndex) => (
                                                <div key={imgIndex} className="flex gap-2 items-center">
                                                    <input
                                                        className="flex-grow bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                                        type="text"
                                                        placeholder={`קישור לתמונה חיצונית ${imgIndex + 1} (URL)`}
                                                        value={url}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setFormData(prev => {
                                                                const updated = [...prev.variants];
                                                                const updatedUrls = [...updated[index].imageUrls];
                                                                updatedUrls[imgIndex] = val;
                                                                updated[index].imageUrls = updatedUrls;
                                                                return { ...prev, variants: updated };
                                                            });
                                                        }}
                                                    />
                                                    {variant.imageUrls.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData(prev => {
                                                                    const updated = [...prev.variants];
                                                                    const updatedUrls = [...updated[index].imageUrls];
                                                                    updatedUrls.splice(imgIndex, 1);
                                                                    updated[index].imageUrls = updatedUrls;
                                                                    return { ...prev, variants: updated };
                                                                });
                                                            }}
                                                            className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-xl transition-all"
                                                        >
                                                            ✕
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                const updated = [...formData.variants];
                                                updated[index].imageUrls = [...updated[index].imageUrls, ''];
                                                setFormData({ ...formData, variants: updated });
                                            }}
                                            className="text-xs text-primary font-black hover:underline mt-3 inline-flex items-center gap-1"
                                        >
                                            <Plus size={12} />
                                            <span>הוסף תמונה נוספת לגלריה</span>
                                        </button>

                                        {validationErrors.variants && validationErrors.variants[index]?.imageUrls && (
                                            <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                                                <AlertCircle size={10} />
                                                <span>{validationErrors.variants[index].imageUrls}</span>
                                            </p>
                                        )}
                                    </div>

                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section 3: Addons & Custom Options */}
                <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-gray-50">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                                <Settings size={20} />
                            </div>
                            <h2 className="text-xl font-black text-gray-900">תוספות ואפשרויות שדרוג</h2>
                        </div>
                        <button
                            type="button"
                            onClick={addOption}
                            className="text-xs bg-primary/10 text-primary px-4 py-2 rounded-xl font-black hover:bg-primary hover:text-white transition-all flex items-center gap-1.5"
                        >
                            <Plus size={14} />
                            <span>הוסף אפשרות</span>
                        </button>
                    </div>

                    <div>
                        {formData.options.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                                <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm font-semibold text-gray-500">אין אפשרויות שדרוג למוצר זה</p>
                                <p className="text-xs text-gray-400 mt-0.5">באפשרותך להוסיף תוספות בתשלום או בחירות של הלקוח</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {formData.options.map((opt, oi) => (
                                    <div key={oi} className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 relative group animate-in fade-in duration-300">
                                        <button
                                            type="button"
                                            onClick={() => removeOption(oi)}
                                            className="absolute top-4 left-4 text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>

                                        <div className="flex gap-4 items-center mb-4 max-w-[90%]">
                                            <input
                                                type="text"
                                                value={opt.name}
                                                onChange={(e) => updateOptionName(oi, e.target.value)}
                                                placeholder="שם האפשרות (לדוג': תוספת זיכרון, בחירת צבע כיסוי)"
                                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                            />
                                        </div>

                                        <div className="space-y-2.5 pr-4 border-r-2 border-gray-200/50">
                                            {opt.choices.map((choice, ci) => (
                                                <div key={ci} className="flex gap-2 items-center">
                                                    <input
                                                        type="text"
                                                        value={choice.name}
                                                        onChange={(e) => updateChoice(oi, ci, 'name', e.target.value)}
                                                        placeholder="שם הבחירה (לדוג': גבינה כפולה, 256GB)"
                                                        className="flex-grow bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs text-gray-800 placeholder-gray-400 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                                    />
                                                    <div className="relative flex items-center">
                                                        <span className="absolute right-3 text-xs text-gray-400 font-bold">₪</span>
                                                        <input
                                                            type="number"
                                                            value={choice.priceAddition || ''}
                                                            onChange={(e) => updateChoice(oi, ci, 'priceAddition', e.target.value)}
                                                            placeholder="תוספת"
                                                            className="w-24 bg-white border border-gray-200 rounded-xl pr-7 pl-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-left"
                                                            min="0"
                                                        />
                                                    </div>
                                                    {opt.choices.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeChoice(oi, ci)}
                                                            className="text-gray-400 hover:text-red-500 p-1.5"
                                                        >
                                                            ✕
                                                        </button>
                                                    )}
                                                </div>
                                            ))}

                                            <button
                                                type="button"
                                                onClick={() => addChoice(oi)}
                                                className="text-xs text-primary font-black hover:underline mt-2 inline-flex items-center gap-1"
                                            >
                                                <Plus size={10} />
                                                <span>הוסף בחירה נוספת</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4">
                    <button
                        type="submit"
                        className="w-full bg-primary text-white rounded-2xl py-4 hover:scale-[1.02] active:scale-[0.98] transition-all font-black text-lg shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                    >
                        <Save size={20} />
                        <span>{existingProduct ? 'שמור ועדכן מוצר' : 'פרסם מוצר חדש בחנות'}</span>
                    </button>
                </div>

            </form>
        </div>
    );
};

export default ProductForm;