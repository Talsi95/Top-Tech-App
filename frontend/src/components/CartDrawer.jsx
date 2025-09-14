import { FaTimes, FaRegTrashAlt } from 'react-icons/fa';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

const CartDrawer = ({ isOpen, onClose, cartItems, onRemoveFromCart, totalPrice, onUpdateQuantity }) => {
    const drawerClasses = `fixed top-0 right-0 h-full w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${isOpen ? 'translate-x-0' : 'translate-x-full'
        }`;
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const handleCheckoutClick = () => {
        if (!isAuthenticated) {
            alert('התחבר/הרשם בכדי לבצע הזמנה');
            return;
        }
        navigate('/checkout');
    };

    return (
        <div className={drawerClasses}>
            <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-xl font-semibold">עגלת הקניות</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                    <FaTimes size={20} />
                </button>
            </div>

            <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(100% - 150px)' }}>
                {cartItems.length === 0 ? (
                    <p className="text-gray-500 text-center">העגלה שלך ריקה</p>
                ) : (
                    cartItems.map(item => (
                        <div key={item.product._id} className="flex items-center space-x-4 mb-4 border-b pb-2">
                            <img src={item.product.imageUrl} alt={item.product.name} className="w-16 h-16 object-cover rounded" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-sm">{item.product.name}</h3>
                                <p className="text-gray-600 text-xs">₪{item.product.price.toFixed(2)} x {item.quantity}</p>
                                <p className="text-gray-800 font-bold">₪{(item.product.price * item.quantity).toFixed(2)}</p>
                            </div>
                            <div className="flex items-center">
                                <button
                                    onClick={() => onUpdateQuantity(item.product._id, 'decrease')}
                                    className="bg-gray-200 text-gray-700 px-2 py-1 rounded-l hover:bg-gray-300"
                                >
                                    -
                                </button>
                                <span className="bg-gray-100 text-gray-700 px-3 py-1 text-sm">{item.quantity}</span>
                                <button
                                    onClick={() => onUpdateQuantity(item.product._id, 'increase')}
                                    className="bg-gray-200 text-gray-700 px-2 py-1 rounded-r hover:bg-gray-300"
                                >
                                    +
                                </button>
                            </div>
                            <button onClick={() => onRemoveFromCart(item.product._id)} className="text-red-500 hover:text-red-700">
                                <FaRegTrashAlt />
                            </button>
                        </div>
                    ))
                )}
            </div>

            <div className="p-4 border-t absolute bottom-0 left-0 w-full bg-white">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-bold">סה״כ:</span>
                    <span className="text-lg font-bold">₪{totalPrice.toFixed(2)}</span>
                </div>
                <button onClick={handleCheckoutClick} className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition-colors">
                    המשך להזמנה
                </button>
            </div>
        </div>
    );
};

export default CartDrawer;


