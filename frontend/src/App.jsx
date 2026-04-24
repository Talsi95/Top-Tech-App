import { useState, useCallback } from 'react';
import { Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import ProductFormPage from './pages/ProductFormPage';
import AdminDashboard from './pages/AdminDashboard';
import UserArea from './pages/UserArea';
import ProfileEditPage from './pages/ProfileEditPage';
import HomePage from './pages/HomePage';
import CartDrawer from './components/CartDrawer';
import Notification from './components/Notification';
import Navbar from './components/Navbar';
import CheckoutPage from './pages/CheckoutPage';
import Footer from './components/Footer';
import SearchDrawer from './components/SearchDrawer';
import ShowPage from './pages/ShowPage';
import ProductsPage from './pages/ProductsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import GuestCheckoutPage from './pages/GuestCheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import UpdateVariantForm from './components/UpdateVariantForm';
import Loader from './components/Loader';
import { useAuth } from './AuthContext';

// Hooks
import useProducts from './hooks/useProducts';
import useCart from './hooks/useCart';
import useAdminOrders from './hooks/useAdminOrders';
import useSearch from './hooks/useSearch';


/**
 * Main Application Component.
 * Sets up routing, layout, and top-level state for notifications and drawers.
 */
const App = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isAdmin, logout, getToken } = useAuth();
  const navigate = useNavigate();

  /**
   * Displays a global notification.
   * @param {string} message - The message to show.
   * @param {string} type - The type of notification (e.g., 'success', 'error').
   */
  const showNotification = (message, type) => {
    setNotification({ message, type });
  };

  /**
   * Toggles the shopping cart drawer.
   */
  const toggleCartDrawer = useCallback(() => {
    setIsDrawerOpen(prev => !prev);
  }, []);

  const {
    products,
    loading,
    error,
    handleDeleteProduct
  } = useProducts(searchParams);

  const {
    cartItems,
    handleAddToCart,
    handleUpdateQuantity,
    handleRemoveFromCart,
    handleCreateOrder,
    cartItemsCount,
    totalPrice,
    setCartItems
  } = useCart(isAuthenticated, getToken, showNotification);

  const {
    newOrders,
    markOrderAsSeen
  } = useAdminOrders(isAdmin, isAuthenticated, getToken);

  const {
    searchQuery,
    searchResults,
    isSearchDrawerOpen,
    handleSearchChange,
    toggleSearchDrawer
  } = useSearch(products);

  /**
   * Handles user logout, clearing state and redirecting to the home page.
   */
  const handleLogout = () => {
    logout();
    setCartItems([]);
    navigate('/');
    showNotification('להתראות', 'success');
  };

  if (loading) {
    return <Loader subtext='אנא המתן' />;
  }

  if (error) {
    return <div className="text-center text-red-500 text-xl font-semibold">שגיאה: {error}</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      <Navbar
        onLogout={handleLogout}
        onShowLogin={() => navigate('/login')}
        onShowRegister={() => navigate('/register')}
        cartItemsCount={cartItemsCount}
        onToggleDrawer={toggleCartDrawer}
        onToggleSearchDrawer={toggleSearchDrawer}
        adminNewOrders={newOrders}
        onMarkOrdersAsSeen={markOrderAsSeen}
      />

      <SearchDrawer
        isOpen={isSearchDrawerOpen}
        onClose={toggleSearchDrawer}
        results={searchResults}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
      />

      <CartDrawer
        isOpen={isDrawerOpen}
        onClose={toggleCartDrawer}
        cartItems={cartItems}
        onRemoveFromCart={handleRemoveFromCart}
        onUpdateQuantity={handleUpdateQuantity}
        totalPrice={totalPrice}
      />

      <div className="pt-28 flex-grow">
        <main>
          <Routes>
            <Route path="/" element={
              <HomePage
                products={products}
                handleAddToCart={handleAddToCart}
                handleDeleteProduct={(id) => handleDeleteProduct(id, getToken, showNotification)}
                showNotification={showNotification}
              />
            } />
            <Route path="/profile" element={<UserArea />} />
            <Route path="/profile/edit" element={<ProfileEditPage showNotification={showNotification} />} />
            <Route path="/admin" element={<AdminDashboard showNotification={showNotification} />} />
            <Route path="/product-form/:id" element={<ProductFormPage showNotification={showNotification} />} />
            <Route path="/product-form" element={<ProductFormPage showNotification={showNotification} />} />
            <Route path="/login" element={<LoginPage showNotification={showNotification} />} />
            <Route path="/register" element={<RegisterPage showNotification={showNotification} />} />
            <Route path="/guest-checkout" element={<GuestCheckoutPage showNotification={showNotification} />} />
            <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage showNotification={showNotification} />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/admin/update-variant/:id" element={<UpdateVariantForm />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route
              path="/product/:id"
              element={<ShowPage onAddToCart={handleAddToCart} />}
            />
            <Route path="/checkout" element={
              <CheckoutPage
                cartItems={cartItems}
                showNotification={showNotification}
                onOrderComplete={handleCreateOrder}
              />
            } />
          </Routes>
        </main>
      </div>
      <Notification message={notification.message} type={notification.type} onClose={() => setNotification({ message: '', type: '' })} />
      <Footer />
    </div>
  );
};

export default App;