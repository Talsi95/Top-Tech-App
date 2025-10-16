import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const LoginForm = ({ onLogin, showNotification }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${__API_URL__}/auth/login`, {
                email,
                password
            });
            const { token } = response.data;
            onLogin(token);
            showNotification('התחברת בהצלחה', 'success');
        } catch (error) {
            if (error.response) {
                showNotification(error.response.data.message, 'error');
            } else {
                showNotification(`אופס יש תקלה: ${error.message}`, 'error');
            }
            console.error('Login failed:', error);
        }
    };

    return (
        <div className="p-8 max-w-lg mx-auto bg-white rounded-lg shadow-md mt-10">
            <h2 className="text-2xl font-bold mb-6 text-center">התחברות</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">מייל</label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2">סיסמא</label>
                    <input
                        className="shadow appearance-none border w-full py-2 px-3 text-gray-700 leading-tight"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <div className="flex items-center justify-center">
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        type="submit"
                    >
                        התחברות
                    </button>
                    <Link
                        to="/forgot-password"
                        className="inline-block mt-4 text-sm text-blue-500 hover:text-blue-800"
                    >
                        שכחתי סיסמא?
                    </Link>
                </div>
            </form>
        </div>
    );
};

export default LoginForm;