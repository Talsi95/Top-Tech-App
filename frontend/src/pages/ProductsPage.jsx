import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import FiltersSidebar from '../components/FiltersSidebar';
import Loader from '../components/Loader';
import { useAuth } from '../AuthContext';

/**
 * ProductsPage Component.
 * Displays a list of products with advanced filtering and category selection capabilities.
 */
const ProductsPage = ({ getToken, showNotification }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [dynamicSubcategories, setDynamicSubcategories] = useState([]);

    const [allCategories, setAllCategories] = useState([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);

    const [availableFilters, setAvailableFilters] = useState({});
    const [pageNum, setPageNum] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const { isAdmin } = useAuth();
    const navigate = useNavigate();

    const selectedCategoryName = searchParams.get('category');
    const selectedSubcategoryName = searchParams.get('subcategory');

    const relevantCategory = useMemo(() => {
        return allCategories.find(cat => cat.name === selectedCategoryName);
    }, [selectedCategoryName, allCategories]);

    const activeFilters = useMemo(() => {
        const filters = {};
        for (const [key, value] of searchParams.entries()) {
            if (key.startsWith('filter_')) {
                const field = key.replace('filter_', '');
                if (!filters[field]) filters[field] = [];
                filters[field].push(value);
            }
        }
        return filters;
    }, [searchParams]);

    useEffect(() => {
        const fetchAllCategories = async () => {
            try {
                const response = await axios.get(`${__API_URL__}/categories`);
                setAllCategories(response.data);
            } catch (err) {
                console.error("Failed to fetch all categories data:", err);
            } finally {
                setIsLoadingCategories(false);
            }
        };

        fetchAllCategories();
    }, []);

    useEffect(() => {
        const fetchDynamicSubcategories = async () => {
            if (!selectedCategoryName) return;

            try {
                const response = await axios.get(`${__API_URL__}/products/subcategories/unique?category=${selectedCategoryName}`);
                setDynamicSubcategories(response.data);
            } catch (err) {
                console.error("Failed to fetch dynamic subcategories:", err);
            }
        };

        fetchDynamicSubcategories();
    }, [selectedCategoryName]);

    const fetchProducts = async (page = 1, isInitial = false) => {
        if (isLoadingCategories && !selectedCategoryName) return;

        if (page === 1) setLoading(true);
        else setLoadingMore(true);

        try {
            const params = new URLSearchParams(searchParams);
            params.set('page', page);
            params.set('limit', 20);

            const url = `${__API_URL__}/products?${params.toString()}`;
            const response = await axios.get(url);

            const newProducts = response.data.products;
            const moreExists = response.data.hasMore;

            setProducts(prev => isInitial || page === 1 ? newProducts : [...prev, ...newProducts]);
            setAvailableFilters(response.data.availableFilters || {});
            setHasMore(moreExists);

        } catch (err) {
            console.error("Failed to fetch products:", err);
            setError("Failed to load products. Please try again later.");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        setPageNum(1);
        fetchProducts(1, true);
    }, [searchParams, isLoadingCategories]);

    // Handle Infinite Scroll
    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + document.documentElement.scrollTop + 50 >= document.documentElement.offsetHeight) {
                if (!loading && !loadingMore && hasMore) {
                    setPageNum(prev => {
                        const nextPage = prev + 1;
                        fetchProducts(nextPage);
                        return nextPage;
                    });
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loading, loadingMore, hasMore]);

    /**
     * Updates multiple search parameters at once.
     * @param {Array} filters - Array of { key, value, isVariant } objects.
     */
    const handleBulkFilterChange = (filters) => {
        const newSearchParams = new URLSearchParams(searchParams);

        filters.forEach(({ key, value, isVariant = true }) => {
            const paramKey = isVariant ? `filter_${key}` : key;

            // Clear existing values for this key if it's a variant filter or we are setting a new value
            newSearchParams.delete(paramKey);

            if (value) {
                if (Array.isArray(value)) {
                    value.forEach(v => newSearchParams.append(paramKey, v));
                } else {
                    newSearchParams.set(paramKey, value);
                }
            }
        });

        newSearchParams.delete('page');
        setSearchParams(newSearchParams);
    };

    /**
     * Updates search parameters based on filter changes.
     * @param {string} filterKey - The key of the filter to change (e.g., 'color').
     * @param {string} filterValue - The value to set for the filter.
     * @param {boolean} isVariant - Whether the filter is a variant-specific one (adds 'filter_' prefix).
     */
    const handleFilterChange = (filterKey, filterValue, isVariant = true) => {
        handleBulkFilterChange([{ key: filterKey, value: filterValue, isVariant }]);
    };

    /**
     * Clears all active filters and resets to defaults.
     */
    const handleResetFilters = () => {
        const newSearchParams = new URLSearchParams(searchParams);

        const keysToDelete = [];
        for (const [key] of searchParams.entries()) {
            if (key.startsWith('filter_') || key === 'page' || key === 'minPrice' || key === 'maxPrice') {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => newSearchParams.delete(key));
        setSearchParams(newSearchParams);
    };

    const hasPriceFilters = searchParams.has('minPrice') || searchParams.has('maxPrice');

    const handleDeleteProduct = async (id) => {
        if (window.confirm('האם אתה בטוח שברצונך למחוק מוצר זה?')) {
            try {
                const token = getToken();
                await axios.delete(`${__API_URL__}/products/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                setProducts(prev => prev.filter(p => p._id !== id));
                showNotification('מוצר נמחק בהצלחה', 'success');
            } catch (err) {
                const errorMessage = err.response ? err.response.data.message : err.message;
                showNotification(errorMessage, 'error');
            }
        }
    };

    if (loading) return <Loader text='טוען מוצרים' />;
    if (error) return <div className="text-center mt-10 text-red-600">שגיאה: {error}</div>;

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-6 text-center">{selectedSubcategoryName || selectedCategoryName || "כל המוצרים"}</h1>

            {(Object.keys(activeFilters).length > 0 || hasPriceFilters) && (
                <div className="mb-4 text-center md:text-right">
                    <button
                        onClick={handleResetFilters}
                        className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors shadow-md"
                    >
                        🗑️ איפוס כל הסינונים ({Object.keys(activeFilters).length + (hasPriceFilters ? 1 : 0)})
                    </button>
                </div>
            )}

            <div className="flex flex-col md:flex-row gap-8">

                {relevantCategory && (
                    <FiltersSidebar
                        selectedCategoryName={selectedCategoryName}
                        selectedSubcategoryName={selectedSubcategoryName}
                        relevantCategory={relevantCategory}
                        activeFilters={activeFilters}
                        availableFilters={availableFilters}
                        onFilterChange={handleFilterChange}
                        onBulkFilterChange={handleBulkFilterChange}
                        dynamicSubcategories={dynamicSubcategories}
                    />
                )}

                <div className="flex-1 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                    {products.length === 0 ? (
                        <div className="col-span-full text-center text-gray-500">
                            לא נמצאו מוצרים תחת הסינונים הנוכחיים.
                        </div>
                    ) : (
                        products.map(product => (
                            <div key={product._id} className="flex flex-col h-full bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
                                <div className="flex-grow">
                                    <ProductCard product={product} filters={activeFilters} />
                                </div>
                                {isAdmin && (
                                    <div className="p-4 border-t flex flex-wrap gap-2 justify-center bg-gray-50">
                                        <button
                                            onClick={() => navigate(`/product-form/${product._id}`)}
                                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1.5 px-3 rounded text-xs transition-colors flex-1"
                                        >
                                            עריכה
                                        </button>
                                        <button
                                            onClick={() => handleDeleteProduct(product._id)}
                                            className="bg-red-500 hover:bg-red-600 text-white font-bold py-1.5 px-3 rounded text-xs transition-colors flex-1"
                                        >
                                            מחיקה
                                        </button>
                                        <button
                                            onClick={() => navigate(`/admin/update-variant/${product._id}`)}
                                            className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-1.5 px-3 rounded text-xs transition-colors w-full"
                                        >
                                            עדכון מלאי
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                    {loadingMore && (
                        <div className="col-span-full text-center py-4">
                            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
                                <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">טוען...</span>
                            </div>
                        </div>
                    )}
                    {!hasMore && products.length > 0 && (
                        <p className="col-span-full text-center text-gray-500 py-6 italic border-t mt-6">הגעת לסוף רשימת המוצרים</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductsPage;