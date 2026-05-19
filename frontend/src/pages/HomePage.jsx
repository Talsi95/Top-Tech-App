import { useMemo, useState, useEffect } from 'react';
import ProductList from '../components/ProductList';
import Banner from '../components/Banner';
import CategorySlider from '../components/CategorySlider';
import HeroVideo from '../components/HeroVideo';
import Gallery from '../components/Gallery';
import { useStore } from '../StoreContext';
import { useAuth } from '../AuthContext';
import axios from 'axios';
import { ArrowUp, ArrowDown } from 'lucide-react';

/**
 * HomePage Component.
 * The landing page of the application, displaying a hero banner and featured product list grouped by category.
 */
const HomePage = ({ handleAddToCart, showNotification, handleDeleteProduct, products }) => {
    const { store } = useStore();
    const { isAdmin, isSuperAdmin, getToken } = useAuth();
    const [categories, setCategories] = useState([]);

    // Fetch category configurations on mount or store change
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data } = await axios.get(`${__API_URL__}/categories`);
                setCategories(data);
            } catch (err) {
                console.error("Error fetching categories:", err);
            }
        };
        fetchCategories();
    }, [store]);

    // Group products by category and sort according to categories order
    const sortedGroupedProducts = useMemo(() => {
        if (!products || products.length === 0) return [];
        const groups = {};
        products.forEach(p => {
            const cat = p.category || 'כללי';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(p);
        });

        const entries = Object.entries(groups);

        // Sort entries according to categories order
        entries.sort(([catA], [catB]) => {
            const indexA = categories.findIndex(c => c.name === catA);
            const indexB = categories.findIndex(c => c.name === catB);

            if (indexA !== -1 && indexB !== -1) {
                return indexA - indexB;
            }
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return catA.localeCompare(catB);
        });

        return entries;
    }, [products, categories]);

    const handleMoveCategory = async (categoryName, direction) => {
        const currentIndex = sortedGroupedProducts.findIndex(([cat]) => cat === categoryName);
        if (currentIndex === -1) return;

        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (newIndex < 0 || newIndex >= sortedGroupedProducts.length) return;

        const newSortedEntries = [...sortedGroupedProducts];
        const temp = newSortedEntries[currentIndex];
        newSortedEntries[currentIndex] = newSortedEntries[newIndex];
        newSortedEntries[newIndex] = temp;

        const updatedCategories = [];
        newSortedEntries.forEach(([name], idx) => {
            const dbCat = categories.find(c => c.name === name);
            if (dbCat) {
                updatedCategories.push({ ...dbCat, order: idx });
            }
        });

        const mergedCategories = categories.map(cat => {
            const updated = updatedCategories.find(u => u._id === cat._id);
            if (updated) return updated;
            return cat;
        });
        mergedCategories.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        // Optimistically update the UI state
        setCategories(mergedCategories);

        try {
            const token = getToken();
            const orderings = updatedCategories.map(cat => ({
                id: cat._id,
                order: cat.order
            }));

            await axios.put(`${__API_URL__}/categories/reorder`, { orderings }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showNotification('סדר הקטגוריות עודכן בהצלחה!', 'success');
        } catch (err) {
            console.error("Error updating category order:", err);
            showNotification('שגיאה בעדכון סדר הקטגוריות', 'error');
            // Rollback if failed
            try {
                const { data } = await axios.get(`${__API_URL__}/categories`);
                setCategories(data);
            } catch (e) {}
        }
    };

    const renderHero = () => {
        const type = store?.homePageConfig?.heroType || 'banner';
        switch (type) {
            case 'slider': return <CategorySlider />;
            case 'video': return <HeroVideo />;
            case 'banner':
            default: return <Banner />;
        }
    };

    const multipleCategories = sortedGroupedProducts.length > 1;

    return (
        <div className={`max-w-[1440px] mx-auto py-6 ${store?.features?.fullWidthCards ? "px-0" : "px-6"} md:px-12 md:py-12`}>
            {renderHero()}
            
            {/* Display titles below hero ONLY for Slider */}
            {store?.homePageConfig?.heroType === 'slider' && (store?.homePageConfig?.heroTitle || store?.homePageConfig?.heroSubtitle) && (
                <div className="text-center my-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    {store.homePageConfig.heroTitle && (
                        <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-4 tracking-tight">
                            {store.homePageConfig.heroTitle}
                        </h1>
                    )}
                    {store.homePageConfig.heroSubtitle && (
                        <p className="text-xl md:text-2xl text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
                            {store.homePageConfig.heroSubtitle}
                        </p>
                    )}
                </div>
            )}

            <div className="space-y-16 mb-12">
                {multipleCategories ? (
                    sortedGroupedProducts.map(([category, catProducts], idx) => {
                        const isFirstCategory = idx === 0;
                        const isLastCategory = idx === sortedGroupedProducts.length - 1;
                        return (
                            <div key={category}>
                                {/* Category heading with accent bar and reordering controls */}
                                <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
                                    <div className="flex items-center gap-4">
                                        <div className="w-2 h-10 bg-primary rounded-full flex-shrink-0" />
                                        <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
                                            {category}
                                        </h2>
                                        <span className="text-sm font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                                            {catProducts.length} מוצרים
                                        </span>
                                    </div>
                                    
                                    {(isAdmin || isSuperAdmin) && (
                                        <div className="flex gap-2" dir="ltr">
                                            <button
                                                type="button"
                                                onClick={() => handleMoveCategory(category, 'up')}
                                                disabled={isFirstCategory}
                                                title="הזז למעלה"
                                                className="p-2.5 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-white rounded-xl transition-all border border-gray-200 shadow-sm hover:shadow active:scale-95 disabled:active:scale-100"
                                            >
                                                <ArrowUp className="w-5 h-5 text-gray-600" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleMoveCategory(category, 'down')}
                                                disabled={isLastCategory}
                                                title="הזז למטה"
                                                className="p-2.5 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-white rounded-xl transition-all border border-gray-200 shadow-sm hover:shadow active:scale-95 disabled:active:scale-100"
                                            >
                                                <ArrowDown className="w-5 h-5 text-gray-600" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <ProductList
                                    products={catProducts}
                                    onAddToCart={handleAddToCart}
                                    showNotification={showNotification}
                                    onDeleteProduct={handleDeleteProduct}
                                />
                            </div>
                        );
                    })
                ) : (
                    <div>
                        <h2 className="text-4xl font-black text-gray-900 mb-8 tracking-tight border-r-8 border-primary pr-6">
                            {store?.labels?.featuredSectionTitle || "הנבחרת שלנו"}
                        </h2>
                        <ProductList
                            products={products}
                            onAddToCart={handleAddToCart}
                            showNotification={showNotification}
                            onDeleteProduct={handleDeleteProduct}
                        />
                    </div>
                )}
            </div>

            <Gallery />
        </div>
    )
};

export default HomePage;