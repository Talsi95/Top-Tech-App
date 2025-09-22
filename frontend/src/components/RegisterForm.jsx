import { useState } from 'react';
import axios from 'axios';

const RegisterForm = ({ onRegister, showNotification }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${__API_URL__}/auth/register`, formData);

            const { token } = response.data;
            onRegister(token);
            showNotification('הרשמה בוצעה בהצלחה', 'success');
        } catch (error) {
            if (error.response) {
                showNotification(error.response.data.message, 'error');
            } else {
                showNotification(`אופס אירעה שגיאה: ${error.message}`, 'error');
            }
            console.error('Registration failed:', error);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-sm mx-auto">
            <h2 className="text-xl font-bold mb-4">הרשמה</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">שם משתמש</label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight"
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">מייל</label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2">סיסמא</label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight"
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="flex items-center justify-center">
                    <button
                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                        type="submit"
                    >
                        הרשמה
                    </button>
                </div>
            </form>
        </div>
    );
};

export default RegisterForm;