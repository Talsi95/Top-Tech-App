import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { FaCartPlus } from 'react-icons/fa';

const ShowPage = ({ onAddToCart }) => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedStorage, setSelectedStorage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await axios.get(`http://localhost:5001/api/products/${id}`);
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

    if (loading) return <div>Loading product...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
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
    );
};

export default ShowPage;