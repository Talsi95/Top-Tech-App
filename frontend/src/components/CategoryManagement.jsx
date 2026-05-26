// src/components/CategoryManagement.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import Loader from '../components/Loader.jsx';
import { Plus, Trash2, Edit, Image as ImageIcon, Check, Folder, Tag, X, Settings2 } from 'lucide-react';

const DEFAULT_VARIANT_FIELDS = ['color', 'storage', 'size'];

const initialNewCategory = {
    name: '',
    subcategories: [{ name: '' }],
    variantFields: [],
    imageUrl: '',
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
    const [isEditing, setIsEditing] = useState(false);
    const [editingCategoryId, setEditingCategoryId] = useState(null);

    const [availableVariantFields, setAvailableVariantFields] = useState(DEFAULT_VARIANT_FIELDS);
    const [customField, setCustomField] = useState('');

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const token = getToken();
            const response = await axios.get(`${__API_URL__}/categories`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const fetchedCategories = response.data;
            setCategories(fetchedCategories);

            const allFields = new Set([...DEFAULT_VARIANT_FIELDS]);
            fetchedCategories.forEach(cat => {
                if (cat.variantFields) {
                    cat.variantFields.forEach(f => allFields.add(f));
                }
            });
            setAvailableVariantFields(Array.from(allFields));
        } catch (error) {
            showNotification('שגיאה בשליפת קטגוריות.', 'error');
            console.error('Fetch categories error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const addCustomField = () => {
        const field = customField.trim();
        if (!field) return;
        if (!availableVariantFields.includes(field)) {
            setAvailableVariantFields([...availableVariantFields, field]);
        }
        if (!newCategory.variantFields.includes(field)) {
            setNewCategory({ ...newCategory, variantFields: [...newCategory.variantFields, field] });
        }
        setCustomField('');
    };

    useEffect(() => {
        fetchCategories();
    }, []);

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
        setNewCategory({ ...newCategory, subcategories: newSubcategories.length > 0 ? newSubcategories : [{ name: '' }] });
    };

    const handleVariantFieldToggle = (field) => {
        const currentFields = newCategory.variantFields;
        const updatedFields = currentFields.includes(field)
            ? currentFields.filter(f => f !== field)
            : [...currentFields, field];

        setNewCategory({ ...newCategory, variantFields: updatedFields });
    };

    const saveCategory = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        const categoryName = newCategory.name.trim();
        if (!categoryName) {
            showNotification('שם קטגוריה ראשית נדרש.', 'error');
            return;
        }

        const filteredSubcategories = newCategory.subcategories.filter(sub => sub.name.trim() !== '');
        if (filteredSubcategories.length === 0) {
            showNotification('יש להזין לפחות תת-קטגוריה אחת.', 'error');
            return;
        }

        const dataToSend = {
            name: categoryName,
            subcategories: filteredSubcategories.map(sub => ({ name: sub.name.trim() })),
            variantFields: newCategory.variantFields,
            imageUrl: newCategory.imageUrl
        };

        setIsSubmitting(true);
        try {
            const token = getToken();
            if (isEditing) {
                await axios.put(`${__API_URL__}/categories/${editingCategoryId}`, dataToSend, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                showNotification(`הקטגוריה "${categoryName}" עודכנה בהצלחה!`, 'success');
            } else {
                await axios.post(`${__API_URL__}/categories`, dataToSend, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                showNotification(`הקטגוריה "${categoryName}" נוצרה בהצלחה!`, 'success');
            }

            cancelEdit();
            fetchCategories();
        } catch (error) {
            const message = error.response?.data?.message || 'שגיאה בשמירת קטגוריה.';
            showNotification(message, 'error');
            console.error('Save category error:', error.response || error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const startEdit = (category) => {
        setIsEditing(true);
        setEditingCategoryId(category._id);
        setNewCategory({
            name: category.name,
            subcategories: category.subcategories.length > 0 ? category.subcategories.map(sub => ({ name: sub.name })) : [{ name: '' }],
            variantFields: category.variantFields || [],
            imageUrl: category.imageUrl || ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setEditingCategoryId(null);
        setNewCategory(initialNewCategory);
    };

    const deleteCategory = async (id, name) => {
        if (!window.confirm(`האם אתה בטוח שברצונך למחוק את הקטגוריה הראשית "${name}"? אם קיימים מוצרים תחתיה, המחיקה תיכשל.`)) {
            return;
        }
        try {
            const token = getToken();
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

    if (isLoading) return <Loader text="טוען קטגוריות" />;

    return (
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-10" dir="rtl">
            <div className="flex flex-col items-center text-center mb-10">
                <div className="p-3.5 bg-primary/10 text-primary rounded-2xl mb-4">
                    <Settings2 className="w-8 h-8" />
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">ניהול קטגוריות</h2>
                <p className="text-gray-500 font-medium mt-2">הגדר קטגוריות ראשיות, תתי קטגוריות ומאפייני מוצר מותאמים</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Column */}
                <div className="lg:col-span-1 bg-white p-8 rounded-[2rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] border border-gray-100 h-fit">
                    <h3 className="text-xl font-bold mb-6 border-b border-gray-50 pb-4 text-gray-900">
                        {isEditing ? `עריכת קטגוריה: ${newCategory.name}` : 'יצירת קטגוריה חדשה'}
                    </h3>

                    <form onSubmit={saveCategory} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-2">שם קטגוריה ראשית</label>
                            <div className="relative group">
                                <Folder className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    type="text"
                                    className="w-full bg-gray-50 border border-gray-100 focus:border-primary focus:bg-white rounded-2xl py-3.5 pr-12 pl-4 outline-none font-bold text-gray-900 transition-all placeholder:text-gray-300 text-sm"
                                    value={newCategory.name}
                                    onChange={handleNewCategoryChange}
                                    placeholder="לדוגמה: פירות וירקות"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-2">קישור לתמונה (URL)</label>
                            <div className="relative group">
                                <ImageIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    type="text"
                                    className="w-full bg-gray-50 border border-gray-100 focus:border-primary focus:bg-white rounded-2xl py-3.5 pr-12 pl-4 outline-none font-bold text-gray-900 transition-all placeholder:text-gray-300 text-sm"
                                    value={newCategory.imageUrl}
                                    onChange={(e) => setNewCategory({ ...newCategory, imageUrl: e.target.value })}
                                    placeholder="https://example.com/image.jpg"
                                />
                            </div>
                            <p className="text-[10px] text-gray-400 mr-2">תמונה זו תוצג בבאנרים בדף הבית</p>
                        </div>

                        <div className="space-y-3 border-t border-gray-50 pt-5">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-2 block">שדות וריאנט חובה למוצרים</label>
                            <div className="flex flex-wrap gap-2">
                                {availableVariantFields.map(field => {
                                    const isSelected = newCategory.variantFields.includes(field);
                                    const displayLabel = field === 'color' ? 'צבע' : field === 'storage' ? 'נפח' : field === 'size' ? 'גודל' : field;

                                    return (
                                        <button
                                            key={field}
                                            type="button"
                                            onClick={() => handleVariantFieldToggle(field)}
                                            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-black transition-all ${isSelected
                                                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/10'
                                                    : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100'
                                                }`}
                                        >
                                            {isSelected && <Check size={14} />}
                                            <span>{displayLabel}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex gap-2 pt-1.5">
                                <div className="relative flex-grow group">
                                    <Tag className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={16} />
                                    <input
                                        type="text"
                                        placeholder="הוסף מאפיין מותאם (למשל: סוג)"
                                        className="w-full bg-gray-50 border border-gray-100 focus:border-primary focus:bg-white rounded-xl py-2.5 pr-10 pl-4 outline-none font-bold text-gray-900 transition-all placeholder:text-gray-300 text-xs"
                                        value={customField}
                                        onChange={(e) => setCustomField(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomField())}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={addCustomField}
                                    className="bg-primary/10 hover:bg-primary text-primary hover:text-white px-4 rounded-xl text-xs font-black transition-all cursor-pointer"
                                >
                                    הוסף
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3 border-t border-gray-50 pt-5">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-2 block">תתי קטגוריות</label>
                            <div className="space-y-2">
                                {newCategory.subcategories.map((sub, index) => (
                                    <div key={index} className="flex gap-2 items-center">
                                        <input
                                            type="text"
                                            className="flex-grow bg-gray-50 border border-gray-100 focus:border-primary focus:bg-white rounded-xl py-2.5 px-4 outline-none font-bold text-gray-900 transition-all text-xs"
                                            placeholder={`תת-קטגוריה ${index + 1}`}
                                            value={sub.name}
                                            onChange={(e) => handleSubcategoryChange(index, e)}
                                            required={index === 0}
                                        />
                                        {newCategory.subcategories.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeSubcategory(index)}
                                                className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={addSubcategory}
                                className="inline-flex items-center gap-1 text-primary hover:underline text-xs font-bold mt-1 cursor-pointer"
                            >
                                <Plus size={16} />
                                <span>הוסף תת-קטגוריה נוספת</span>
                            </button>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-gray-50">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-grow py-4 bg-gray-900 text-white rounded-2xl font-black text-sm shadow-lg hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:bg-gray-200 disabled:text-gray-400 cursor-pointer"
                            >
                                <span>{isSubmitting ? 'שומר...' : isEditing ? 'עדכן קטגוריה' : 'שמור קטגוריה'}</span>
                            </button>
                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="px-5 py-4 bg-gray-50 border border-gray-100 text-gray-600 rounded-2xl font-black text-sm hover:bg-gray-100 active:scale-[0.98] transition-all cursor-pointer"
                                >
                                    ביטול
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* List Column */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] border border-gray-100">
                    <div className="flex justify-between items-center mb-6 border-b border-gray-50 pb-4">
                        <h3 className="text-xl font-bold text-gray-900">קטגוריות קיימות</h3>
                        <span className="text-xs font-black text-primary bg-primary/5 px-3 py-1.5 rounded-full">
                            {categories.length} קטגוריות
                        </span>
                    </div>

                    <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
                        {categories.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 font-medium">
                                אין עדיין קטגוריות במערכת.
                            </div>
                        ) : (
                            categories.map(category => (
                                <div
                                    key={category._id}
                                    className="group flex flex-col md:flex-row md:items-center justify-between border border-gray-50 hover:border-primary/10 rounded-2xl p-5 hover:bg-gray-50/50 transition-all duration-200 gap-4"
                                >
                                    <div className="flex items-center gap-4">
                                        {category.imageUrl ? (
                                            <img
                                                src={category.imageUrl}
                                                alt={category.name}
                                                className="w-14 h-14 object-cover rounded-xl border border-gray-100 shadow-inner shrink-0"
                                            />
                                        ) : (
                                            <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 border border-gray-50 shrink-0">
                                                <Folder className="w-6 h-6" />
                                            </div>
                                        )}
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-lg text-gray-900">{category.name}</h4>

                                            {/* Subcategories display */}
                                            {category.subcategories && category.subcategories.length > 0 ? (
                                                <div className="flex flex-wrap gap-1 items-center">
                                                    <span className="text-[10px] font-black text-gray-400">תתי קטגוריות:</span>
                                                    {category.subcategories.map((sub, sIdx) => (
                                                        <span key={sIdx} className="text-[10px] bg-white border border-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-bold shadow-sm">
                                                            {sub.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-[10px] text-gray-400">אין תתי קטגוריות</p>
                                            )}

                                            {/* Variant fields display */}
                                            {category.variantFields && category.variantFields.length > 0 && (
                                                <div className="flex flex-wrap gap-1 items-center pt-0.5">
                                                    <span className="text-[10px] font-black text-gray-400">שדות חובה:</span>
                                                    {category.variantFields.map((field, fIdx) => (
                                                        <span key={fIdx} className="text-[10px] bg-primary/5 text-primary px-2 py-0.5 rounded-md font-bold">
                                                            {field === 'color' ? 'צבע' : field === 'storage' ? 'נפח' : field === 'size' ? 'גודל' : field}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 md:self-center self-end opacity-90 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => startEdit(category)}
                                            className="p-2.5 bg-white hover:bg-primary/5 text-gray-500 hover:text-primary rounded-xl transition-all border border-gray-100 shadow-sm active:scale-95 cursor-pointer"
                                            title="ערוך קטגוריה"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => deleteCategory(category._id, category.name)}
                                            className="p-2.5 bg-white hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-xl transition-all border border-gray-100 shadow-sm active:scale-95 cursor-pointer"
                                            title="מחק קטגוריה"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CategoryManagement;