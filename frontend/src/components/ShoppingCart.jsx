import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

const ShoppingCart = ({ cartItems, onRemoveFromCart, onUpdateQuantity }) => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();

    const validCartItems = cartItems.filter(item =>
        item && typeof item.price === 'number' && typeof item.quantity === 'number'
    );

    const calculateTotal = () => {
        return validCartItems.reduce((acc, item) => {
            if (typeof item.price === 'number' && typeof item.quantity === 'number') {
                return acc + item.price * item.quantity;
            }
            return acc;
        }, 0);
    };
    const handleCheckoutClick = () => {
        if (!isAuthenticated) {
            alert('You must be logged in to checkout!');
            return;
        }
        navigate('/checkout');
    };

    const isCartEmpty = cartItems.length === 0;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Shopping Cart</h2>
            <div className="mb-4 text-center text-gray-600">
                {isAuthenticated ? (
                    <p>You are logged in as <span className="font-semibold">{user.username}</span>.</p>
                ) : (
                    <p>Please log in to save your cart & checkout</p>
                )}
            </div>
            {isCartEmpty ? (
                <p className="text-gray-500 text-center">Your cart is empty.</p>
            ) : (
                <>
                    <ul>
                        {validCartItems.map((item) => (
                            <li key={item._id} className="flex justify-between items-center mb-4 border-b pb-2">
                                <div className="flex items-center">
                                    <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-md mr-4" />
                                    <div>
                                        <h3 className="text-lg font-semibold">{item.name}</h3>
                                        <p className="text-gray-600">${item.price.toFixed(2)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => onUpdateQuantity(item._id, 'decrease')} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-1 px-2 rounded-l">-</button>
                                    <span className="bg-gray-100 py-1 px-3 rounded">{item.quantity}</span>
                                    <button onClick={() => onUpdateQuantity(item._id, 'increase')} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-1 px-2 rounded-r">+</button>
                                    <button onClick={() => onRemoveFromCart(item._id)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded-full text-xs ml-2">X</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-4 pt-4 border-t border-gray-300 flex justify-between items-center">
                        <h3 className="text-xl font-bold">Total:</h3>
                        <span className="text-xl font-bold text-green-600">${calculateTotal().toFixed(2)}</span>
                    </div>
                    {/* הוספת כפתור "הזמנה" */}
                    <div className="mt-4 text-center">
                        <button
                            onClick={handleCheckoutClick}
                            disabled={isCartEmpty}
                            className={`w-full mt-4 text-white font-bold py-2 px-4 rounded-md transition-colors duration-300
                    ${isCartEmpty ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}`}
                        >
                            Checkout
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default ShoppingCart;