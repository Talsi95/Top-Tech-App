import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

/**
 * RegisterPage Component.
 * Provides a user interface for new users to create an account.
 * 
 * @param {Object} props - Component props.
 * @param {Function} props.showNotification - Function to display a global notification.
 */
const RegisterPage = ({ showNotification }) => {
    const navigate = useNavigate()
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');

    /**
     * Validates Israeli phone numbers.
     * @param {string} phone - The phone number to validate.
     * @returns {boolean} True if valid, false otherwise.
     */
    const isValidPhone = (phone) => {
        const phoneRegex = /^0(5\d|2|3|4|8|9)-?\d{7}$/;
        return phoneRegex.test(phone);
    };

    /**
     * Handles the registration form submission.
     * @param {Event} e - The form submission event.
     */
    const handleRegister = async (e) => {
        e.preventDefault();

        if (phone && !isValidPhone(phone)) {
            showNotification('אנא הזן מספר טלפון תקין (למשל 0501234567)', 'error');
            return;
        }

        try {
            const response = await axios.post(`${__API_URL__}/auth/register`, {
                username,
                email,
                phone,
                password,
            });

            showNotification('ההרשמה הסתיימה בהצלחה, כעת ניתן להתחבר', 'success');
            navigate('/login');
        } catch (error) {
            console.error("Error registering:", error);

            let errorMessage = 'אופס.. ההרשמה נכשלה';

            if (error.response?.data?.errors) {
                errorMessage = error.response.data.errors[0].msg;
            }
            else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }

            showNotification(errorMessage, 'error');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
                <h2 className="text-center text-3xl font-bold text-gray-900">
                    הרשמה
                </h2>
                <form className="mt-8 space-y-6" onSubmit={handleRegister}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-1">
                                שם מלא:
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                autoComplete="username"
                                required
                                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
                                כתובת אימייל:
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1">
                                מספר טלפון:
                            </label>
                            <input
                                id="phone"
                                name="phone"
                                type="text"
                                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">
                                סיסמה:
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
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
                            הרשמה
                        </button>
                    </div>
                </form>
                <div className="text-center text-sm text-gray-600">
                    <Link to="/login" className="font-medium text-green-600 hover:text-green-500">
                        כבר יש לך חשבון? התחבר
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;