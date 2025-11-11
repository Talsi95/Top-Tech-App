import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const LoginPage = ({ showNotification }) => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const errorMessages = {
        INVALID_PASSWORD: 'הסיסמה שגויה',
        USER_NOT_FOUND: 'המשתמש לא נמצא',
        VALIDATION_FAILED: 'הנתונים שהוזנו לא תקינים',
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${__API_URL__}/auth/login`, {
                email,
                password
            });
            const { token } = response.data;
            login(token);
            showNotification('התחברת בהצלחה', 'success');
            navigate('/');
        } catch (error) {
            if (error.response) {
                const { errorCode } = error.response.data;
                const errorMessage = errorMessages[errorCode] || 'אירעה שגיאה, אנא נסה שוב';
                showNotification(errorMessage, 'error');
            } else {
                showNotification(`אופס יש תקלה: ${error.message}`, 'error');
            }
            console.error('Login failed:', error);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
                <h2 className="text-center text-3xl font-bold text-gray-900">
                    התחברות
                </h2>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email" className="sr-only">
                                כתובת אימייל
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                                placeholder="כתובת אימייל"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <div>
                                <label htmlFor="password" className="sr-only">
                                    סיסמה
                                </label>
                            </div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                                placeholder="סיסמה"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <Link
                                to="/forgot-password"
                                className="text-xs text-green-600 hover:text-green-500"
                            >
                                שכחתי סיסמא?
                            </Link>
                        </div>
                    </div>
                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            התחבר
                        </button>
                    </div>
                </form>
                <div className="text-center text-sm text-gray-600">
                    <Link to="/register" className="font-medium text-green-600 hover:text-green-500">
                        עדיין אין לך חשבון? הרשמה
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;