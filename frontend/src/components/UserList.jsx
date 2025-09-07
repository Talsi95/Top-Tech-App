import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import Notification from './Notification';

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isAdmin, getToken } = useAuth();

    useEffect(() => {
        const fetchUsers = async () => {
            if (!isAdmin) {
                setError('You do not have permission to view this page.');
                setLoading(false);
                return;
            }

            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setError('Authentication token not found.');
                    setLoading(false);
                    return;
                }

                const response = await fetch('http://localhost:5001/api/auth', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch users');
                }

                const data = await response.json();
                setUsers(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [isAdmin]);

    if (loading) {
        return <div className="text-center">Loading users...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500">{error}</div>;
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-4">User List</h3>
            <ul className="divide-y divide-gray-200">
                {users.length > 0 ? (
                    users.map((user) => (
                        <li key={user._id} className="py-4 flex justify-between items-center">
                            <div>
                                <p className="text-lg font-semibold">{user.username}</p>
                                <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                            {user.isAdmin && (
                                <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                    Admin
                                </span>
                            )}
                        </li>
                    ))
                ) : (
                    <p className="text-center text-gray-500">No users found.</p>
                )}
            </ul>
        </div>
    );
};

export default UserList;