import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const UserArea = () => {
    const { isAuthenticated, getToken } = useAuth();
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [userOrders, setUserOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchUserDataAndOrders = useCallback(async () => {
        try {
            const token = getToken();
            if (!token) {
                navigate('/login');
                return;
            }

            // Fetch user data and orders from the profile endpoint
            const response = await axios.get('/api/auth/profile', {
                headers: {
                    Authorization: `Bearer ${token}`
                },
            });

            // Set user data and orders from the API response
            setUserData(response.data);
            setUserOrders(response.data.orders);
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.message || err.message);
            setLoading(false);
        }
    }, [getToken, navigate]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchUserDataAndOrders();
        } else {
            navigate('/');
        }
    }, [isAuthenticated, navigate, fetchUserDataAndOrders]);

    if (loading) {
        return <div className="text-center mt-10">טוען...</div>;
    }

    if (error) {
        return <div className="text-center mt-10 text-red-600">שגיאה: {error}</div>;
    }

    return (
        <div className="container mx-auto p-8">
            <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">האיזור האישי שלי</h2>

            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h3 className="text-xl font-bold mb-4">פרטים אישיים</h3>
                <p><strong>שם משתמש:</strong> {userData.username}</p>
                <p><strong>מייל:</strong> {userData.email}</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-4">ההזמנות שלי</h3>
                {userOrders.length === 0 ? (
                    <p className="text-center text-gray-500">אין עדיין הזמנות</p>
                ) : (
                    <ul>
                        {userOrders.map((order) => (
                            <li key={order._id} className="mb-4 border-b pb-4">
                                <p><strong>מספר הזמנה:</strong> {order._id}</p>
                                <p><strong>תאריך:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                                <p><strong>סה״כ:</strong> ₪{order.totalPrice.toFixed(2)}</p>
                                <p><strong>סטטוס:</strong> {order.isDelivered ? 'נשלח' : 'ממתין לטיפול'}</p>

                                <ul className="pl-4 mt-2 space-y-4">
                                    {order.orderItems.map((item, index) => {
                                        if (!item.product) {
                                            return <p key={`deleted-${index}`} className="text-gray-500 italic">מוצר אינו קיים יותר (x{item.quantity})</p>;
                                        }

                                        const imageUrl = item.variant?.imageUrl || item.product?.variants[0]?.imageUrl || 'https://via.placeholder.com/150';
                                        const variantText = item.variant ? `צבע: ${item.variant.color}, נפח: ${item.variant.storage}` : '';

                                        return (
                                            <li key={item._id || `item-${index}`} className="flex items-start">
                                                <img src={imageUrl} alt={item.product.name} className="w-16 h-16 object-cover rounded-md ml-4" />
                                                <div className="flex-1">
                                                    <p className="font-semibold text-lg">{item.product.name}</p>
                                                    {variantText && <p className="text-sm text-gray-600">{variantText}</p>}
                                                    <p className="text-gray-500">כמות: {item.quantity}</p>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default UserArea;


// import { useState, useEffect } from 'react';
// import { useAuth } from '../AuthContext';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';

// const UserArea = () => {
//     const { isAuthenticated, user, getToken } = useAuth();
//     const navigate = useNavigate();
//     const [userData, setUserData] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);

//     useEffect(() => {
//         if (!isAuthenticated) {
//             navigate('/');
//             return;
//         }

//         const fetchUserData = async () => {
//             try {
//                 const token = getToken();
//                 if (!token) throw new Error('Authentication token not found');

//                 const response = await axios.get('http://localhost:5001/api/auth/profile', {
//                     headers: {
//                         Authorization: `Bearer ${token}`
//                     },
//                 });
//                 setUserData(response.data)
//                 setLoading(false);
//             } catch (err) {
//                 setError(err.response?.data?.message || err.message);
//                 setLoading(false);
//             }
//         };

//         fetchUserData();
//     }, [isAuthenticated, navigate, getToken]);

//     if (loading) {
//         return <div className="text-center mt-10">טוען...</div>;
//     }

//     if (error) {
//         return <div className="text-center mt-10 text-red-600">שגיאה: {error}</div>;
//     }

//     return (
//         <div className="container mx-auto p-8">
//             <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">האיזור האישי שלי</h2>

//             <div className="bg-white p-6 rounded-lg shadow-md mb-6">
//                 <h3 className="text-xl font-bold mb-4">פרטים אישיים</h3>
//                 <p><strong>שם משתמש:</strong> {userData.username}</p>
//                 <p><strong>מייל:</strong> {userData.email}</p>
//             </div>

//             <div className="bg-white p-6 rounded-lg shadow-md">
//                 <h3 className="text-xl font-bold mb-4">ההזמנות שלי</h3>
//                 {userData.orders.length === 0 ? (
//                     <p className="text-center text-gray-500">אין עדיין הזמנות</p>
//                 ) : (
//                     <ul>
//                         {userData.orders.map((order) => (
//                             <li key={order._id} className="mb-4 border-b pb-4">
//                                 <p><strong>מספר הזמנה:</strong> {order._id}</p>
//                                 <p><strong>תאריך:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
//                                 <p><strong>סה״כ:</strong> ₪{order.totalPrice.toFixed(2)}</p>
//                                 <p><strong>סטטוס:</strong> {order.isDelivered ? 'נשלח' : 'ממתין לטיפול'}</p>
//                                 <ul className="pl-4 mt-2">
//                                     {order.orderItems.map((item) => (
//                                         <li key={item.product?._id || `deleted-product-${order._id}-${Math.random()}`}>
//                                             {item.product?.name ? (
//                                                 <>
//                                                     <p className="text-gray-700">
//                                                         {item.product.name} x {item.quantity}
//                                                     </p>
//                                                     {item.variant && (
//                                                         <p className="text-gray-600 text-sm italic">
//                                                             (צבע: {item.variant.color}, נפח: {item.variant.storage})
//                                                         </p>
//                                                     )}
//                                                 </>
//                                             ) : (
//                                                 <p className="text-gray-500 italic">
//                                                     מוצר אינו קיים יותר (x{item.quantity})
//                                                 </p>
//                                             )}
//                                         </li>
//                                     ))}
//                                 </ul>
//                             </li>
//                         ))}
//                     </ul>
//                 )}
//             </div>
//         </div>
//     );
// };

// export default UserArea;