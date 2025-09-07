import { useState, useEffect, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProductFormPage from './pages/ProductFormPage';
import AdminDashboard from './pages/AdminDashboard';
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

// קומפוננטת AdminPage שתכיל את הטופס (ProductForm)
const AdminPage = ({ showNotification }) => (
  <div className="flex justify-center">
    <ProductForm showNotification={showNotification} />
  </div>
);

const App = () => {
  const [cartItems, setCartItems] = useState([]);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  // const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });
  // const [selectedProduct, setSelectedProduct] = useState(null);
  // שינוי כאן: הסרנו את getToken מהפירוק של useAuth
  const { user, isAuthenticated, isAdmin, login, logout } = useAuth();

  const showNotification = (message, type) => {
    setNotification({ message, type });
  };

  const saveCart = useCallback(async (currentCart) => {
    if (!isAuthenticated) return;
    try {
      // שינוי כאן: משתמשים ב-localStorage.getItem ישירות במקום בפונקציה getToken
      const token = localStorage.getItem('token');
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

  const loadCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCartItems([]);
      return;
    }
    try {
      // שינוי כאן: משתמשים ב-localStorage.getItem ישירות במקום בפונקציה getToken
      const token = localStorage.getItem('token');
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
  }, [isAuthenticated]);

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
      // Determine the price to use: salePrice if on sale, otherwise regular price
      const priceToUse = product.isOnSale ? product.salePrice : product.price;

      const isItemInCart = prevItems.find((item) => item._id === product._id);

      if (isItemInCart) {
        return prevItems.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1, price: priceToUse } // Update price as well
            : item
        );
      }

      // If the item is not in the cart, add it with the correct price
      return [...prevItems, { ...product, quantity: 1, price: priceToUse }];
    };

    setCartItems(updatedItems);
    await saveCart(updatedItems(cartItems));
    showNotification(`${product.name} added to cart`, 'success');
  };

  const handleUpdateQuantity = async (productId, action) => {
    // 1. צור מערך חדש של העגלה עם הכמות המעודכנת
    const updatedCart = cartItems
      .map((item) => {
        if (item._id === productId) {
          const newQuantity = action === 'increase' ? item.quantity + 1 : item.quantity - 1;
          // אם הכמות יורדת לאפס, אנחנו נסיר את הפריט מהעגלה
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
        }
        return item;
      })
      .filter(Boolean); // מסנן את כל הפריטים שהפכו ל-null

    // ודא שכל הפריטים במערך החדש מכילים _id
    const finalCart = updatedCart.filter(item => item && item._id);

    // 2. עדכן את המצב המקומי של React
    setCartItems(finalCart);

    // 3. שלח את העגלה המעודכנת לשרת
    await saveCart(finalCart);

    showNotification('Cart updated successfully.', 'success');
  };

  const handleRemoveFromCart = async (productId) => {
    const updatedCart = cartItems.filter((item) => item._id !== productId);

    // ודא שכל הפריטים במערך החדש מכילים _id
    const finalCart = updatedCart.filter(item => item && item._id);

    setCartItems(finalCart);
    await saveCart(finalCart);

    showNotification('Product removed from cart', 'success');
  };

  // const handleCheckout = () => {
  //   if (!isAuthenticated) {
  //     showNotification('You must be logged in to checkout!', 'error');
  //     setShowLogin(true);
  //   } else {
  //     setIsCheckingOut(true);
  //   }
  // };

  const handleOrderComplete = () => {
    setCartItems([]);
    setIsCheckingOut(false);
  }

  // const handleUpdateProduct = (product) => {
  //   setSelectedProduct(product);
  // };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const token = localStorage.getItem('token');
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
            <Route path="/admin" element={<AdminDashboard showNotification={showNotification} />} />
            <Route path="/product-form/:id" element={<ProductFormPage showNotification={showNotification} />} />
            <Route path="/product-form" element={<ProductFormPage showNotification={showNotification} />} />
            <Route path="/checkout" element={
              <CheckoutForm
                cartItems={cartItems}
                showNotification={showNotification}
                onOrderComplete={handleOrderComplete}
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