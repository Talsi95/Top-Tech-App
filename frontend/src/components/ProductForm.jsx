import { useState } from 'react';

const ProductForm = ({ showNotification }) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [category, setCategory] = useState('');
    const [validationErrors, setValidationErrors] = useState({});

    const validateForm = () => {
        const errors = {};
        const parsedPrice = parseFloat(price);

        if (!name.trim()) {
            errors.name = 'Product name is required';
        }
        if (isNaN(parsedPrice) || parsedPrice <= 0) {
            errors.price = 'Price must be a positive number';
        }
        if (!imageUrl.trim()) {
            errors.imageUrl = 'Image URL is required';
        }
        if (!category.trim()) {
            errors.category = 'Category is required';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            return; // עוצר את התהליך אם יש שגיאות אימות
        }

        const newProduct = { name, price: parseFloat(price), imageUrl, category };

        try {
            const response = await fetch('http://localhost:5001/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newProduct),
            });

            if (response.ok) {
                showNotification('Product added successfully!', 'success');
                setName('');
                setPrice('');
                setImageUrl('');
                setCategory('');
                setValidationErrors({}); // איפוס השגיאות לאחר הצלחה
            } else {
                const errorData = await response.json();
                showNotification(`Failed to add product: ${errorData.message}`, 'error');
            }
        } catch (error) {
            showNotification(`There was an error: ${error.message}`, 'error');
        }
    };

    return (
        <div className="p-8 max-w-lg mx-auto bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-center">Add New Product</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">Name</label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={validateForm} // אימות בעת יציאה מהשדה
                        required
                    />
                    {validationErrors.name && <p className="text-red-500 text-xs italic mt-1">{validationErrors.name}</p>}
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="price">Price</label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="price"
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        onBlur={validateForm}
                        required
                    />
                    {validationErrors.price && <p className="text-red-500 text-xs italic mt-1">{validationErrors.price}</p>}
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="imageUrl">Image URL</label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="imageUrl"
                        type="text"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        onBlur={validateForm}
                        required
                    />
                    {validationErrors.imageUrl && <p className="text-red-500 text-xs italic mt-1">{validationErrors.imageUrl}</p>}
                </div>
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category">Category</label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="category"
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        onBlur={validateForm}
                        required
                    />
                    {validationErrors.category && <p className="text-red-500 text-xs italic mt-1">{validationErrors.category}</p>}
                </div>
                <div className="flex items-center justify-center">
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        type="submit"
                    >
                        Add Product
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProductForm;