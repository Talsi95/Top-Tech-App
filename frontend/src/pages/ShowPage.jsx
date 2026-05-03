import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaCartPlus, FaPlus, FaSave, FaTrashAlt } from 'react-icons/fa';
import { useAuth } from '../AuthContext';
import Loader from '../components/Loader';

/**
 * VideoItem Component.
 * Handles individual video rendering and autoplay when in view.
 */
const VideoItem = ({ video, index, isAdmin, onEdit, onDelete }) => {
    const [isVisible, setIsVisible] = useState(false);
    const videoRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting);
            },
            { threshold: 0.5 } // Trigger when 50% of the video is visible
        );

        if (videoRef.current) {
            observer.observe(videoRef.current);
        }

        return () => {
            if (videoRef.current) {
                observer.unobserve(videoRef.current);
            }
        };
    }, []);

    const videoId = video.url.split('v=')[1]?.split('&')[0];
    // Base URL without autoplay by default
    let embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?mute=1&rel=0` : video.url;

    // Append autoplay=1 ONLY when visible for YouTube
    if (isVisible && videoId) {
        embedUrl += embedUrl.includes('?') ? '&autoplay=1' : '?autoplay=1';
    }

    return (
        <div ref={videoRef} className="flex flex-col bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden group">
            <div className="relative aspect-video w-full bg-black">
                {isVisible && (
                    videoId ? (
                        <iframe
                            src={embedUrl}
                            title={video.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="absolute top-0 left-0 w-full h-full"
                        ></iframe>
                    ) : (
                        <video
                            src={video.url}
                            autoPlay
                            muted
                            controls
                            className="absolute top-0 left-0 w-full h-full object-cover"
                        />
                    )
                )}
                {!isVisible && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-gray-500">
                        <div className="animate-pulse">טוען סרטון...</div>
                    </div>
                )}
            </div>
            <div className="p-6 flex justify-between items-center bg-gray-50">
                <span className="text-2xl text-gray-700 truncate mr-2 font-normal">{video.title}</span>
                {isAdmin && (
                    <div className="flex gap-2">
                        <button onClick={() => onEdit(index)} className="text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors">עריכה</button>
                        <button onClick={() => onDelete(index)} className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors">מחיקה</button>
                    </div>
                )}
            </div>
            {video.description && video.description.trim() !== '' && (
                <div className="p-6 bg-white text-center border-t border-gray-100">
                    <p className="text-xl text-gray-600 font-normal leading-relaxed">
                        {video.description}
                    </p>
                </div>
            )}
        </div>
    );
};

/**
 * ShowPage Component.
 * Displays detailed information about a single product, including images, videos, specs, and variants.
 * 
 * @param {Object} props - Component props.
 * @param {Function} props.onAddToCart - Function to add the selected product variant to the cart.
 */
const ShowPage = ({ onAddToCart }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAdmin, getToken } = useAuth();
    const [product, setProduct] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedStorage, setSelectedStorage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasStorage, setHasStorage] = useState(false);

    const [newImages, setNewImages] = useState([{ url: '', description: '' }]);
    const [newVideos, setNewVideos] = useState([{ url: '', title: '', description: '' }]);
    const [newSpecs, setNewSpecs] = useState([{ key: '', value: '' }]);
    const [newLongDescription, setNewLongDescription] = useState('');

    const [isAddingImages, setIsAddingImages] = useState(false);
    const [isAddingVideos, setIsAddingVideos] = useState(false);
    const [isAddingSpecs, setIsAddingSpecs] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isAddingDescription, setIsAddingDescription] = useState(false);

    // Modal state for editing existing media
    const [editingMedia, setEditingMedia] = useState(null); // { type: 'image' | 'video', index, data }

    const handleDelete = async () => {
        if (!window.confirm(`האם אתה בטוח שברצונך למחוק את "${product.name}"?`)) return;
        try {
            await axios.delete(`${__API_URL__}/products/${product._id}`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            alert('המוצר נמחק בהצלחה');
            navigate('/');
        } catch (error) {
            alert('שגיאה במחיקת מוצר');
            console.error(error);
        }
    };

    /**
     * Fetches detailed product data based on the ID from the URL.
     */
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await axios.get(`${__API_URL__}/products/${id}`);
                const data = response.data;

                setProduct(data);
                setNewLongDescription(data.longDescription || '');

                if (data.variants && data.variants.length > 0) {
                    const productHasStorage = data.variants.some(v => v.storage && v.storage.trim() !== '');
                    setHasStorage(productHasStorage);

                    setSelectedColor(data.variants[0].color);

                    if (productHasStorage) {
                        setSelectedStorage(data.variants[0].storage);
                    } else {
                        setSelectedStorage(null);
                    }
                } else {
                    setSelectedVariant(data.variants?.[0] || null);
                }
            } catch (err) {
                setError("Failed to load product details.");
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    useEffect(() => {
        if (!product) return;

        let newVariant = null;

        if (hasStorage) {
            if (selectedColor && selectedStorage) {
                newVariant = product.variants.find(
                    v => v.color === selectedColor && v.storage === selectedStorage
                );
            }
        } else {
            if (selectedColor) {
                newVariant = product.variants.find(
                    v => v.color === selectedColor
                );
            } else if (product.variants.length === 1) {
                newVariant = product.variants[0];
            }
        }

        setSelectedVariant(newVariant || null);
    }, [selectedColor, selectedStorage, product, hasStorage]);



    const uniqueColors = product?.variants ? [...new Set(product.variants.map(v => v.color).filter(c => c))] : [];
    const uniqueStorage = hasStorage && product?.variants
        ? [...new Set(product.variants.map(v => v.storage).filter(s => s && s.trim() !== ''))]
        : [];

    const isCombinationValid = useCallback((color, storage) => {
        if (!product?.variants) return false;

        if (hasStorage) {
            return product.variants.some(v => v.color === color && v.storage === storage);
        } else {
            return product.variants.some(v => v.color === color);
        }
    }, [product, hasStorage]);

    const isOutOfStock = selectedVariant?.stock === 0;

    /**
     * Saves new content (images, videos, specs, description) to the product.
     * Restricted to admin users.
     */
    const handleSaveNewContent = async () => {
        if (!isAdmin || isSaving) return;

        const token = getToken();
        setIsSaving(true);

        const filteredNewImages = newImages.filter(img => img.url.trim() !== '');

        const updatedProduct = {
            ...product,
            additionalImages: [...(product.additionalImages || []), ...filteredNewImages],
            videos: [...(product.videos || []), ...newVideos],
            technicalSpecs: [...(product.technicalSpecs || []), ...newSpecs],
            longDescription: newLongDescription
        };

        try {
            await axios.put(`${__API_URL__}/products/${id}`, updatedProduct, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setProduct(prev => ({
                ...prev,
                ...updatedProduct
            }));

            setNewImages([{ url: '', description: '' }]);
            setNewVideos([{ url: '', title: '', description: '' }]);
            setNewSpecs([{ key: '', value: '' }]);
            setIsAddingImages(false);
            setIsAddingVideos(false);
            setIsAddingSpecs(false);
            setIsAddingDescription(false);

        } catch (error) {
            console.error('Error saving new content:', error);
            setError('Failed to save content. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteImage = async (imageIndex) => {
        if (!isAdmin || !window.confirm('האם אתה בטוח שברצונך למחוק תמונה זו?')) {
            return;
        }

        const token = getToken();

        const updatedImages = (product.additionalImages || []).filter((_, index) => index !== imageIndex);

        try {
            await axios.put(`${__API_URL__}/products/${id}`, { ...product, additionalImages: updatedImages }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setProduct(prev => ({
                ...prev,
                additionalImages: updatedImages
            }));
        } catch (error) {
            console.error('Error deleting image:', error);
            setError('Failed to delete image. Please try again.');
        }
    };

    const handleEditImage = (imageIndex) => {
        if (!isAdmin) return;
        const img = product.additionalImages[imageIndex];
        setEditingMedia({
            type: 'image',
            index: imageIndex,
            data: { url: img.url, description: img.description || '' }
        });
    };

    const handleDeleteVideo = async (videoIndex) => {
        if (!isAdmin || !window.confirm('האם למחוק סרטון זה?')) return;
        const updatedVideos = product.videos.filter((_, idx) => idx !== videoIndex);
        try {
            const token = getToken();
            await axios.put(`${__API_URL__}/products/${id}`, { ...product, videos: updatedVideos }, { headers: { Authorization: `Bearer ${token}` } });
            setProduct(prev => ({ ...prev, videos: updatedVideos }));
        } catch (err) {
            alert('שגיאה במחיקת סרטון');
        }
    };

    const handleEditVideo = (videoIndex) => {
        if (!isAdmin) return;
        const vid = product.videos[videoIndex];
        setEditingMedia({
            type: 'video',
            index: videoIndex,
            data: { url: vid.url, title: vid.title || '', description: vid.description || '' }
        });
    };

    const handleSaveEditMedia = async () => {
        if (!isAdmin || !editingMedia) return;

        const token = getToken();
        let updatedData = {};

        if (editingMedia.type === 'image') {
            const updatedImages = [...product.additionalImages];
            updatedImages[editingMedia.index] = editingMedia.data;
            updatedData = { additionalImages: updatedImages };
        } else {
            const updatedVideos = [...product.videos];
            updatedVideos[editingMedia.index] = editingMedia.data;
            updatedData = { videos: updatedVideos };
        }

        try {
            setIsSaving(true);
            await axios.put(`${__API_URL__}/products/${id}`, { ...product, ...updatedData }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProduct(prev => ({ ...prev, ...updatedData }));
            setEditingMedia(null);
        } catch (err) {
            alert('שגיאה בעדכון המדיה');
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddSpecField = () => {
        setNewSpecs([...newSpecs, { key: '', value: '' }]);
    };

    const handleSpecChange = (index, field, value) => {
        const updatedSpecs = [...newSpecs];
        updatedSpecs[index][field] = value;
        setNewSpecs(updatedSpecs);
    };

    const handleAddImageField = () => {
        setNewImages(prev => [...prev, { url: '', description: '' }]);
    };

    const handleNewImageChange = (index, field, value) => {
        const updatedImages = [...newImages];
        updatedImages[index][field] = value;
        setNewImages(updatedImages);
    };

    if (loading) return <Loader text="טוען מוצר" />;
    if (error) return <div className="text-center text-red-500 text-xl font-semibold mt-10">{error}</div>;

    const showVariantError = product?.variants?.length > 1 && !selectedVariant;

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-extrabold mb-8 text-center md:text-right text-gray-800 drop-shadow-sm">{product?.name}</h1>

            <div className="bg-white p-6 md:p-10 rounded-3xl shadow-2xl flex flex-col md:flex-row gap-10 border border-gray-100">
                {/* Product Image Section */}
                <div className="md:w-1/2 flex justify-center items-center bg-gray-50 rounded-2xl p-8 border border-gray-100">
                    <img src={selectedVariant?.imageUrl} alt={product?.name} className="max-h-[500px] object-contain drop-shadow-xl hover:scale-105 transition-transform duration-500" />
                </div>

                {/* Product Details, Variants, and Add to Cart Section */}
                <div className="md:w-1/2 flex flex-col justify-start">
                    <div className="flex-grow">
                        {selectedVariant ? (
                            <div className="flex flex-col items-start mb-8 pb-6 border-b border-gray-100">
                                {selectedVariant.isOnSale ? (
                                    <div className="flex flex-col">
                                        <span className="text-gray-400 line-through text-xl">₪{selectedVariant.price.toFixed(2)}</span>
                                        <span className="text-red-600 font-black text-4xl mt-1">₪{selectedVariant.salePrice.toFixed(2)}</span>
                                    </div>
                                ) : (
                                    <span className="text-gray-800 font-black text-4xl">₪{selectedVariant.price.toFixed(2)}</span>
                                )}
                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold mt-4 ${isOutOfStock ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200'}`}>
                                    <span className={`w-2 h-2 rounded-full mr-2 ml-1 ${isOutOfStock ? 'bg-red-500' : 'bg-green-500'}`}></span>
                                    {isOutOfStock ? 'אזל מהמלאי' : `זמין במלאי (${selectedVariant.stock})`}
                                </div>
                            </div>
                        ) : (
                            showVariantError && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm mb-6 border border-red-100">
                                    השילוב שבחרת אינו קיים. נא בחר שילוב אחר.
                                </div>
                            )
                        )}

                        <div className="mb-8 space-y-6">
                            {uniqueColors.length > 0 && (
                                <div>
                                    <span className="text-gray-800 font-bold block mb-3 text-lg">בחר צבע:</span>
                                    <div className="flex flex-wrap gap-3">
                                        {uniqueColors.map(color => (
                                            <button
                                                key={color}
                                                onClick={() => {
                                                    setSelectedColor(color);
                                                    const firstAvailableStorage = product.variants.find(v => v.color === color)?.storage;
                                                    if (firstAvailableStorage) {
                                                        setSelectedStorage(firstAvailableStorage);
                                                    }
                                                }}
                                                className={`px-5 py-2.5 rounded-xl border-2 font-medium transition-all duration-200 ${selectedColor === color
                                                    ? 'bg-sky-50 border-sky-500 text-sky-700 shadow-sm'
                                                    : 'bg-white border-gray-200 text-gray-700 hover:border-sky-300 hover:bg-gray-50'}`}
                                            >
                                                {color}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {hasStorage && uniqueStorage.length > 0 && (
                                <div>
                                    <span className="text-gray-800 font-bold block mb-3 text-lg">בחר נפח אחסון:</span>
                                    <div className="flex flex-wrap gap-3">
                                        {uniqueStorage.map(storage => {
                                            const isAvailable = isCombinationValid(selectedColor, storage);
                                            return (
                                                <button
                                                    key={storage}
                                                    onClick={() => setSelectedStorage(storage)}
                                                    disabled={!isAvailable}
                                                    className={`px-5 py-2.5 rounded-xl border-2 font-medium transition-all duration-200 
                                                        ${selectedStorage === storage && isAvailable
                                                            ? 'bg-sky-50 border-sky-500 text-sky-700 shadow-sm'
                                                            : 'bg-white border-gray-200 text-gray-700 hover:border-sky-300 hover:bg-gray-50'} 
                                                        ${!isAvailable ? 'opacity-40 cursor-not-allowed bg-gray-100 border-gray-100' : ''}`}
                                                >
                                                    {storage}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="pt-2">
                            <button
                                onClick={() => onAddToCart(product, selectedVariant)}
                                className={`w-full px-6 py-4 rounded-xl text-lg font-bold transition-all duration-300 flex items-center justify-center space-x-2 space-x-reverse shadow-lg
                                ${isOutOfStock || !selectedVariant
                                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-none'
                                        : 'bg-green-500 text-white hover:bg-green-600 hover:shadow-green-500/30 hover:-translate-y-0.5'}`}
                                disabled={isOutOfStock || !selectedVariant}
                            >
                                <FaCartPlus className="w-6 h-6" />
                                <span>{isOutOfStock ? 'אזל מהמלאי' : 'הוסף לעגלה'}</span>
                            </button>
                        </div>

                        {isAdmin && (
                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">פעולות מנהל</span>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => navigate(`/product-form/${product._id}`)}
                                        className="bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 font-bold py-2.5 px-3 rounded-lg text-sm transition-colors text-center"
                                    >
                                        עריכה
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 font-bold py-2.5 px-3 rounded-lg text-sm transition-colors text-center"
                                    >
                                        מחיקה
                                    </button>
                                    <button
                                        onClick={() => navigate(`/admin/update-variant/${product._id}`)}
                                        className="bg-sky-50 text-sky-600 hover:bg-sky-100 border border-sky-200 font-bold py-2.5 px-3 rounded-lg text-sm transition-colors text-center"
                                    >
                                        עדכון מלאי
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-8">
                {/* In-depth Description */}
                <div className="">
                    <h3 className="text-2xl font-bold mb-4 flex justify-between items-center">
                        {isAdmin && (
                            <button
                                onClick={() => setIsAddingDescription(!isAddingDescription)}
                                className={`transition-colors duration-300 ${isAddingDescription ? 'text-green-500' : 'text-gray-500 hover:text-green-500'}`}
                            >
                                <FaPlus className={isAddingDescription ? 'rotate-45' : ''} />
                            </button>
                        )}
                    </h3>
                    {isAddingDescription && isAdmin && (
                        <div className="mb-6 space-y-4 animate-in slide-in-from-top duration-300">
                            <textarea
                                value={newLongDescription}
                                onChange={(e) => setNewLongDescription(e.target.value)}
                                placeholder="הוסף תיאור מורחב למוצר..."
                                className="w-full px-5 py-4 border-2 border-gray-100 focus:border-green-500 rounded-2xl h-40 resize-none outline-none transition-all"
                            ></textarea>
                            <button
                                onClick={handleSaveNewContent}
                                disabled={isSaving}
                                className={`bg-green-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-green-600 transition-all ${isSaving ? 'opacity-50' : ''}`}
                            >
                                {isSaving ? 'שומר...' : 'שמור תיאור'}
                            </button>
                        </div>
                    )}
                    {!isAddingDescription && (
                        <p className="text-lg font-extrabold text-gray-800 leading-relaxed whitespace-pre-line text-center">
                            {product.longDescription || 'אין תיאור מורחב זמין.'}
                        </p>
                    )}
                </div>

                {/* Demo Videos */}
                <h3 className="text-3xl font-extrabold mb-6 flex justify-between items-center text-gray-800 border-b pb-4">
                    סרטוני הדגמה
                    {isAdmin && (
                        <button
                            onClick={() => setIsAddingVideos(!isAddingVideos)}
                            className={`transition-colors duration-300 p-2 rounded-full ${isAddingVideos ? 'bg-green-50 text-green-500' : 'bg-gray-50 text-gray-400 hover:text-green-500'}`}
                        >
                            <FaPlus className={`w-5 h-5 transition-transform ${isAddingVideos ? 'rotate-45' : ''}`} />
                        </button>
                    )}
                </h3>
                {isAddingVideos && isAdmin && (
                    <div className="mb-10 p-6 bg-white rounded-3xl border-2 border-dashed border-sky-100 animate-in slide-in-from-top duration-300">
                        <div className="space-y-4 mb-6">
                            {newVideos.map((vid, index) => (
                                <div key={index} className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <input
                                        type="text"
                                        placeholder="כתובת URL לסרטון (YouTube)"
                                        value={vid.url || ''}
                                        onChange={(e) => {
                                            const updated = [...newVideos];
                                            updated[index] = { ...updated[index], url: e.target.value };
                                            setNewVideos(updated);
                                        }}
                                        className="w-full px-4 py-3 border-2 border-sky-100 focus:border-sky-500 rounded-xl outline-none transition-colors"
                                    />
                                    <input
                                        type="text"
                                        placeholder="כותרת הסרטון"
                                        value={vid.title || ''}
                                        onChange={(e) => {
                                            const updated = [...newVideos];
                                            updated[index] = { ...updated[index], title: e.target.value };
                                            setNewVideos(updated);
                                        }}
                                        className="w-full px-4 py-3 border-2 border-sky-100 focus:border-sky-500 rounded-xl outline-none transition-colors"
                                    />
                                    <textarea
                                        placeholder="תיאור הסרטון (אופציונלי)"
                                        value={vid.description || ''}
                                        onChange={(e) => {
                                            const updated = [...newVideos];
                                            updated[index] = { ...updated[index], description: e.target.value };
                                            setNewVideos(updated);
                                        }}
                                        className="w-full px-4 py-3 border-2 border-sky-100 focus:border-sky-500 rounded-xl outline-none transition-colors resize-none h-24"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <button
                                onClick={() => setNewVideos([...newVideos, { url: '', title: '', description: '' }])}
                                className="bg-sky-50 text-sky-600 px-6 py-3 rounded-xl font-bold hover:bg-sky-100 transition-colors"
                            >
                                + הוסף סרטון נוסף
                            </button>
                            <button
                                onClick={handleSaveNewContent}
                                disabled={isSaving}
                                className={`bg-green-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-green-600 transition-all ${isSaving ? 'opacity-50' : ''}`}
                            >
                                {isSaving ? 'שומר...' : 'שמור סרטונים'}
                            </button>
                        </div>
                    </div>
                )}
                <div className="grid grid-cols-1 gap-12 mt-6">
                    {product?.videos?.map((video, index) => (
                        <VideoItem
                            key={index}
                            video={video}
                            index={index}
                            isAdmin={isAdmin}
                            onEdit={handleEditVideo}
                            onDelete={handleDeleteVideo}
                        />
                    ))}
                </div>
            </div>

            {/* Additional Images Gallery */}
            <div className="mt-16 bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
                <h3 className="text-3xl font-extrabold mb-6 flex justify-between items-center text-gray-800 border-b pb-4">
                    גלריית תמונות
                    {isAdmin && (
                        <button
                            onClick={() => setIsAddingImages(!isAddingImages)}
                            className={`transition-colors duration-300 p-2 rounded-full ${isAddingImages ? 'bg-green-50 text-green-500' : 'bg-gray-50 text-gray-400 hover:text-green-500'}`}
                        >
                            <FaPlus className={`w-5 h-5 transition-transform ${isAddingImages ? 'rotate-45' : ''}`} />
                        </button>
                    )}
                </h3>
                {isAddingImages && isAdmin && (
                    <div className="mb-10 p-6 bg-white rounded-3xl border-2 border-dashed border-sky-100 animate-in slide-in-from-top duration-300">
                        <div className="space-y-4 mb-6">
                            {newImages.map((img, index) => (
                                <div key={index} className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <input
                                        type="text"
                                        placeholder="כתובת URL לתמונה"
                                        value={img.url}
                                        onChange={(e) => handleNewImageChange(index, 'url', e.target.value)}
                                        className="w-full px-4 py-3 border-2 border-sky-100 focus:border-sky-500 rounded-xl outline-none transition-all"
                                    />
                                    <input
                                        type="text"
                                        placeholder="תיאור קצר לתמונה (אופציונלי)"
                                        value={img.description}
                                        onChange={(e) => handleNewImageChange(index, 'description', e.target.value)}
                                        className="w-full px-4 py-3 border-2 border-sky-100 focus:border-sky-500 rounded-xl outline-none transition-all"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <button
                                onClick={handleAddImageField}
                                className="bg-sky-50 text-sky-600 px-6 py-3 rounded-xl font-bold hover:bg-sky-100 transition-colors"
                            >
                                + הוסף תמונה נוספת
                            </button>
                            <button
                                onClick={handleSaveNewContent}
                                disabled={isSaving}
                                className={`bg-green-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-green-600 transition-all ${isSaving ? 'opacity-50' : ''}`}
                            >
                                {isSaving ? 'שומר...' : 'שמור תמונות'}
                            </button>
                        </div>
                    </div>
                )}
                {product?.additionalImages?.length > 0 && (
                    <div className="grid grid-cols-1 gap-16 mt-6">
                        {product.additionalImages.map((imgItem, index) => {
                            const imageUrl = imgItem.url;
                            const imageDescription = imgItem.description;

                            return (
                                <div key={index} className="flex flex-col bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden group hover:shadow-xl transition-shadow duration-300">
                                    <div className="relative w-full bg-gray-50 flex justify-center items-center overflow-hidden rounded-t-2xl">
                                        <img
                                            src={imageUrl}
                                            alt={imageDescription || `${product.name} ${index + 1}`}
                                            className="w-full max-h-[700px] object-contain group-hover:scale-[1.02] transition-transform duration-500"
                                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/800x600/eeeeee/282828?text=תמונה+חסרה'; }}
                                        />
                                        {isAdmin && (
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-center items-center gap-4">
                                                <button
                                                    onClick={() => handleEditImage(index)}
                                                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg shadow-lg transform -translate-y-2 group-hover:translate-y-0 transition-all duration-300"
                                                >
                                                    עריכה
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteImage(index)}
                                                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300"
                                                >
                                                    מחיקה
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    {imageDescription && imageDescription.trim() !== '' && (
                                        <div className="p-6 bg-white text-center">
                                            <h4 className="text-2xl text-gray-700 font-normal">
                                                {imageDescription}
                                            </h4>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
                {isAddingSpecs && (
                    <div className="mt-4 space-y-4 animate-in slide-in-from-top duration-300">
                        <div className="space-y-2">
                            {newSpecs.map((spec, index) => (
                                <div key={index} className="flex flex-col sm:flex-row gap-3 p-4 bg-gray-50 rounded-xl">
                                    <input
                                        type="text"
                                        placeholder="מפתח (לדוגמה: מעבד)"
                                        value={spec.key}
                                        onChange={(e) => handleSpecChange(index, 'key', e.target.value)}
                                        className="w-full px-4 py-2 border-2 border-gray-100 focus:border-sky-500 rounded-xl outline-none transition-all"
                                    />
                                    <input
                                        type="text"
                                        placeholder="ערך (לדוגמה: A17 Bionic)"
                                        value={spec.value}
                                        onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                                        className="w-full px-4 py-2 border-2 border-gray-100 focus:border-sky-500 rounded-xl outline-none transition-all"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <button
                                onClick={handleAddSpecField}
                                className="bg-sky-50 text-sky-600 px-6 py-3 rounded-xl font-bold hover:bg-sky-100 transition-colors"
                            >
                                + הוסף שדה נוסף
                            </button>
                            <button
                                onClick={handleSaveNewContent}
                                disabled={isSaving}
                                className={`bg-green-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-green-600 transition-all ${isSaving ? 'opacity-50' : ''}`}
                            >
                                {isSaving ? 'שומר...' : 'שמור מפרט'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal עריכת מדיה (תמונה/סרטון) */}
            {editingMedia && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 overflow-y-auto">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200" dir="rtl">
                        <div className="bg-sky-500 p-6 flex justify-between items-center text-white">
                            <h3 className="text-2xl font-bold">עריכת {editingMedia.type === 'image' ? 'תמונה' : 'סרטון'}</h3>
                            <button onClick={() => setEditingMedia(null)} className="hover:rotate-90 transition-transform duration-200">
                                <FaPlus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700 mr-1">כתובת URL</label>
                                <input
                                    type="text"
                                    value={editingMedia.data.url}
                                    onChange={(e) => setEditingMedia({ ...editingMedia, data: { ...editingMedia.data, url: e.target.value } })}
                                    className="w-full px-5 py-3 border-2 border-gray-100 focus:border-sky-500 rounded-2xl outline-none transition-all"
                                    placeholder="הכנס כתובת URL..."
                                />
                            </div>

                            {editingMedia.type === 'video' && (
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700 mr-1">כותרת הסרטון</label>
                                    <input
                                        type="text"
                                        value={editingMedia.data.title}
                                        onChange={(e) => setEditingMedia({ ...editingMedia, data: { ...editingMedia.data, title: e.target.value } })}
                                        className="w-full px-5 py-3 border-2 border-gray-100 focus:border-sky-500 rounded-2xl outline-none transition-all"
                                        placeholder="כותרת הסרטון..."
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700 mr-1">תיאור (אופציונלי)</label>
                                <textarea
                                    value={editingMedia.data.description}
                                    onChange={(e) => setEditingMedia({ ...editingMedia, data: { ...editingMedia.data, description: e.target.value } })}
                                    className="w-full px-5 py-3 border-2 border-gray-100 focus:border-sky-500 rounded-2xl outline-none transition-all resize-none h-32"
                                    placeholder="תיאור קצר..."
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={handleSaveEditMedia}
                                    disabled={isSaving}
                                    className={`flex-1 bg-green-500 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-green-600 transition-all ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isSaving ? 'שומר שינויים...' : 'שמור שינויים'}
                                </button>
                                <button
                                    onClick={() => setEditingMedia(null)}
                                    className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold text-lg hover:bg-gray-200 transition-all"
                                >
                                    ביטול
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default ShowPage;