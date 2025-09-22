import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaTimes, FaSearch } from 'react-icons/fa';
import axios from 'axios';

const SearchDrawer = ({ isOpen, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const debounce = (func, delay) => {
        let timeout;
        return function (...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    };

    const fetchSearchResults = async (query) => {
        if (query.length > 2) {
            try {
                const response = await axios.get(`${__API_URL__}/products/search?query=${query}`);
                setSearchResults(response.data);
            } catch (error) {
                console.error('Error fetching search results:', error);
                setSearchResults([]);
            }
        } else {
            setSearchResults([]);
        }
    };

    const debouncedFetchResults = debounce(fetchSearchResults, 300);

    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        debouncedFetchResults(query);
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
                onClick={onClose}
            ></div>

            <div
                className="fixed top-0 left-0 w-full h-full md:w-3/5 md:h-3/4 md:top-1/2 md:-translate-y-1/2 md:left-1/2 md:-translate-x-1/2 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 transform transition-all duration-300 ease-in-out"
            >
                <div className="flex items-center p-4 border-b border-gray-700">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="חפש מוצר"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            autoFocus
                            className="w-full pl-10 pr-4 py-2 border border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-400 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white ml-4">
                        <FaTimes size={24} />
                    </button>
                </div>
                <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(100% - 6rem)' }}>
                    {searchResults.length === 0 && searchQuery.length > 2 ? (
                        <p className="text-gray-400 text-center mt-8">לא נמצאו מוצרים.</p>
                    ) : searchQuery.length <= 2 ? (
                        <p className="text-gray-400 text-center mt-8">הקלד/י שם מוצר כדי להתחיל לחפש...</p>
                    ) : (
                        searchResults.map(product => (
                            <div key={product._id} className="flex items-center space-x-4 mb-4 pb-4 border-b border-gray-700">
                                <Link to={`/product/${product._id}`} onClick={onClose}>
                                    <img src={product.variants[0]?.imageUrl} alt={product.name} className="h-16 w-16 object-cover rounded-md" />
                                </Link>
                                <div className="flex-1">
                                    <Link to={`/product/${product._id}`} onClick={onClose} className="font-semibold text-lg text-white hover:underline">
                                        {product.name}
                                    </Link>
                                    <p className="text-gray-400">
                                        {product.variants[0]?.price ? `$${product.variants[0].price.toFixed(2)}` : 'מחיר לא זמין'}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
};

export default SearchDrawer;