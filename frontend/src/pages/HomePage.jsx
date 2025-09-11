import ProductList from '../components/ProductList';
import { useState } from 'react';

const HomePage = ({ handleAddToCart, showNotification, handleDeleteProduct, products }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="container mx-auto p-4">
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="הקלד שם מוצר"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
            </div>
            <ProductList
                products={filteredProducts}
                // products={products}
                onAddToCart={handleAddToCart}
                showNotification={showNotification}
                onDeleteProduct={handleDeleteProduct}
            />
        </div>
    )
};


export default HomePage;