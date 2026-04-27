import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

/**
 * Hook to manage the shopping cart, including local storage persistence and server-side synchronization.
 * @param {boolean} isAuthenticated - Whether the user is logged in.
 * @param {Function} getToken - Function to get the current auth token.
 * @param {Function} showNotification - Function to show notifications to the user.
 */
const useCart = (isAuthenticated, getToken, showNotification) => {
  const [cartItems, setCartItems] = useState([]);

  const isGuestUser = useCallback(() => {
    const token = getToken();
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return !!payload.isGuest;
    } catch (e) {
      return true;
    }
  }, [getToken]);

  /**
   * Saves the current cart to local storage and attempts to sync it with the server if authenticated.
   * @param {Array} currentCart - The current items in the cart.
   */
  const saveCart = useCallback(async (currentCart) => {
    localStorage.setItem('cartItems', JSON.stringify(currentCart));
    try {
      const token = getToken();
      if (!isAuthenticated || isGuestUser()) {
        return;
      }


      const simplifiedCart = currentCart.map(item => ({
        product: item.product._id,
        variant: item.variant ? item.variant._id : null,
        quantity: item.quantity
      }));

      await axios.post(`${__API_URL__}/cart`,
        { cartItems: simplifiedCart },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
    } catch (err) {
      console.error("Failed to save cart:", err.response ? err.response.data : err.message);
      throw new Error('Failed to save cart on server');
    }
  }, [getToken]);

  /**
   * Loads the cart from local storage or the server (if authenticated).
   * Synchronizes local and server carts if necessary.
   */
  const loadCart = useCallback(async () => {
    const storedCart = localStorage.getItem('cartItems');
    let localCart = [];
    if (storedCart) {
      try {
        localCart = JSON.parse(storedCart).filter(item => item.product);
      } catch (e) {
        console.error("Failed to parse cart data from localStorage", e);
        localStorage.removeItem('cartItems');
      }
    }

    if (!isAuthenticated || isGuestUser()) {
      setCartItems(localCart);
      return;
    }

    try {
      const token = getToken();
      if (!token) {
        setCartItems(localCart);
        return;
      }
      const response = await axios.get(`${__API_URL__}/cart`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dbCart = response.data.filter(item => item.product); // Ensure no null products from DB

      if (localCart.length > 0) {
        if (dbCart.length === 0 || dbCart.length < localCart.length) {
          await saveCart(localCart);
          setCartItems(localCart);
        } else {
          setCartItems(dbCart);
          localStorage.removeItem('cartItems');
        }
      } else {
        setCartItems(dbCart);
      }
    } catch (err) {
      console.error("Failed to load cart from DB:", err.response ? err.response.data : err.message);
      setCartItems(localCart);
    }
  }, [isAuthenticated, getToken, saveCart]);

  // Initial load of the cart.
  useEffect(() => {
    loadCart();
  }, [loadCart]);

  /**
   * Adds a product variant to the cart.
   * @param {Object} product - The product object.
   * @param {Object} variant - The specific variant of the product.
   */
  const handleAddToCart = useCallback(async (product, variant) => {
    if (!product || !variant) {
      showNotification('שגיאה: לא נבחרה וריאציה למוצר', 'error');
      return;
    }

    setCartItems(prevItems => {
      const isItemInCart = prevItems.find(
        (item) => item.product && item.product._id === product._id && item.variant?._id === variant._id
      );

      let newCart;
      if (isItemInCart) {
        newCart = prevItems.map((item) =>
          item.product && item.product._id === product._id && item.variant?._id === variant._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newCart = [...prevItems, { product, variant, quantity: 1 }];
      }

      saveCart(newCart);
      return newCart;
    });

    showNotification(`${product.name} נוסף לעגלה`, 'success');
  }, [saveCart, showNotification]);

  /**
   * Updates the quantity of a specific product variant in the cart.
   * @param {string} productId - ID of the product.
   * @param {string} variantId - ID of the variant.
   * @param {string} action - 'increase' or 'decrease'.
   */
  const handleUpdateQuantity = useCallback(async (productId, variantId, action) => {
    setCartItems(prevItems => {
      const updatedCart = prevItems
        .map((item) => {
          if (item.product && item.product._id === productId && item.variant?._id === variantId) {
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

  /**
   * Removes a specific product variant from the cart.
   * @param {string} productId - ID of the product.
   * @param {string} variantId - ID of the variant.
   */
  const handleRemoveFromCart = useCallback(async (productId, variantId) => {
    setCartItems(prevItems => {
      const updatedCart = prevItems.filter(
        (item) => !(item.product && item.product._id === productId && item.variant?._id === variantId)
      );
      saveCart(updatedCart);
      return updatedCart;
    });
    showNotification('מוצר הוסר מהעגלה', 'success');
  }, [saveCart, showNotification]);

  /**
   * Finalizes an order and clears the cart on success.
   * @param {Object} orderData - Data for the order being placed.
   * @param {string} [authToken] - Optional override auth token.
   */
  const handleCreateOrder = useCallback(async (orderData, authToken) => {
    const tokenToUse = authToken || getToken();
    if (!tokenToUse) {
      const errorMessage = "משתמש לא מזוהה. נדרש טוקן אורח או משתמש רשום.";
      showNotification(`שגיאה: ${errorMessage}`, 'error');
      return { success: false, message: errorMessage };
    }

    try {
      const response = await axios.post(`${__API_URL__}/orders`, orderData, {
        headers: { Authorization: `Bearer ${tokenToUse}` },
      });
      setCartItems([]);
      await saveCart([]);
      return { success: true, orderId: response.data._id };
    } catch (error) {
      const errorMessage = error.response ? error.response.data.message : error.message;
      showNotification(`שגיאה: ${errorMessage}`, 'error');
      return { success: false, message: errorMessage };
    }
  }, [getToken, saveCart, showNotification]);

  // Derived state for the UI.
  const cartItemsCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  /**
   * Calculates the total price of all items in the cart, considering sales.
   */
  const totalPrice = cartItems.reduce((total, item) => {
    if (!item.product) return total;
    const regularPrice = item.variant?.price ?? item.product?.price ?? 0;
    const salePrice = item.variant?.salePrice;
    const isOnSale = item.variant?.isOnSale;
    const priceToUse = isOnSale && salePrice && salePrice > 0 ? salePrice : regularPrice;
    return total + (priceToUse * item.quantity);
  }, 0);

  return {
    cartItems,
    setCartItems,
    handleAddToCart,
    handleUpdateQuantity,
    handleRemoveFromCart,
    handleCreateOrder,
    cartItemsCount,
    totalPrice,
    saveCart
  };
};

export default useCart;
