import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import axios from 'axios';

const ProductsPage = () => {
    const [searchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Get the category and subcategory from the URL
    const category = searchParams.get('category');
    const subcategory = searchParams.get('subcategory');

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                let url = 'http://localhost:5001/api/products';

                // Add query parameters to the URL if they exist
                const params = new URLSearchParams();
                if (category) {
                    params.append('category', category);
                }
                if (subcategory) {
                    params.append('subcategory', subcategory);
                }

                if (params.toString()) {
                    url = `${url}?${params.toString()}`;
                }

                const response = await axios.get(url);
                setProducts(response.data);
                setLoading(false);
            } catch (err) {
                setError("Failed to load products.");
                setLoading(false);
                console.error(err);
            }
        };

        fetchProducts();
    }, [category, subcategory]); // The useEffect hook will re-run whenever the category or subcategory changes

    if (loading) return <div className="text-center mt-10">טוען מוצרים...</div>;
    if (error) return <div className="text-center mt-10 text-red-600">{error}</div>;

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6 text-center">{subcategory || category || "כל המוצרים"}</h1>

            {products.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">לא נמצאו מוצרים בקטגוריה זו.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {products.map(product => (
                        <ProductCard key={product._id} product={product} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProductsPage;