import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const ShowPage = ({ onAddToCart }) => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await axios.get(`http://localhost:5001/api/products/${id}`);
                setProduct(response.data);
            } catch (err) {
                setError("Failed to load product details.");
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    if (loading) return <div>Loading product...</div>;
    if (error) return <div className="text-red-500">{error}</div>;
    if (!product) return <div>Product not found.</div>;

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
            <img src={product.imageUrl} alt={product.name} className="w-1/2 object-cover mb-4" />
            <p className="text-lg text-gray-800 mb-4">{product.description}</p>
            <p className="text-2xl font-semibold">₪{product.price.toFixed(2)}</p>

            <button
                onClick={() => onAddToCart(product)}
                className="mt-4 bg-green-500 text-white px-6 py-3 rounded-md hover:bg-green-600 transition-colors duration-300"
            >
                הוסף לעגלה
            </button>
        </div>
    );
};

export default ShowPage;