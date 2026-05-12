import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaTimes, FaSearch, FaArrowRight } from 'react-icons/fa';
import axios from 'axios';

/**
 * SearchDrawer Component.
 */
const SearchDrawer = ({ isOpen, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => setIsVisible(true), 10);
        } else {
            setIsVisible(false);
        }
    }, [isOpen]);

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

    if (!isOpen && !isVisible) return null;

    return (
        <div className={`fixed inset-0 z-[100] transition-all duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-md cursor-pointer"
                onClick={onClose}
            ></div>

            {/* Drawer Content */}
            <div
                className={`absolute top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl transition-transform duration-500 ease-out flex flex-col ${isVisible ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Header */}
                <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tighter">חיפוש מוצרים</h2>
                    <button 
                        onClick={onClose} 
                        className="w-12 h-12 flex items-center justify-center bg-gray-50 rounded-2xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all"
                    >
                        <FaTimes size={20} />
                    </button>
                </div>

                {/* Search Input Section */}
                <div className="p-8">
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="מה תרצו למצוא היום?"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            autoFocus
                            className="w-full pl-14 pr-6 py-5 bg-surface-container border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-[2rem] text-xl font-bold text-gray-900 placeholder-gray-400 focus:outline-none transition-all shadow-sm focus:shadow-xl focus:shadow-primary/5"
                        />
                        <FaSearch size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                    </div>
                </div>

                {/* Results Section */}
                <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
                    {searchResults.length === 0 && searchQuery.length > 2 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <FaSearch className="text-gray-300" size={32} />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2">לא נמצאו תוצאות</h3>
                            <p className="text-gray-500 font-medium">נסו לחפש מילה אחרת או קטגוריה</p>
                        </div>
                    ) : searchQuery.length <= 2 ? (
                        <div className="py-10 animate-in fade-in slide-in-from-top-4 duration-500">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 px-2">חיפושים פופולריים</h3>
                            <div className="flex flex-wrap gap-3">
                                {['iPhone', 'Samsung', 'Laptops', 'Gaming', 'Headphones'].map(tag => (
                                    <button 
                                        key={tag}
                                        onClick={() => { setSearchQuery(tag); fetchSearchResults(tag); }}
                                        className="px-6 py-3 bg-gray-50 hover:bg-primary hover:text-white text-gray-700 font-bold rounded-2xl transition-all border border-transparent"
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 px-2">תוצאות ({searchResults.length})</h3>
                            {searchResults.map((product, index) => (
                                <Link 
                                    key={product._id} 
                                    to={`/product/${product._id}`} 
                                    onClick={onClose}
                                    className="group flex items-center gap-6 p-4 rounded-3xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100 animate-in fade-in slide-in-from-right-4 duration-500"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className="w-24 h-24 bg-white rounded-2xl border border-gray-100 p-3 flex items-center justify-center overflow-hidden">
                                        <img 
                                            src={(product.variants[0]?.imageUrls && product.variants[0].imageUrls.length > 0) 
                                                ? product.variants[0].imageUrls[0] 
                                                : product.variants[0]?.imageUrl} 
                                            alt={product.name} 
                                            className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-500" 
                                        />
                                    </div>
                                    <div className="flex-1 text-right">
                                        <h4 className="text-lg font-black text-gray-900 group-hover:text-primary transition-colors">{product.name}</h4>
                                        <div className="flex items-center justify-end gap-2 mt-1">
                                            <span className="text-primary font-black text-xl">₪{product.variants[0]?.price.toFixed(2)}</span>
                                            {product.variants[0]?.salePrice && (
                                                <span className="text-gray-300 line-through text-sm">₪{product.variants[0].price.toFixed(2)}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 flex items-center justify-center text-gray-300 group-hover:text-primary group-hover:translate-x-[-4px] transition-all">
                                        <FaArrowRight size={14} className="rotate-180" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchDrawer;