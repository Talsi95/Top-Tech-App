import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

/**
 * Hook to manage admin-specific features like fetching and marking new orders as seen.
 * @param {boolean} isAdmin - Whether the user has admin privileges.
 * @param {boolean} isAuthenticated - Whether the user is logged in.
 * @param {Function} getToken - Function to retrieve the auth token.
 */
const useAdminOrders = (isAdmin, isAuthenticated, getToken) => {
  const [newOrders, setNewOrders] = useState([]);

  /**
   * Fetches the list of new (unseen) orders from the server.
   */
  const fetchNewOrders = useCallback(async () => {
    if (!isAuthenticated || !isAdmin) return;

    const token = getToken();
    if (!token) {
      console.error('No token available for admin notification API call.');
      return;
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const { data } = await axios.get(`${__API_URL__}/orders/new`, config);
      setNewOrders(data);
    } catch (error) {
      console.error('Error fetching new orders:', error.response ? error.response.data : error.message);
    }
  }, [isAuthenticated, isAdmin, getToken]);

  /**
   * Marks a specific order as seen, notifying the server and updating local state.
   * @param {string} orderId - The ID of the order to mark as seen.
   */
  const markOrderAsSeen = useCallback(async (orderId) => {
    if (!isAuthenticated || !isAdmin) return;

    const token = getToken();
    if (!token) {
      console.error('No token available for marking order as seen.');
      return;
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      await axios.patch(`${__API_URL__}/orders/${orderId}/seen`, {}, config);
      setNewOrders(prevOrders => prevOrders.filter(order => order._id !== orderId));
    } catch (error) {
      console.error('Error marking order as seen:', error.response ? error.response.data : error.message);
    }
  }, [isAuthenticated, isAdmin, getToken]);

  // Initial fetch of new orders if the user is an admin.
  useEffect(() => {
    if (isAdmin) {
      fetchNewOrders();
    }
  }, [isAdmin, fetchNewOrders]);

  return { newOrders, fetchNewOrders, markOrderAsSeen };
};

export default useAdminOrders;
