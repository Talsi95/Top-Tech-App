import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ShoppingCart, Plus, Save, Trash2, ChevronLeft, ChevronRight, CheckCircle, Info, Video, Image as ImageIcon, Cpu } from 'lucide-react';
import { useAuth } from '../AuthContext';
import Loader from '../components/Loader';
import ConfirmationModal from '../components/ConfirmationModal';
import ProductCard from '../components/ProductCard';

/**
 * VideoItem Component.
 */
const VideoItem = ({ video, index, isAdmin, onDelete }) => {
    const [isVisible, setIsVisible] = useState(false);
    const videoRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => setIsVisible(entry.isIntersecting),
            { threshold: 0.5 }
        );
        if (videoRef.current) observer.observe(videoRef.current);
        return () => { if (videoRef.current) observer.unobserve(videoRef.current); };
    }, []);

    const videoId = video.url.split('v=')[1]?.split('&')[0];
    let embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?mute=1&rel=0&controls=0&disablekb=1&iv_load_policy=3&modestbranding=1` : video.url;
    if (isVisible && videoId) embedUrl += embedUrl.includes('?') ? '&autoplay=1' : '?autoplay=1';

    return (
        <div ref={videoRef} className="group relative flex flex-col bg-white rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border border-gray-50 overflow-hidden transition-all duration-500 hover:shadow-2xl">
            <div className="relative aspect-video w-full bg-black overflow-hidden">
                {isVisible && (
                    videoId ? (
                        <iframe src={embedUrl} title={video.title} frameBorder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" className="absolute top-0 left-0 w-full h-full pointer-events-none" />
                    ) : (
                        <video src={video.url} autoPlay muted loop playsInline className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none" />
                    )
                )}
                {!isVisible && <div className="absolute inset-0 flex items-center justify-center bg-gray-900/10 backdrop-blur-xl text-gray-400">טוען סקירה...</div>}
                {isAdmin && (
                    <button onClick={() => onDelete(index)} className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-md text-red-500 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white shadow-xl">
                        <Trash2 size={18} />
                    </button>
                )}
            </div>
            <div className="p-8 flex justify-between items-center bg-white/80 backdrop-blur-md">
                <h4 className="text-2xl font-black text-gray-900 tracking-tighter">{video.title}</h4>
            </div>
            {video.description && (
                <div className="px-8 pb-8 bg-white/80 backdrop-blur-md">
                    <p className="text-lg text-gray-500 font-medium leading-relaxed">{video.description}</p>
                </div>
            )}
        </div>
    );
};

/**
 * ShowPage Component.
 */
const ShowPage = ({ onAddToCart }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAdmin, getToken } = useAuth();
    const [product, setProduct] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [selectedAttributes, setSelectedAttributes] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [variantFields, setVariantFields] = useState([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const [isAddingSpecs, setIsAddingSpecs] = useState(false);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [editedDescription, setEditedDescription] = useState('');
    const [newImages, setNewImages] = useState([{ url: '', description: '' }]);
    const [newVideos, setNewVideos] = useState([{ url: '', title: '', description: '' }]);
    const [newSpecs, setNewSpecs] = useState([{ key: '', value: '' }]);
    const [isAddingImages, setIsAddingImages] = useState(false);
    const [isAddingVideos, setIsAddingVideos] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [relatedProducts, setRelatedProducts] = useState([]);

    // Confirmation States
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, onConfirm: null, title: '', message: '' });

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await axios.get(`${__API_URL__}/products/${id}`);
                const data = response.data;
                setProduct(data);
                setEditedDescription(data.longDescription || '');

                // Fetch Related Products
                const relatedResponse = await axios.get(`${__API_URL__}/products?category=${encodeURIComponent(data.category)}&limit=10`);
                const filteredRelated = relatedResponse.data.products
                    .filter(p => p._id !== id)
                    .slice(0, 4);
                setRelatedProducts(filteredRelated);

                if (data.variants?.length > 0) {
                    const standardFields = ['price', 'stock', 'imageUrl', 'imageUrls', 'isOnSale', 'salePrice', '_id', 'id', 'attributes', '__v'];
                    const hiddenFields = ['מותג', 'brand'];
                    const fields = new Set();
                    data.variants.forEach(v => {
                        Object.keys(v).forEach(key => {
                            if (!standardFields.includes(key) && !hiddenFields.includes(key) && v[key] !== undefined && v[key] !== null && String(v[key]).trim() !== '') {
                                fields.add(key);
                            }
                        });
                    });
                    const sortedFields = Array.from(fields);
                    setVariantFields(sortedFields);
                    const initialAttrs = {};
                    sortedFields.forEach(f => { initialAttrs[f] = data.variants[0][f]; });
                    setSelectedAttributes(initialAttrs);
                }
            } catch (err) { setError("Failed to load product details."); }
            finally { setLoading(false); }
        };
        fetchProduct();
    }, [id]);

    useEffect(() => {
        if (!product?.variants) return;
        const newVariant = product.variants.find(v => variantFields.every(field => String(v[field]) === String(selectedAttributes[field])));
        setSelectedVariant(newVariant || null);
        setCurrentImageIndex(0);
    }, [selectedAttributes, product, variantFields]);

    const getUniqueValuesForField = (field) => {
        if (!product?.variants) return [];
        return [...new Set(product.variants.map(v => v[field]).filter(val => val))];
    };

    const isOptionAvailable = (field, value) => {
        if (!product?.variants) return false;
        return product.variants.some(v => String(v[field]) === String(value));
    };

    const handleAttributeClick = (field, value) => {
        const newAttributes = { ...selectedAttributes, [field]: value };

        let bestMatch = null;
        let highestScore = -1;

        product.variants.forEach(v => {
            if (String(v[field]) !== String(value)) return;

            let score = 0;
            variantFields.forEach(f => {
                if (String(v[f]) === String(newAttributes[f])) score++;
            });

            if (score > highestScore) {
                highestScore = score;
                bestMatch = v;
            }
        });

        if (bestMatch) {
            const updatedAttrs = {};
            variantFields.forEach(f => { updatedAttrs[f] = bestMatch[f]; });
            setSelectedAttributes(updatedAttrs);
        }
    };

    const openConfirm = (title, message, onConfirm) => {
        setConfirmConfig({ isOpen: true, title, message, onConfirm: () => { onConfirm(); setConfirmConfig({ ...confirmConfig, isOpen: false }); } });
    };

    const handleSaveNewContent = async () => {
        if (!isAdmin || isSaving) return;
        setIsSaving(true);
        const updatedProduct = {
            ...product,
            additionalImages: [...(product.additionalImages || []), ...newImages.filter(img => img.url.trim() !== '')],
            videos: [...(product.videos || []), ...newVideos.filter(vid => vid.url.trim() !== '')],
            technicalSpecs: [...(product.technicalSpecs || []), ...newSpecs.filter(spec => spec.key.trim() !== '')],
            longDescription: isEditingDescription ? editedDescription : product.longDescription
        };
        try {
            await axios.put(`${__API_URL__}/products/${id}`, updatedProduct, { headers: { Authorization: `Bearer ${getToken()}` } });
            setProduct(updatedProduct);
            setNewImages([{ url: '', description: '' }]);
            setNewVideos([{ url: '', title: '', description: '' }]);
            setNewSpecs([{ key: '', value: '' }]);
            setIsAddingImages(false); setIsAddingVideos(false); setIsAddingSpecs(false); setIsEditingDescription(false);
        } catch (error) { setError('Failed to save content.'); }
        finally { setIsSaving(false); }
    };

    if (loading) return <Loader text="טוען חוויה..." />;
    if (error) return <div className="min-h-[60vh] flex items-center justify-center text-red-500 text-2xl font-black">{error}</div>;

    // Smart Gallery Logic: Fallback to variants with same visual attributes if current one lacks images
    const getVariantImages = () => {
        if (!selectedVariant) return [];

        let variantImages = selectedVariant.imageUrls?.filter(img => img) || [];
        if (variantImages.length === 0 && selectedVariant.imageUrl) variantImages = [selectedVariant.imageUrl];

        // If we only have 1 image, check if other variants of the same color have more
        if (variantImages.length <= 1 && variantFields.includes('color')) {
            const sameColorVariants = product.variants.filter(v =>
                String(v.color) === String(selectedVariant.color) &&
                (v.imageUrls?.length > variantImages.length || v.imageUrl)
            );

            if (sameColorVariants.length > 0) {
                // Pick the one with the most images
                const bestMatch = sameColorVariants.reduce((prev, current) =>
                    ((current.imageUrls?.length || 0) > (prev.imageUrls?.length || 0)) ? current : prev
                );
                variantImages = bestMatch.imageUrls?.filter(img => img) || [bestMatch.imageUrl];
            }
        }

        return variantImages;
    };

    const images = getVariantImages();

    return (
        <div className="max-w-[1440px] mx-auto px-6 py-12" dir="rtl">
            {/* Main Product Showcase */}
            <div className="bg-white rounded-[3rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border border-gray-50 overflow-hidden flex flex-col lg:flex-row gap-12 p-8 lg:p-16 mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* Visual Section */}
                <div className="lg:w-1/2 flex flex-col items-center">
                    <div className="relative group w-full aspect-[4/5] lg:aspect-square bg-gray-50/50 rounded-[2.5rem] flex items-center justify-center p-4 lg:p-8 overflow-hidden">
                        {images.length > 0 && (
                            <>
                                <img src={images[currentImageIndex]} alt={product.name} className="max-h-full max-w-full object-contain transform group-hover:scale-105 transition-transform duration-700" />
                                {images.length > 1 && (
                                    <div className="absolute inset-0 flex items-center justify-between px-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                        <button onClick={() => setCurrentImageIndex(prev => (prev - 1 + images.length) % images.length)} className="w-12 h-12 flex items-center justify-center bg-white shadow-xl rounded-full text-gray-900 hover:bg-primary hover:text-white transition-all"><ChevronRight size={24} /></button>
                                        <button onClick={() => setCurrentImageIndex(prev => (prev + 1) % images.length)} className="w-12 h-12 flex items-center justify-center bg-white shadow-xl rounded-full text-gray-900 hover:bg-primary hover:text-white transition-all"><ChevronLeft size={24} /></button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    {images.length > 1 && (
                        <div className="flex gap-3 mt-8 overflow-x-auto pb-2 max-w-full no-scrollbar">
                            {images.map((img, idx) => (
                                <button key={idx} onClick={() => setCurrentImageIndex(idx)} className={`flex-shrink-0 w-20 h-20 rounded-2xl border-2 overflow-hidden transition-all ${currentImageIndex === idx ? 'border-primary shadow-lg shadow-primary/10' : 'border-gray-100 opacity-60 hover:opacity-100'}`}>
                                    <img src={img} alt="thumbnail" className="w-full h-full object-contain p-1" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Details Section */}
                <div className="lg:w-1/2 flex flex-col text-right">
                    <div className="flex-1">
                        <h1 className="text-5xl lg:text-6xl font-black text-gray-900 tracking-tighter mb-4 leading-none">{product.name}</h1>

                        {selectedVariant && (
                            <div className="mb-8">
                                {selectedVariant.isOnSale ? (
                                    <div className="flex items-center gap-4">
                                        <span className="text-5xl font-black text-primary">₪{selectedVariant.salePrice.toFixed(2)}</span>
                                        <span className="text-2xl font-bold text-gray-300 line-through">₪{selectedVariant.price.toFixed(2)}</span>
                                        <div className="bg-red-50 text-red-500 px-3 py-1 rounded-full text-xs font-black uppercase">SALE</div>
                                    </div>
                                ) : (
                                    <span className="text-5xl font-black text-gray-900 tracking-tight">₪{selectedVariant.price.toFixed(2)}</span>
                                )}
                                <div className={`flex items-center gap-2 mt-4 font-bold ${selectedVariant.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    <div className={`w-2 h-2 rounded-full ${selectedVariant.stock > 0 ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                    <span>{selectedVariant.stock > 0 ? `זמין במלאי (${selectedVariant.stock} יח')` : 'אזל מהמלאי'}</span>
                                </div>
                            </div>
                        )}

                        {/* Variant Selection */}
                        <div className="space-y-8 mb-12">
                            {variantFields.map(field => {
                                const values = getUniqueValuesForField(field);
                                return values.length > 1 && (
                                    <div key={field}>
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">בחר {field === 'color' ? 'צבע' : field === 'storage' ? 'נפח' : field}</h3>
                                        <div className="flex flex-wrap gap-3">
                                            {values.map(val => {
                                                const isSelected = String(selectedAttributes[field]) === String(val);
                                                // Check if this option exists in ANY variant
                                                const exists = isOptionAvailable(field, val);

                                                return (
                                                    <button
                                                        key={val}
                                                        onClick={() => handleAttributeClick(field, val)}
                                                        className={`px-6 py-3 rounded-2xl font-black transition-all border-2 ${isSelected
                                                                ? 'bg-primary/10 border-primary text-primary'
                                                                : exists
                                                                    ? 'bg-white border-gray-100 text-gray-900 hover:border-primary/20 hover:text-primary'
                                                                    : 'bg-gray-50 border-gray-100 text-gray-300 pointer-events-none'
                                                            }`}
                                                    >
                                                        {val}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Subcategory Link */}
                            {product.subcategory && (
                                <div className="pt-6 border-t border-gray-50">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">קטגוריה</h3>
                                    <Link 
                                        to={`/products?category=${encodeURIComponent(product.category)}&subcategory=${encodeURIComponent(product.subcategory)}`}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-50 text-gray-600 rounded-2xl font-black text-sm hover:bg-primary hover:text-white transition-all shadow-sm border border-gray-100 hover:border-primary"
                                    >
                                        <span>{product.subcategory}</span>
                                        <ChevronLeft size={16} />
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    <button onClick={() => onAddToCart(product, selectedVariant)} disabled={!selectedVariant || selectedVariant.stock === 0} className="w-full py-6 bg-primary text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-primary/30 hover:bg-primary-hover hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:bg-gray-100 disabled:text-gray-300 disabled:shadow-none disabled:scale-100">
                        <ShoppingCart size={24} />
                        <span>{selectedVariant?.stock === 0 ? 'אזל מהמלאי' : 'הוסף לסל הקניות'}</span>
                    </button>

                    {isAdmin && (
                        <div className="flex flex-col gap-2 mt-6">
                            <div className="flex gap-2">
                                <button onClick={() => navigate(`/product-form/${product._id}`)} className="flex-1 py-3 bg-gray-50 text-gray-600 rounded-xl font-bold hover:bg-primary hover:text-white transition-all">עריכת מוצר</button>
                                <button onClick={() => navigate(`/admin/update-variant/${product._id}`)} className="flex-1 py-3 bg-gray-50 text-gray-600 rounded-xl font-bold hover:bg-primary hover:text-white transition-all">מלאי ווריאציות</button>
                            </div>
                            <button 
                                onClick={() => openConfirm(
                                    'מחיקת מוצר',
                                    `האם אתה בטוח שברצונך למחוק את המוצר "${product.name}"? פעולה זו תמחוק את כל הווריאציות והמדיה של המוצר לצמיתות.`,
                                    async () => {
                                        try {
                                            await axios.delete(`${__API_URL__}/products/${product._id}`, {
                                                headers: { Authorization: `Bearer ${getToken()}` }
                                            });
                                            navigate('/');
                                        } catch (err) {
                                            console.error('Failed to delete product', err);
                                            alert('מחיקת המוצר נכשלה');
                                        }
                                    }
                                )}
                                className="w-full py-3 bg-red-50 text-red-500 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                            >
                                <Trash2 size={18} />
                                <span>מחיקת מוצר לצמיתות</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Tabs / Sections */}
            <div className="space-y-24">
                {/* Long Description */}
                {(isAdmin || product.longDescription) && (
                    <div className="max-w-4xl mx-auto text-center px-6">
                        <div className="flex items-center justify-center gap-4 mb-8">
                            <h2 className="text-3xl font-black text-gray-900 tracking-tighter">תיאור המוצר</h2>
                            {isAdmin && !isEditingDescription && (
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => { setEditedDescription(product.longDescription || ''); setIsEditingDescription(true); }}
                                        className="p-2 text-gray-400 hover:text-primary transition-colors"
                                    >
                                        <Plus size={20} />
                                    </button>
                                    {product.longDescription && (
                                        <button 
                                            onClick={() => openConfirm(
                                                'מחיקת תיאור',
                                                'האם אתה בטוח שברצונך למחוק את התיאור המורחב? פעולה זו אינה ניתנת לביטול.',
                                                async () => {
                                                    const updated = { ...product, longDescription: '' };
                                                    await axios.put(`${__API_URL__}/products/${id}`, updated, { headers: { Authorization: `Bearer ${getToken()}` } });
                                                    setProduct(updated);
                                                    setEditedDescription('');
                                                }
                                            )}
                                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {isAdmin && isEditingDescription ? (
                            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
                                <textarea
                                    value={editedDescription}
                                    onChange={(e) => setEditedDescription(e.target.value)}
                                    placeholder="הזן תיאור מורחב למוצר..."
                                    className="w-full min-h-[200px] p-6 bg-gray-50 rounded-[2rem] border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 font-medium text-lg leading-relaxed text-gray-700 transition-all"
                                />
                                <div className="flex justify-center gap-3">
                                    <button onClick={handleSaveNewContent} disabled={isSaving} className="px-8 py-3 bg-primary text-white rounded-xl font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                                        {isSaving ? 'שומר...' : 'שמור תיאור'}
                                    </button>
                                    <button onClick={() => setIsEditingDescription(false)} className="px-8 py-3 bg-white text-gray-400 rounded-xl font-bold hover:text-gray-600 transition-all">ביטול</button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xl text-gray-500 font-medium leading-relaxed whitespace-pre-line">
                                {product.longDescription || (isAdmin && 'לחץ על הפלוס כדי להוסיף תיאור מורחב...')}
                            </p>
                        )}
                    </div>
                )}

                {/* Review Section */}
                {(isAdmin || (product.videos?.length > 0) || (product.additionalImages?.length > 0)) && (
                    <div className="bg-white p-8 lg:p-16 rounded-[3.5rem] shadow-sm border border-gray-50">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"><Video size={24} /></div>
                                <h2 className="text-4xl font-black text-gray-900 tracking-tighter">סקירה מלאה</h2>
                            </div>
                            {isAdmin && (
                                <div className="flex flex-wrap gap-3">
                                    <button onClick={() => setIsAddingVideos(true)} className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-black transition-all shadow-lg shadow-black/10">
                                        <Plus size={18} />
                                        <span>הוסף סרטון</span>
                                    </button>
                                    <button onClick={() => setIsAddingImages(true)} className="px-6 py-3 bg-gray-50 text-gray-600 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-100 transition-all">
                                        <Plus size={18} />
                                        <span>הוסף תמונה</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Inline Admin Forms for Media */}
                        {isAdmin && (isAddingVideos || isAddingImages) && (
                            <div className="mb-12 p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 animate-in fade-in zoom-in-95 duration-500">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-black">הוספת תוכן חדש</h3>
                                    <button
                                        onClick={() => {
                                            if (isAddingVideos) setNewVideos([...newVideos, { url: '', title: '', description: '' }]);
                                            if (isAddingImages) setNewImages([...newImages, { url: '', description: '' }]);
                                        }}
                                        className="p-3 bg-white text-primary rounded-xl border border-primary/20 hover:bg-primary/5 transition-all flex items-center gap-2 font-bold"
                                    >
                                        <Plus size={18} />
                                        <span>הוסף שורה נוספת</span>
                                    </button>
                                </div>
                                <div className="space-y-6">
                                    {isAddingVideos && newVideos.map((vid, idx) => (
                                        <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white rounded-2xl border border-gray-50 relative group">
                                            <input placeholder="כותרת הסרטון" value={vid.title} onChange={e => { const v = [...newVideos]; v[idx].title = e.target.value; setNewVideos(v); }} className="p-4 bg-gray-50 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 font-bold transition-all" />
                                            <input placeholder="URL (YouTube/Direct)" value={vid.url} onChange={e => { const v = [...newVideos]; v[idx].url = e.target.value; setNewVideos(v); }} className="p-4 bg-gray-50 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 font-bold transition-all" />
                                            <input placeholder="תיאור קצר" value={vid.description} onChange={e => { const v = [...newVideos]; v[idx].description = e.target.value; setNewVideos(v); }} className="p-4 bg-gray-50 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 font-bold transition-all" />
                                            {newVideos.length > 1 && (
                                                <button onClick={() => setNewVideos(newVideos.filter((_, i) => i !== idx))} className="absolute -left-2 -top-2 w-8 h-8 bg-white shadow-lg text-red-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:text-red-500">
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {isAddingImages && newImages.map((img, idx) => (
                                        <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-2xl border border-gray-50 relative group">
                                            <input placeholder="URL התמונה" value={img.url} onChange={e => { const i = [...newImages]; i[idx].url = e.target.value; setNewImages(i); }} className="p-4 bg-gray-50 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 font-bold transition-all" />
                                            <input placeholder="תיאור התמונה" value={img.description} onChange={e => { const i = [...newImages]; i[idx].description = e.target.value; setNewImages(i); }} className="p-4 bg-gray-50 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 font-bold transition-all" />
                                            {newImages.length > 1 && (
                                                <button onClick={() => setNewImages(newImages.filter((_, i) => i !== idx))} className="absolute -left-2 -top-2 w-8 h-8 bg-white shadow-lg text-red-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:text-red-500">
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-3 mt-8">
                                    <button onClick={handleSaveNewContent} disabled={isSaving} className="px-8 py-3 bg-primary text-white rounded-xl font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
                                        {isSaving ? 'שומר...' : 'שמור הכל'}
                                    </button>
                                    <button onClick={() => { setIsAddingVideos(false); setIsAddingImages(false); setNewVideos([{ url: '', title: '', description: '' }]); setNewImages([{ url: '', description: '' }]); }} className="px-8 py-3 bg-white text-gray-400 rounded-xl font-bold hover:text-gray-600 transition-all">ביטול</button>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {product.videos?.map((vid, i) => (
                                <VideoItem
                                    key={i}
                                    video={vid}
                                    index={i}
                                    isAdmin={isAdmin}
                                    onDelete={() => openConfirm(
                                        'מחיקת סרטון',
                                        `האם אתה בטוח שברצונך למחוק את הסרטון "${vid.title}"? פעולה זו אינה ניתנת לביטול.`,
                                        async () => {
                                            const updated = { ...product, videos: product.videos.filter((_, idx) => idx !== i) };
                                            await axios.put(`${__API_URL__}/products/${id}`, updated, { headers: { Authorization: `Bearer ${getToken()}` } });
                                            setProduct(updated);
                                        }
                                    )}
                                />
                            ))}
                            {product.additionalImages?.map((img, i) => (
                                <div key={i} className="group relative rounded-[2.5rem] overflow-hidden border border-gray-50 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col bg-white">
                                    <div className="relative overflow-hidden aspect-video">
                                        <img src={img.url} alt="Review" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        {isAdmin && (
                                            <button
                                                onClick={() => openConfirm(
                                                    'מחיקת תמונה',
                                                    'האם אתה בטוח שברצונך למחוק תמונה זו מהסקירה? פעולה זו אינה ניתנת לביטול.',
                                                    async () => {
                                                        const updated = { ...product, additionalImages: product.additionalImages.filter((_, idx) => idx !== i) };
                                                        await axios.put(`${__API_URL__}/products/${id}`, updated, { headers: { Authorization: `Bearer ${getToken()}` } });
                                                        setProduct(updated);
                                                    }
                                                )}
                                                className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-md text-red-500 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white shadow-xl"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                    {img.description && (
                                        <div className="p-8 bg-white/50 backdrop-blur-md border-t border-gray-50">
                                            <p className="text-lg text-gray-500 font-medium leading-relaxed">{img.description}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Technical Specs */}
                {(isAdmin || (product.technicalSpecs?.length > 0)) && (
                    <div className="max-w-5xl mx-auto">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"><Cpu size={24} /></div>
                                <h2 className="text-4xl font-black text-gray-900 tracking-tighter">מפרט טכני</h2>
                            </div>
                            {isAdmin && (
                                <button onClick={() => setIsAddingSpecs(true)} className="px-6 py-3 bg-gray-50 text-gray-600 rounded-xl font-bold flex items-center gap-2 hover:bg-primary hover:text-white transition-all">
                                    <Plus size={18} />
                                    <span>הוסף מפרט</span>
                                </button>
                            )}
                        </div>

                        {isAdmin && isAddingSpecs && (
                            <div className="mb-12 p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 animate-in fade-in zoom-in-95 duration-500">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-black">הוספת מפרט טכני</h3>
                                    <button
                                        onClick={() => setNewSpecs([...newSpecs, { key: '', value: '' }])}
                                        className="p-3 bg-white text-primary rounded-xl border border-primary/20 hover:bg-primary/5 transition-all flex items-center gap-2 font-bold"
                                    >
                                        <Plus size={18} />
                                        <span>הוסף שורה</span>
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {newSpecs.map((spec, idx) => (
                                        <div key={idx} className="grid grid-cols-2 gap-4 relative group p-2">
                                            <input placeholder="שם הפרמטר" value={spec.key} onChange={e => { const s = [...newSpecs]; s[idx].key = e.target.value; setNewSpecs(s); }} className="p-4 bg-white rounded-xl border border-gray-100 outline-none focus:border-primary font-bold" />
                                            <input placeholder="ערך" value={spec.value} onChange={e => { const s = [...newSpecs]; s[idx].value = e.target.value; setNewSpecs(s); }} className="p-4 bg-white rounded-xl border border-gray-100 outline-none focus:border-primary font-bold" />
                                            {newSpecs.length > 1 && (
                                                <button onClick={() => setNewSpecs(newSpecs.filter((_, i) => i !== idx))} className="absolute -left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white shadow-lg text-red-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:text-red-500">
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-3 mt-8">
                                    <button onClick={handleSaveNewContent} disabled={isSaving} className="px-8 py-3 bg-primary text-white rounded-xl font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">שמור מפרט</button>
                                    <button onClick={() => { setIsAddingSpecs(false); setNewSpecs([{ key: '', value: '' }]); }} className="px-8 py-3 bg-white text-gray-400 rounded-xl font-bold hover:text-gray-600 transition-all">ביטול</button>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {product.technicalSpecs?.length > 0 ? (
                                product.technicalSpecs.map((spec, i) => (
                                    <div key={i} className="flex items-center justify-between p-6 bg-white rounded-2xl border border-gray-50 hover:border-primary/20 transition-all group relative">
                                        <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">{spec.key}</span>
                                        <div className="flex items-center gap-4">
                                            <span className="text-gray-900 font-black tracking-tight group-hover:text-primary transition-colors">{spec.value}</span>
                                            {isAdmin && (
                                                <button
                                                    onClick={() => openConfirm(
                                                        'מחיקת מפרט',
                                                        `האם אתה בטוח שברצונך למחוק את "${spec.key}"?`,
                                                        async () => {
                                                            const updated = { ...product, technicalSpecs: product.technicalSpecs.filter((_, idx) => idx !== i) };
                                                            await axios.put(`${__API_URL__}/products/${id}`, updated, { headers: { Authorization: `Bearer ${getToken()}` } });
                                                            setProduct(updated);
                                                        }
                                                    )}
                                                    className="w-8 h-8 flex items-center justify-center text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:text-red-500"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full py-12 text-center bg-gray-50/50 rounded-[2.5rem] border border-dashed border-gray-100">
                                    <p className="text-gray-400 font-bold text-lg">אין כרגע נתונים להצגה</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            {/* Related Products */}
            {relatedProducts.length > 0 && (
                <div className="mt-32 pt-24 border-t border-gray-100">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-black text-gray-900 tracking-tighter mb-4">מוצרים נוספים שיכולים לעניין אותך</h2>
                            <p className="text-gray-500 font-medium text-lg">במיוחד עבורך - מוצרים משלימים ודגמים נוספים</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {relatedProducts.map(relProduct => (
                                <ProductCard key={relProduct._id} product={relProduct} />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={confirmConfig.isOpen}
                onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
                onConfirm={confirmConfig.onConfirm}
                title={confirmConfig.title}
                message={confirmConfig.message}
            />
        </div>
    );
};

export default ShowPage;