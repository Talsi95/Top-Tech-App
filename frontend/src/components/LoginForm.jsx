import { useState } from 'react';

const LoginForm = ({ onLogin, showNotification }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5001/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (response.ok) {
                // התיקון נמצא כאן: העבר את האסימון ל-onLogin
                onLogin(data.token);
                showNotification('Login successful!', 'success');
            } else {
                const errorMessage = data.errors ? data.errors[0].msg : data.message || 'Login failed';
                showNotification(errorMessage, 'error');
            }
        } catch (error) {
            showNotification(`There was an error: ${error.message}`, 'error');
        }
    };

    return (
        <div className="p-8 max-w-lg mx-auto bg-white rounded-lg shadow-md mt-10">
            <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
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
                        Login
                    </button>
                </div>
            </form>
        </div>
    );
};

export default LoginForm;