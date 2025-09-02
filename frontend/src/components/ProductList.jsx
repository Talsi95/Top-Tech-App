import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

const ProductList = ({ onAddToCart, showNotification }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [editFormData, setEditFormData] = useState({});

    const { isAdmin } = useAuth();

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5001/api/products');
            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }
            const data = await response.json();
            setProducts(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    showNotification('You must be logged in to perform this action.', 'error');
                    return;
                }

                const response = await fetch(`http://localhost:5001/api/products/${id}`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (response.ok) {
                    showNotification('Product deleted successfully!', 'success');
                    fetchProducts();
                } else {
                    const errorData = await response.json();
                    showNotification(errorData.message, 'error');
                }
            } catch (err) {
                showNotification(`Error deleting product: ${err.message}`, 'error');
            }
        }
    };

    const handleEdit = (product) => {
        setIsEditing(true);
        setCurrentProduct(product);
        setEditFormData({
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
            category: product.category,
        });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                showNotification('You must be logged in to perform this action.', 'error');
                return;
            }
            const response = await fetch(`http://localhost:5001/api/products/${currentProduct._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(editFormData),
            });
            if (response.ok) {
                showNotification('Product updated successfully!', 'success');
                setIsEditing(false);
                setCurrentProduct(null);
                fetchProducts();
            } else {
                const errorData = await response.json();
                showNotification(errorData.message, 'error');
            }
        } catch (err) {
            showNotification(`Error updating product: ${err.message}`, 'error');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditFormData({ ...editFormData, [name]: value });
    };

    if (loading) {
        return <div className="text-center text-xl font-semibold">Loading products...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500 text-xl font-semibold">Error: {error}</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Available Products</h2>
            {isEditing && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-96">
                        <h3 className="text-2xl font-bold mb-4">Edit Product</h3>
                        <form onSubmit={handleUpdate}>
                            <input type="text" name="name" value={editFormData.name} onChange={handleChange} placeholder="Name" className="w-full mb-4 p-2 border rounded" required />
                            <input type="number" name="price" value={editFormData.price} onChange={handleChange} placeholder="Price" className="w-full mb-4 p-2 border rounded" required />
                            <input type="text" name="imageUrl" value={editFormData.imageUrl} onChange={handleChange} placeholder="Image URL" className="w-full mb-4 p-2 border rounded" required />
                            <input type="text" name="category" value={editFormData.category} onChange={handleChange} placeholder="Category" className="w-full mb-4 p-2 border rounded" required />
                            <div className="flex justify-between">
                                <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Update</button>
                                <button type="button" onClick={() => setIsEditing(false)} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {products.length === 0 ? (
                <p className="text-center text-gray-500">No products found. Please add some!</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {products.map((product) => (
                        <div key={product._id} className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col justify-between">
                            <img src={product.imageUrl} alt={product.name} className="w-full h-48 object-cover" />
                            <div className="p-4 flex-grow">
                                <h3 className="text-xl font-semibold text-gray-900">{product.name}</h3>
                                <p className="text-gray-600 mt-2">{product.category}</p>
                                <p className="text-green-600 text-lg font-bold mt-2">${product.price.toFixed(2)}</p>
                            </div>
                            <div className="p-4 border-t flex justify-between items-center">
                                <button
                                    onClick={() => onAddToCart(product)}
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
                                >
                                    Add to Cart
                                </button>
                                {isAdmin && (
                                    <div className="flex space-x-2">
                                        <button onClick={() => handleEdit(product)} className="bg-yellow-500 hover:bg-yellow-700 text-white py-1 px-3 rounded text-xs">
                                            Edit
                                        </button>
                                        <button onClick={() => handleDelete(product._id)} className="bg-red-500 hover:bg-red-700 text-white py-1 px-3 rounded text-xs">
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProductList;