import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

/**
 * Hook to manage product data, including fetching and deleting products.
 * @param {URLSearchParams} searchParams - The search parameters for filtering products.
 */
const useProducts = (searchParams) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetches products from the backend API based on current search parameters.
   */
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `${__API_URL__}/products?${searchParams.toString()}`;
      const response = await axios.get(url);
      setProducts(response.data.products);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError("Failed to load products. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  // Fetch products on component mount or when searchParams change.
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  /**
   * Deletes a product by ID after user confirmation.
   * @param {string} id - The ID of the product to delete.
   * @param {Function} getToken - Function to retrieve the authorization token.
   * @param {Function} showNotification - Function to display a UI notification.
   */
  const handleDeleteProduct = useCallback(async (id, getToken, showNotification) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const token = getToken();
        await axios.delete(`${__API_URL__}/products/${id}`, {
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
  }, []);

  return { products, loading, error, fetchProducts, handleDeleteProduct };
};

export default useProducts;
