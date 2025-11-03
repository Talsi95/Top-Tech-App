import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell } from 'react-icons/fa';

const AdminNotifications = ({ newOrders = [], onMarkOrderAsSeen }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const navigate = useNavigate();

    const newOrdersCount = newOrders.length;

    const handleBellClick = () => {
        setIsDropdownOpen(prev => !prev);
    };

    const handleOrderClick = async (orderId) => {
        if (onMarkOrderAsSeen) {
            await onMarkOrderAsSeen(orderId);
        }
        setIsDropdownOpen(false);

        navigate('/admin', { state: { activeTab: 'orders', highlightId: orderId } });
    };

    return (
        <div className="relative inline-block text-right z-50">
            <button
                onClick={handleBellClick}
                className="relative text-gray-200 hover:text-yellow-400 focus:outline-none transition-colors mx-2"
                title={`יש לך ${newOrdersCount} הזמנות חדשות`}
            >
                <FaBell className="h-6 w-6" />
                {newOrdersCount > 0 && (
                    <span className="absolute -top-2 -left-2 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-gray-800">
                        {newOrdersCount}
                    </span>
                )}
            </button>

            {isDropdownOpen && (
                <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-72 origin-top-left bg-white rounded-md shadow-2xl ring-1 ring-black ring-opacity-10 divide-y divide-gray-100 z-50">
                    <div className="py-1">
                        <h4 className="px-4 py-2 text-sm font-bold text-gray-700">
                            הזמנות חדשות ({newOrdersCount})
                        </h4>

                        {newOrdersCount === 0 ? (
                            <p className="px-4 py-3 text-sm text-gray-500 text-center">אין התראות חדשות</p>
                        ) : (
                            newOrders.map((order) => (
                                <div
                                    key={order._id}
                                    onClick={() => handleOrderClick(order._id)}
                                    className="block px-4 py-3 text-sm text-gray-800 hover:bg-red-50/50 cursor-pointer transition-colors border-l-4 border-red-500"
                                >
                                    <p className="font-semibold truncate">הזמנה חדשה: ₪{order.totalPrice ? order.totalPrice.toFixed(2) : 'N/A'}</p>
                                    <p className="text-xs text-gray-500">
                                        נוצר ב: {new Date(order.createdAt).toLocaleDateString('he-IL')}
                                    </p>
                                </div>
                            ))
                        )}
                        <div
                            onClick={() => { navigate('/admin', { state: { activeTab: 'orders' } }); setIsDropdownOpen(false); }}
                            className="text-center py-2 text-sm text-sky-600 hover:bg-gray-100 cursor-pointer border-t font-medium"
                        >
                            צפייה בכל ההזמנות
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminNotifications;