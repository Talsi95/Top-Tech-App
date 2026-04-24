import { useState, useCallback } from 'react';

/**
 * Hook to manage search functionality, including filtering items and managing drawer visibility.
 * @param {Array} products - The list of products to search within.
 */
const useSearch = (products) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchDrawerOpen, setIsSearchDrawerOpen] = useState(false);

  /**
   * Handles changes to the search input, filtering products in real-time.
   * @param {Object} e - The DOM change event.
   */
  const handleSearchChange = useCallback((e) => {
    const query = e.target.value;
    setSearchQuery(query);
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(filtered);
  }, [products]);

  /**
   * Toggles the visibility of the search drawer and resets search state when closing.
   */
  const toggleSearchDrawer = useCallback(() => {
    setIsSearchDrawerOpen(prev => {
      if (!prev) {
        setSearchQuery('');
        setSearchResults([]);
      }
      return !prev;
    });
  }, []);

  return {
    searchQuery,
    searchResults,
    isSearchDrawerOpen,
    handleSearchChange,
    toggleSearchDrawer
  };
};

export default useSearch;
