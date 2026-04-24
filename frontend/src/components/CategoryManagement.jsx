// src/components/CategoryManagement.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext';

// שדות וריאנט חוקיים לפי המודל שלך
const AVAILABLE_VARIANT_FIELDS = ['color', 'storage', 'size'];

const initialNewCategory = {
    name: '',
    subcategories: [{ name: '' }],
    variantFields: [], // מתחיל ריק, האדמין בוחר מהנדרש
};

/**
 * CategoryManagement Component.
 * Administrative tool for managing product categories, subcategories, and their required variant fields.
 * 
 * @param {Object} props - Component props.
 * @param {Function} props.showNotification - Function to display a global notification.
 */
const CategoryManagement = ({ showNotification }) => {
    const { getToken } = useAuth();
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newCategory, setNewCategory] = useState(initialNewCategory);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const token = getToken();
            // משתמש בפונקציה getCategories הקיימת בבקר שלך
            const response = await axios.get(`${__API_URL__}/categories`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setCategories(response.data);
        } catch (error) {
            showNotification('שגיאה בשליפת קטגוריות.', 'error');
            console.error('Fetch categories error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // --- לוגיקה לטופס החדש ---
    const handleNewCategoryChange = (e) => {
        setNewCategory({ ...newCategory, name: e.target.value });
    };

    const handleSubcategoryChange = (index, e) => {
        const newSubcategories = [...newCategory.subcategories];
        newSubcategories[index].name = e.target.value;
        setNewCategory({ ...newCategory, subcategories: newSubcategories });
    };

    const addSubcategory = () => {
        setNewCategory({ ...newCategory, subcategories: [...newCategory.subcategories, { name: '' }] });
    };

    const removeSubcategory = (index) => {
        const newSubcategories = newCategory.subcategories.filter((_, i) => i !== index);
        // ודא שלפחות תת-קטגוריה אחת נשארת אם זו לא הולכת להיות ריקה
        setNewCategory({ ...newCategory, subcategories: newSubcategories.length > 0 ? newSubcategories : [{ name: '' }] });
    };

    const handleVariantFieldToggle = (field) => {
        const currentFields = newCategory.variantFields;
        const updatedFields = currentFields.includes(field)
            ? currentFields.filter(f => f !== field)
            : [...currentFields, field];

        setNewCategory({ ...newCategory, variantFields: updatedFields });
    };

    // --- לוגיקת שליחת הטופס ---
    const createCategory = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        const categoryName = newCategory.name.trim();
        if (!categoryName) {
            showNotification('שם קטגוריה ראשית נדרש.', 'error');
            return;
        }

        // ולידציה: לפחות תת-קטגוריה אחת
        const filteredSubcategories = newCategory.subcategories.filter(sub => sub.name.trim() !== '');

        if (filteredSubcategories.length === 0) {
            showNotification('יש להזין לפחות תת-קטגוריה אחת.', 'error');
            return;
        }

        // יצירת אובייקט הנתונים לשליחה
        const dataToSend = {
            name: categoryName,
            subcategories: filteredSubcategories.map(sub => ({ name: sub.name.trim() })),
            variantFields: newCategory.variantFields
        };

        setIsSubmitting(true);
        try {
            const token = getToken();
            // משתמש בפונקציה createCategory הקיימת בבקר שלך
            await axios.post(`${__API_URL__}/categories`, dataToSend, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            showNotification(`הקטגוריה "${categoryName}" נוצרה בהצלחה!`, 'success');
            setNewCategory(initialNewCategory); // איפוס הטופס
            fetchCategories(); // רענון הרשימה
        } catch (error) {
            const message = error.response?.data?.message || 'שגיאה ביצירת קטגוריה.';
            showNotification(message, 'error');
            console.error('Create category error:', error.response || error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- לוגיקת מחיקה ---
    const deleteCategory = async (id, name) => {
        if (!window.confirm(`האם אתה בטוח שברצונך למחוק את הקטגוריה הראשית "${name}"? אם קיימים מוצרים תחתיה, המחיקה תיכשל.`)) {
            return;
        }
        try {
            const token = getToken();
            // משתמש בפונקציה deleteCategory הקיימת בבקר שלך
            await axios.delete(`${__API_URL__}/categories/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            showNotification(`הקטגוריה "${name}" נמחקה בהצלחה.`, 'success');
            fetchCategories();
        } catch (error) {
            const message = error.response?.data?.message || 'שגיאה במחיקת קטגוריה.';
            showNotification(message, 'error');
            console.error('Delete category error:', error.response || error);
        }
    };


    if (isLoading) {
        return <div className="text-center p-8 text-xl text-gray-600">טוען קטגוריות...</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-3xl font-bold mb-8 text-gray-800 text-center">⚙️ ניהול קטגוריות</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* === טופס הוספת קטגוריה חדשה === */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-2xl h-fit border border-sky-100">
                    <h3 className="text-xl font-semibold mb-4 border-b pb-2 text-sky-700">יצירת קטגוריה ראשית חדשה</h3>
                    <form onSubmit={createCategory}>
                        {/* שם קטגוריה */}
                        <div className="mb-4">
                            <label className="block text-gray-700 font-medium mb-1">שם קטגוריה ראשית</label>
                            <input
                                type="text"
                                className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-sky-500 focus:border-sky-500"
                                value={newCategory.name}
                                onChange={handleNewCategoryChange}
                                placeholder="לדוגמה: טלפונים חכמים"
                                required
                            />
                        </div>

                        {/* וריאנטים נדרשים */}
                        <div className="mb-4 border-t pt-4">
                            <label className="block text-gray-700 font-medium mb-2">שדות וריאנט חובה (Variant Fields):</label>
                            <div className="flex flex-wrap gap-4">
                                {AVAILABLE_VARIANT_FIELDS.map(field => (
                                    <div key={field} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id={`field-${field}`}
                                            checked={newCategory.variantFields.includes(field)}
                                            onChange={() => handleVariantFieldToggle(field)}
                                            className="mr-2 h-4 w-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                                        />
                                        <label htmlFor={`field-${field}`} className="text-sm text-gray-600">
                                            {field === 'color' ? 'צבע' : field === 'storage' ? 'נפח' : 'גודל'}
                                        </label>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">שדות אלה יהיו **חובה** לכל מוצר בקטגוריה זו.</p>
                        </div>


                        {/* תתי קטגוריות */}
                        <div className="mb-6 border-t pt-4">
                            <label className="block text-gray-700 font-medium mb-2">תתי קטגוריות (Subcategories):</label>
                            {newCategory.subcategories.map((sub, index) => (
                                <div key={index} className="flex mb-2 items-center">
                                    <input
                                        type="text"
                                        className="w-full p-2 border border-gray-300 rounded-lg"
                                        placeholder={`שם תת-קטגוריה ${index + 1}`}
                                        value={sub.name}
                                        onChange={(e) => handleSubcategoryChange(index, e)}
                                        required={index === 0}
                                    />
                                    {newCategory.subcategories.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeSubcategory(index)}
                                            className="ml-2 text-red-500 hover:text-red-700 p-1"
                                        >
                                            🗑️
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addSubcategory}
                                className="text-sky-500 hover:text-sky-600 text-sm font-semibold mt-1 flex items-center"
                            >
                                <span className="text-xl mr-1">+</span> הוסף תת-קטגוריה נוספת
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full py-3 rounded-xl text-lg font-bold transition-colors ${isSubmitting ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                        >
                            {isSubmitting ? 'יוצר...' : '✅ שמור קטגוריה חדשה'}
                        </button>
                    </form>
                </div>

                {/* === רשימת קטגוריות קיימות === */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-2xl border border-gray-200">
                    <h3 className="text-xl font-semibold mb-4 border-b pb-2 text-gray-700">📂 קטגוריות קיימות ({categories.length})</h3>
                    <div className="max-h-[70vh] overflow-y-auto pr-2">
                        {categories.map(category => (
                            <div key={category._id} className="border-b last:border-b-0 p-4 hover:bg-gray-50 transition duration-150 rounded-lg">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-lg text-sky-800">{category.name}</span>
                                    <button
                                        onClick={() => deleteCategory(category._id, category.name)}
                                        className="text-red-500 hover:text-red-700 text-sm font-semibold py-1 px-3 rounded-full border border-red-300 transition-colors"
                                    >
                                        מחק
                                    </button>
                                </div>

                                <p className="text-sm text-gray-500">
                                    **תתי קטגוריות:** {
                                        Array.isArray(category.subcategories) && category.subcategories.length > 0
                                            ? category.subcategories.map(sub => sub.name).join(' | ')
                                            : 'אין'
                                    }
                                </p>
                                <p className="text-sm text-gray-600 mb-1">
                                    **שדות וריאנט (חובה):** {
                                        Array.isArray(category.variantFields) && category.variantFields.length > 0
                                            ? category.variantFields.join(', ')
                                            : 'אין'
                                    }
                                </p>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CategoryManagement;