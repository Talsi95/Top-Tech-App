import React from 'react';
import { useAuth } from '../AuthContext';

const Navbar = ({ onLogout, onShowLogin, onShowRegister }) => {
    const { isAuthenticated, user } = useAuth();

    return (
        <nav className="bg-gray-800 p-4 text-white shadow-md">
            <div className="container mx-auto flex justify-between items-center">
                <a href="/" className="text-2xl font-bold text-green-400">My Veggies</a>
                <div className="flex items-center space-x-4">
                    {isAuthenticated ? (
                        <>
                            <span className="text-lg">Welcome, {user.username}!</span>
                            <button
                                onClick={onLogout}
                                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={onShowLogin}
                                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                            >
                                Login
                            </button>
                            <button
                                onClick={onShowRegister}
                                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                            >
                                Register
                            </button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;