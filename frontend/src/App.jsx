import { useState, useEffect, useCallback } from 'react';
import ProductList from './components/ProductList';
import ShoppingCart from './components/ShoppingCart';
import ProductForm from './components/ProductForm';
import Notification from './components/Notification';
import RegisterForm from './components/RegisterForm';
import LoginForm from './components/LoginForm';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CheckoutForm from './components/CheckoutForm';
import { useAuth } from './AuthContext';

const App = () => {
  const [cartItems, setCartItems] = useState([]);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const { user, isAuthenticated, isAdmin, login, logout } = useAuth();

  const showNotification = (message, type) => {
    setNotification({ message, type });
  };

  // פונקציה לשמירת העגלה בשרת
  const saveCart = useCallback(async (currentCart) => {
    if (!isAuthenticated) return;
    try {
      const token = localStorage.getItem('token'); // התיקון כאן: קבלת האסימון מ-localStorage

      // אם אין אסימון, לא ניתן לשמור את העגלה
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
  }, [isAuthenticated]);

  // פונקציה לטעינת העגלה מהשרת
  const loadCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCartItems([]);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/cart', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        // נמיר את נתוני העגלה מהשרת לפורמט המתאים לקומפוננטה
        const formattedCart = data.map(item => ({
          ...item.product,
          quantity: item.quantity
        }));
        setCartItems(formattedCart);
      }
    } catch (err) {
      console.error("Failed to load cart:", err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const handleLogin = (token) => {
    // הוספת בדיקה לוודא שהאסימון הוא מחרוזת
    if (typeof token !== 'string' || !token) {
      showNotification('Invalid or empty token received. Please try again.', 'error');
      console.error('Expected a string token, but received:', token);
      return; // יציאה מהפונקציה
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
      const isItemInCart = prevItems.find((item) => item._id === product._id);
      if (isItemInCart) {
        return prevItems.map((item) =>
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { ...product, quantity: 1 }];
    };
    setCartItems(updatedItems);
    await saveCart(updatedItems(cartItems));
    showNotification(`${product.name} added to cart`, 'success');
  };

  const handleUpdateQuantity = async (productId, action) => {
    const updatedItems = (prevItems) => {
      const updated = prevItems.map((item) => {
        if (item._id === productId) {
          const newQuantity = action === 'increase' ? item.quantity + 1 : item.quantity - 1;
          if (newQuantity <= 0) {
            return null;
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(Boolean);
      return updated;
    };
    setCartItems(updatedItems);
    await saveCart(updatedItems(cartItems));
  };

  const handleRemoveFromCart = async (productId) => {
    const updatedItems = (prevItems) => {
      const removedItem = prevItems.find(item => item._id === productId);
      if (removedItem) {
        showNotification(`${removedItem.name} removed from cart`, 'success');
      }
      return prevItems.filter((item) => item._id !== productId);
    };
    setCartItems(updatedItems);
    await saveCart(updatedItems(cartItems));
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      showNotification('You must be logged in to checkout!', 'error');
      setShowLogin(true);
    } else {
      setIsCheckingOut(true);
    }
  };

  const handleOrderComplete = () => {
    setCartItems([]); // איפוס העגלה לאחר הזמנה
    setIsCheckingOut(false);
  }


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
          {isCheckingOut ? (
            <CheckoutForm
              cartItems={cartItems}
              showNotification={showNotification}
              onOrderComplete={handleOrderComplete}
            />
          ) : (
            <>
              {isAuthenticated && isAdmin && <ProductForm showNotification={showNotification} />}
              <hr className="my-10 border-gray-300" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                  <ProductList
                    onAddToCart={handleAddToCart}
                    showNotification={showNotification}
                  />
                </div>
                <div>
                  <ShoppingCart
                    cartItems={cartItems}
                    onRemoveFromCart={handleRemoveFromCart}
                    onUpdateQuantity={handleUpdateQuantity}
                    onCheckout={handleCheckout}
                  />
                </div>
              </div>
            </>
          )}
        </main>
        <Notification message={notification.message} type={notification.type} onClose={() => setNotification({ message: '', type: '' })} />
      </div>
      <Footer />
    </div>
  );
};

export default App;