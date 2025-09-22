import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import { categories } from '../components/categoriesData'; // Make sure the path is correct

const ProductsPage = () => {
    const [searchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Get the category and subcategory from the URL
    const selectedCategoryName = searchParams.get('category');
    const selectedSubcategoryName = searchParams.get('subcategory');

    // Find the relevant category and its subcategories from your data file
    const relevantCategory = useMemo(() => {
        // Log the search param and the categories to the console for debugging
        // console.log("Selected Category Name from URL:", selectedCategoryName);
        // console.log("All Categories:", categories.map(c => c.name));
        return categories.find(cat => cat.name === selectedCategoryName);
    }, [selectedCategoryName]);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                // Construct the URL with query parameters
                const params = new URLSearchParams();
                if (selectedCategoryName) {
                    params.append('category', selectedCategoryName);
                }
                if (selectedSubcategoryName) {
                    params.append('subcategory', selectedSubcategoryName);
                }

                const url = `${__API_URL__}/products?${params.toString()}`;

                const response = await axios.get(url);
                setProducts(response.data);
            } catch (err) {
                console.error("Failed to fetch products:", err);
                setError("Failed to load products. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [selectedCategoryName, selectedSubcategoryName]);

    if (loading) return <div className="text-center mt-10">טוען מוצרים...</div>;
    if (error) return <div className="text-center mt-10 text-red-600">שגיאה: {error}</div>;

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-6 text-center">{selectedSubcategoryName || selectedCategoryName || "כל המוצרים"}</h1>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Filter Sidebar - shows only if a category is selected */}
                {relevantCategory && (
                    <aside className="w-full md:w-1/4 bg-white p-6 rounded-lg shadow-md">
                        <div>
                            <h2 className="text-xl font-bold mb-4">תתי קטגוריות</h2>
                            <ul className="space-y-2">
                                {/* Link to show all products within the main category */}
                                <li>
                                    <Link
                                        to={`/products?category=${selectedCategoryName}`}
                                        className={`block py-2 px-4 rounded-md transition-colors duration-200 ${!selectedSubcategoryName ? 'bg-sky-500 text-white' : 'hover:bg-gray-200 text-gray-800'
                                            }`}
                                    >
                                        הכל
                                    </Link>
                                </li>
                                {/* Map through the subcategories to create filter links */}
                                {relevantCategory.subcategories.map(sub => (
                                    <li key={sub.name}>
                                        <Link
                                            to={sub.link}
                                            className={`block py-2 px-4 rounded-md transition-colors duration-200 ${selectedSubcategoryName === sub.name ? 'bg-sky-500 text-white' : 'hover:bg-gray-200 text-gray-800'
                                                }`}
                                        >
                                            {sub.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </aside>
                )}

                {/* Product List */}
                <div className={`flex-1 grid gap-6 ${relevantCategory ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
                    {products.length === 0 ? (
                        <div className="col-span-full text-center text-gray-500">
                            לא נמצאו מוצרים בקטגוריה זו.
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