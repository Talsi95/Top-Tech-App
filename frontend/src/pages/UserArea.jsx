import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

const UserArea = () => {
    const { isAuthenticated, user, getToken } = useAuth();
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // אם המשתמש לא מחובר, נווט אותו לדף הבית
        if (!isAuthenticated) {
            navigate('/');
            return;
        }

        const fetchUserData = async () => {
            try {
                // קריאת API מאובטחת לשרת
                const response = await fetch('http://localhost:5001/api/auth/profile', {
                    headers: {
                        Authorization: `Bearer ${getToken()}` // שליחת הטוקן לצורך אימות
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch user data');
                }

                const data = await response.json();
                setUserData(data); // שמירת הנתונים במצב הקומפוננטה
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchUserData();
    }, [isAuthenticated, navigate, getToken]);

    // אם עדיין טוען נתונים, הצג הודעת טעינה
    if (loading) {
        return <div className="text-center mt-10">Loading...</div>;
    }

    // אם הייתה שגיאה, הצג אותה למשתמש
    if (error) {
        return <div className="text-center mt-10 text-red-600">Error: {error}</div>;
    }

    // אם הכל תקין, הצג את התוכן של האזור האישי
    return (
        <div className="container mx-auto p-8">
            <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">My Personal Area</h2>

            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h3 className="text-xl font-bold mb-4">Personal Details</h3>
                <p><strong>Username:</strong> {user.username}</p>
                <p><strong>Email:</strong> {user.email}</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-4">My Past Orders</h3>
                {userData.orders.length === 0 ? (
                    <p className="text-center text-gray-500">No orders found.</p>
                ) : (
                    <ul>
                        {userData.orders.map((order) => (
                            <li key={order._id} className="mb-4 border-b pb-4">
                                <p><strong>Order ID:</strong> {order._id}</p>
                                <p><strong>Order Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                                <p><strong>Total Price:</strong> ${order.totalPrice.toFixed(2)}</p>
                                <p><strong>Status:</strong> {order.isDelivered ? 'Delivered' : 'Pending'}</p>
                                <ul className="pl-4 mt-2">
                                    {order.orderItems.map(item => (
                                        <li key={item.product._id}>
                                            {item.product.name} x {item.quantity}
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