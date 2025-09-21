import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { FaCartPlus, FaPlus } from 'react-icons/fa';
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

    const [newImages, setNewImages] = useState([]);
    const [newVideos, setNewVideos] = useState([]);
    const [newSpecs, setNewSpecs] = useState([]);
    const [newLongDescription, setNewLongDescription] = useState(product?.longDescription || '');


    const [isAddingImages, setIsAddingImages] = useState(false);
    const [isAddingVideos, setIsAddingVideos] = useState(false);
    const [isAddingSpecs, setIsAddingSpecs] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isAddingDescription, setIsAddingDescription] = useState(false);


    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await axios.get(`/api/products/${id}`);
                const data = response.data;
                setProduct(data);

                if (data.variants && data.variants.length > 0) {
                    setSelectedColor(data.variants[0].color);
                    setSelectedStorage(data.variants[0].storage);
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
        if (product && selectedColor && selectedStorage) {
            const newVariant = product.variants.find(
                v => v.color === selectedColor && v.storage === selectedStorage
            );
            setSelectedVariant(newVariant || null);
        }
    }, [selectedColor, selectedStorage, product]);

    const uniqueColors = [...new Set(product?.variants.map(v => v.color))];
    const uniqueStorage = [...new Set(product?.variants.map(v => v.storage))];

    const isCombinationValid = (color, storage) => {
        return product?.variants.some(v => v.color === color && v.storage === storage);
    };

    const isOutOfStock = selectedVariant?.stock === 0;

    const handleSaveNewContent = async () => {
        const token = getToken();
        setIsSaving(true);
        try {
            const updatedProduct = {
                ...product,
                additionalImages: [...(product.additionalImages || []), ...newImages],
                videos: [...(product.videos || []), ...newVideos],
                technicalSpecs: [...(product.technicalSpecs || []), ...newSpecs],
            };

            await axios.put(`/api/products/${id}`, updatedProduct, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setProduct(updatedProduct);
            setNewImages([]);
            setNewVideos([]);
            setNewSpecs([]);
            setIsAddingImages(false);
            setIsAddingVideos(false);
            setIsAddingSpecs(false);

        } catch (error) {
            console.error('Error saving new content:', error);
            // כאן תוכל להוסיף הודעת שגיאה למשתמש
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div>טוען מוצר...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <>
            <div className="container mx-auto p-8 flex flex-col md:flex-row gap-8">
                <div className="md:w-1/2 flex flex-col">
                    <div className="bg-white p-4 rounded-lg shadow-md mb-4 flex justify-center items-center">
                        <img src={selectedVariant?.imageUrl} alt={product?.name} className="max-h-96 object-contain rounded-lg" />
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-2xl font-bold mb-2">תיאור המוצר</h3>
                        <p className="text-gray-800">{product?.description}</p>
                    </div>
                </div>

                <div className="md:w-1/2 flex flex-col justify-start">
                    <h1 className="text-4xl font-bold mb-4">{product?.name}</h1>
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
                            <div className="text-red-500 text-sm mt-4">השילוב שבחרת אינו קיים. נא בחר שילוב אחר.</div>
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
                            {uniqueStorage.length > 0 && (
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
                            className={`w-full md:w-auto mt-4 px-6 py-3 rounded-md transition-colors duration-300 flex items-center justify-center space-x-2 
                        ${isOutOfStock || !selectedVariant ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'}`}
                            disabled={isOutOfStock || !selectedVariant}
                        >
                            <FaCartPlus className="w-5 h-5" />
                            <span>{isOutOfStock ? 'אזל מהמלאי' : 'הוסף לעגלה'}</span>
                        </button>
                    </div>
                </div>
            </div>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Additional Images */}
                <div className="bg-white p-6 rounded-lg shadow-md col-span-full md:col-span-1 lg:col-span-1">
                    <h3 className="text-2xl font-bold mb-4 flex justify-between items-center">
                        גלריית תמונות
                        {isAdmin && (
                            <button onClick={() => setIsAddingImages(!isAddingImages)} className="text-gray-500 hover:text-green-500 transition-colors duration-300">
                                <FaPlus />
                            </button>
                        )}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        {product?.additionalImages?.map((img, index) => (
                            <img key={index} src={img} alt={`${product.name} ${index + 1}`} className="w-full rounded-lg object-cover" />
                        ))}
                    </div>
                    {isAddingImages && (
                        <div className="mt-4">
                            {/* טופס הוספת תמונה */}
                            <input
                                type="text"
                                placeholder="הוסף כתובת URL לתמונה"
                                onChange={(e) => setNewImages([e.target.value])}
                                className="w-full px-3 py-2 border rounded-md"
                            />
                        </div>
                    )}
                </div>

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
                    {/* Display existing description or the new input field */}
                    {!isAddingDescription && product?.longDescription ? (
                        <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                            {product.longDescription}
                        </p>
                    ) : (
                        <textarea
                            value={newLongDescription}
                            onChange={(e) => setNewLongDescription(e.target.value)}
                            placeholder="הוסף תיאור מורחב למוצר..."
                            className="w-full px-3 py-2 border rounded-md h-40 resize-none"
                        ></textarea>
                    )}
                </div>


                {/* Technical Specifications */}
                <div className="bg-white p-6 rounded-lg shadow-md col-span-full">
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
                            {/* טופס הוספת מפרט */}
                            <input
                                type="text"
                                placeholder="מפתח (לדוגמה: מעבד)"
                                onChange={(e) => setNewSpecs([{ key: e.target.value, value: '' }])}
                                className="w-full px-3 py-2 border rounded-md"
                            />
                            <input
                                type="text"
                                placeholder="ערך (לדוגמה: A17 Bionic)"
                                onChange={(e) => setNewSpecs([{ key: newSpecs[0]?.key || '', value: e.target.value }])}
                                className="w-full px-3 py-2 border rounded-md"
                            />
                        </div>
                    )}
                </div>

                {/* Demo Videos */}
                <div className="bg-white p-6 rounded-lg shadow-md col-span-full">
                    <h3 className="text-2xl font-bold mb-4 flex justify-between items-center">
                        סרטוני הדגמה
                        {isAdmin && (
                            <button onClick={() => setIsAddingVideos(!isAddingVideos)} className="text-gray-500 hover:text-green-500 transition-colors duration-300">
                                <FaPlus />
                            </button>
                        )}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {product?.videos?.map((video, index) => {
                            const videoId = video.url.split('/').pop().split('?')[0];
                            const autoplayUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}`;

                            return (
                                <div key={index} className="relative aspect-w-16 aspect-h-9 w-full rounded-lg overflow-hidden shadow-lg">
                                    <iframe
                                        src={autoplayUrl}
                                        title={video.title}
                                        frameBorder="0"
                                        allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
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
            </div>

            {/* כפתור שמירה גדול למנהל */}
            {isAdmin && (isAddingImages || isAddingVideos || isAddingSpecs || isAddingDescription) && (
                <div className="flex justify-center mt-8">
                    <button
                        onClick={handleSaveNewContent}
                        className={`bg-green-500 text-white px-6 py-3 rounded-md shadow-lg font-bold transition-colors duration-300 hover:bg-green-600 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={isSaving}
                    >
                        {isSaving ? 'שומר...' : 'שמור שינויים'}
                    </button>
                </div>
            )}
        </>

    );
};

export default ShowPage;