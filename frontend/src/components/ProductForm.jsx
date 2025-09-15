import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// רשימת הקטגוריות ותתי-הקטגוריות
const categories = {
    'מכשירים ניידים': ['אייפון', 'גלקסי', 'גוגל פיקסל'],
    'קונסולות משחק': ['סוני', 'אקסבוקס', 'נינטנדו'],
    'מחשבים ניידים': ['Apple MacBook', 'Dell XPS', 'Lenovo'],
    'טלוויזיות': ['LG', 'Samsung', 'Sony'],
    'אוזניות': ['אלחוטיות', 'חוטיות', 'ביטול רעשים']
};

const variantFields = {
    'מכשירים ניידים': ['color', 'storage'],
    'קונסולות משחק': ['color', 'storage'],
    'מחשבים ניידים': ['color', 'storage'],
    'טלוויזיות': ['color', 'size'], // שינוי ל-size במקום storage
    'אוזניות': ['color'] // רק צבע, ללא נפח או גודל
};

const ProductForm = ({ showNotification, existingProduct, onUpdateSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: { main: '', sub: '' },
        variants: [
            {
                color: '',
                storage: '',
                price: '',
                salePrice: '',
                isOnSale: false,
                imageUrl: '',
                stock: ''
            }
        ]
    });
    const [validationErrors, setValidationErrors] = useState({});
    const { isAdmin, getToken } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (existingProduct) {
            // התאמת הנתונים הקיימים למבנה החדש
            const { name, description, category, variants } = existingProduct;
            setFormData({
                name,
                description,
                category,
                variants: variants.map(v => ({
                    ...v,
                    price: v.price || '',
                    salePrice: v.salePrice || '',
                    stock: v.stock || '',
                }))
            });
        }
    }, [existingProduct]);

    const handleMainChange = (e) => {
        const main = e.target.value;
        setFormData(prevData => ({
            ...prevData,
            category: { main: main, sub: categories[main][0] || '' }
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
                color: '',
                storage: '',
                price: '',
                salePrice: '',
                isOnSale: false,
                imageUrl: '',
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
        if (!formData.category.sub) errors.category = 'תת-קטגוריה נדרשת';

        const variantErrors = formData.variants.map((v, index) => {
            const vErrors = {};
            const parsedPrice = parseFloat(v.price);
            const parsedSalePrice = parseFloat(v.salePrice);
            const parsedStock = parseInt(v.stock, 10);

            if (!v.color.trim()) vErrors.color = 'צבע נדרש';
            if (!v.storage.trim()) vErrors.storage = 'נפח נדרש';
            if (isNaN(parsedPrice) || parsedPrice <= 0) vErrors.price = 'מחיר חייב להיות מספר חיובי';
            if (isNaN(parsedStock) || parsedStock < 0) vErrors.stock = 'מלאי חייב להיות מספר חיובי או אפס';
            if (!v.imageUrl.trim()) vErrors.imageUrl = 'קישור תמונה נדרש';
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
            return;
        }

        const isUpdating = !!existingProduct;
        const url = `http://localhost:5001/api/products/${existingProduct ? existingProduct._id : ''}`;
        const method = isUpdating ? 'PUT' : 'POST';

        const productData = {
            name: formData.name,
            description: formData.description,
            category: formData.category,
            variants: formData.variants.map(v => ({
                ...v,
                price: parseFloat(v.price),
                stock: parseInt(v.stock, 10),
                salePrice: v.isOnSale ? parseFloat(v.salePrice) : null,
            })),
        };

        try {
            const token = getToken();
            if (!token) {
                showNotification('Authentication token is missing.', 'error');
                return;
            }

            const response = await axios({
                method,
                url,
                data: productData,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            showNotification(`מוצר ${isUpdating ? 'עודכן' : 'נוצר'} בהצלחה`, 'success');
            navigate('/');
        } catch (err) {
            if (err.response) {
                showNotification(err.response.data.message || `Failed to ${isUpdating ? 'update' : 'create'} product`, 'error');
            } else {
                showNotification('An error occurred.', 'error');
            }
            console.error("Failed to process product:", err);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto mb-8">
            <h2 className="text-xl font-bold mb-4">{existingProduct ? 'עריכת מוצר קיים' : 'הוספת מוצר חדש'}</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-700">שם מוצר</label>
                    <input className="w-full mt-1 p-2 border rounded-md" type="text" name="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                    {validationErrors.name && <p className="text-red-500 text-xs italic mt-1">{validationErrors.name}</p>}
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700">תיאור</label>
                    <textarea className="w-full mt-1 p-2 border rounded-md" name="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
                    {validationErrors.description && <p className="text-red-500 text-xs italic mt-1">{validationErrors.description}</p>}
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700">קטגוריה ראשית</label>
                    <select className="w-full mt-1 p-2 border rounded-md" value={formData.category.main} onChange={handleMainChange} required>
                        <option value="">בחר קטגוריה</option>
                        {Object.keys(categories).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    {validationErrors.category && <p className="text-red-500 text-xs italic mt-1">{validationErrors.category}</p>}
                </div>

                {formData.category.main && (
                    <div className="mb-4">
                        <label className="block text-gray-700">תת-קטגוריה</label>
                        <select className="w-full mt-1 p-2 border rounded-md" value={formData.category.sub} onChange={handleSubChange} required>
                            <option value="">בחר תת-קטגוריה</option>
                            {categories[formData.category.main].map(sub => <option key={sub} value={sub}>{sub}</option>)}
                        </select>
                        {validationErrors.category && <p className="text-red-500 text-xs italic mt-1">{validationErrors.category}</p>}
                    </div>
                )}

                <h3 className="text-lg font-semibold mt-6 mb-2">וריאציות המוצר</h3>
                {formData.variants.map((variant, index) => (
                    <div key={index} className="border p-4 rounded-md mb-4 bg-gray-50 relative">
                        {formData.variants.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeVariant(index)}
                                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                            >
                                הסר
                            </button>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {formData.category.main && variantFields[formData.category.main].includes('color') && (
                                <div>
                                    <label className="block text-gray-700">צבע</label>
                                    <input className="w-full mt-1 p-2 border rounded-md" type="text" name="color" value={variant.color} onChange={(e) => handleVariantChange(index, e)} required />
                                    {validationErrors.variants && validationErrors.variants[index]?.color && <p className="text-red-500 text-xs italic mt-1">{validationErrors.variants[index].color}</p>}
                                </div>
                            )}
                            {formData.category.main && variantFields[formData.category.main].includes('storage') && (
                                <div>
                                    <label className="block text-gray-700">נפח</label>
                                    <input className="w-full mt-1 p-2 border rounded-md" type="text" name="storage" value={variant.storage} onChange={(e) => handleVariantChange(index, e)} />
                                    {validationErrors.variants && validationErrors.variants[index]?.storage && <p className="text-red-500 text-xs italic mt-1">{validationErrors.variants[index].storage}</p>}
                                </div>
                            )}
                            <div>
                                <label className="block text-gray-700">מחיר (₪)</label>
                                <input className="w-full mt-1 p-2 border rounded-md" type="number" name="price" value={variant.price} onChange={(e) => handleVariantChange(index, e)} required />
                                {validationErrors.variants && validationErrors.variants[index]?.price && <p className="text-red-500 text-xs italic mt-1">{validationErrors.variants[index].price}</p>}
                            </div>
                            <div>
                                <label className="block text-gray-700">מלאי</label>
                                <input className="w-full mt-1 p-2 border rounded-md" type="number" name="stock" value={variant.stock} onChange={(e) => handleVariantChange(index, e)} required />
                                {validationErrors.variants && validationErrors.variants[index]?.stock && <p className="text-red-500 text-xs italic mt-1">{validationErrors.variants[index].stock}</p>}
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-gray-700">קישור לתמונה</label>
                                <input className="w-full mt-1 p-2 border rounded-md" type="text" name="imageUrl" value={variant.imageUrl} onChange={(e) => handleVariantChange(index, e)} required />
                                {validationErrors.variants && validationErrors.variants[index]?.imageUrl && <p className="text-red-500 text-xs italic mt-1">{validationErrors.variants[index].imageUrl}</p>}
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-gray-700">מחיר מבצע (₪)</label>
                                <input className="w-full mt-1 p-2 border rounded-md" type="number" name="salePrice" value={variant.salePrice} onChange={(e) => handleVariantChange(index, e)} disabled={!variant.isOnSale} />
                                {validationErrors.variants && validationErrors.variants[index]?.salePrice && <p className="text-red-500 text-xs italic mt-1">{validationErrors.variants[index].salePrice}</p>}
                            </div>
                            <div className="flex items-center col-span-1 md:col-span-2">
                                <input className="mr-2" type="checkbox" name="isOnSale" checked={variant.isOnSale} onChange={(e) => handleVariantChange(index, e)} />
                                <label className="text-gray-700">זה במבצע?</label>
                            </div>
                        </div>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={addVariant}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md mb-4"
                >
                    הוסף וריאציה חדשה
                </button>

                <button className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md" type="submit">
                    {existingProduct ? 'עדכן מוצר' : 'הוסף מוצר'}
                </button>
            </form>
        </div>
    );
};

export default ProductForm;