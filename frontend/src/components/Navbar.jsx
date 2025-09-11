import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { FaShoppingCart, FaTimes, FaBars } from 'react-icons/fa';
// import topTechLogo from '../assets/topTechLogo.png';
import t_tech from '../assets/t_tech.PNG';

const Navbar = ({ onLogout, onShowLogin, onShowRegister, onToggleDrawer = () => { }, cartItemsCount }) => {
    const { isAuthenticated, user, isAdmin } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    return (
        <nav className="bg-sky-400 shadow-md fixed top-0 w-full z-50">
            <div className="container mx-auto px-6 py-3 flex justify-between items-center">
                <Link to="/" className="text-xl font-bold text-gray-800">
                    <img src={t_tech} alt="Top Tech Logo" className="h-20" />
                </Link>
                <div className="flex items-center space-x-4">
                    <div className="hidden md:flex items-center space-x-4">
                        <NavLink to="/" className="text-gray-800 hover:text-green-500 transition-colors duration-300">
                            דף הבית
                        </NavLink>
                        {isAuthenticated && (
                            <span className="text-sm text-gray-600">
                                שלום, {user?.username}
                            </span>
                        )}
                        {isAuthenticated && (
                            <NavLink to="/profile" className="text-gray-800 hover:text-green-500 transition-colors duration-300">
                                איזור אישי
                            </NavLink>
                        )}
                        {isAuthenticated && isAdmin && (
                            <NavLink to="/admin" className="text-gray-800 hover:text-green-500 transition-colors duration-300">
                                איזור מנהל
                            </NavLink>
                        )}
                    </div>

                    <button onClick={onToggleDrawer} className="relative text-gray-700 hover:text-gray-900 focus:outline-none">
                        <FaShoppingCart className="h-6 w-6" />
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                            {cartItemsCount}
                        </span>
                    </button>

                    <div className="hidden md:flex items-center space-x-4">
                        {isAuthenticated ? (
                            <button onClick={onLogout} className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors duration-300">
                                התנתק
                            </button>
                        ) : (
                            <>
                                <button onClick={onShowLogin} className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors duration-300">
                                    התחבר
                                </button>
                                <button onClick={onShowRegister} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors duration-300">
                                    הרשמה
                                </button>
                            </>
                        )}
                    </div>

                    <button onClick={toggleMenu} className="md:hidden text-gray-500 hover:text-gray-600 focus:outline-none focus:text-gray-600">
                        {isOpen ? <FaTimes className="h-6 w-6" /> : <FaBars className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            <div className={`md:hidden ${isOpen ? 'block' : 'hidden'} bg-gray-50 border-t border-gray-200`}>
                <div className="px-2 pt-2 pb-3 space-y-1">
                    <NavLink to="/" onClick={toggleMenu} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-200">דף הבית</NavLink>
                    {isAdmin && (
                        <NavLink to="/admin" onClick={toggleMenu} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-200">איזור מנהל</NavLink>
                    )}
                    {isAuthenticated ? (
                        <>
                            <NavLink to="/profile" onClick={toggleMenu} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-200">איזור אישי</NavLink>
                            <button onClick={() => { onLogout(); toggleMenu(); }} className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-200">התנתק</button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => { onShowLogin(); toggleMenu(); }} className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-200">התחבר</button>
                            <button onClick={() => { onShowRegister(); toggleMenu(); }} className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-200">הרשמה</button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;