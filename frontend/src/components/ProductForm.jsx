import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

const ProductForm = ({ showNotification, existingProduct, onUpdateSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        salePrice: '',
        isOnSale: false,
        imageUrl: '',
        category: '',
    });
    const [validationErrors, setValidationErrors] = useState({});

    const { isAdmin, getToken } = useAuth();

    useEffect(() => {
        if (existingProduct) {
            setFormData(prevData => ({
                ...prevData,
                ...existingProduct,
                salePrice: existingProduct.salePrice || '',
                description: existingProduct.description || ''
            }));
        } else {
            setFormData({
                name: '',
                description: '',
                price: '',
                salePrice: '',
                isOnSale: false,
                imageUrl: '',
                category: '',
            });
        }
    }, [existingProduct]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const validateForm = () => {
        const errors = {};
        const parsedPrice = parseFloat(formData.price);
        const parsedSalePrice = parseFloat(formData.salePrice);

        if (!formData.name.trim()) {
            errors.name = 'Product name is required';
        }
        if (isNaN(parsedPrice) || parsedPrice <= 0) {
            errors.price = 'Price must be a positive number';
        }
        if (formData.isOnSale && (isNaN(parsedSalePrice) || parsedSalePrice <= 0 || parsedSalePrice >= parsedPrice)) {
            errors.salePrice = 'Sale price must be a positive number and less than the original price';
        }
        if (!formData.imageUrl.trim()) {
            errors.imageUrl = 'Image URL is required';
        }
        if (!formData.category.trim()) {
            errors.category = 'Category is required';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }

        const isUpdating = !!existingProduct;
        const url = isUpdating
            ? `http://localhost:5001/api/products/${existingProduct._id}`
            : 'http://localhost:5001/api/products';
        const method = isUpdating ? 'PUT' : 'POST';

        const productData = {
            ...formData,
            price: parseFloat(formData.price),
            salePrice: formData.isOnSale && formData.salePrice !== '' ? parseFloat(formData.salePrice) : null,
        };

        try {
            const token = getToken();
            if (!token) {
                showNotification('Authentication token is missing. Please log in again.', 'error');
                return;
            }

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(productData),
            });

            if (response.ok) {
                showNotification(`Product ${isUpdating ? 'updated' : 'created'} successfully!`, 'success');
                if (isUpdating && onUpdateSuccess) {
                    onUpdateSuccess();
                } else {
                    setFormData({
                        name: '',
                        description: '',
                        price: '',
                        salePrice: '',
                        isOnSale: false,
                        imageUrl: '',
                        category: '',
                    });
                    setValidationErrors({});
                }
            } else {
                const errorData = await response.json();
                showNotification(errorData.message || `Failed to ${isUpdating ? 'update' : 'create'} product`, 'error');
            }
        } catch (err) {
            console.error("Failed to process product:", err);
            showNotification('An error occurred.', 'error');
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto mb-8">
            <h2 className="text-xl font-bold mb-4">{existingProduct ? 'Update Product' : 'Add New Product'}</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-700">Product Name</label>
                    <input className="w-full mt-1 p-2 border rounded-md" type="text" name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700">Description</label>
                    <textarea className="w-full mt-1 p-2 border rounded-md" name="description" value={formData.description} onChange={handleChange} required />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700">Price ($)</label>
                    <input className="w-full mt-1 p-2 border rounded-md" type="number" name="price" value={formData.price} onChange={handleChange} required />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700">Sale Price ($)</label>
                    <input
                        className="w-full mt-1 p-2 border rounded-md"
                        type="number"
                        name="salePrice"
                        value={formData.salePrice}
                        onChange={handleChange}
                        disabled={!formData.isOnSale}
                    />
                    {validationErrors.salePrice && <p className="text-red-500 text-xs italic mt-1">{validationErrors.salePrice}</p>}
                </div>
                <div className="mb-4 flex items-center">
                    <input className="mr-2" type="checkbox" name="isOnSale" checked={formData.isOnSale} onChange={handleChange} />
                    <label className="text-gray-700">Is on Sale?</label>
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700">Image URL</label>
                    <input className="w-full mt-1 p-2 border rounded-md" type="text" name="imageUrl" value={formData.imageUrl} onChange={handleChange} required />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700">Category</label>
                    <input className="w-full mt-1 p-2 border rounded-md" type="text" name="category" value={formData.category} onChange={handleChange} required />
                </div>
                <button className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md" type="submit">
                    {existingProduct ? 'Update Product' : 'Add Product'}
                </button>
            </form>
        </div>
    );
};

export default ProductForm;