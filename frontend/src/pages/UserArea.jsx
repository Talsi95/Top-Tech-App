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
        return <div className="text-center mt-10">Loading...</div>;
    }

    if (error) {
        return <div className="text-center mt-10 text-red-600">Error: {error}</div>;
    }

    return (
        <div className="container mx-auto p-8">
            <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">My Personal Area</h2>

            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h3 className="text-xl font-bold mb-4">Personal Details</h3>
                <p><strong>Username:</strong> {userData.username}</p>
                <p><strong>Email:</strong> {userData.email}</p>
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
                                    {order.orderItems.map((item, index) => (
                                        <li key={item.product?._id || `deleted-product-${order._id}-${index}`}>
                                            {item.product?.name ? `${item.product.name} x ${item.quantity}` : `Deleted Product (x${item.quantity})`}
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