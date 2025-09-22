import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import Notification from './Notification';
import axios from 'axios';

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isAdmin, getToken } = useAuth();

    useEffect(() => {
        const fetchUsers = async () => {
            if (!isAdmin) {
                setError('אין לך הרשאה להיכנס לדף זה');
                setLoading(false);
                return;
            }

            try {
                const token = getToken();
                if (!token) {
                    setError('Authentication token not found.');
                    setLoading(false);
                    return;
                }

                const response = await axios.get(`${__API_URL__}/auth`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                setUsers(response.data);
            } catch (err) {
                if (err.response) {
                    setError(err.response.data.message || 'אירעה שגיאה בשליפת הנתונים');
                } else {
                    setError(err.message);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [isAdmin, getToken]);

    if (loading) {
        return <div className="text-center">טוען נתונים...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500">{error}</div>;
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-4">כל המשתמשים</h3>
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
                                    מנהל מערכת
                                </span>
                            )}
                        </li>
                    ))
                ) : (
                    <p className="text-center text-gray-500">אין משתמשים עדיין</p>
                )}
            </ul>
        </div>
    );
};

export default UserList;