import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { FaCartPlus, FaPlus, FaSave, FaTrashAlt } from 'react-icons/fa';
import { useAuth } from '../AuthContext';

const ShowPage = ({ onAddToCart }) => {
    const { id } = useParams();
    const { isAdmin, getToken } = useAuth();
    const [product, setProduct] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedStorage, setSelectedStorage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasStorage, setHasStorage] = useState(false);

    const [newImages, setNewImages] = useState([{ url: '', description: '' }]);
    const [newVideos, setNewVideos] = useState([]);
    const [newSpecs, setNewSpecs] = useState([{ key: '', value: '' }]);
    const [newLongDescription, setNewLongDescription] = useState('');

    const [isAddingImages, setIsAddingImages] = useState(false);
    const [isAddingVideos, setIsAddingVideos] = useState(false);
    const [isAddingSpecs, setIsAddingSpecs] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isAddingDescription, setIsAddingDescription] = useState(false);

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

    const handleSaveNewContent = async () => {
        if (!isAdmin || isSaving) return;

        const token = getToken();
        setIsSaving(true);

        const filteredNewImages = newImages.filter(img => img.url.trim() !== '');

        const updatedProduct = {
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
            setNewVideos([]);
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
            await axios.put(`${__API_URL__}/products/${id}`, { additionalImages: updatedImages }, {
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

    if (loading) return <div className="text-center text-xl font-semibold mt-10">טוען מוצר...</div>;
    if (error) return <div className="text-center text-red-500 text-xl font-semibold mt-10">{error}</div>;

    const showVariantError = product?.variants?.length > 1 && !selectedVariant;

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-center md:text-right">{product?.name}</h1>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Product Image and Description Section */}
                <div className="md:w-1/2 flex flex-col">
                    <div className="bg-white p-4 rounded-lg shadow-md mb-4 flex justify-center items-center">
                        <img src={selectedVariant?.imageUrl} alt={product?.name} className="max-h-96 object-contain rounded-lg" />
                    </div>
                </div>

                {/* Product Details, Variants, and Add to Cart Section */}
                <div className="md:w-1/2 flex flex-col justify-start">
                    <div className="bg-white p-6 rounded-lg shadow-md flex-grow">
                        {selectedVariant ? (
                            <div className="flex flex-col items-start mb-4">
                                {selectedVariant.isOnSale ? (
                                    <div className="flex flex-col">
                                        <span className="text-gray-400 line-through text-lg">₪{selectedVariant.price.toFixed(2)}</span>
                                        <span className="text-red-600 font-bold text-3xl">₪{selectedVariant.salePrice.toFixed(2)}</span>
                                    </div>
                                ) : (
                                    <span className="text-gray-800 font-bold text-3xl">₪{selectedVariant.price.toFixed(2)}</span>
                                )}
                                <span className={`text-sm font-semibold mt-2 ${isOutOfStock ? 'text-red-500' : 'text-green-500'}`}>
                                    {isOutOfStock ? 'אזל מהמלאי' : `במלאי: ${selectedVariant.stock}`}
                                </span>
                            </div>
                        ) : (
                            showVariantError && (
                                <div className="text-red-500 text-sm mt-4">השילוב שבחרת אינו קיים. נא בחר שילוב אחר.</div>
                            )
                        )}

                        <div className="mb-6">
                            {uniqueColors.length > 0 && (
                                <div className="mb-4">
                                    <span className="text-gray-700 font-semibold block mb-2">צבע:</span>
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
                                            className={`px-4 py-2 rounded-md border transition-colors mr-2 ${selectedColor === color ? 'bg-sky-500 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                                        >
                                            {color}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {hasStorage && uniqueStorage.length > 0 && (
                                <div className="mb-4">
                                    <span className="text-gray-700 font-semibold block mb-2">נפח:</span>
                                    {uniqueStorage.map(storage => {
                                        const isAvailable = isCombinationValid(selectedColor, storage);
                                        return (
                                            <button
                                                key={storage}
                                                onClick={() => setSelectedStorage(storage)}
                                                disabled={!isAvailable}
                                                className={`px-4 py-2 rounded-md border transition-colors mr-2 ${selectedStorage === storage && isAvailable ? 'bg-sky-500 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'} ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                {storage}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => onAddToCart(product, selectedVariant)}
                            className={`w-full mt-4 px-6 py-3 rounded-md transition-colors duration-300 flex items-center justify-center space-x-2 
                            ${isOutOfStock || !selectedVariant ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'}`}
                            disabled={isOutOfStock || !selectedVariant}
                        >
                            <FaCartPlus className="w-5 h-5" />
                            <span>{isOutOfStock ? 'אזל מהמלאי' : 'הוסף לעגלה'}</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-8">
                {/* In-depth Description */}
                <div className="bg-white p-6 rounded-lg shadow-md col-span-full">
                    <h3 className="text-2xl font-bold mb-4 flex justify-between items-center">
                        תיאור מורחב
                        {isAdmin && (
                            <button
                                onClick={() => setIsAddingDescription(!isAddingDescription)}
                                className="text-gray-500 hover:text-green-500 transition-colors duration-300"
                            >
                                <FaPlus />
                            </button>
                        )}
                    </h3>
                    {isAddingDescription ? (
                        <textarea
                            value={newLongDescription}
                            onChange={(e) => setNewLongDescription(e.target.value)}
                            placeholder="הוסף תיאור מורחב למוצר..."
                            className="w-full px-3 py-2 border rounded-md h-40 resize-none"
                        ></textarea>
                    ) : (
                        <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                            {product.longDescription || 'אין תיאור מורחב זמין.'}
                        </p>
                    )}
                </div>

                {/* Demo Videos */}
                <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-2xl font-bold mb-4 flex justify-between items-center">
                        סרטוני הדגמה
                        {isAdmin && (
                            <button onClick={() => setIsAddingVideos(!isAddingVideos)} className="text-gray-500 hover:text-green-500 transition-colors duration-300">
                                <FaPlus />
                            </button>
                        )}
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                        {product?.videos?.map((video, index) => {
                            const videoId = video.url.split('v=')[1]?.split('&')[0];
                            const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0` : video.url;

                            return (
                                <div key={index} className="relative aspect-video w-full rounded-lg overflow-hidden shadow-lg">
                                    <iframe
                                        src={embedUrl}
                                        title={video.title}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className="absolute top-0 left-0 w-full h-full"
                                    ></iframe>
                                </div>
                            );
                        })}
                    </div>
                    {isAddingVideos && (
                        <div className="mt-4 space-y-2">
                            <input
                                type="text"
                                placeholder="הוסף כתובת URL לסרטון"
                                onChange={(e) => setNewVideos([{ url: e.target.value, title: '' }])}
                                className="w-full px-3 py-2 border rounded-md"
                            />
                        </div>
                    )}
                </div>

                {/* Additional Images Gallery */}
                <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-2xl font-bold mb-4 flex justify-between items-center">
                        גלריית תמונות
                        {isAdmin && (
                            <button onClick={() => setIsAddingImages(!isAddingImages)} className="text-gray-500 hover:text-green-500 transition-colors duration-300">
                                <FaPlus />
                            </button>
                        )}
                    </h3>
                    {product?.additionalImages?.length > 0 && (
                        <div className="flex flex-col gap-8">
                            {product.additionalImages.map((imgItem, index) => {
                                const imageUrl = imgItem.url;
                                const imageDescription = imgItem.description;

                                return (
                                    <div key={index}>
                                        {imageDescription && imageDescription.trim() !== '' && (
                                            <h4 className="text-xl font-extrabold text-gray-800 mb-4 uppercase tracking-wide border-b-2 pb-2 border-gray-100">
                                                {imageDescription}
                                            </h4>
                                        )}

                                        <div className="relative w-full rounded-lg overflow-hidden shadow-md group">
                                            <img
                                                src={imageUrl}
                                                alt={imageDescription || `${product.name} ${index + 1}`}
                                                className="w-full h-auto object-cover"
                                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/800x600/eeeeee/282828?text=תמונה+חסרה'; }}
                                            />
                                            {isAdmin && (
                                                <button
                                                    onClick={() => handleDeleteImage(index)}
                                                    className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                                >
                                                    <FaTrashAlt className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {isAddingImages && (
                        <div className="mt-4 space-y-4">
                            {newImages.map((img, index) => (
                                <div key={index} className="space-y-2 p-3 border rounded-md bg-gray-50">
                                    <input
                                        type="text"
                                        placeholder="כתובת URL לתמונה"
                                        value={img.url}
                                        onChange={(e) => handleNewImageChange(index, 'url', e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md"
                                    />
                                    <input
                                        type="text"
                                        placeholder="תיאור קצר לתמונה (אופציונלי)"
                                        value={img.description}
                                        onChange={(e) => handleNewImageChange(index, 'description', e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md"
                                    />
                                </div>
                            ))}
                            <button onClick={handleAddImageField} className="mt-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors">הוסף תמונה נוספת</button>
                        </div>
                    )}
                </div>

                {/* Technical Specifications */}
                <div className="mt-8 bg-white p-6 rounded-lg shadow-md col-span-1">
                    <h3 className="text-2xl font-bold mb-4 flex justify-between items-center">
                        מפרט טכני
                        {isAdmin && (
                            <button onClick={() => setIsAddingSpecs(!isAddingSpecs)} className="text-gray-500 hover:text-green-500 transition-colors duration-300">
                                <FaPlus />
                            </button>
                        )}
                    </h3>
                    <ul className="text-gray-800 space-y-2">
                        {product?.technicalSpecs?.map((spec, index) => (
                            <li key={index} className="flex flex-col sm:flex-row sm:items-center">
                                <span className="font-semibold text-gray-700 w-full sm:w-40">{spec.key}:</span>
                                <span className="text-gray-900 flex-1">{spec.value}</span>
                            </li>
                        ))}
                    </ul>
                    {isAddingSpecs && (
                        <div className="mt-4 space-y-2">
                            {newSpecs.map((spec, index) => (
                                <div key={index} className="flex flex-col sm:flex-row gap-2">
                                    <input
                                        type="text"
                                        placeholder="מפתח (לדוגמה: מעבד)"
                                        value={spec.key}
                                        onChange={(e) => handleSpecChange(index, 'key', e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md"
                                    />
                                    <input
                                        type="text"
                                        placeholder="ערך (לדוגמה: A17 Bionic)"
                                        value={spec.value}
                                        onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md"
                                    />
                                </div>
                            ))}
                            <button onClick={handleAddSpecField} className="mt-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors">הוסף שדה נוסף</button>
                        </div>
                    )}
                </div>
            </div>

            {/* כפתור שמירה גדול למנהל */}
            {isAdmin && (isAddingImages || isAddingVideos || isAddingSpecs || isAddingDescription) && (
                <div className="flex justify-center mt-8">
                    <button
                        onClick={handleSaveNewContent}
                        className={`bg-green-500 text-white px-6 py-3 rounded-md shadow-lg font-bold transition-colors duration-300 hover:bg-green-600 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={isSaving}
                    >
                        <FaSave className="inline-block mr-2" />
                        {isSaving ? 'שומר...' : 'שמור שינויים'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ShowPage;