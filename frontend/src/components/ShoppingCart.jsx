import { useAuth } from '../AuthContext';

const ShoppingCart = ({ cartItems, onRemoveFromCart, onUpdateQuantity, onCheckout }) => {
    const { user, isAuthenticated } = useAuth();

    const calculateTotal = () => {
        return cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    };

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
            {cartItems.length === 0 ? (
                <p className="text-gray-500 text-center">Your cart is empty.</p>
            ) : (
                <>
                    <ul>
                        {cartItems.map((item) => (
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
                            onClick={onCheckout}
                            disabled={!isAuthenticated || cartItems.length === 0}
                            className={`w-full py-2 rounded font-bold transition-colors ${!isAuthenticated || cartItems.length === 0
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-green-500 hover:bg-green-600 text-white'
                                }`}
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