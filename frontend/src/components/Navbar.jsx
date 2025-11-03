import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { FaShoppingCart, FaTimes, FaBars, FaSearch } from 'react-icons/fa';
import { useAuth } from '../AuthContext';
import AdminNotifications from './AdminNotifications';

const Navbar = ({
    onLogout,
    onShowLogin,
    onShowRegister,
    onToggleDrawer = () => { },
    cartItemsCount,
    onToggleSearchDrawer,
    adminNewOrders = [],
    onMarkOrdersAsSeen
}) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { user, isAuthenticated, isAdmin } = useAuth();

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    return (
        <nav className="bg-gray-800 shadow-md sticky top-0 w-full z-50">
            <div className="container mx-auto px-6 py-3 flex flex-row-reverse justify-between items-center">
                {/* Section 1: Logo */}
                <Link to="/" className="text-2xl font-bold text-gray-200 hover:text-white transition-colors duration-300">
                    Top Tech
                </Link>

                {/* Section 2: Desktop Links */}
                <div className="hidden md:flex flex-row-reverse items-center space-x-reverse space-x-8">
                    {/* Desktop Search Button */}
                    <button onClick={onToggleSearchDrawer} className="text-gray-200 hover:text-white focus:outline-none">
                        <FaSearch className="h-6 w-6" />
                    </button>

                    {/* Desktop NavLinks */}
                    <div className="flex flex-row-reverse items-center space-x-reverse space-x-8">
                        <NavLink to="/" className="text-gray-200 hover:text-white transition-colors duration-300">
                            דף הבית
                        </NavLink>
                        {isAuthenticated && (
                            <span className="text-sm text-gray-400">
                                שלום, {user?.username}
                            </span>
                        )}
                        {isAuthenticated && (
                            <NavLink to="/profile" className="text-gray-200 hover:text-white transition-colors duration-300">
                                איזור אישי
                            </NavLink>
                        )}
                        {isAuthenticated && isAdmin && (
                            <NavLink to="/admin" className="text-gray-200 hover:text-white transition-colors duration-300">
                                איזור מנהל
                            </NavLink>
                        )}
                    </div>

                    {/* Desktop Auth Buttons */}
                    <div className="flex flex-row-reverse items-center space-x-reverse space-x-8">
                        {isAdmin && (
                            <AdminNotifications
                                newOrders={adminNewOrders}
                                onMarkOrderAsSeen={onMarkOrdersAsSeen}
                            />
                        )}
                        <button onClick={onToggleDrawer} className="relative text-gray-200 hover:text-white focus:outline-none">
                            <FaShoppingCart className="h-6 w-6" />
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                                {cartItemsCount}
                            </span>
                        </button>
                        {isAuthenticated ? (
                            <button onClick={onLogout} className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors duration-300">
                                התנתק
                            </button>
                        ) : (
                            <>
                                <button onClick={onShowLogin} className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors duration-300">
                                    התחברות
                                </button>
                                <button onClick={onShowRegister} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors duration-300">
                                    הרשמה
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Section 3: Mobile elements (always visible) */}
                <div className="flex flex-row-reverse items-center space-x-6 md:hidden">
                    {isAdmin && (
                        <AdminNotifications
                            newOrders={adminNewOrders}
                            onMarkOrderAsSeen={onMarkOrdersAsSeen}
                        />
                    )}
                    {/* Mobile Search Button */}
                    <button onClick={onToggleSearchDrawer} className="text-gray-200 hover:text-white focus:outline-none">
                        <FaSearch className="h-6 w-6" />
                    </button>
                    {/* Cart Button */}
                    <button onClick={onToggleDrawer} className="relative text-gray-200 hover:text-white focus:outline-none">
                        <FaShoppingCart className="h-6 w-6" />
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                            {cartItemsCount}
                        </span>
                    </button>
                    {/* Hamburger Button */}
                    <button onClick={toggleMobileMenu} className="text-gray-200 hover:text-white focus:outline-none focus:text-white">
                        {isMobileMenuOpen ? <FaTimes className="h-6 w-6" /> : <FaBars className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {/* Section 4: Mobile Dropdown Menu (hidden on desktop) */}
            <div className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'} bg-gray-700 border-t border-gray-600`}>
                <div className="px-2 pt-2 pb-3 space-y-1 text-right">
                    <NavLink to="/" onClick={toggleMobileMenu} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-white/5">דף הבית</NavLink>
                    {isAdmin && (
                        <NavLink to="/admin" onClick={toggleMobileMenu} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-white/5">איזור מנהל</NavLink>
                    )}
                    {isAuthenticated ? (
                        <>
                            <NavLink to="/profile" onClick={toggleMobileMenu} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-white/5">איזור אישי</NavLink>
                            <button onClick={() => { onLogout(); toggleMobileMenu(); }} className="w-full text-right px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-white/5">התנתק</button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => { onShowLogin(); toggleMobileMenu(); }} className="w-full text-right px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-white/5">התחברות</button>
                            <button onClick={() => { onShowRegister(); toggleMobileMenu(); }} className="w-full text-right px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-white/5">הרשמה</button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;