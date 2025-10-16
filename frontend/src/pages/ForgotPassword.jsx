import { useState } from 'react';
import axios from 'axios';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        try {
            await axios.post(`${__API_URL__}/auth/forgot-password`, { email });
            setMessage('קישור לאיפוס סיסמה נשלח לכתובת המייל שלך. אנא בדוק את תיבת הדואר הנכנס.');
        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError('שגיאה בשליחת הבקשה. אנא נסה שנית מאוחר יותר.');
            }
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-3xl font-bold mb-6 text-center">שחזור סיסמה</h2>
                <p className="text-center text-gray-600 mb-6">אנא הזן את כתובת המייל שלך כדי לקבל קישור לאיפוס סיסמה.</p>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-gray-700 font-semibold mb-2">כתובת מייל:</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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
                        שלח קישור
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;