import { FaTimes, FaTrash, FaMinus, FaPlus, FaShoppingCart } from 'react-icons/fa';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * CartDrawer Component.
 */
const CartDrawer = ({ isOpen, onClose, cartItems, onRemoveFromCart, totalPrice, onUpdateQuantity }) => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const handleCheckoutClick = () => {
        onClose();
        const token = localStorage.getItem('token');
        const guestToken = localStorage.getItem('guestToken');

        if (isAuthenticated || token || guestToken) {
            navigate('/checkout');
        } else {
            navigate('/guest-checkout');
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div 
                className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
                onClick={onClose}
            />

            {/* Drawer */}
            <div className={`fixed top-0 right-0 h-full w-full max-w-sm md:max-w-md bg-white/90 backdrop-blur-2xl shadow-[-20px_0_50px_rgba(0,0,0,0.1)] transform transition-transform duration-500 ease-out z-[70] flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg text-primary">
                            <FaShoppingCart size={20} />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">עגלת הקניות</h2>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all"
                    >
                        <FaTimes size={20} />
                    </button>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {cartItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                            <FaShoppingCart size={64} />
                            <p className="text-xl font-bold">העגלה שלך ריקה</p>
                        </div>
                    ) : (
                        cartItems.map(item => {
                            const itemImageUrl = (item.variant?.imageUrls && item.variant.imageUrls.length > 0)
                                ? item.variant.imageUrls[0]
                                : (item.variant?.imageUrl || 
                                   (item.product?.variants?.[0]?.imageUrls && item.product.variants[0].imageUrls.length > 0 
                                    ? item.product.variants[0].imageUrls[0] 
                                    : item.product?.imageUrl));
                            
                            const itemKey = item.product?._id + (item.variant?._id || '');
                            const isItemOnSale = item.variant?.isOnSale;
                            const regularPrice = item.variant?.price;
                            const salePrice = item.variant?.salePrice;
                            const effectivePrice = isItemOnSale && salePrice && salePrice > 0 ? salePrice : regularPrice;
                            const itemTotal = (effectivePrice || 0) * item.quantity;

                            if (!item.product) return null;

                            return (
                                <div key={itemKey} className="flex gap-4 group animate-in slide-in-from-left-4 duration-300">
                                    <div className="relative w-24 h-24 flex-shrink-0 bg-surface-container rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                                        <img src={itemImageUrl} alt={item.product?.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    </div>
                                    
                                    <div className="flex-1 flex flex-col justify-between py-1">
                                        <div>
                                            <h3 className="font-bold text-gray-900 leading-tight mb-1">{item.product.name}</h3>
                                            {item.variant && (
                                                <p className="text-xs text-gray-500 font-medium">{item.variant.color} | {item.variant.storage}</p>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center bg-surface-container rounded-xl p-1">
                                                <button
                                                    onClick={() => item.product?._id && onUpdateQuantity(item.product._id, item.variant?._id, 'decrease')}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-600 transition-all"
                                                >
                                                    <FaMinus size={12} />
                                                </button>
                                                <span className="w-10 text-center font-bold text-sm text-gray-900">{item.quantity}</span>
                                                <button
                                                    onClick={() => item.product?._id && onUpdateQuantity(item.product._id, item.variant?._id, 'increase')}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-600 transition-all"
                                                >
                                                    <FaPlus size={12} />
                                                </button>
                                            </div>
                                            
                                            <div className="text-left">
                                                <p className="text-lg font-black text-primary">₪{itemTotal.toFixed(2)}</p>
                                                {isItemOnSale && (
                                                    <p className="text-[10px] text-gray-400 line-through">₪{(regularPrice * item.quantity).toFixed(2)}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => item.product?._id && onRemoveFromCart(item.product._id, item.variant?._id)} 
                                        className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all h-fit"
                                    >
                                        <FaTrash size={16} />
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-gray-100 space-y-6 bg-white/50 backdrop-blur-md">
                    <div className="space-y-2">
                        <div className="flex justify-between text-gray-500 font-medium">
                            <span>סכום ביניים</span>
                            <span>₪{totalPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-900">
                            <span className="text-xl font-bold">סה״כ</span>
                            <span className="text-2xl font-black text-primary">₪{totalPrice.toFixed(2)}</span>
                        </div>
                    </div>

                    <button 
                        onClick={handleCheckoutClick} 
                        disabled={cartItems.length === 0}
                        className={`w-full py-4 rounded-2xl text-white font-black text-lg shadow-xl shadow-primary/20 transform transition-all active:scale-[0.98] ${cartItems.length === 0 ? 'bg-gray-300 cursor-not-allowed grayscale' : 'bg-primary hover:bg-primary-hover hover:shadow-primary/40'}`}
                    >
                        המשך להזמנה
                    </button>

                    <button 
                        onClick={onClose}
                        className="w-full py-2 text-gray-500 font-bold hover:text-gray-900 transition-colors text-sm"
                    >
                        המשך בקניות
                    </button>
                </div>
            </div>
        </>
    );
};

export default CartDrawer;