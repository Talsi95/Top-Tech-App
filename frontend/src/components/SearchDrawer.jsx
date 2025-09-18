import { Link } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';

const SearchDrawer = ({ isOpen, onClose, results }) => {
    return (
        <div
            className={`absolute w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100 pointer-events-auto' : 'max-h-0 opacity-0 overflow-hidden pointer-events-none'}`}
            style={{ zIndex: 50 }}
        >
            <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-xl font-semibold">תוצאות חיפוש</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                    <FaTimes size={20} />
                </button>
            </div>
            <div className="p-4 overflow-y-auto h-full">
                {results.length === 0 ? (
                    <p className="text-gray-500">לא נמצאו מוצרים.</p>
                ) : (
                    results.map(product => (
                        <div key={product._id} className="flex items-center space-x-4 mb-4 pb-4 border-b">
                            <Link to={`/product/${product._id}`} onClick={onClose}>
                                <img src={product.imageUrl} alt={product.name} className="h-16 w-16 object-cover rounded-md" />
                            </Link>
                            <div>
                                <Link to={`/product/${product._id}`} onClick={onClose} className="font-semibold text-lg hover:underline">
                                    {product.name}
                                </Link>
                                <p className="text-gray-600">${product.price.toFixed(2)}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default SearchDrawer;