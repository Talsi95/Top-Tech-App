import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import { useParams } from 'react-router-dom';

const UpdateVariantForm = () => {
    const { id: productId } = useParams();
    const { getToken } = useAuth();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [editedStock, setEditedStock] = useState({});

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await axios.get(`http://localhost:5001/api/products/${productId}`);
                setProduct(response.data);
                const initialStock = {};
                response.data.variants.forEach(v => {
                    initialStock[v._id] = v.stock;
                });
                setEditedStock(initialStock);
            } catch (err) {
                setError("Failed to fetch product for editing.");
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [productId]);

    const handleStockChange = (variantId, newStock) => {
        setEditedStock(prev => ({
            ...prev,
            [variantId]: newStock,
        }));
    };

    const handleUpdateVariant = async (variantId) => {
        const token = getToken();
        if (!token) return;

        try {
            const updatedStock = editedStock[variantId];
            if (updatedStock === undefined) return;

            await axios.put(
                `http://localhost:5001/api/products/${productId}/variants/${variantId}`,
                { stock: parseInt(updatedStock, 10) },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setProduct(prevProduct => {
                const newVariants = prevProduct.variants.map(v =>
                    v._id === variantId ? { ...v, stock: parseInt(updatedStock, 10) } : v
                );
                return { ...prevProduct, variants: newVariants };
            });

            alert('המלאי עודכן בהצלחה!');
        } catch (err) {
            alert('שגיאה בעדכון המלאי: ' + (err.response?.data?.message || err.message));
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="text-red-500">{error}</div>;
    if (!product) return <div>Product not found.</div>;

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-2xl font-bold mb-4">עדכון מלאי עבור: {product.name}</h1>
            {product.variants.map(variant => (
                <div key={variant._id} className="flex items-center justify-between p-4 mb-4 border rounded-md shadow-sm">
                    <div className="flex items-center">
                        <img src={variant.imageUrl} alt={variant.color} className="w-16 h-16 object-cover rounded-md mr-4" />
                        <div>
                            <p className="font-semibold">{variant.color} - {variant.storage}</p>
                            <p className="text-gray-600">מחיר: ₪{variant.price}</p>
                            <p className="text-sm">מזהה וריאציה: {variant._id}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <label className="text-gray-700">מלאי:</label>
                        <input
                            type="number"
                            value={editedStock[variant._id] || ''}
                            onChange={(e) => handleStockChange(variant._id, e.target.value)}
                            className="w-24 p-2 border rounded-md text-center"
                        />
                        <button
                            onClick={() => handleUpdateVariant(variant._id)}
                            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                        >
                            עדכן
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default UpdateVariantForm;