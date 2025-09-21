import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios'; // ייבוא ספריית Axios

const LoginPage = ({ showNotification }) => {
    const { login } = useAuth();
    const navigate = useNavigate();

    // State for form inputs
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            // שימוש ב-Axios במקום ב-fetch
            const response = await axios.post('/api/auth/login', {
                email,
                password,
            });

            const { token } = response.data; // Axios מחלץ אוטומטית את ה-JSON מהתגובה

            if (token) {
                login(token);
                showNotification('התחברת בהצלחה', 'success');
                navigate('/'); // הפנייה לדף הבית לאחר התחברות מוצלחת
            } else {
                showNotification('Invalid token received', 'error');
            }
        } catch (error) {
            console.error("Error logging in:", error);
            // Axios מספק גישה קלה לתשובת השרת במקרה של שגיאה
            const errorMessage = error.response?.data?.message || 'אופס.. אחד מהנתונים שגוי';
            showNotification(errorMessage, 'error');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
                <h2 className="text-center text-3xl font-bold text-gray-900">
                    התחברות
                </h2>
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
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
                            <label htmlFor="password" className="sr-only">
                                סיסמה
                            </label>
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