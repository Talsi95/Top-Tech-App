import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [token, setToken] = useState(null);

    useEffect(() => {
        const urlToken = searchParams.get('token');
        if (urlToken) {
            setToken(urlToken);
        } else {
            setError('לא נמצא טוקן לאיפוס סיסמה. הקישור אינו תקין.');
        }
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (!token) {
            setError('שגיאה: טוקן לא קיים. אנא נסה לשחזר את הסיסמה שוב.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('הסיסמאות אינן תואמות.');
            return;
        }

        try {
            await axios.post(`${__API_URL__}/auth/reset-password`, { token, newPassword });
            setMessage('הסיסמה אופסה בהצלחה! תועבר לדף ההתחברות בעוד מספר שניות...');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError('שגיאה באיפוס הסיסמה. אנא נסה שנית מאוחר יותר.');
            }
        }
    };

    if (!token && !error) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
                <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
                    <p>טוען...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-3xl font-bold mb-6 text-center">איפוס סיסמה</h2>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="newPassword" className="block text-gray-700 font-semibold mb-2">סיסמה חדשה:</label>
                        <input
                            type="password"
                            id="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="confirmPassword" className="block text-gray-700 font-semibold mb-2">אימות סיסמה:</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                            required
                        />
                    </div>

                    {message && <p className="text-green-600 text-center mb-4">{message}</p>}
                    {error && <p className="text-red-600 text-center mb-4">{error}</p>}

                    <button
                        type="submit"
                        className="w-full bg-sky-500 text-white font-bold py-2 px-4 rounded-md hover:bg-sky-600 transition-colors duration-300"
                    >
                        אפס סיסמה
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;