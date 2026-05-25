import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import { useStore } from '../StoreContext';
import Loader from './Loader';

const StoreSettings = ({ showNotification }) => {
    const { getToken } = useAuth();
    const { store, setStore } = useStore();
    const [formData, setFormData] = useState(null);
    const [loading, setLoading] = useState(false);

    // States for video uploads
    const [isUploadingHeroVideo, setIsUploadingHeroVideo] = useState(false);
    const [uploadingGalleryVideoIndices, setUploadingGalleryVideoIndices] = useState({});
    const [galleryVideoModes, setGalleryVideoModes] = useState({});
    const [heroVideoMode, setHeroVideoMode] = useState('link');

    useEffect(() => {
        if (store) {
            setFormData({ ...store });
            const url = store.homePageConfig?.mediaUrls?.[0] || '';
            setHeroVideoMode(url.includes('cloudinary.com') ? 'file' : 'link');
        }
    }, [store]);

    const handleNestedChange = (section, field, value) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleFeatureChange = (field, value) => {
        handleNestedChange('features', field, value);
    };

    const handleHeroVideoFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploadingHeroVideo(true);
        const token = getToken();
        const formDataUpload = new FormData();
        formDataUpload.append('video', file);

        try {
            const res = await axios.post(`${__API_URL__}/products/upload-video`, formDataUpload, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });
            const urls = [...(formData.homePageConfig?.mediaUrls || [])];
            urls[0] = res.data.url;
            handleNestedChange('homePageConfig', 'mediaUrls', urls);
            showNotification('הסרטון הועלה בהצלחה!', 'success');
        } catch (err) {
            console.error("Error uploading hero video:", err);
            showNotification('שגיאה בהעלאת הסרטון', 'error');
        } finally {
            setIsUploadingHeroVideo(false);
        }
    };

    const handleGalleryVideoFileChange = async (e, idx) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingGalleryVideoIndices(prev => ({ ...prev, [idx]: true }));
        const token = getToken();
        const formDataUpload = new FormData();
        formDataUpload.append('video', file);

        try {
            const res = await axios.post(`${__API_URL__}/products/upload-video`, formDataUpload, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });
            const newGallery = [...formData.gallery];
            newGallery[idx].url = res.data.url;
            setFormData({ ...formData, gallery: newGallery });
            showNotification('הסרטון הועלה בהצלחה לגלריה!', 'success');
        } catch (err) {
            console.error("Error uploading gallery video:", err);
            showNotification('שגיאה בהעלאת סרטון הגלריה', 'error');
        } finally {
            setUploadingGalleryVideoIndices(prev => ({ ...prev, [idx]: false }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.put(`${__API_URL__}/stores`, formData, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            setStore(res.data);
            showNotification('הגדרות החנות עודכנו בהצלחה!', 'success');
        } catch (error) {
            console.error(error);
            showNotification('שגיאה בעדכון הגדרות החנות', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!formData) return <Loader />;

    return (
        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in zoom-in-95 duration-500 text-right" dir="rtl">
            {/* General Info */}
            <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                <h3 className="text-xl font-black mb-4">הגדרות כלליות</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">שם החנות</label>
                        <input
                            type="text"
                            value={formData.name || ''}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full p-4 bg-white rounded-xl border border-gray-200 focus:border-primary outline-none transition-all"
                            required
                        />
                    </div>
                </div>
            </div>

            {/* Business Info */}
            <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                <h3 className="text-xl font-black mb-4">פרטי העסק וצור קשר</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">כתובת</label>
                        <input type="text" value={formData.businessInfo?.address || ''} onChange={(e) => handleNestedChange('businessInfo', 'address', e.target.value)} className="w-full p-4 bg-white rounded-xl border border-gray-200 focus:border-primary outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">טלפון</label>
                        <input type="text" value={formData.businessInfo?.phone || ''} onChange={(e) => handleNestedChange('businessInfo', 'phone', e.target.value)} className="w-full p-4 bg-white rounded-xl border border-gray-200 focus:border-primary outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">וואטסאפ (לדוגמה 972501234567)</label>
                        <input type="text" value={formData.businessInfo?.whatsapp || ''} onChange={(e) => handleNestedChange('businessInfo', 'whatsapp', e.target.value)} className="w-full p-4 bg-white rounded-xl border border-gray-200 focus:border-primary outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">פייסבוק</label>
                        <input type="text" value={formData.businessInfo?.facebook || ''} onChange={(e) => handleNestedChange('businessInfo', 'facebook', e.target.value)} className="w-full p-4 bg-white rounded-xl border border-gray-200 focus:border-primary outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">אינסטגרם</label>
                        <input type="text" value={formData.businessInfo?.instagram || ''} onChange={(e) => handleNestedChange('businessInfo', 'instagram', e.target.value)} className="w-full p-4 bg-white rounded-xl border border-gray-200 focus:border-primary outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">טיקטוק</label>
                        <input type="text" value={formData.businessInfo?.tiktok || ''} onChange={(e) => handleNestedChange('businessInfo', 'tiktok', e.target.value)} className="w-full p-4 bg-white rounded-xl border border-gray-200 focus:border-primary outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">דוא"ל</label>
                        <input type="email" value={formData.businessInfo?.email || ''} onChange={(e) => handleNestedChange('businessInfo', 'email', e.target.value)} className="w-full p-4 bg-white rounded-xl border border-gray-200 focus:border-primary outline-none" />
                    </div>
                </div>
            </div>

            {/* Design & Colors */}
            <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                <h3 className="text-xl font-black mb-4">עיצוב ומיתוג</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">צבע ראשי (Primary)</label>
                        <div className="flex gap-4 items-center">
                            <input type="color" value={formData.design?.primaryColor || '#4f46e5'} onChange={(e) => handleNestedChange('design', 'primaryColor', e.target.value)} className="w-14 h-14 rounded-xl cursor-pointer" />
                            <input type="text" value={formData.design?.primaryColor || '#4f46e5'} onChange={(e) => handleNestedChange('design', 'primaryColor', e.target.value)} className="flex-1 p-4 bg-white rounded-xl border border-gray-200 focus:border-primary outline-none" dir="ltr" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">צבע משני (Secondary)</label>
                        <div className="flex gap-4 items-center">
                            <input type="color" value={formData.design?.secondaryColor || '#1f2937'} onChange={(e) => handleNestedChange('design', 'secondaryColor', e.target.value)} className="w-14 h-14 rounded-xl cursor-pointer" />
                            <input type="text" value={formData.design?.secondaryColor || '#1f2937'} onChange={(e) => handleNestedChange('design', 'secondaryColor', e.target.value)} className="flex-1 p-4 bg-white rounded-xl border border-gray-200 focus:border-primary outline-none" dir="ltr" />
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2">קישור ללוגו החנות (Logo URL)</label>
                        <input type="text" value={formData.design?.logoUrl || ''} onChange={(e) => handleNestedChange('design', 'logoUrl', e.target.value)} className="w-full p-4 bg-white rounded-xl border border-gray-200 focus:border-primary outline-none" dir="ltr" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2">קישור לאייקון הלשונית (Favicon URL)</label>
                        <input type="text" value={formData.design?.faviconUrl || ''} onChange={(e) => handleNestedChange('design', 'faviconUrl', e.target.value)} className="w-full p-4 bg-white rounded-xl border border-gray-200 focus:border-primary outline-none" dir="ltr" />
                    </div>
                </div>
            </div>

            {/* Labels */}
            <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                <h3 className="text-xl font-black mb-4">תוויות וטקסטים</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">תת-כותרת בבאנר (דף הבית)</label>
                        <input type="text" value={formData.labels?.bannerDescription || ''} onChange={(e) => handleNestedChange('labels', 'bannerDescription', e.target.value)} className="w-full p-4 bg-white rounded-xl border border-gray-200 focus:border-primary outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">תיאור קצר (Footer)</label>
                        <input type="text" value={formData.labels?.footerDescription || ''} onChange={(e) => handleNestedChange('labels', 'footerDescription', e.target.value)} className="w-full p-4 bg-white rounded-xl border border-gray-200 focus:border-primary outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">כותרת מפרט טכני (דף מוצר)</label>
                        <input type="text" value={formData.labels?.technicalSpecs || ''} onChange={(e) => handleNestedChange('labels', 'technicalSpecs', e.target.value)} className="w-full p-4 bg-white rounded-xl border border-gray-200 focus:border-primary outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">כפתור צור קשר (במצב קטלוג)</label>
                        <input type="text" value={formData.labels?.contactUsLabel || ''} onChange={(e) => handleNestedChange('labels', 'contactUsLabel', e.target.value)} className="w-full p-4 bg-white rounded-xl border border-gray-200 focus:border-primary outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">כותרת רשימת מוצרים (דף הבית)</label>
                        <input type="text" value={formData.labels?.featuredSectionTitle || ''} onChange={(e) => handleNestedChange('labels', 'featuredSectionTitle', e.target.value)} className="w-full p-4 bg-white rounded-xl border border-gray-200 focus:border-primary outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">כותרת מעל הקטגוריות (דף הבית)</label>
                        <input type="text" value={formData.labels?.discoverSectionTitle || ''} onChange={(e) => handleNestedChange('labels', 'discoverSectionTitle', e.target.value)} className="w-full p-4 bg-white rounded-xl border border-gray-200 focus:border-primary outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">תת כותרת מעל הקטגוריות (דף הבית)</label>
                        <input type="text" value={formData.labels?.discoverSectionSubtitle || ''} onChange={(e) => handleNestedChange('labels', 'discoverSectionSubtitle', e.target.value)} className="w-full p-4 bg-white rounded-xl border border-gray-200 focus:border-primary outline-none" />
                    </div>
                </div>
            </div>

            {/* Home Page Configuration */}
            <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                <h3 className="text-xl font-black mb-4">ניהול דף הבית</h3>
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-4">מה יוצג בראש דף הבית (Hero Section)?</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { id: 'banner', label: 'באנר (ברירת מחדל)', desc: 'תמונה עם טקסט' },
                                { id: 'slider', label: 'סליידר קטגוריות', desc: 'מעבר אוטומטי בין קטגוריות' },
                                { id: 'video', label: 'סרטון רקע', desc: 'סרטון וידאו במסך מלא' }
                            ].map(option => (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => handleNestedChange('homePageConfig', 'heroType', option.id)}
                                    className={`p-6 rounded-2xl border-2 transition-all text-right ${formData.homePageConfig?.heroType === option.id
                                        ? 'border-primary bg-primary/5 shadow-md'
                                        : 'border-gray-100 bg-white hover:border-gray-300'
                                        }`}
                                >
                                    <div className="font-black text-gray-900 mb-1">{option.label}</div>
                                    <div className="text-xs text-gray-500">{option.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {formData.homePageConfig?.heroType !== 'banner' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-4 duration-500">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">כותרת ראשית (Hero Title)</label>
                                <input
                                    type="text"
                                    value={formData.homePageConfig?.heroTitle || ''}
                                    onChange={(e) => handleNestedChange('homePageConfig', 'heroTitle', e.target.value)}
                                    placeholder="למשל: ברוכים הבאים"
                                    className="w-full p-4 bg-white rounded-xl border border-gray-200 focus:border-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">כותרת משנית (Hero Subtitle)</label>
                                <input
                                    type="text"
                                    value={formData.homePageConfig?.heroSubtitle || ''}
                                    onChange={(e) => handleNestedChange('homePageConfig', 'heroSubtitle', e.target.value)}
                                    placeholder="למשל: הקולקציה החדשה כבר כאן"
                                    className="w-full p-4 bg-white rounded-xl border border-gray-200 focus:border-primary outline-none"
                                />
                            </div>
                        </div>
                    )}

                    {formData.homePageConfig?.heroType === 'video' && (
                        <div className="animate-in slide-in-from-top-4 duration-500 bg-white p-6 rounded-2xl border border-gray-100 flex flex-col gap-4">
                            <label className="block text-sm font-bold text-gray-700">מקור הסרטון הראשי</label>

                            {/* Toggle options */}
                            <div className="flex gap-4 mb-2">
                                <button
                                    type="button"
                                    onClick={() => setHeroVideoMode('link')}
                                    className={`flex-1 py-3 rounded-xl font-black text-sm transition-all border ${heroVideoMode === 'link'
                                        ? 'bg-primary text-white border-primary shadow-md'
                                        : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100'
                                        }`}
                                >
                                    הדבקת קישור לסרטון (YouTube/Vimeo/Direct MP4)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setHeroVideoMode('file')}
                                    className={`flex-1 py-3 rounded-xl font-black text-sm transition-all border ${heroVideoMode === 'file'
                                        ? 'bg-primary text-white border-primary shadow-md'
                                        : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100'
                                        }`}
                                >
                                    העלאת קובץ וידאו מובנה ל-Cloudinary
                                </button>
                            </div>

                            {/* Link input */}
                            {heroVideoMode === 'link' ? (
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-gray-400">קישור ישיר או כתובת YouTube/Vimeo:</label>
                                    <input
                                        type="text"
                                        value={formData.homePageConfig?.mediaUrls?.[0] || ''}
                                        onChange={(e) => {
                                            const urls = [...(formData.homePageConfig?.mediaUrls || [])];
                                            urls[0] = e.target.value;
                                            handleNestedChange('homePageConfig', 'mediaUrls', urls);
                                        }}
                                        placeholder="https://example.com/video.mp4"
                                        className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:border-primary focus:bg-white outline-none font-bold"
                                    />
                                    <p className="text-[10px] text-gray-400 mr-2">מומלץ להשתמש בקישור ישיר לקובץ MP4 לקבלת ביצועים מקסימליים</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    <label className="text-xs font-bold text-gray-400">קובץ סרטון (MP4, MOV, WebM):</label>
                                    {formData.homePageConfig?.mediaUrls?.[0] && formData.homePageConfig.mediaUrls[0].includes('cloudinary.com') ? (
                                        <div className="flex items-center justify-between p-4 bg-green-50 border border-green-100 rounded-2xl text-green-800 text-right">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm">הסרטון הועלה בהצלחה!</span>
                                                    <span className="text-xs text-green-700 font-medium truncate max-w-[200px] md:max-w-xs leading-none mt-1">
                                                        {formData.homePageConfig.mediaUrls[0]}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <label className="cursor-pointer px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold transition-all">
                                                    החלף סרטון
                                                    <input type="file" accept="video/*" className="hidden" onChange={handleHeroVideoFileChange} />
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const urls = [...(formData.homePageConfig?.mediaUrls || [])];
                                                        urls[0] = '';
                                                        handleNestedChange('homePageConfig', 'mediaUrls', urls);
                                                    }}
                                                    className="px-4 py-2 bg-white hover:bg-red-50 text-red-500 hover:text-red-600 border border-red-100 rounded-xl text-xs font-bold transition-all"
                                                >
                                                    הסר
                                                </button>
                                            </div>
                                        </div>
                                    ) : isUploadingHeroVideo ? (
                                        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 border border-dashed border-gray-200 rounded-2xl gap-4">
                                            <div className="relative w-12 h-12">
                                                <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                                                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                            <span className="text-sm font-bold text-gray-500 animate-pulse">מעלה סרטון ל-Cloudinary ומבצע אופטימיזציה...</span>
                                        </div>
                                    ) : (
                                        <div className="relative group/dropzone flex flex-col items-center justify-center p-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl hover:bg-gray-100/50 hover:border-primary/40 transition-all cursor-pointer">
                                            <input
                                                type="file"
                                                accept="video/mp4,video/quicktime,video/webm"
                                                onChange={handleHeroVideoFileChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-3 group-hover/dropzone:scale-110 transition-transform">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                            </div>
                                            <span className="text-sm font-black text-gray-700 mb-1">לחץ להעלאת קובץ סרטון</span>
                                            <span className="text-xs text-gray-400 font-bold">או גרור את הקובץ לכאן (תומך ב-MP4, MOV, WebM)</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Features */}
            <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                <h3 className="text-xl font-black mb-4">פיצ'רים ומודולים</h3>
                <div className="space-y-6">
                    <label className="flex items-center cursor-pointer relative">
                        <input type="checkbox" checked={formData.features?.hasRepairLab ?? false} onChange={(e) => handleFeatureChange('hasRepairLab', e.target.checked)} className="peer sr-only" />
                        <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                        <span className="mr-3 text-sm font-medium text-gray-900 pr-3">הפעלת מעבדת תיקונים (מודול מלא)</span>
                    </label>

                    <label className="flex items-center cursor-pointer relative">
                        <input type="checkbox" checked={formData.features?.hasCart ?? true} onChange={(e) => handleFeatureChange('hasCart', e.target.checked)} className="peer sr-only" />
                        <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                        <span className="mr-3 text-sm font-medium text-gray-900 pr-3">הפעלת עגלת קניות (מצב מכירה פעיל)</span>
                    </label>

                    <label className="flex items-center cursor-pointer relative">
                        <input type="checkbox" checked={formData.features?.hasUserAccounts ?? true} onChange={(e) => handleFeatureChange('hasUserAccounts', e.target.checked)} className="peer sr-only" />
                        <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                        <span className="mr-3 text-sm font-medium text-gray-900 pr-3">הפעלת חשבונות משתמשים</span>
                    </label>

                    <label className="flex items-center cursor-pointer relative">
                        <input type="checkbox" checked={formData.features?.hasCheckout ?? true} onChange={(e) => handleFeatureChange('hasCheckout', e.target.checked)} className="peer sr-only" />
                        <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                        <span className="mr-3 text-sm font-medium text-gray-900 pr-3">הפעלת תהליך תשלום (Checkout)</span>
                    </label>

                    <label className="flex items-center cursor-pointer relative">
                        <input type="checkbox" checked={formData.features?.fullWidthCards ?? false} onChange={(e) => handleFeatureChange('fullWidthCards', e.target.checked)} className="peer sr-only" />
                        <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                        <span className="mr-3 text-sm font-medium text-gray-900 pr-3">כרטיסי מוצר ברוחב מלא (Mobile Edge-to-Edge)</span>
                    </label>

                    <label className="flex items-center cursor-pointer relative">
                        <input type="checkbox" checked={formData.features?.cartDrawer ?? true} onChange={(e) => handleFeatureChange('cartDrawer', e.target.checked)} className="peer sr-only" />
                        <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                        <span className="mr-3 text-sm font-medium text-gray-900 pr-3">הפעלת מגירת חיפוש/עגלה (Search/Cart Drawer)</span>
                    </label>

                    <label className="flex items-center cursor-pointer relative">
                        <input type="checkbox" checked={formData.features?.useSubCategories ?? true} onChange={(e) => handleFeatureChange('useSubCategories', e.target.checked)} className="peer sr-only" />
                        <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                        <span className="mr-3 text-sm font-medium text-gray-900 pr-3">הפעלת תתי-קטגוריות (Subcategories)</span>
                    </label>

                    <label className="flex items-center cursor-pointer relative">
                        <input type="checkbox" checked={formData.features?.showStock ?? true} onChange={(e) => handleFeatureChange('showStock', e.target.checked)} className="peer sr-only" />
                        <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                        <span className="mr-3 text-sm font-medium text-gray-900 pr-3">הצגת מלאי מוצרים (Stock Management)</span>
                    </label>

                    <label className="flex items-center cursor-pointer relative">
                        <input type="checkbox" checked={formData.features?.hasArticles ?? false} onChange={(e) => handleFeatureChange('hasArticles', e.target.checked)} className="peer sr-only" />
                        <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                        <span className="mr-3 text-sm font-medium text-gray-900 pr-3">הפעלת בלוג ומאמרים (Articles/Blog)</span>
                    </label>
                </div>
            </div>

            {/* Gallery Management */}
            <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-gray-900">גלריית תמונות ווידאו</h3>
                    <button
                        type="button"
                        onClick={() => {
                            const newGallery = [...(formData.gallery || []), { url: '', type: 'image', title: '' }];
                            setFormData({ ...formData, gallery: newGallery });
                        }}
                        className="bg-primary/10 text-primary px-4 py-2 rounded-xl font-bold text-sm hover:bg-primary hover:text-white transition-all flex items-center gap-2"
                    >
                        + הוסף פריט לגלריה
                    </button>
                </div>

                <div className="space-y-4">
                    {(formData.gallery || []).length === 0 ? (
                        <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
                            הגלריה ריקה. הוסף תמונות או סרטונים כדי להציג אותם בדף הבית.
                        </div>
                    ) : (
                        formData.gallery.map((item, index) => {
                            const currentMode = galleryVideoModes[index] || (item.url?.includes('cloudinary.com') ? 'file' : 'link');
                            return (
                                <div key={index} className="bg-white p-5 rounded-3xl border border-gray-100 flex flex-col md:flex-row gap-6 items-center shadow-sm hover:shadow-md transition-all">
                                    {/* Preview Thumbnail */}
                                    <div className="w-24 h-24 rounded-2xl bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center border border-gray-100">
                                        {item.url ? (
                                            item.type === 'image' ? (
                                                <img src={item.url} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex flex-col items-center gap-1">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                    </svg>
                                                    <span className="text-[8px] font-bold text-primary uppercase">Video</span>
                                                </div>
                                            )
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        )}
                                    </div>

                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full text-right">
                                        {item.type === 'video' ? (
                                            <div className="lg:col-span-1 flex flex-col gap-2">
                                                <div className="flex justify-between items-center">
                                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-wider">מקור הוידאו</label>
                                                    <div className="flex gap-2 bg-gray-100 p-0.5 rounded-lg">
                                                        <button
                                                            type="button"
                                                            onClick={() => setGalleryVideoModes(prev => ({ ...prev, [index]: 'link' }))}
                                                            className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${currentMode === 'link'
                                                                ? 'bg-white text-gray-900 shadow-sm'
                                                                : 'text-gray-400 hover:text-gray-600'
                                                                }`}
                                                        >
                                                            קישור
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setGalleryVideoModes(prev => ({ ...prev, [index]: 'file' }))}
                                                            className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${currentMode === 'file'
                                                                ? 'bg-white text-gray-900 shadow-sm'
                                                                : 'text-gray-400 hover:text-gray-600'
                                                                }`}
                                                        >
                                                            קובץ
                                                        </button>
                                                    </div>
                                                </div>

                                                {currentMode === 'link' ? (
                                                    <input
                                                        type="text"
                                                        value={item.url || ''}
                                                        onChange={(e) => {
                                                            const newGallery = [...formData.gallery];
                                                            newGallery[index].url = e.target.value;
                                                            setFormData({ ...formData, gallery: newGallery });
                                                        }}
                                                        className="w-full p-3 bg-gray-50 rounded-xl border border-transparent focus:border-primary focus:bg-white outline-none text-sm transition-all font-bold"
                                                        placeholder="הדבק קישור כאן"
                                                    />
                                                ) : (
                                                    <div className="border border-dashed border-gray-200 rounded-xl p-2.5 text-center relative hover:border-primary transition-all bg-gray-50 flex items-center justify-center min-h-[46px]">
                                                        {uploadingGalleryVideoIndices[index] ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                                <span className="text-[10px] font-bold text-gray-500">מעלה סרטון...</span>
                                                            </div>
                                                        ) : item.url?.includes('cloudinary.com') ? (
                                                            <div className="flex items-center justify-between w-full px-1">
                                                                <span className="text-[10px] text-green-600 font-bold">הועלה!</span>
                                                                <div className="flex gap-1.5">
                                                                    <label className="cursor-pointer bg-primary/10 text-primary px-2 py-1 rounded-md font-bold text-[10px] hover:bg-primary hover:text-white transition-all">
                                                                        החלף
                                                                        <input type="file" accept="video/*" className="hidden" onChange={(e) => handleGalleryVideoFileChange(e, index)} />
                                                                    </label>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const newGallery = [...formData.gallery];
                                                                            newGallery[index].url = '';
                                                                            setFormData({ ...formData, gallery: newGallery });
                                                                        }}
                                                                        className="bg-red-50 text-red-500 px-2 py-1 rounded-md font-bold text-[10px] hover:bg-red-500 hover:text-white transition-all"
                                                                    >
                                                                        הסר
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <label className="cursor-pointer flex items-center gap-1.5 w-full justify-center">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                                </svg>
                                                                <span className="text-[10px] font-bold text-gray-500">לחץ להעלאה</span>
                                                                <input type="file" accept="video/*" className="hidden" onChange={(e) => handleGalleryVideoFileChange(e, index)} />
                                                            </label>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="lg:col-span-1">
                                                <label className="block text-xs font-black text-gray-400 mb-1.5 uppercase tracking-wider">קישור (URL)</label>
                                                <input
                                                    type="text"
                                                    value={item.url || ''}
                                                    onChange={(e) => {
                                                        const newGallery = [...formData.gallery];
                                                        newGallery[index].url = e.target.value;
                                                        setFormData({ ...formData, gallery: newGallery });
                                                    }}
                                                    className="w-full p-3.5 bg-gray-50 rounded-xl border border-transparent focus:border-primary focus:bg-white outline-none text-sm transition-all font-bold"
                                                    placeholder="https://..."
                                                />
                                            </div>
                                        )}
                                        <div>
                                            <label className="block text-xs font-black text-gray-400 mb-1.5 uppercase tracking-wider">סוג תוכן</label>
                                            <select
                                                value={item.type || 'image'}
                                                onChange={(e) => {
                                                    const newGallery = [...formData.gallery];
                                                    newGallery[index].type = e.target.value;
                                                    setFormData({ ...formData, gallery: newGallery });
                                                }}
                                                className="w-full p-3.5 bg-gray-50 rounded-xl border border-transparent focus:border-primary focus:bg-white outline-none text-sm transition-all"
                                            >
                                                <option value="image">תמונה 🖼️</option>
                                                <option value="video">וידאו (YouTube/MP4) 🎥</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-gray-400 mb-1.5 uppercase tracking-wider">כותרת (אופציונלי)</label>
                                            <input
                                                type="text"
                                                value={item.title || ''}
                                                onChange={(e) => {
                                                    const newGallery = [...formData.gallery];
                                                    newGallery[index].title = e.target.value;
                                                    setFormData({ ...formData, gallery: newGallery });
                                                }}
                                                className="w-full p-3.5 bg-gray-50 rounded-xl border border-transparent focus:border-primary focus:bg-white outline-none text-sm transition-all"
                                                placeholder="מה רואים כאן?"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newGallery = formData.gallery.filter((_, i) => i !== index);
                                            setFormData({ ...formData, gallery: newGallery });
                                        }}
                                        className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm flex-shrink-0"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Shipping Options Management */}
            <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-gray-900 font-sans">אפשרויות משלוח</h3>
                    <button
                        type="button"
                        onClick={() => {
                            const currentOptions = formData.shippingOptions || [];
                            const newOptions = [...currentOptions, { name: '', price: 0 }];
                            setFormData({ ...formData, shippingOptions: newOptions });
                        }}
                        className="bg-primary/10 text-primary px-4 py-2 rounded-xl font-bold text-sm hover:bg-primary hover:text-white transition-all flex items-center gap-2"
                    >
                        + הוסף אפשרות משלוח
                    </button>
                </div>

                <div className="space-y-4">
                    {(!formData.shippingOptions || formData.shippingOptions.length === 0) ? (
                        <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
                            לא הוגדרו אפשרויות משלוח מותאמות אישית. במקרה כזה, יוצגו אפשרויות ברירת המחדל (משלוח עד הבית, נקודת איסוף, איסוף עצמי).
                        </div>
                    ) : (
                        formData.shippingOptions.map((option, index) => (
                            <div key={index} className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-col sm:flex-row gap-4 items-center shadow-sm">
                                <div className="flex-1 w-full">
                                    <label className="block text-xs font-black text-gray-400 mb-1.5 uppercase">שם אפשרות המשלוח</label>
                                    <input
                                        type="text"
                                        value={option.name || ''}
                                        onChange={(e) => {
                                            const newOptions = [...formData.shippingOptions];
                                            newOptions[index].name = e.target.value;
                                            setFormData({ ...formData, shippingOptions: newOptions });
                                        }}
                                        className="w-full p-3 bg-gray-50 rounded-xl border border-transparent focus:border-primary focus:bg-white outline-none text-sm transition-all"
                                        placeholder="לדוגמה: משלוח מהיר עד הבית"
                                        required
                                    />
                                </div>
                                <div className="w-full sm:w-48">
                                    <label className="block text-xs font-black text-gray-400 mb-1.5 uppercase font-mono">מחיר (₪)</label>
                                    <input
                                        type="number"
                                        value={option.price ?? 0}
                                        min="0"
                                        step="0.01"
                                        onChange={(e) => {
                                            const newOptions = [...formData.shippingOptions];
                                            newOptions[index].price = parseFloat(e.target.value) || 0;
                                            setFormData({ ...formData, shippingOptions: newOptions });
                                        }}
                                        className="w-full p-3 bg-gray-50 rounded-xl border border-transparent focus:border-primary focus:bg-white outline-none text-sm transition-all"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newOptions = formData.shippingOptions.filter((_, i) => i !== index);
                                        setFormData({ ...formData, shippingOptions: newOptions });
                                    }}
                                    className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all self-end sm:self-center mt-2 sm:mt-0"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xl shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:bg-primary-hover transition-all">
                {loading ? 'שומר שינויים...' : 'שמירת הגדרות חנות'}
            </button>
        </form>
    );
};

export default StoreSettings;
