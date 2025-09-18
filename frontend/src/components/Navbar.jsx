import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { categories } from './categoriesData';
import { FaShoppingCart, FaTimes, FaBars, FaSearch } from 'react-icons/fa';
import SearchDrawer from './SearchDrawer';
import t_tech from '../assets/t_tech.PNG';

const Navbar = ({ onLogout, onSearchChange, searchQuery, onShowLogin, onShowRegister, onToggleDrawer = () => { }, cartItemsCount }) => {
    const { isAuthenticated, user, isAdmin } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isSearchDrawerOpen, setIsSearchDrawerOpen] = useState(false);
    const [openCategory, setOpenCategory] = useState(null);
    const [searchResults, setSearchResults] = useState([]);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const handleCategoryClick = (categoryName) => {
        setOpenCategory(openCategory === categoryName ? null : categoryName);
    };

    const handleSearchChange = (e) => {
        const query = e.target.value;
        onSearchChange(e);

        if (query.length > 2) {
            const dummyProducts = [
                { _id: '1', name: 'אייפון 16', imageUrl: 'https://via.placeholder.com/150' },
                { _id: '2', name: 'Galaxy S24', imageUrl: 'https://via.placeholder.com/150' },
                { _id: '3', name: 'Google Pixel 9', imageUrl: 'https://via.placeholder.com/150' },
            ];
            const filtered = dummyProducts.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
            setSearchResults(filtered);
        } else {
            setSearchResults([]);
        }
    };

    return (
        <nav className="bg-gray-800 shadow-md fixed top-0 w-full z-50">
            <div className="container mx-auto px-6 py-3 flex justify-between items-center">
                {/* Section 1: Logo */}
                <Link to="/" className="text-2xl font-bold text-gray-200 hover:text-white transition-colors duration-300">
                    Top Tech
                </Link>

                {/* Section 2: Desktop Search & Links */}
                <div className="hidden md:flex items-center space-x-8">
                    {/* Desktop Search */}
                    <div className="relative w-full max-w-sm">
                        <input
                            type="text"
                            placeholder="חפש מוצר"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            onFocus={() => setIsSearchDrawerOpen(true)}
                            onBlur={() => setTimeout(() => setIsSearchDrawerOpen(false), 200)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-400 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <SearchDrawer
                            isOpen={isSearchDrawerOpen && searchQuery.length > 0}
                            onClose={() => setIsSearchDrawerOpen(false)}
                            results={searchResults}
                        />
                    </div>

                    {/* Desktop NavLinks */}
                    <div className="flex items-center space-x-4">
                        <div className="hidden md:flex items-center space-x-4">
                            {categories.map((category) => (
                                <div key={category.name} className="relative group">
                                    <button className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white">
                                        {category.name}
                                    </button>
                                    {/* המגירה עצמה */}
                                    <div className="absolute left-0 top-full mt-0 pt-2 w-48 bg-gray-700 text-white rounded-md shadow-lg opacity-0 group-hover:opacity-100 transform scale-95 group-hover:scale-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto">
                                        <ul className="py-2">
                                            {category.subcategories.map((sub) => (
                                                <li key={sub.name}>
                                                    <NavLink
                                                        to={sub.link}
                                                        className="block px-4 py-2 hover:bg-white/10"
                                                    >
                                                        {sub.name}
                                                    </NavLink>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <NavLink to="/" className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white">
                            דף הבית
                        </NavLink>
                        {isAuthenticated && (
                            <span className="text-sm text-gray-300">
                                שלום, {user?.username}
                            </span>
                        )}
                        {isAuthenticated && (
                            <NavLink to="/profile" className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white">
                                איזור אישי
                            </NavLink>
                        )}
                        {isAuthenticated && isAdmin && (
                            <NavLink to="/admin" className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white">
                                איזור מנהל
                            </NavLink>
                        )}
                    </div>

                    {/* Desktop Auth Buttons */}
                    <div className="flex items-center space-x-4">
                        <button onClick={onToggleDrawer} className="relative text-gray-300 hover:text-white focus:outline-none">
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
                                <NavLink to="/login" className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors duration-300">
                                    התחברות
                                </NavLink>
                                <NavLink to="/register" className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors duration-300">
                                    הרשמה
                                </NavLink>
                            </>
                        )}
                    </div>
                </div>

                {/* Section 3: Mobile elements */}
                <div className="flex items-center space-x-6 md:hidden">
                    {/* Mobile Search */}
                    <div className="relative w-full max-w-xs">
                        <input
                            type="text"
                            placeholder="חפש מוצר"
                            value={searchQuery}
                            onChange={onSearchChange}
                            className="w-full pl-10 pr-4 py-2 border rounded-full border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    {/* Cart Button */}
                    <button onClick={onToggleDrawer} className="relative text-gray-300 hover:text-white focus:outline-none">
                        <FaShoppingCart className="h-6 w-6" />
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                            {cartItemsCount}
                        </span>
                    </button>
                    {/* Hamburger Button */}
                    <button onClick={toggleMenu} className="text-gray-300 hover:text-white focus:outline-none focus:text-white">
                        {isOpen ? <FaTimes className="h-6 w-6" /> : <FaBars className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {/* Section 4: Mobile Dropdown Menu */}
            <div className={`md:hidden ${isOpen ? 'block' : 'hidden'} bg-gray-700 border-t border-gray-600`}>
                <div className="px-2 pt-2 pb-3 space-y-1">
                    {/* Mobile Categories */}
                    {categories.map((category) => (
                        <div key={category.name} className="relative">
                            <button onClick={() => handleCategoryClick(category.name)} className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-white/5">
                                {category.name}
                            </button>
                            {openCategory === category.name && (
                                <ul className="pl-4 py-2">
                                    {category.subcategories.map((sub) => (
                                        <li key={sub.name}>
                                            <NavLink
                                                to={sub.link}
                                                className="block px-4 py-2 rounded-md text-sm text-gray-400 hover:bg-white/5"
                                                onClick={toggleMenu}
                                            >
                                                {sub.name}
                                            </NavLink>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                    {/* Mobile NavLinks */}
                    <NavLink to="/" onClick={toggleMenu} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-white/5">דף הבית</NavLink>
                    {isAuthenticated && isAdmin && (
                        <NavLink to="/admin" onClick={toggleMenu} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-white/5">איזור מנהל</NavLink>
                    )}
                    {isAuthenticated ? (
                        <>
                            <NavLink to="/profile" onClick={toggleMenu} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-white/5">איזור אישי</NavLink>
                            <button onClick={() => { onLogout(); toggleMenu(); }} className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-white/5">התנתק</button>
                        </>
                    ) : (
                        <>
                            <NavLink
                                to="/login"
                                onClick={toggleMenu}
                                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-white/5"
                            >
                                התחברות
                            </NavLink>
                            <NavLink
                                to="/register"
                                onClick={toggleMenu}
                                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-white/5"
                            >
                                הרשמה
                            </NavLink>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;