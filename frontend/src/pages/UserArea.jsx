import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const UserArea = () => {
    const { isAuthenticated, user, getToken } = useAuth();
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/');
            return;
        }

        const fetchUserData = async () => {
            try {
                const token = getToken();
                if (!token) throw new Error('Authentication token not found');

                const response = await axios.get('http://localhost:5001/api/auth/profile', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                });
                setUserData(response.data)
                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.message || err.message);
                setLoading(false);
            }
        };

        fetchUserData();
    }, [isAuthenticated, navigate, getToken]);

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
                {userData.orders.length === 0 ? (
                    <p className="text-center text-gray-500">אין עדיין הזמנות</p>
                ) : (
                    <ul>
                        {userData.orders.map((order) => (
                            <li key={order._id} className="mb-4 border-b pb-4">
                                <p><strong>מספר הזמנה:</strong> {order._id}</p>
                                <p><strong>תאריך:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                                <p><strong>סה״כ:</strong> ${order.totalPrice.toFixed(2)}</p>
                                <p><strong>סטטוס:</strong> {order.isDelivered ? 'נשלח' : 'ממתין לטיפול'}</p>
                                <ul className="pl-4 mt-2">
                                    {order.orderItems.map((item, index) => (
                                        <li key={item.product?._id || `deleted-product-${order._id}-${index}`}>
                                            {item.product?.name ? `${item.product.name} x ${item.quantity}` : `מוצר אינו קיים יותר (x${item.quantity})`}
                                        </li>
                                    ))}
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