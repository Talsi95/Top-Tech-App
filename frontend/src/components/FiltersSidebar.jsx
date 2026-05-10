import { Link, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FaFilter, FaTimes } from 'react-icons/fa';


/**
 * FiltersSidebar Component.
 * Provides a UI for filtering products by subcategory and variant-specific attributes (e.g., color, storage).
 * 
 * @param {Object} props - Component props.
 * @param {string} props.selectedCategoryName - The name of the currently selected main category.
 * @param {string} props.selectedSubcategoryName - The name of the currently selected subcategory.
 * @param {Object} props.relevantCategory - Metadata for the selected category, including available variant fields.
 * @param {Object} props.activeFilters - Currently applied variant filters.
 * @param {Object} props.availableFilters - Map of available filter values for each field.
 * @param {Function} props.onFilterChange - Callback for when a filter selection changes.
 * @param {Array} props.dynamicSubcategories - List of unique subcategories available for the current selection.
 */
const FiltersSidebar = ({
    selectedCategoryName,
    selectedSubcategoryName,
    relevantCategory,
    activeFilters,
    availableFilters,
    onFilterChange,
    onBulkFilterChange,
    dynamicSubcategories
}) => {
    const [searchParams] = useSearchParams();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
    const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
    const [localVariants, setLocalVariants] = useState({ ...activeFilters });

    useEffect(() => {
        setMinPrice(searchParams.get('minPrice') || '');
        setMaxPrice(searchParams.get('maxPrice') || '');
        setLocalVariants({ ...activeFilters });
    }, [searchParams, activeFilters]);

    const handleApplyFilters = () => {
        const bulkUpdates = [
            { key: 'minPrice', value: minPrice, isVariant: false },
            { key: 'maxPrice', value: maxPrice, isVariant: false }
        ];

        // Add all local variants to bulk updates
        // We need to know which ones were removed too
        // Actually, easiest is to just reset all variant filters and set new ones
        // But bulkUpdate already handles this if we pass null for removed ones

        // Let's get all possible variant keys from relevantCategory
        relevantCategory.variantFields.forEach(field => {
            bulkUpdates.push({
                key: field,
                value: localVariants[field] || null,
                isVariant: true
            });
        });

        onBulkFilterChange(bulkUpdates);
        if (window.innerWidth < 768) setIsMobileOpen(false);
    };

    const toggleVariant = (field, value) => {
        setLocalVariants(prev => {
            const next = { ...prev };
            const currentValues = next[field] || [];

            if (currentValues.includes(value)) {
                next[field] = currentValues.filter(v => v !== value);
                if (next[field].length === 0) delete next[field];
            } else {
                next[field] = [...currentValues, value];
            }
            return next;
        });
    };

    const isFilterActive = (key, value) => (localVariants[key] || []).includes(value);

    const createSubcategoryUrl = (subName) => {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('category', selectedCategoryName);

        if (subName) {
            newSearchParams.set('subcategory', subName);
        } else {
            newSearchParams.delete('subcategory');
        }

        return `/products?${newSearchParams.toString()}`;
    };

    const sidebarContent = (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center md:hidden mb-6">
                <h2 className="text-2xl font-bold">סינון מוצרים</h2>
                <button onClick={() => setIsMobileOpen(false)} className="text-gray-500 hover:text-black">
                    <FaTimes size={24} />
                </button>
            </div>

            <div className="mb-6 border-b pb-4">
                <button
                    onClick={handleApplyFilters}
                    className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg flex items-center justify-center gap-2 mb-4"
                >
                    <FaFilter size={14} />
                    החל את כל הסינונים
                </button>
            </div>

            <div className="mb-8 border-b pb-4">
                {/* <h2 className="text-xl font-bold mb-4">מותג/חברה</h2> */}
                <ul className="space-y-2 text-right">
                    <li>
                        <Link
                            to={createSubcategoryUrl(null)}
                            onClick={() => window.innerWidth < 768 && setIsMobileOpen(false)}
                            className={`block py-2 px-4 rounded-md transition-colors ${!selectedSubcategoryName ? 'bg-sky-500 text-white' : 'hover:bg-gray-200 text-gray-800'}`}
                        >
                            הכל
                        </Link>
                    </li>

                    {dynamicSubcategories.map(subName => (
                        <li key={subName}>
                            <Link
                                to={createSubcategoryUrl(subName)}
                                onClick={() => window.innerWidth < 768 && setIsMobileOpen(false)}
                                className={`block py-2 px-4 rounded-md transition-colors ${selectedSubcategoryName === subName ? 'bg-sky-500 text-white' : 'hover:bg-gray-200 text-gray-800'}`}
                            >
                                {subName}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Price Filter */}
            <div className="mb-8 border-b pb-6">
                <h2 className="text-xl font-bold mb-4">סינון לפי מחיר</h2>
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            placeholder="מ-"
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-sky-500 focus:border-sky-500"
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                        />
                        <span className="text-gray-500">עד</span>
                        <input
                            type="number"
                            placeholder="עד-"
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-sky-500 focus:border-sky-500"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                        />
                    </div>
                    <p className="text-xs text-gray-400 italic text-center">* המחירים בשקלים (₪)</p>
                </div>
            </div>

            {relevantCategory.variantFields.map(field => {
                const translatedField = {
                    color: 'צבע',
                    storage: 'נפח',
                    size: 'גודל',
                    processor: 'מעבד',
                    ram: 'זיכרון RAM'
                }[field] || field;

                return (
                    <div key={field} className="mb-8 border-b pb-4">
                        <h2 className="text-xl font-bold mb-4">סינון לפי {translatedField}</h2>

                        {availableFilters[field] && availableFilters[field].length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {availableFilters[field].map(value => (
                                    <button
                                        key={value}
                                        onClick={() => toggleVariant(field, value)}
                                        className={`py-1 px-3 border rounded-full text-sm transition-colors ${isFilterActive(field, value)
                                            ? 'bg-sky-600 text-white border-sky-600'
                                            : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'
                                            }`}
                                    >
                                        {value}
                                    </button>
                                ))}

                                {localVariants[field] && localVariants[field].length > 0 && (
                                    <button
                                        onClick={() => setLocalVariants(prev => {
                                            const next = { ...prev };
                                            delete next[field];
                                            return next;
                                        })}
                                        className="py-1 px-3 border rounded-full text-sm bg-red-100 text-red-600 border-red-300 hover:bg-red-200"
                                    >
                                        ❌ נקה הכל ({localVariants[field].length})
                                    </button>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">אין פילטרים זמינים.</p>
                        )}
                    </div>
                );
            })}
        </div>
    );

    return (
        <>
            {/* Mobile Toggle Button */}
            <div className="md:hidden sticky top-20 z-30 mb-4">
                <button
                    onClick={() => setIsMobileOpen(true)}
                    className="w-full bg-white border border-gray-300 shadow-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    <FaFilter className="text-sky-500" />
                    סינונים ופילטרים
                </button>
            </div>

            {/* Mobile Drawer */}
            <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300 md:hidden ${isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div
                    className={`fixed right-0 top-0 h-full w-4/5 max-w-sm bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out p-6 overflow-y-auto ${isMobileOpen ? 'translate-x-0' : 'translate-x-full'}`}
                >
                    {sidebarContent}
                </div>
            </div>

            {/* Desktop Sidebar */}
            <aside className="hidden md:block w-full md:w-1/4 bg-white p-6 rounded-lg shadow-md h-fit sticky top-24">
                {sidebarContent}
            </aside>
        </>
    );
};

export default FiltersSidebar;