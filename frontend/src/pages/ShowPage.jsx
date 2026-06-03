import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { ShoppingCart, Plus, Save, Trash2, ChevronLeft, ChevronRight, CheckCircle, Info, Video, Image as ImageIcon, Cpu, Import, Phone } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { useAuth } from '../AuthContext';
import { useStore } from '../StoreContext';
import Loader from '../components/Loader';
import ConfirmationModal from '../components/ConfirmationModal';
import ProductCard from '../components/ProductCard';
import useStoreNavigate from '../hooks/useStoreNavigate';
import StoreLink from '../components/StoreLink';
import { transformCloudinaryUrl, uploadVideoToCloudinary } from '../utils/cloudinary';

/**
 * VideoItem Component.
 */
const VideoItem = ({ video, index, isAdmin, onDelete, isFullWidth }) => {
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = useRef(null);
    const videoRef = useRef(null);

    const extractYouTubeId = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => setIsVisible(entry.isIntersecting),
            { threshold: 0.3 }
        );
        if (containerRef.current) observer.observe(containerRef.current);
        return () => { if (containerRef.current) observer.unobserve(containerRef.current); };
    }, []);

    useEffect(() => {
        if (!videoRef.current) return;

        if (isVisible) {
            videoRef.current.play().catch(err => console.log("Autoplay prevented:", err));
        } else {
            videoRef.current.pause();
        }
    }, [isVisible]);

    const isCloudinary = video.type === 'cloudinary' || (video.url && video.url.includes('cloudinary.com'));
    const videoId = !isCloudinary ? extractYouTubeId(video.url) : null;
    const isShorts = video.url && (video.url.includes('shorts/') || video.isVertical);
    const hasText = !!(video.title || video.description);

    let embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?mute=1&rel=0&controls=0&disablekb=1&iv_load_policy=3&modestbranding=1` : video.url;
    if (isVisible && videoId) embedUrl += embedUrl.includes('?') ? '&autoplay=1' : '?autoplay=1';

    const optimizedVideoUrl = isCloudinary ? transformCloudinaryUrl(video.url) : video.url;

    return (
        <div className={`group relative flex flex-col bg-white overflow-hidden transition-all duration-500 hover:shadow-2xl ${isFullWidth ? 'rounded-none border-x-0 shadow-none md:rounded-[2.5rem] md:border md:border-gray-50 md:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)]' : 'rounded-[2.5rem] border border-gray-50 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)]'}`}>
            <div ref={containerRef} className={`relative w-full bg-black flex items-center justify-center overflow-hidden ${isShorts ? 'aspect-[9/16]' : 'aspect-video'} ${hasText ? 'md:aspect-video' : 'md:aspect-auto md:flex-grow md:h-full'} ${isFullWidth ? 'p-0' : 'p-4'}`}>
                {isShorts && videoId && (
                    <div
                        className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-40 scale-125 transition-opacity duration-700 pointer-events-none"
                        style={{ backgroundImage: `url(https://img.youtube.com/vi/${videoId}/0.jpg)` }}
                    />
                )}
                {isShorts && <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none z-0" />}
                {isVisible && (
                    isCloudinary ? (
                        <video
                            ref={videoRef}
                            src={optimizedVideoUrl}
                            muted
                            loop
                            playsInline
                            className={`${isFullWidth || isShorts ? 'w-full h-full object-cover' : 'max-h-full max-w-full object-contain'} absolute top-0 left-0`} />) : videoId ?
                        isVisible && (
                            <iframe src={embedUrl}
                                title={video.title}
                                frameBorder="0"
                                allow="accelerometer;
                            autoplay;
                            encrypted-media;
                            gyroscope;
                            picture-in-picture"
                                className={isShorts
                                    ? "absolute inset-0 w-full h-full pointer-events-none md:relative md:h-full md:aspect-[9/16] md:max-w-full md:mx-auto md:object-cover md:z-10 md:shadow-2xl md:rounded-2xl"
                                    : "absolute top-0 left-0 w-full h-full pointer-events-none"
                                }
                            />
                        ) : (
                            <video src={video.url} autoPlay muted loop playsInline className={`${isFullWidth || isShorts ? 'w-full h-full object-cover' : 'max-h-full max-w-full object-contain'} absolute top-0 left-0 pointer-events-none`} />)
                )}
                {!isVisible && <div className="absolute inset-0 flex items-center justify-center bg-gray-900/10 backdrop-blur-xl text-gray-400">טוען סקירה...</div>}
                {isAdmin && (
                    <button onClick={() => onDelete(index)} className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-md text-red-500 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white shadow-xl">
                        <Trash2 size={18} />
                    </button>
                )}
            </div>
            {video.title && (
                <div className="p-8 flex justify-between items-center bg-white/80 backdrop-blur-md">
                    <h4 className="text-2xl font-black text-gray-900 tracking-tighter">
                        {video.title}
                    </h4>
                </div>
            )}
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
    const { id, productSlug } = useParams();
    const navigate = useStoreNavigate();
    const location = useLocation();
    const { isAdmin, getToken } = useAuth();
    const { store } = useStore();
    const isFullWidth = store?.features?.fullWidthCards;
    const [product, setProduct] = useState(location.state?.product || null);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [selectedAttributes, setSelectedAttributes] = useState({});
    const [loading, setLoading] = useState(!product);
    const [error, setError] = useState(null);
    const [variantFields, setVariantFields] = useState([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [selectedOptions, setSelectedOptions] = useState({});

    const [isAddingSpecs, setIsAddingSpecs] = useState(false);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [editedDescription, setEditedDescription] = useState('');
    const [newImages, setNewImages] = useState([{ url: '', description: '' }]);
    const [newVideos, setNewVideos] = useState([{ url: '', title: '', description: '' }]);
    const [primaryVideoType, setPrimaryVideoType] = useState('link');
    const [primaryVideoUrl, setPrimaryVideoUrl] = useState('');
    const [primaryVideoTitle, setPrimaryVideoTitle] = useState('');
    const [primaryVideoDescription, setPrimaryVideoDescription] = useState('');
    const [primaryVideoPublicId, setPrimaryVideoPublicId] = useState('');
    const [isUploadingVideo, setIsUploadingVideo] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [newSpecs, setNewSpecs] = useState([{ key: '', value: '' }]);
    const [isAddingImages, setIsAddingImages] = useState(false);
    const [isAddingVideos, setIsAddingVideos] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [relatedProducts, setRelatedProducts] = useState([]);

    // Confirmation States
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, onConfirm: null, title: '', message: '' });

    useEffect(() => {
        const param = productSlug || id;
        if (!param) return;

        const fetchProduct = async () => {
            try {
                const initializeVariants = (targetData) => {
                    if (targetData && targetData.variants?.length > 0) {
                        const standardFields = ['price', 'stock', 'imageUrl', 'imageUrls', 'isOnSale', 'salePrice', '_id', 'id', 'attributes', '__v'];
                        const hiddenFields = ['מותג', 'brand'];
                        const fields = new Set();

                        targetData.variants.forEach(v => {
                            Object.keys(v).forEach(key => {
                                if (!standardFields.includes(key) && !hiddenFields.includes(key) && v[key] !== undefined && v[key] !== null && String(v[key]).trim() !== '') {
                                    fields.add(key);
                                }
                            });
                        });

                        const sortedFields = Array.from(fields);
                        setVariantFields(sortedFields);

                        const initialAttrs = {};
                        sortedFields.forEach(f => { initialAttrs[f] = targetData.variants[0][f]; });
                        setSelectedAttributes(initialAttrs);
                    }
                };

                if (product) {
                    initializeVariants(product);
                    setEditedDescription(product.longDescription || '');
                    setPrimaryVideoType(product.video?.type || 'link');
                    setPrimaryVideoUrl(product.video?.url || '');
                    setPrimaryVideoTitle(product.video?.title || '');
                    setPrimaryVideoDescription(product.video?.description || '');
                    setPrimaryVideoPublicId(product.video?.public_id || '');
                    setLoading(false);
                }

                const category = product?.category;
                const productPromise = axios.get(`${__API_URL__}/products/${param}`);
                const relatedPromise = category
                    ? axios.get(`${__API_URL__}/products?category=${encodeURIComponent(category)}&limit=10`)
                    : null;

                if (relatedPromise) {
                    const [res, relatedRes] = await Promise.all([productPromise, relatedPromise]);
                    const data = res.data;

                    if (id && data.slug) {
                        navigate(`/products/${data.slug}`, { replace: true });
                        return;
                    }

                    setProduct(prev => {
                        if (prev) {
                            return {
                                ...prev,
                                ...data,
                                variants: data.variants
                            };
                        }
                        return data;
                    });
                    initializeVariants(data);
                    setEditedDescription(data.longDescription || '');
                    setPrimaryVideoType(data.video?.type || 'link');
                    setPrimaryVideoUrl(data.video?.url || '');
                    setPrimaryVideoTitle(data.video?.title || '');
                    setPrimaryVideoDescription(data.video?.description || '');
                    setPrimaryVideoPublicId(product.video?.public_id || '');

                    const filteredRelated = relatedRes.data.products
                        .filter(p => p._id !== data._id)
                        .slice(0, 4);
                    setRelatedProducts(filteredRelated);
                } else {
                    const res = await productPromise;
                    const data = res.data;

                    if (id && data.slug) {
                        navigate(`/products/${data.slug}`, { replace: true });
                        return;
                    }

                    setProduct(data);
                    initializeVariants(data);
                    setEditedDescription(data.longDescription || '');
                    setPrimaryVideoType(data.video?.type || 'link');
                    setPrimaryVideoUrl(data.video?.url || '');
                    setPrimaryVideoTitle(data.video?.title || '');
                    setPrimaryVideoDescription(data.video?.description || '');
                    setPrimaryVideoPublicId(product.video?.public_id || '');

                    const relatedRes = await axios.get(`${__API_URL__}/products?category=${encodeURIComponent(data.category)}&limit=10`);
                    const filteredRelated = relatedRes.data.products
                        .filter(p => p._id !== data._id)
                        .slice(0, 4);
                    setRelatedProducts(filteredRelated);
                }
            } catch (err) {
                console.error(err);
                setError("Failed to load product details.");
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id, productSlug]);

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

    const handleVideoUpload = async (file) => {
        if (!file) return;
        setIsUploadingVideo(true);
        setError('');
        setUploadProgress(0);

        try {
            const { secure_url, public_id } = await uploadVideoToCloudinary(file, (percent) => {
                setUploadProgress(percent);
                console.log(`העלאה בתהליך: ${percent}%`);
            });

            await axios.put(
                `${__API_URL__}/products/${product?._id}`,
                {
                    videos: [...(product.videos || []), { url: secure_url, public_id: public_id, type: 'cloudinary' }]

                },
                { headers: { 'Authorization': `Bearer ${getToken()}` } }
            );

            setPrimaryVideoUrl(secure_url);
            setPrimaryVideoPublicId(public_id);
            setPrimaryVideoType('cloudinary');

        } catch (err) {
            console.error('Direct upload process failed:', err);
            setError(err.response?.data?.message || 'שגיאה בתהליך העלאת הסרטון.');
        } finally {
            setIsUploadingVideo(false);
        }
    };

    // const handleVideoUpload = async (file) => {
    //     if (!file) return;
    //     setIsUploadingVideo(true);
    //     const formData = new FormData();
    //     formData.append('video', file);
    //     try {
    //         const res = await axios.post(`${__API_URL__}/products/upload-video`, formData, {
    //             headers: {
    //                 'Content-Type': 'multipart/form-data',
    //                 'Authorization': `Bearer ${getToken()}`
    //             }
    //         });

    //         console.log("Response from server:", res.data);
    //         if (res.data && res.data.secure_url) {
    //             setPrimaryVideoUrl(res.data.secure_url);
    //             setPrimaryVideoPublicId(res.data.public_id || '');
    //             setPrimaryVideoType('cloudinary');
    //         } else {
    //             setError('Failed to upload video');
    //         }
    //     } catch (err) {
    //         console.error('Upload failed:', err);
    //         setError(err.response?.data?.message || 'שגיאה בהעלאת הסרטון.');
    //     } finally {
    //         setIsUploadingVideo(false);
    //     }
    // };

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
            await axios.put(`${__API_URL__}/products/${product._id}`, updatedProduct, { headers: { Authorization: `Bearer ${getToken()}` } });
            setProduct(updatedProduct);
            setNewImages([{ url: '', description: '' }]);
            setNewVideos([{ url: '', title: '', description: '', type: 'link' }]);
            setNewSpecs([{ key: '', value: '' }]);
            setIsAddingImages(false); setIsAddingVideos(false); setIsAddingSpecs(false); setIsEditingDescription(false);
        } catch (error) { setError('Failed to save content.'); }
        finally { setIsSaving(false); }
    };

    if (loading) return <Loader subtext="אנא המתן" />;
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

    const productPrice = selectedVariant
        ? (selectedVariant.isOnSale ? selectedVariant.salePrice : selectedVariant.price)
        : 0;

    const schemaData = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.name,
        "image": images.length > 0 ? images : [product.imageUrl || '/top-tech.svg'],
        "description": product.longDescription || product.description || "",
        "offers": {
            "@type": "Offer",
            "priceCurrency": "ILS",
            "price": productPrice,
            "availability": selectedVariant && selectedVariant.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
        }
    };

    return (
        <div className="max-w-[1440px] mx-auto px-6 py-12" dir="rtl">
            <Helmet>
                <title>{`${product.name} | ${store?.name || 'Top Tech'}`}</title>
                <script type="application/ld+json">
                    {JSON.stringify(schemaData)}
                </script>
            </Helmet>
            {/* Main Product Showcase */}
            <div className="bg-white rounded-[3rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border border-gray-50 overflow-hidden flex flex-col lg:flex-row gap-12 p-8 lg:p-16 mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* Product Name for Mobile View */}
                <h1 className="block lg:hidden text-3xl font-black text-gray-900 tracking-tighter mb-2 leading-tight text-right w-full">{product.name}</h1>

                {/* Visual Section */}
                <div className="lg:w-1/2 flex flex-col items-center">
                    <div className={`relative group w-full aspect-[4/5] lg:aspect-square bg-gray-50/50 rounded-[2.5rem] flex items-center justify-center ${isFullWidth ? 'p-0' : 'p-4 lg:p-8'} overflow-hidden`}>
                        {images.length > 0 && (
                            <>
                                <img
                                    src={images[currentImageIndex]}
                                    alt={product.name}
                                    className={`${isFullWidth ? 'w-full h-full object-cover' : 'max-h-full max-w-full object-contain'} transform group-hover:scale-105 transition-transform duration-700`}
                                />
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
                                    <img src={img} alt="thumbnail" className={`w-full h-full ${isFullWidth ? 'object-cover' : 'object-contain p-1'}`} />
                                </button>
                            ))}
                        </div>
                    )}
                </div>


                {/* Details Section */}
                <div className="lg:w-1/2 flex flex-col text-right">
                    <div className="flex-1">
                        <h1 className="hidden lg:block text-3xl lg:text-3xl font-black text-gray-900 tracking-tighter mb-4 leading-none">{product.name}</h1>


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
                                    <StoreLink
                                        to={`/products?category=${encodeURIComponent(product.category)}&subcategory=${encodeURIComponent(product.subcategory)}`}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-50 text-gray-600 rounded-2xl font-black text-sm hover:bg-primary hover:text-white transition-all shadow-sm border border-gray-100 hover:border-primary"
                                    >
                                        <span>{product.subcategory}</span>
                                        <ChevronLeft size={16} />
                                    </StoreLink>
                                </div>
                            )}

                            {/* Product Options / Add-ons */}
                            {product.options?.length > 0 && (
                                <div className="pt-6 border-t border-gray-50 space-y-6">
                                    {product.options.map((opt, oi) => (
                                        <div key={oi}>
                                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{opt.name}</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {opt.choices.map((choice, ci) => {
                                                    const optionKey = `${opt.name}::${choice.name}`;
                                                    const isSelected = !!selectedOptions[optionKey];
                                                    return (
                                                        <button
                                                            key={ci}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedOptions(prev => {
                                                                    const next = { ...prev };
                                                                    if (isSelected) {
                                                                        delete next[optionKey];
                                                                    } else {
                                                                        next[optionKey] = { name: opt.name, choice: choice.name, priceAddition: choice.priceAddition || 0 };
                                                                    }
                                                                    return next;
                                                                });
                                                            }}
                                                            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all border-2 ${isSelected
                                                                ? 'bg-primary/10 border-primary text-primary'
                                                                : 'bg-white border-gray-100 text-gray-800 hover:border-primary/30'
                                                                }`}
                                                        >
                                                            {choice.name}
                                                            {choice.priceAddition > 0 && (
                                                                <span className="mr-1 text-xs font-black text-gray-400">+₪{choice.priceAddition}</span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {selectedVariant && (
                        <div className="mb-8">
                            {(() => {
                                const optionsTotal = Object.values(selectedOptions).reduce((sum, opt) => sum + (opt.priceAddition || 0), 0);
                                const basePrice = selectedVariant.isOnSale ? selectedVariant.salePrice : selectedVariant.price;
                                const totalPrice = basePrice + optionsTotal;
                                return (
                                    <>
                                        {selectedVariant.isOnSale ? (
                                            <div className="flex items-center gap-4">
                                                <span className="text-2xl font-black text-primary">₪{totalPrice.toFixed(2)}</span>
                                                <span className="text-xl font-bold text-gray-300 line-through">₪{selectedVariant.price.toFixed(2)}</span>
                                                <div className="bg-red-50 text-red-500 px-3 py-1 rounded-full text-xs font-black uppercase">SALE</div>
                                            </div>
                                        ) : (
                                            <span className="text-2xl font-black text-gray-900 tracking-tight">₪{totalPrice.toFixed(2)}</span>
                                        )}
                                        {optionsTotal > 0 && (
                                            <p className="text-xs text-gray-400 mt-1">כולל תוספות: +₪{optionsTotal.toFixed(2)}</p>
                                        )}
                                    </>
                                );
                            })()}
                            {store?.features?.showStock !== false && (
                                <div className={`flex items-center gap-2 mt-4 font-bold ${selectedVariant.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    <div className={`w-2 h-2 rounded-full ${selectedVariant.stock > 0 ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                    <span>{selectedVariant.stock > 0 ? `זמין במלאי (${selectedVariant.stock} יח')` : 'אזל מהמלאי'}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {(store?.features?.hasCart && (store?.businessInfo?.whatsapp || store?.businessInfo?.phone)) && (
                        <div className="mb-6 p-4 bg-gray-50/70 rounded-2xl border border-gray-100/80 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-300">
                            <span className="text-sm font-bold text-gray-600">יש לכם שאלה על מוצר זה?</span>
                            <div className="flex items-center gap-2.5 w-full sm:w-auto">
                                {store?.businessInfo?.whatsapp && (
                                    <a
                                        href={`https://wa.me/${store?.businessInfo?.whatsapp}?text=${encodeURIComponent(`היי, יש לי שאלה לגבי המוצר: ${product.name}${selectedVariant ? ` (${variantFields.map(f => `${f}: ${selectedVariant[f]}`).join(', ')})` : ''}`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-[#25D366]/5 border border-gray-200 hover:border-[#25D366] text-[#25D366] rounded-xl text-sm font-black transition-all shadow-sm"
                                    >
                                        <FaWhatsapp size={18} />
                                        <span>ווטסאפ</span>
                                    </a>
                                )}
                                {store?.businessInfo?.phone && (
                                    <a
                                        href={`tel:${store?.businessInfo?.phone}`}
                                        className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 rounded-xl text-sm font-black transition-all shadow-sm"
                                    >
                                        <Phone size={15} className="text-gray-500" />
                                        <span>שיחה</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                    {store?.features?.hasCart ? (
                        <button
                            onClick={() => {
                                const optionsTotal = Object.values(selectedOptions).reduce((sum, opt) => sum + (opt.priceAddition || 0), 0);
                                const selectedOptionsList = Object.values(selectedOptions);
                                onAddToCart(product, selectedVariant, selectedOptionsList, optionsTotal);
                            }}
                            disabled={!selectedVariant || (store?.features?.showStock !== false && selectedVariant.stock === 0)}
                            aria-label="הוסף לסל הקניות"
                            className="w-full py-4 md:py-6 bg-primary text-white rounded-2xl md:rounded-[2rem] font-black text-base md:text-xl shadow-2xl shadow-primary/30 hover:bg-primary-hover hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:bg-gray-100 disabled:text-gray-300 disabled:shadow-none disabled:scale-100"
                        >
                            <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />
                            <span>{store?.features?.showStock !== false && selectedVariant?.stock === 0 ? 'אזל מהמלאי' : 'הוסף לסל הקניות'}</span>
                        </button>
                    ) : (
                        <a
                            href={`https://wa.me/${store?.businessInfo?.whatsapp}?text=${encodeURIComponent(`היי, אני מעוניין במוצר: ${product.name}${selectedVariant ? ` (${variantFields.map(f => `${f}: ${selectedVariant[f]}`).join(', ')})` : ''}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="וואטסאפ"
                            className="w-full py-4 md:py-6 bg-[#25D366] text-white rounded-2xl md:rounded-[2rem] font-black text-base md:text-xl shadow-2xl shadow-[#25D366]/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
                        >
                            <FaWhatsapp className="w-6 h-6 md:w-7 md:h-7" />
                            <span>{store?.labels?.contactUsLabel || 'צור קשר בוואטסאפ'}</span>
                        </a>
                    )}

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
                            {/* <h2 className="text-3xl font-black text-gray-900 tracking-tighter">תיאור המוצר</h2> */}
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
                                                    await axios.put(`${__API_URL__}/products/${product._id}`, updated, { headers: { Authorization: `Bearer ${getToken()}` } });
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

                {/* Review Section — only render if there's actual content, or admin who can add */}
                {(product.video?.url || product.videos?.length > 0 || product.additionalImages?.length > 0 || isAdmin) && (
                    <div className={`bg-white transition-all duration-500 ${isFullWidth ? '-mx-6 px-0 py-6 rounded-none border-x-0 shadow-none md:mx-0 md:px-8 md:py-8 md:rounded-[3.5rem] md:border md:border-gray-50 md:shadow-sm' : 'rounded-[3.5rem] border border-gray-50 shadow-sm p-8 lg:p-16'}`}>
                        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 ${isFullWidth ? 'px-6 md:px-0' : ''}`}>
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
                            <div className={`grid grid-cols-1 ${isFullWidth ? 'grid-cols-1 gap-12' : 'md:grid-cols-2 gap-12'}`}>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-black">{isAddingVideos ? 'הוספת סרטונים לסקירה' : 'הוספת תמונות לסקירה'}</h3>
                                    {isAddingImages && (
                                        <button
                                            onClick={() => setNewImages([...newImages, { url: '', description: '' }])}
                                            className="p-3 bg-white text-primary rounded-xl border border-primary/20 hover:bg-primary/5 transition-all flex items-center gap-2 font-bold"
                                        >
                                            <Plus size={18} />
                                            <span>הוסף שורה נוספת</span>
                                        </button>
                                    )}
                                    {isAddingVideos && (
                                        <button
                                            onClick={() => setNewVideos([...newVideos, { url: '', title: '', description: '', type: 'link' }])}
                                            className="p-3 bg-white text-primary rounded-xl border border-primary/20 hover:bg-primary/5 transition-all flex items-center gap-2 font-bold"
                                        >
                                            <Plus size={18} />
                                            <span>הוסף שורה נוספת</span>
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-6">
                                    {isAddingVideos && newVideos.map((vid, idx) => (
                                        <div key={idx} className="flex flex-col gap-4 p-6 bg-white rounded-3xl border border-gray-100 shadow-sm relative group">
                                            {newVideos.length > 1 && (
                                                <button
                                                    onClick={() => setNewVideos(newVideos.filter((_, i) => i !== idx))}
                                                    className="absolute -left-2 -top-2 w-8 h-8 bg-white shadow-lg text-red-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:text-red-500 z-10"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}

                                            {/* Row header */}
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">סרטון {idx + 1}</p>

                                            {/* Toggle link / upload */}
                                            <div className="flex gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updated = [...newVideos];
                                                        updated[idx] = { ...updated[idx], type: 'link', url: '' };
                                                        setNewVideos(updated);
                                                    }}
                                                    className={`flex-1 py-3 rounded-2xl font-black text-sm transition-all border ${(!vid.type || vid.type === 'link')
                                                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                                        : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    הדבקת קישור (YouTube/Vimeo)
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updated = [...newVideos];
                                                        updated[idx] = { ...updated[idx], type: 'cloudinary', url: '' };
                                                        setNewVideos(updated);
                                                    }}
                                                    className={`flex-1 py-3 rounded-2xl font-black text-sm transition-all border ${vid.type === 'cloudinary'
                                                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                                        : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    העלאת קובץ מהמכשיר
                                                </button>
                                            </div>

                                            {/* Link input */}
                                            {(!vid.type || vid.type === 'link') && (
                                                <input
                                                    type="text"
                                                    placeholder="הדבק כאן את כתובת ה-URL של הסרטון..."
                                                    value={vid.url}
                                                    onChange={e => {
                                                        const updated = [...newVideos];
                                                        updated[idx] = { ...updated[idx], url: e.target.value };
                                                        setNewVideos(updated);
                                                    }}
                                                    className="p-4 bg-gray-50 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 font-bold transition-all border border-gray-100 animate-in fade-in duration-200"
                                                />
                                            )}

                                            {/* File upload */}
                                            {vid.type === 'cloudinary' && (
                                                <div className="animate-in fade-in duration-200">
                                                    {vid.url ? (
                                                        <div className="flex items-center justify-between p-4 bg-green-50 border border-green-100 rounded-2xl text-green-800">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                                                    <CheckCircle size={16} />
                                                                </div>
                                                                <span className="font-bold text-sm">הסרטון הועלה בהצלחה!</span>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const updated = [...newVideos];
                                                                    updated[idx] = { ...updated[idx], url: '' };
                                                                    setNewVideos(updated);
                                                                }}
                                                                className="px-4 py-2 bg-white hover:bg-red-50 text-red-500 border border-red-100 rounded-xl text-xs font-bold transition-all"
                                                            >
                                                                הסר
                                                            </button>
                                                        </div>
                                                    ) : isUploadingVideo ? (
                                                        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 border border-dashed border-gray-200 rounded-2xl gap-4">
                                                            <div className="relative w-12 h-12">
                                                                <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                                                                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                            </div>
                                                            <span className="text-sm font-bold text-gray-500 animate-pulse">מעלה סרטון...</span>
                                                            {uploadProgress > 0 && (
                                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                                    <div className="bg-primary h-2 rounded-full transition-all duration-100" style={{ width: `${uploadProgress}%` }}></div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="relative group/dropzone flex flex-col items-center justify-center p-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl hover:bg-gray-100/50 hover:border-primary/40 transition-all cursor-pointer">
                                                            <input
                                                                type="file"
                                                                accept="video/mp4,video/quicktime,video/webm"
                                                                onChange={async e => {
                                                                    const file = e.target.files[0];
                                                                    if (!file) return;
                                                                    setIsUploadingVideo(true);
                                                                    setUploadProgress(0);
                                                                    try {
                                                                        const { secure_url, public_id } = await uploadVideoToCloudinary(file, p => setUploadProgress(p));
                                                                        const updated = [...newVideos];
                                                                        updated[idx] = { ...updated[idx], url: secure_url, public_id, type: 'cloudinary' };
                                                                        setNewVideos(updated);
                                                                    } catch (err) {
                                                                        setError('שגיאה בהעלאת הסרטון.');
                                                                    } finally {
                                                                        setIsUploadingVideo(false);
                                                                    }
                                                                }}
                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                            />
                                                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 group-hover/dropzone:scale-110 transition-transform">
                                                                <Plus size={24} />
                                                            </div>
                                                            <span className="text-sm font-black text-gray-700 mb-1">לחץ להעלאת קובץ סרטון</span>
                                                            <span className="text-xs text-gray-400 font-bold">MP4, MOV, WebM</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Title & Description */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t border-gray-100 text-right">
                                                <input
                                                    type="text"
                                                    placeholder="כותרת הסרטון (אופציונלי)"
                                                    value={vid.title}
                                                    onChange={e => {
                                                        const updated = [...newVideos];
                                                        updated[idx] = { ...updated[idx], title: e.target.value };
                                                        setNewVideos(updated);
                                                    }}
                                                    className="p-4 bg-gray-50 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 font-bold transition-all border border-gray-100 text-right"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="תיאור קצר (אופציונלי)"
                                                    value={vid.description}
                                                    onChange={e => {
                                                        const updated = [...newVideos];
                                                        updated[idx] = { ...updated[idx], description: e.target.value };
                                                        setNewVideos(updated);
                                                    }}
                                                    className="p-4 bg-gray-50 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 font-bold transition-all border border-gray-100 text-right"
                                                />
                                            </div>
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
                            {product.video?.url && (
                                <VideoItem
                                    video={{
                                        url: product.video.url,
                                        type: product.video.type || 'link',
                                        title: product.video.title || 'סרטון סקירת מוצר ראשי',
                                        description: product.video.description || 'סרטון סקירה שהועלה על ידי בעל החנות'
                                    }}
                                    isFullWidth={isFullWidth}
                                    isAdmin={isAdmin}
                                    onDelete={() => openConfirm(
                                        'מחיקת סרטון ראשי',
                                        'האם אתה בטוח שברצונך למחוק את הסרטון הראשי של המוצר?',
                                        async () => {
                                            const updated = {
                                                ...product,
                                                video: { type: 'link', url: '', public_id: '' }
                                            };
                                            await axios.put(`${__API_URL__}/products/${product._id}`, updated, { headers: { Authorization: `Bearer ${getToken()}` } });
                                            setProduct(updated);
                                            setPrimaryVideoUrl('');
                                            setPrimaryVideoPublicId('');
                                            setPrimaryVideoTitle('');
                                            setPrimaryVideoDescription('');
                                        }
                                    )}
                                />
                            )}
                            {product.videos?.map((vid, i) => (
                                <VideoItem
                                    key={i}
                                    video={vid}
                                    index={i}
                                    isFullWidth={isFullWidth}
                                    isAdmin={isAdmin}
                                    onDelete={() => openConfirm(
                                        'מחיקת סרטון',
                                        `האם אתה בטוח שברצונך למחוק את הסרטון "${vid.title}"? פעולה זו אינה ניתנת לביטול.`,
                                        async () => {
                                            const updated = { ...product, videos: product.videos.filter((_, idx) => idx !== i) };
                                            await axios.put(`${__API_URL__}/products/${product._id}`, updated, { headers: { Authorization: `Bearer ${getToken()}` } });
                                            setProduct(updated);
                                        }
                                    )}
                                />
                            ))}
                            {product.additionalImages?.map((img, i) => (
                                <div key={i} className={`group relative overflow-hidden transition-all duration-500 flex flex-col bg-white ${isFullWidth ? 'rounded-none border-x-0 shadow-none md:rounded-[2.5rem] md:border md:border-gray-50 md:shadow-sm' : 'rounded-[2.5rem] border border-gray-50 shadow-sm hover:shadow-2xl'}`}>
                                    <div className={`relative overflow-hidden aspect-video bg-gray-50/50 flex items-center justify-center ${isFullWidth ? 'p-0' : 'p-4'}`}>
                                        <img
                                            src={img.url}
                                            alt="Review"
                                            className={`${isFullWidth ? 'w-full h-full object-cover' : 'max-h-full max-w-full object-contain'} transform group-hover:scale-110 transition-transform duration-700`}
                                        />
                                        {isAdmin && (
                                            <button
                                                onClick={() => openConfirm(
                                                    'מחיקת תמונה',
                                                    'האם אתה בטוח שברצונך למחוק תמונה זו מהסקירה? פעולה זו אינה ניתנת לביטול.',
                                                    async () => {
                                                        const updated = { ...product, additionalImages: product.additionalImages.filter((_, idx) => idx !== i) };
                                                        await axios.put(`${__API_URL__}/products/${product._id}`, updated, { headers: { Authorization: `Bearer ${getToken()}` } });
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

                {/* Add Spec admin button — always visible to admin, outside the specs section */}
                {isAdmin && !isAddingSpecs && (
                    <div className="flex justify-end">
                        <button onClick={() => setIsAddingSpecs(true)} className="px-5 py-2.5 bg-gray-50 text-gray-500 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-primary hover:text-white transition-all">
                            <Plus size={16} />
                            <span>הוסף מפרט טכני</span>
                        </button>
                    </div>
                )}

                {/* Technical Specs — only render if there are specs, or admin is actively adding */}
                {(product.technicalSpecs?.length > 0 || (isAdmin && isAddingSpecs)) && (
                    <div className="max-w-5xl mx-auto">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"><Cpu size={24} /></div>
                                <h2 className="text-4xl font-black text-gray-900 tracking-tighter">{store?.labels?.technicalSpecs || "מפרט טכני"}</h2>
                            </div>
                        </div>

                        {isAdmin && isAddingSpecs && (
                            <div className="mb-12 p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 animate-in fade-in zoom-in-95 duration-500 text-right" dir="rtl">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-black">הוספת מפרט טכני</h3>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                const rawText = prompt("הדבק כאן את המפרט הטכני המלא (שורות מופרדות בנקודתיים או מקף):");
                                                if (!rawText) return;

                                                const parsedSpecs = rawText
                                                    .split('\n')
                                                    .map(line => line.trim())
                                                    .filter(line => line.length > 0)
                                                    .map(line => {
                                                        const match = line.match(/^([^:-]+)[: -](.+)$/);
                                                        if (match) {
                                                            return { key: match[1].trim(), value: match[2].trim() };
                                                        }
                                                        return { key: line, value: '' };
                                                    });

                                                if (parsedSpecs.length > 0) {
                                                    if (newSpecs.length === 1 && !newSpecs[0].key && !newSpecs[0].value) {
                                                        setNewSpecs(parsedSpecs);
                                                    } else {
                                                        setNewSpecs([...newSpecs, ...parsedSpecs]);
                                                    }
                                                }
                                            }}
                                            className="p-3 bg-white text-green-600 rounded-xl border border-green-200 hover:bg-green-50 transition-all flex items-center gap-2 font-bold"
                                        >
                                            <Import size={18} />
                                            <span>ייבוא מהיר (הדבקה)</span>
                                        </button>

                                        <button
                                            onClick={() => setNewSpecs([...newSpecs, { key: '', value: '' }])}
                                            className="p-3 bg-white text-primary rounded-xl border border-primary/20 hover:bg-primary/5 transition-all flex items-center gap-2 font-bold"
                                        >
                                            <Plus size={18} />
                                            <span>הוסף שורה</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {newSpecs.map((spec, idx) => (
                                        <div key={idx} className="grid grid-cols-2 gap-4 relative group p-2">
                                            <input
                                                placeholder="שם הפרמטר"
                                                value={spec.key}
                                                onChange={e => { const s = [...newSpecs]; s[idx].key = e.target.value; setNewSpecs(s); }}
                                                className="p-4 bg-white rounded-xl border border-gray-100 outline-none focus:border-primary font-bold text-right"
                                            />
                                            <input
                                                placeholder="ערך"
                                                value={spec.value}
                                                onChange={e => { const s = [...newSpecs]; s[idx].value = e.target.value; setNewSpecs(s); }}
                                                className="p-4 bg-white rounded-xl border border-gray-100 outline-none focus:border-primary font-bold text-right"
                                            />
                                            {newSpecs.length > 1 && (
                                                <button
                                                    onClick={() => setNewSpecs(newSpecs.filter((_, i) => i !== idx))}
                                                    className="absolute -left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white shadow-lg text-red-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:text-red-500"
                                                >
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
                                                            await axios.put(`${__API_URL__}/products/${product._id}`, updated, { headers: { Authorization: `Bearer ${getToken()}` } });
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
