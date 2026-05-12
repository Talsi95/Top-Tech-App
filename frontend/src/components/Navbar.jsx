import { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { FaShoppingCart, FaTimes, FaBars, FaSearch, FaUserCircle } from 'react-icons/fa';
import { useAuth } from '../AuthContext';
import AdminNotifications from './AdminNotifications';

/**
 * Navbar Component.
 */
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
    const [isScrolled, setIsScrolled] = useState(false);
    const { user, isAuthenticated, isAdmin, isGuest } = useAuth();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const activeLinkClass = "text-primary font-bold relative after:absolute after:-bottom-1 after:right-0 after:w-full after:h-0.5 after:bg-primary after:rounded-full";
    const navLinkClass = "text-gray-600 hover:text-primary font-medium transition-all duration-300";

    return (
        <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled ? 'py-3 bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20' : 'py-5 bg-transparent'}`}>
            <div className="max-w-[1440px] mx-auto px-6 flex flex-row-reverse justify-between items-center">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 group-hover:rotate-12 transition-transform duration-500">
                        <span className="text-white font-black text-xl">T</span>
                    </div>
                    <span className="text-2xl font-black text-gray-900 tracking-tighter group-hover:text-primary transition-colors">Top Tech</span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex flex-row-reverse items-center space-x-reverse space-x-10">
                    <div className="flex flex-row-reverse items-center space-x-reverse space-x-8">
                        <NavLink to="/" className={({ isActive }) => isActive ? activeLinkClass : navLinkClass}>דף הבית</NavLink>
                        <NavLink to="/repair-lab" className={({ isActive }) => isActive ? activeLinkClass : navLinkClass}>מעבדת תיקונים</NavLink>
                        {isAuthenticated && (
                            <NavLink to="/profile" className={({ isActive }) => isActive ? activeLinkClass : navLinkClass}>איזור אישי</NavLink>
                        )}
                        {isAuthenticated && isAdmin && (
                            <NavLink to="/admin" className={({ isActive }) => isActive ? activeLinkClass : navLinkClass}>איזור מנהל</NavLink>
                        )}
                    </div>

                    {/* Action Group */}
                    <div className="flex flex-row-reverse items-center space-x-reverse space-x-6 border-r border-gray-200 pr-10">
                        {/* Search */}
                        <button
                            onClick={onToggleSearchDrawer}
                            className="p-2.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all group"
                        >
                            <FaSearch size={20} className="group-hover:scale-110 transition-transform" />
                        </button>

                        {/* Notifications (Admin) */}
                        {isAdmin && (
                            <AdminNotifications
                                newOrders={adminNewOrders}
                                onMarkOrderAsSeen={onMarkOrdersAsSeen}
                            />
                        )}

                        {/* Cart */}
                        <button 
                            onClick={onToggleDrawer} 
                            className="relative p-2.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all group"
                        >
                            <FaShoppingCart size={22} className="group-hover:scale-110 transition-transform" />
                            {cartItemsCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 bg-primary text-white text-[10px] font-black rounded-full h-5 w-5 flex items-center justify-center border-2 border-white shadow-sm animate-in zoom-in duration-300">
                                    {cartItemsCount}
                                </span>
                            )}
                        </button>

                        {/* Auth */}
                        {isAuthenticated ? (
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">מחובר כ</p>
                                    <p className="text-xs font-black text-gray-900">{isGuest ? "אורח" : user?.username}</p>
                                </div>
                                <button 
                                    onClick={onLogout} 
                                    className="px-5 py-2.5 bg-gray-900 text-white text-xs font-black rounded-xl hover:bg-primary hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95"
                                >
                                    התנתק
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-row-reverse items-center gap-3">
                                <button 
                                    onClick={onShowLogin} 
                                    className="px-6 py-2.5 bg-primary text-white text-sm font-black rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-95"
                                >
                                    התחברות
                                </button>
                                <button 
                                    onClick={onShowRegister} 
                                    className="px-6 py-2.5 text-gray-600 text-sm font-bold hover:text-primary transition-all"
                                >
                                    הרשמה
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Menu Button */}
                <div className="flex flex-row-reverse items-center gap-4 md:hidden">
                    {/* Search */}
                    <button
                        onClick={onToggleSearchDrawer}
                        className="p-2 text-gray-400"
                    >
                        <FaSearch size={20} />
                    </button>

                    {/* Cart */}
                    <button 
                        onClick={onToggleDrawer} 
                        className="relative p-2 text-gray-400"
                    >
                        <FaShoppingCart size={24} />
                        {cartItemsCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-black rounded-full h-5 w-5 flex items-center justify-center border-2 border-white">
                                {cartItemsCount}
                            </span>
                        )}
                    </button>

                    {/* Hamburger */}
                    <button 
                        onClick={toggleMobileMenu} 
                        className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-xl text-gray-900"
                    >
                        {isMobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
                    </button>
                </div>
            </div>

            {/* Mobile Dropdown Menu */}
            <div className={`md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-2xl border-b border-gray-100 overflow-hidden transition-all duration-500 ${isMobileMenuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                <div className="p-6 space-y-4 text-right flex flex-col">
                    <NavLink to="/" onClick={toggleMobileMenu} className="text-xl font-black text-gray-900 p-2">דף הבית</NavLink>
                    <NavLink to="/repair-lab" onClick={toggleMobileMenu} className="text-xl font-black text-gray-900 p-2">מעבדת תיקונים</NavLink>
                    {isAuthenticated && (
                        <NavLink to="/profile" onClick={toggleMobileMenu} className="text-xl font-black text-gray-900 p-2">איזור אישי</NavLink>
                    )}
                    {isAuthenticated && isAdmin && (
                        <NavLink to="/admin" onClick={toggleMobileMenu} className="text-xl font-black text-gray-900 p-2">איזור מנהל</NavLink>
                    )}
                    <hr className="border-gray-100" />
                    {isAuthenticated ? (
                        <button onClick={() => { onLogout(); toggleMobileMenu(); }} className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl">התנתק</button>
                    ) : (
                        <div className="space-y-3">
                            <button onClick={() => { onShowLogin(); toggleMobileMenu(); }} className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20">התחברות</button>
                            <button onClick={() => { onShowRegister(); toggleMobileMenu(); }} className="w-full py-4 text-gray-600 font-bold">הרשמה</button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;