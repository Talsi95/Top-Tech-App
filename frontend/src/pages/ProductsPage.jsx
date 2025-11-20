import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import { categories } from '../components/categoriesData';
import FiltersSidebar from '../components/FiltersSidebar';

const ProductsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dynamicSubcategories, setDynamicSubcategories] = useState([]);

    const [availableFilters, setAvailableFilters] = useState({});

    const selectedCategoryName = searchParams.get('category');
    const selectedSubcategoryName = searchParams.get('subcategory');

    const relevantCategory = useMemo(() => {
        return categories.find(cat => cat.name === selectedCategoryName);
    }, [selectedCategoryName]);

    const activeFilters = useMemo(() => {
        const filters = {};
        for (const [key, value] of searchParams.entries()) {
            if (key.startsWith('filter_')) {
                filters[key.replace('filter_', '')] = value;
            }
        }
        return filters;
    }, [searchParams]);

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

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const url = `${__API_URL__}/products?${searchParams.toString()}`;

                const response = await axios.get(url);

                setProducts(response.data.products);
                setAvailableFilters(response.data.availableFilters || {});

            } catch (err) {
                console.error("Failed to fetch products:", err);
                setError("Failed to load products. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [searchParams]);

    const handleFilterChange = (filterKey, filterValue) => {
        const newSearchParams = new URLSearchParams(searchParams);
        const paramKey = `filter_${filterKey}`;

        if (filterValue) {
            newSearchParams.set(paramKey, filterValue);
        } else {
            newSearchParams.delete(paramKey);
        }

        newSearchParams.delete('page');
        setSearchParams(newSearchParams);
    };

    const handleResetFilters = () => {
        const newSearchParams = new URLSearchParams(searchParams);

        for (const [key] of searchParams.entries()) {
            if (key.startsWith('filter_')) {
                newSearchParams.delete(key);
            }
            if (key === 'page') {
                newSearchParams.delete(key);
            }
        }

        setSearchParams(newSearchParams);
    };

    if (loading) return <div className="text-center mt-10">טוען מוצרים...</div>;
    if (error) return <div className="text-center mt-10 text-red-600">שגיאה: {error}</div>;

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-6 text-center">{selectedSubcategoryName || selectedCategoryName || "כל המוצרים"}</h1>

            {(Object.keys(activeFilters).length > 0) && (
                <div className="mb-4 text-center md:text-right">
                    <button
                        onClick={handleResetFilters}
                        className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors shadow-md"
                    >
                        🗑️ איפוס כל הסינונים ({Object.keys(activeFilters).length})
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
                            <ProductCard key={product._id} product={product} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductsPage;