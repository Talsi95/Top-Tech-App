import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import ProductFormPage from './pages/ProductFormPage';
import AdminDashboard from './pages/AdminDashboard';
import UserArea from './pages/UserArea';
import HomePage from './pages/HomePage';
import ProductList from './components/ProductList';
import ShoppingCart from './components/ShoppingCart';
import CartDrawer from './components/CartDrawer';
import ProductForm from './components/ProductForm';
import Notification from './components/Notification';
import RegisterForm from './components/RegisterForm';
import LoginForm from './components/LoginForm';
import Navbar from './components/NavBar';
import Footer from './components/Footer';
import CheckoutForm from './components/CheckoutForm';
import { useAuth } from './AuthContext';
import axios from 'axios';


const App = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const { user, isAuthenticated, isAdmin, login, logout, getToken } = useAuth();
  const navigate = useNavigate();

  const showNotification = (message, type) => {
    setNotification({ message, type });
  };

  const toggleCartDrawer = useCallback(() => {
    setIsDrawerOpen(prev => !prev);
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:5001/api/products');
      setProducts(response.data);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError("Failed to load products. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const saveCart = useCallback(async (currentCart) => {
    if (!isAuthenticated) return;
    try {
      const token = getToken();
      if (!token) {
        console.error('No token found, cannot save cart.');
        return;
      }

      const simplifiedCart = currentCart.map(item => ({
        product: item.product._id,
        quantity: item.quantity
      }));

      await axios.post('http://localhost:5001/api/cart',
        { cartItems: simplifiedCart },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log('Cart saved to server successfully.');
    } catch (err) {
      console.error("Failed to save cart:", err.response ? err.response.data : err.message);
      throw new Error('Failed to save cart on server');
    }
  }, [isAuthenticated, getToken]);

  const loadCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCartItems([]);
      return;
    }
    try {
      const token = getToken();
      const response = await axios.get('http://localhost:5001/api/cart', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setCartItems(response.data);

    } catch (err) {
      console.error("Failed to load cart:", err.response ? err.response.data : err.message);
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
      showNotification('התחברת בהצלחה', 'success');
      setShowLogin(false);
      setShowRegister(false);
    } catch (error) {
      console.error("Error decoding token:", error);
      showNotification('אופס.. אחד מהנתונים שגוי', 'error');
    }
  };

  const handleLogout = () => {
    logout();
    setCartItems([]);
    showNotification('התנתק בהצלחה', 'success');
  };

  const handleAddToCart = useCallback(async (product) => {
    setCartItems(prevItems => {
      const isItemInCart = prevItems.find((item) => item.product._id === product._id);

      const priceToUse = product.isOnSale ? product.salePrice : product.price;

      let newCart;
      if (isItemInCart) {
        newCart = prevItems.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newCart = [...prevItems, { product: { ...product, price: priceToUse }, quantity: 1 }];
      }

      saveCart(newCart);
      return newCart;
    });

    showNotification(`${product.name} נוסף לעגלה`, 'success');
  }, [saveCart, showNotification]);

  const handleUpdateQuantity = useCallback(async (productId, action) => {
    setCartItems(prevItems => {
      const updatedCart = prevItems
        .map((item) => {
          if (item.product._id === productId) {
            const newQuantity = action === 'increase' ? item.quantity + 1 : item.quantity - 1;
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
          }
          return item;
        })
        .filter(Boolean);

      saveCart(updatedCart);
      return updatedCart;
    });
    showNotification('עגלה עודכנה בהצלחה', 'success');
  }, [saveCart, showNotification]);

  const handleRemoveFromCart = useCallback(async (productId) => {
    setCartItems(prevItems => {
      const updatedCart = prevItems.filter((item) => item.product._id !== productId);
      saveCart(updatedCart);
      return updatedCart;
    });
    showNotification('מוצר הוסר מהעגלה', 'success');
  }, [saveCart, showNotification]);

  const handleDeleteProduct = useCallback(async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const token = getToken();
        await axios.delete(`http://localhost:5001/api/products/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setProducts(prevProducts => prevProducts.filter(product => product._id !== id));
        showNotification('מוצר נמחק בהצלחה', 'success');

      } catch (err) {
        const errorMessage = err.response ? err.response.data.message : err.message;
        showNotification(errorMessage, 'error');
      }
    }
  }, [getToken, showNotification]);

  const handleCreateOrder = async (orderData) => {
    try {
      const response = await axios.post('http://localhost:5001/api/orders', orderData, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const data = response.data;
      showNotification('הזמנה בוצעה בהצלחה', 'success');

      setCartItems([]);
      await saveCart([]);

      navigate('/');

      return { success: true, orderId: data._id };

    } catch (error) {
      const errorMessage = error.response ? error.response.data.message : error.message;
      showNotification(`שגיאה: ${errorMessage}`, 'error');

      return { success: false, message: errorMessage };
    }
  };

  const cartItemsCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = cartItems.reduce((total, item) => {
    return total + (item.product?.price * item.quantity || 0);
  }, 0);

  if (loading) {
    return <div className="text-center text-xl font-semibold">טוען מוצרים...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 text-xl font-semibold">שגיאה: {error}</div>;
  }


  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      <Navbar
        onLogout={handleLogout}
        onShowLogin={() => { setShowLogin(true); setShowRegister(false); }}
        onShowRegister={() => { setShowRegister(true); setShowLogin(false); }}
        cartItemsCount={cartItemsCount}
        onToggleDrawer={toggleCartDrawer}
        isAuthenticated={isAuthenticated}
        isAdmin={isAdmin}
        user={user}
      />

      <CartDrawer
        isOpen={isDrawerOpen}
        onClose={toggleCartDrawer}
        cartItems={cartItems}
        onRemoveFromCart={handleRemoveFromCart}
        onUpdateQuantity={handleUpdateQuantity}
        totalPrice={totalPrice}
      />

      <div className="pt-28 container mx-auto p-8 flex-grow">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">ברוכים הבאים לטופ טק</h1>
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
                products={products}
                handleAddToCart={handleAddToCart}
                handleDeleteProduct={handleDeleteProduct}
                showNotification={showNotification}
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
      </div>
      <Notification message={notification.message} type={notification.type} onClose={() => setNotification({ message: '', type: '' })} />
      <Footer />
    </div>
  );
};

export default App;



{/* <div className="bg-gray-100 min-h-screen flex flex-col">
    //   <div className='pt-20'>
    //     <Navbar */}
//       onLogout={handleLogout}
//       onShowLogin={() => { setShowLogin(true); setShowRegister(false); }}
//       onShowRegister={() => { setShowRegister(true); setShowLogin(false); }}
//       cartItemsCount={cartItemsCount}
//       onToggleDrawer={toggleCartDrawer}
//     />

//     <CartDrawer
//       isOpen={isDrawerOpen}
//       onClose={toggleCartDrawer}
//       cartItems={cartItems}
//       onRemoveFromCart={handleRemoveFromCart}
//       onUpdateQuantity={handleUpdateQuantity}
//       totalPrice={totalPrice}
//     />
//     <div className="container mx-auto p-8 flex-grow">
//       <header className="text-center mb-8">
//         <h1 className="text-4xl font-bold text-gray-800">ברוכים הבאים לטופ טק</h1>
//         {!isAuthenticated && (showLogin || showRegister) && (
//           <div className="mt-4 flex justify-center space-x-4">
//             {showLogin && <LoginForm onLogin={handleLogin} showNotification={showNotification} />}
//             {showRegister && <RegisterForm onRegister={handleLogin} showNotification={showNotification} />}
//           </div>
//         )}
//       </header>
//       <main>
//         <Routes>
//           <Route path="/" element={
//             <HomePage
//               products={products}
//               cartItems={cartItems}
//               handleAddToCart={handleAddToCart}
//               handleUpdateQuantity={handleUpdateQuantity}
//               handleRemoveFromCart={handleRemoveFromCart}
//               showNotification={showNotification}
//               handleDeleteProduct={handleDeleteProduct}
//             />
//           } />
//           <Route path="/profile" element={<UserArea />} />
//           <Route path="/admin" element={<AdminDashboard showNotification={showNotification} />} />
//           <Route path="/product-form/:id" element={<ProductFormPage showNotification={showNotification} />} />
//           <Route path="/product-form" element={<ProductFormPage showNotification={showNotification} />} />
//           <Route path="/checkout" element={
//             <CheckoutForm
//               cartItems={cartItems}
//               showNotification={showNotification}
//               onOrderComplete={handleCreateOrder}
//             />
//           } />
//         </Routes>
//       </main>
//     </div>
// <Notification message={notification.message} type={notification.type} onClose={() => setNotification({ message: '', type: '' })} />
//   </div>
//   <Footer />
// </div >