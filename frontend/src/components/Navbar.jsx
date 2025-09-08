import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const Navbar = ({ onLogout, onShowLogin, onShowRegister }) => {
    const { isAuthenticated, user, isAdmin } = useAuth();

    return (
        <nav className="bg-white shadow-md">
            <div className="container mx-auto px-6 py-3 flex justify-between items-center">
                <Link to="/" className="text-xl font-bold text-gray-800">
                    Top Tech
                </Link>
                <div className="flex items-center space-x-4">
                    <NavLink to="/" className="text-gray-800 hover:text-green-500 transition-colors duration-300">
                        Home
                    </NavLink>
                    {isAuthenticated && (
                        <span className="text-sm text-gray-600">
                            Welcome, {user.username}
                        </span>
                    )}
                    {isAuthenticated && (
                        <NavLink to="/profile" className="text-gray-800 hover:text-green-500 transition-colors duration-300">
                            My Profile
                        </NavLink>
                    )}
                    {isAuthenticated && isAdmin && (
                        <NavLink to="/admin" className="text-gray-800 hover:text-green-500 transition-colors duration-300">
                            Admin Dashboard
                        </NavLink>
                    )}
                    {!isAuthenticated ? (
                        <>
                            <button
                                onClick={onShowLogin}
                                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors duration-300"
                            >
                                Login
                            </button>
                            <button
                                onClick={onShowRegister}
                                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors duration-300"
                            >
                                Register
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onLogout}
                            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors duration-300"
                        >
                            Logout
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;