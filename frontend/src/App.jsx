import { useState, useCallback, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import useStoreNavigate from './hooks/useStoreNavigate';
import HomePage from './pages/HomePage';
import CartDrawer from './components/CartDrawer';
import Notification from './components/Notification';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SearchDrawer from './components/SearchDrawer';
import Loader from './components/Loader';
import { useAuth } from './AuthContext';
import { useStore } from './StoreContext';
import ScrollToTop from './components/ScrollToTop';
import { AccessibilityMenu } from './components/AccessibilityMenu';
import { AccessibilityProvider } from './AccessibilityContext';
import PaymentSuccess from './components/PaymentSuccess';

// Hooks
import useCart from './hooks/useCart';
import useAdminOrders from './hooks/useAdminOrders';

// Lazy loaded pages
const ProductFormPage = lazy(() => import('./pages/ProductFormPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const UserArea = lazy(() => import('./pages/UserArea'));
const ProfileEditPage = lazy(() => import('./pages/ProfileEditPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const ShowPage = lazy(() => import('./pages/ShowPage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const GuestCheckoutPage = lazy(() => import('./pages/GuestCheckoutPage'));
const OrderConfirmationPage = lazy(() => import('./pages/OrderConfirmationPage'));
const UpdateVariantForm = lazy(() => import('./components/UpdateVariantForm'));
const RepairLab = lazy(() => import('./pages/RepairLab'));
const ArticlesPage = lazy(() => import('./pages/ArticlesPage'));
const ArticleShowPage = lazy(() => import('./pages/ArticleShowPage'));
const AccessibilityPage = lazy(() => import('./pages/AccessibilityPage'));


/**
 * Main Application Component.
 * Sets up routing, layout, and top-level state for notifications and drawers.
 */
const App = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const { isAuthenticated, isAdmin, logout, getToken } = useAuth();
  const { store } = useStore();
  const navigate = useStoreNavigate();

  /**
   * Displays a global notification.
   * @param {string} message - The message to show.
   * @param {string} type - The type of notification (e.g., 'success', 'error').
   */
  const showNotification = useCallback((message, type) => {
    setNotification({ message, type });
  }, []);

  /**
   * Toggles the shopping cart drawer.
   */
  const toggleCartDrawer = useCallback(() => {
    if (store?.features?.hasCart) {
      setIsDrawerOpen(prev => !prev);
    }
  }, [store?.features?.hasCart]);

  const {
    cartItems,
    handleAddToCart,
    handleUpdateQuantity,
    handleRemoveFromCart,
    handleCreateOrder,
    cartItemsCount,
    totalPrice,
    clearCart
  } = useCart(isAuthenticated, getToken, showNotification);

  const {
    newOrders,
    markOrderAsSeen
  } = useAdminOrders(isAdmin, isAuthenticated, getToken);

  const [isSearchDrawerOpen, setIsSearchDrawerOpen] = useState(false);
  const toggleSearchDrawer = useCallback(() => {
    setIsSearchDrawerOpen(prev => !prev);
  }, []);

  /**
   * Handles user logout, clearing state and redirecting to the home page.
   */
  const handleLogout = () => {
    logout();
    setCartItems([]);
    navigate('/');
    showNotification('להתראות', 'success');
  };

  return (
    <AccessibilityProvider>
      <div className="bg-surface min-h-screen flex flex-col">
        <ScrollToTop />
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

        {store?.features?.cartDrawer !== false && (
          <SearchDrawer
            isOpen={isSearchDrawerOpen}
            onClose={toggleSearchDrawer}
          />
        )}

        {store?.features?.cartDrawer !== false && store?.features?.hasCart && (
          <CartDrawer
            isOpen={isDrawerOpen}
            onClose={toggleCartDrawer}
            cartItems={cartItems}
            onRemoveFromCart={handleRemoveFromCart}
            onUpdateQuantity={handleUpdateQuantity}
            totalPrice={totalPrice}
          />
        )}

        <div className="pt-20 flex-grow">
          <main>
            <Suspense fallback={<Loader subtext="אנא המתן" />}>
              <Routes>
                <Route path="" element={
                  <HomePage
                    handleAddToCart={handleAddToCart}
                    showNotification={showNotification}
                  />
                } />
                <Route path="accessibility" element={<AccessibilityPage />} />
                {store?.features?.hasUserAccounts && (
                  <>
                    <Route path="profile" element={<UserArea />} />
                    <Route path="profile/edit" element={<ProfileEditPage showNotification={showNotification} />} />
                    <Route path="login" element={<LoginPage showNotification={showNotification} />} />
                    <Route path="register" element={<RegisterPage showNotification={showNotification} />} />
                    <Route path="forgot-password" element={<ForgotPassword />} />
                    <Route path="reset-password" element={<ResetPassword />} />
                  </>
                )}

                {store?.features?.hasCheckout && store?.features?.hasCart && (
                  <>
                    <Route path="guest-checkout" element={<GuestCheckoutPage showNotification={showNotification} />} />
                    <Route path="checkout" element={
                      <CheckoutPage
                        cartItems={cartItems}
                        showNotification={showNotification}
                        onOrderComplete={handleCreateOrder}
                      />
                    } />
                  </>
                )}

                <Route path="admin" element={<AdminDashboard showNotification={showNotification} />} />
                <Route path="product-form/:id" element={<ProductFormPage showNotification={showNotification} />} />
                <Route path="product-form" element={<ProductFormPage showNotification={showNotification} />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="order-confirmation/:orderId" element={<OrderConfirmationPage showNotification={showNotification} clearCart={clearCart} />} />
                <Route path="admin/update-variant/:id" element={<UpdateVariantForm />} />
                <Route path="products" element={<ProductsPage getToken={getToken} showNotification={showNotification} />} />
                <Route path="repair-lab" element={<RepairLab />} />
                {store?.features?.hasArticles && (
                  <>
                    <Route path="articles" element={<ArticlesPage />} />
                    <Route path="articles/:articleSlug" element={<ArticleShowPage />} />
                  </>
                )}
                <Route
                  path="products/:productSlug"
                  element={<ShowPage onAddToCart={handleAddToCart} />}
                />
                <Route
                  path="product/:id"
                  element={<ShowPage onAddToCart={handleAddToCart} />}
                />
              </Routes>
            </Suspense>
          </main>
        </div>
        <Notification message={notification.message} type={notification.type} onClose={() => setNotification({ message: '', type: '' })} />
        <Footer />
        <AccessibilityMenu />

      </div>
    </AccessibilityProvider>
  );
};

export default App;