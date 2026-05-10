import { useAuth } from '../AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import ProductCard from './ProductCard';

/**
 * ProductList Component.
 * Renders a grid of product cards. Primarily used for displaying general product listings.
 * 
 * @param {Object} props - Component props.
 * @param {Function} props.onAddToCart - Callback for adding a product to the cart.
 * @param {Function} props.onUpdateProduct - Callback for administrative product updates.
 * @param {Function} props.onDeleteProduct - Callback for administrative product deletion.
 * @param {Array} props.products - List of product objects to display.
 */
const ProductList = ({ onAddToCart, onUpdateProduct, onDeleteProduct, products }) => {
    const { isAdmin } = useAuth();
    const navigate = useNavigate();

    if (products.length === 0) {
        return <div className="text-center text-gray-500">אופס.. נראה שאין תוצאות עבור חיפוש זה</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">כל המוצרים שלנו</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map((product) => (
                    <div key={product._id} className="flex flex-col h-full bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
                        <div className="flex-grow">
                            <ProductCard product={product} />
                        </div>
                        {isAdmin && (
                            <div className="p-4 border-t flex flex-wrap gap-2 justify-center bg-gray-50">
                                <button
                                    onClick={() => navigate(`/product-form/${product._id}`)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1.5 px-3 rounded text-xs transition-colors flex-1"
                                >
                                    עריכה
                                </button>
                                <button
                                    onClick={() => onDeleteProduct(product._id)}
                                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-1.5 px-3 rounded text-xs transition-colors flex-1"
                                >
                                    מחיקה
                                </button>
                                <button
                                    onClick={() => navigate(`/admin/update-variant/${product._id}`)}
                                    className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-1.5 px-3 rounded text-xs transition-colors w-full"
                                >
                                    עדכון מלאי
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProductList;