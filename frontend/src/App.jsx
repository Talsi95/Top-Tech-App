import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import ProductFormPage from './pages/ProductFormPage';
import AdminDashboard from './pages/AdminDashboard';
import UserArea from './pages/UserArea';
import ProductList from './components/ProductList';
import ShoppingCart from './components/ShoppingCart';
import ProductForm from './components/ProductForm';
import Notification from './components/Notification';
import RegisterForm from './components/RegisterForm';
import LoginForm from './components/LoginForm';
import Navbar from './components/NavBar';
import Footer from './components/Footer';
import CheckoutForm from './components/CheckoutForm';
import { useAuth } from './AuthContext';

const HomePage = ({ cartItems, handleAddToCart, handleUpdateQuantity, handleRemoveFromCart, showNotification, handleDeleteProduct }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
    <div className="md:col-span-2">
      <ProductList
        onAddToCart={handleAddToCart}
        showNotification={showNotification}
        onDeleteProduct={handleDeleteProduct}
      />
    </div>
    <div>
      <ShoppingCart
        cartItems={cartItems}
        onRemoveFromCart={handleRemoveFromCart}
        onUpdateQuantity={handleUpdateQuantity}
      />
    </div>
  </div>
);

const AdminPage = ({ showNotification }) => (
  <div className="flex justify-center">
    <ProductForm showNotification={showNotification} />
  </div>
);

const App = () => {
  const [cartItems, setCartItems] = useState([]);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const { user, isAuthenticated, isAdmin, login, logout, getToken } = useAuth();

  const showNotification = (message, type) => {
    setNotification({ message, type });
  };
  const navigate = useNavigate();

  const saveCart = useCallback(async (currentCart) => {
    if (!isAuthenticated) return;
    try {
      const token = getToken();
      if (!token) {
        console.error('No token found, cannot save cart.');
        return;
      }
      const response = await fetch('http://localhost:5001/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ cartItems: currentCart })
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error response:', errorData);
        throw new Error('Failed to save cart on server');
      }
    } catch (err) {
      console.error("Failed to save cart:", err);
    }
  }, [isAuthenticated, getToken]);

  const loadCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCartItems([]);
      return;
    }
    try {
      const token = getToken();
      const response = await fetch('http://localhost:5001/api/cart', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const formattedCart = data.map(item => ({
          ...item.product,
          quantity: item.quantity
        }));
        setCartItems(formattedCart);
      }
    } catch (err) {
      console.error("Failed to load cart:", err);
    }
  }, [isAuthenticated, getToken]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const handleLogin = (token) => {
    if (typeof token !== 'string' || !token) {
      showNotification('Invalid or empty token received. Please try again.', 'error');
      console.error('Expected a string token, but received:', token);
      return;
    }

    try {
      login(token);
      showNotification('Logged in successfully!', 'success');
      setShowLogin(false);
      setShowRegister(false);
    } catch (error) {
      console.error("Error decoding token:", error);
      showNotification('Failed to log in. Please check your credentials.', 'error');
    }
  };

  const handleLogout = () => {
    logout();
    setCartItems([]);
    showNotification('Logged out successfully.', 'success');
  };

  const handleAddToCart = async (product) => {
    const updatedItems = (prevItems) => {
      const priceToUse = product.isOnSale ? product.salePrice : product.price;

      const isItemInCart = prevItems.find((item) => item._id === product._id);

      if (isItemInCart) {
        return prevItems.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1, price: priceToUse }
            : item
        );
      }

      return [...prevItems, { ...product, quantity: 1, price: priceToUse }];
    };

    setCartItems(updatedItems);
    await saveCart(updatedItems(cartItems));
    showNotification(`${product.name} added to cart`, 'success');
  };

  const handleUpdateQuantity = async (productId, action) => {
    const updatedCart = cartItems
      .map((item) => {
        if (item._id === productId) {
          const newQuantity = action === 'increase' ? item.quantity + 1 : item.quantity - 1;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
        }
        return item;
      })
      .filter(Boolean);

    const finalCart = updatedCart.filter(item => item && item._id);

    setCartItems(finalCart);

    await saveCart(finalCart);

    showNotification('Cart updated successfully.', 'success');
  };

  const handleRemoveFromCart = async (productId) => {
    const updatedCart = cartItems.filter((item) => item._id !== productId);

    const finalCart = updatedCart.filter(item => item && item._id);

    setCartItems(finalCart);
    await saveCart(finalCart);

    showNotification('Product removed from cart', 'success');
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const token = getToken();
        const response = await fetch(`http://localhost:5001/api/products/${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          showNotification('Product deleted successfully!', 'success');
          window.location.reload();
        } else {
          const errorData = await response.json();
          showNotification(errorData.message, 'error');
        }
      } catch (err) {
        showNotification(`Error deleting product: ${err.message}`, 'error');
      }
    }
  };
  const handleCreateOrder = async (orderData) => {
    try {
      const response = await fetch('http://localhost:5001/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to place order');
      }

      const data = await response.json();
      showNotification('Order placed successfully!', 'success');

      setCartItems([]);
      await saveCart([]);

      navigate('/');
      return { success: true, orderId: data._id };
    } catch (error) {
      showNotification(`Error: ${error.message}`, 'error');
      return { success: false, message: error.message };
    }
  };


  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      <Navbar
        onLogout={handleLogout}
        onShowLogin={() => { setShowLogin(true); setShowRegister(false); }}
        onShowRegister={() => { setShowRegister(true); setShowLogin(false); }}
      />
      <div className="container mx-auto p-8 flex-grow">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">My Veggies App</h1>
          {!isAuthenticated && (showLogin || showRegister) && (
            <div className="mt-4 flex justify-center space-x-4">
              {showLogin && <LoginForm onLogin={handleLogin} showNotification={showNotification} />}
              {showRegister && <RegisterForm onRegister={handleLogin} showNotification={showNotification} />}
            </div>
          )}
        </header>
        <main>
          <Routes>
            <Route path="/" element={
              <HomePage
                cartItems={cartItems}
                handleAddToCart={handleAddToCart}
                handleUpdateQuantity={handleUpdateQuantity}
                handleRemoveFromCart={handleRemoveFromCart}
                showNotification={showNotification}
                handleDeleteProduct={handleDeleteProduct}
              />
            } />
            <Route path="/profile" element={<UserArea />} />
            <Route path="/admin" element={<AdminDashboard showNotification={showNotification} />} />
            <Route path="/product-form/:id" element={<ProductFormPage showNotification={showNotification} />} />
            <Route path="/product-form" element={<ProductFormPage showNotification={showNotification} />} />
            <Route path="/checkout" element={
              <CheckoutForm
                cartItems={cartItems}
                showNotification={showNotification}
                onOrderComplete={handleCreateOrder}
              />
            } />
          </Routes>
        </main>
        <Notification message={notification.message} type={notification.type} onClose={() => setNotification({ message: '', type: '' })} />
      </div>
      <Footer />
    </div>
  );
};

export default App;