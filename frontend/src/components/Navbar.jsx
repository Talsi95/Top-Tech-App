import { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { FaShoppingCart, FaTimes, FaBars, FaSearch, FaUserCircle } from 'react-icons/fa';
import { useAuth } from '../AuthContext';
import { useStore } from '../StoreContext';
import AdminNotifications from './AdminNotifications';
import StoreLink from './StoreLink';
import StoreNavLink from './StoreNavLink';
import axios from 'axios';

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
    const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState(null);
    const { user, isAuthenticated, isAdmin, isGuest } = useAuth();
    const { store, categories, isLoadingCategories } = useStore();

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
        <nav className={`fixed top-0 w-full z-[100] transition-all duration-500 ${isScrolled ? 'py-3 bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20' : 'py-5 bg-transparent'}`}>
            <div className="max-w-[1440px] mx-auto px-6 flex flex-row-reverse justify-between items-center">
                {/* Logo */}
                <StoreLink to="/" className="flex items-center gap-3 group">
                    {store?.design?.logoUrl ? (
                        <img
                            src={store.design.logoUrl}
                            alt={store.name}
                            className="h-10 w-auto object-contain max-w-[150px] transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 group-hover:rotate-12 transition-transform duration-500">
                            <span className="text-white font-black text-xl">{store?.name?.[0] || 'T'}</span>
                        </div>
                    )}
                    <span className="text-2xl font-black text-gray-900 tracking-tighter group-hover:text-primary transition-colors">{store?.name || "Top Tech"}</span>
                </StoreLink>

                {/* Desktop Navigation */}
                <div className="hidden md:flex flex-row-reverse items-center space-x-reverse space-x-10">
                    {/* categories */}
                    <div
                        className="relative group py-2"
                        onMouseEnter={() => setIsCategoriesOpen(true)}
                        onMouseLeave={() => { setIsCategoriesOpen(false); setActiveCategory(null); }}
                    >
                        <button className={`flex items-center gap-1 ${navLinkClass} h-full`}>
                            <span>כל הקטגוריות</span>
                            <svg className={`w-4 h-4 transition-transform duration-300 ${isCategoriesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </button>

                        {isCategoriesOpen && categories && categories.length > 0 && (
                            <div className="absolute right-0 top-full w-64 text-right animate-in fade-in slide-in-from-top-5 duration-200 z-[110]">
                                <div className="bg-white/95 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-xl p-3 flex flex-col gap-1">
                                    {categories.map((category) => (
                                        <div
                                            key={category.id || category._id}
                                            className="relative"
                                            onMouseEnter={() => setActiveCategory(category.id || category._id)}
                                        >
                                            <StoreLink
                                                to={`/products?category=${encodeURIComponent(category.name)}`}
                                                state={{ categoryName: category.name }}
                                                className={`flex items-center justify-between p-3 rounded-xl transition-all ${activeCategory === (category.id || category._id) ? 'bg-primary/5 text-primary font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
                                            >
                                                <svg className={`w-3.5 h-3.5 transition-transform ${activeCategory === (category.id || category._id) ? '-translate-x-1' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                                                <span>{category.name}</span>
                                            </StoreLink>

                                            {activeCategory === (category.id || category._id) && category.subcategories?.length > 0 && (
                                                <div className="absolute right-full top-0 pr-2 w-56 text-right animate-in fade-in slide-in-from-right-2 duration-200">
                                                    <div className="bg-white/95 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-xl p-3 flex flex-col gap-1">
                                                        {category.subcategories.map((sub) => (
                                                            <StoreLink
                                                                key={sub.id || sub._id}
                                                                to={`/products?category=${encodeURIComponent(category.name)}&subcategory=${encodeURIComponent(sub.name)}`}
                                                                state={{ categoryName: category.name }}
                                                                className="p-2.5 text-sm text-gray-600 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                                                            >
                                                                {sub.name}
                                                            </StoreLink>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-row-reverse items-center space-x-reverse space-x-8">
                        <StoreNavLink to="/" className={({ isActive }) => isActive ? activeLinkClass : navLinkClass}>דף הבית</StoreNavLink>
                        {store?.features?.hasRepairLab && (
                            <StoreNavLink to="/repair-lab" className={({ isActive }) => isActive ? activeLinkClass : navLinkClass}>מעבדת תיקונים</StoreNavLink>
                        )}
                        {/* {store?.features?.hasArticles && (
                            <StoreNavLink to="/articles" className={({ isActive }) => isActive ? activeLinkClass : navLinkClass}>מאמרים ובלוג</StoreNavLink>
                        )} */}
                        {isAuthenticated && store?.features?.hasUserAccounts && (
                            <StoreNavLink to="/profile" className={({ isActive }) => isActive ? activeLinkClass : navLinkClass}>איזור אישי</StoreNavLink>
                        )}
                        {isAuthenticated && isAdmin && (
                            <StoreNavLink to="/admin" className={({ isActive }) => isActive ? activeLinkClass : navLinkClass}>איזור מנהל</StoreNavLink>
                        )}
                    </div>

                    {/* Action Group */}
                    <div className="flex flex-row-reverse items-center space-x-reverse space-x-6 border-r border-gray-200 pr-10">
                        {/* Search */}
                        {store?.features?.cartDrawer !== false && (
                            <button
                                onClick={onToggleSearchDrawer}
                                aria-label="חיפוש"
                                className="p-2.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all group"
                            >
                                <FaSearch size={20} className="group-hover:scale-110 transition-transform" />
                            </button>
                        )}

                        {/* Notifications (Admin) */}
                        {isAdmin && (
                            <AdminNotifications
                                newOrders={adminNewOrders}
                                onMarkOrderAsSeen={onMarkOrdersAsSeen}
                            />
                        )}

                        {/* Cart */}
                        {store?.features?.hasCart && (
                            <button
                                onClick={onToggleDrawer}
                                aria-label="עגלת קניות"
                                className="relative p-2.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all group"
                            >
                                <FaShoppingCart size={22} className="group-hover:scale-110 transition-transform" />
                                {cartItemsCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 bg-primary text-white text-[10px] font-black rounded-full h-5 w-5 flex items-center justify-center border-2 border-white shadow-sm animate-in zoom-in duration-300">
                                        {cartItemsCount}
                                    </span>
                                )}
                            </button>
                        )}

                        {/* Auth */}
                        {store?.features?.hasUserAccounts && (
                            isAuthenticated ? (
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
                            )
                        )}
                    </div>
                </div>

                {/* Mobile Menu Button */}
                <div className="flex flex-row-reverse items-center gap-4 md:hidden">
                    {/* Search */}
                    {store?.features?.cartDrawer !== false && (
                        <button
                            onClick={onToggleSearchDrawer}
                            aria-label="חיפוש"
                            className="p-2 text-gray-400"
                        >
                            <FaSearch size={20} />
                        </button>
                    )}

                    {/* Cart */}
                    {store?.features?.hasCart && (
                        <button
                            onClick={onToggleDrawer}
                            aria-label="עגלת קניות"
                            className="relative p-2 text-gray-400"
                        >
                            <FaShoppingCart size={24} />
                            {cartItemsCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-black rounded-full h-5 w-5 flex items-center justify-center border-2 border-white">
                                    {cartItemsCount}
                                </span>
                            )}
                        </button>
                    )}

                    {/* Hamburger */}
                    <button
                        onClick={toggleMobileMenu}
                        aria-label="תפריט"
                        className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-xl text-gray-900"
                    >
                        {isMobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
                    </button>
                </div>
            </div>

            {/* Mobile Dropdown Menu */}
            <div className={`md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-2xl border-b border-gray-100 overflow-hidden transition-all duration-500 z-50 ${isMobileMenuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                <div className="p-6 space-y-4 text-right flex flex-col">

                    <StoreNavLink to="/" onClick={toggleMobileMenu} className="text-xl font-black text-gray-900 p-2">דף הבית</StoreNavLink>
                    {categories && categories.length > 0 && (
                        <div className="flex flex-col text-right" dir="rtl">
                            <button
                                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                                className="text-xl font-black text-gray-900 p-2 flex flex-row items-center justify-between w-full text-right"
                            >
                                <span>כל הקטגוריות</span>
                                <svg className={`w-5 h-5 transition-transform duration-300 ${isCategoriesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                            </button>

                            <div className={`transition-all duration-300 overflow-hidden pr-4 flex flex-col gap-2 ${isCategoriesOpen ? 'max-h-[1000px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                                {categories.map((category) => {
                                    const categoryId = category.id || category._id;
                                    const isSubOpen = activeCategory === categoryId;

                                    return (
                                        <div key={categoryId} className="flex flex-col border-b border-gray-50 pb-1 text-right">
                                            <div className="flex flex-row items-center justify-between w-full p-2">
                                                <StoreLink
                                                    to={`/products?category=${encodeURIComponent(category.name)}`}
                                                    state={{ categoryName: category.name }}
                                                    onClick={toggleMobileMenu}
                                                    className={`text-lg font-bold text-gray-700 transition-colors text-right flex-1`}
                                                >
                                                    {category.name}
                                                </StoreLink>

                                                {category.subcategories?.length > 0 && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setActiveCategory(isSubOpen ? null : categoryId);
                                                        }}
                                                        className={`p-2 text-gray-500 hover:text-primary transition-colors mr-auto ${isSubOpen ? 'text-primary' : ''}`}
                                                        type="button"
                                                    >
                                                        <svg className={`w-5 h-5 transition-transform duration-200 ${isSubOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                                    </button>
                                                )}
                                            </div>

                                            {category.subcategories?.length > 0 && (
                                                <div className={`transition-all duration-300 overflow-hidden pr-4 flex flex-col border-r-2 border-gray-100 mr-2 ${isSubOpen ? 'max-h-[500px] opacity-100 my-1' : 'max-h-0 opacity-0'}`}>
                                                    {category.subcategories.map((sub) => (
                                                        <StoreLink
                                                            key={sub.id || sub._id}
                                                            to={`/products?category=${encodeURIComponent(category.name)}&subcategory=${encodeURIComponent(sub.name)}`}
                                                            state={{ categoryName: category.name }}
                                                            onClick={toggleMobileMenu}
                                                            className="p-2.5 text-sm text-gray-500 hover:text-primary transition-colors text-right"
                                                        >
                                                            {sub.name}
                                                        </StoreLink>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    {store?.features?.hasRepairLab && (
                        <StoreNavLink to="/repair-lab" onClick={toggleMobileMenu} className="text-xl font-black text-gray-900 p-2">מעבדת תיקונים</StoreNavLink>
                    )}
                    {/* {store?.features?.hasArticles && (
                        <StoreNavLink to="/articles" onClick={toggleMobileMenu} className="text-xl font-black text-gray-900 p-2">מאמרים ובלוג</StoreNavLink>
                    )} */}
                    {isAuthenticated && (
                        <StoreNavLink to="/profile" onClick={toggleMobileMenu} className="text-xl font-black text-gray-900 p-2">איזור אישי</StoreNavLink>
                    )}
                    {isAuthenticated && isAdmin && (
                        <StoreNavLink to="/admin" onClick={toggleMobileMenu} className="text-xl font-black text-gray-900 p-2">איזור מנהל</StoreNavLink>
                    )}
                    <hr className="border-gray-100" />
                    {store?.features?.hasUserAccounts && (
                        isAuthenticated ? (
                            <button onClick={() => { onLogout(); toggleMobileMenu(); }} className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl">התנתק</button>
                        ) : (
                            <div className="space-y-3">
                                <button onClick={() => { onShowLogin(); toggleMobileMenu(); }} className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20">התחברות</button>
                                <button onClick={() => { onShowRegister(); toggleMobileMenu(); }} className="w-full py-4 text-gray-600 font-bold">הרשמה</button>
                            </div>
                        )
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;