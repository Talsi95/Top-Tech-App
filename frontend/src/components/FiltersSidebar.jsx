import StoreLink from './StoreLink';
import { useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FaFilter, FaTimes, FaChevronLeft } from 'react-icons/fa';

/**
 * FiltersSidebar Component.
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
        <div className="flex flex-col h-full text-right">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-gray-900 tracking-tighter">סינון מוצרים</h2>
                <button onClick={() => setIsMobileOpen(false)} className="md:hidden w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl text-gray-400">
                    <FaTimes size={20} />
                </button>
            </div>

            {/* Apply Button */}
            <div className="mb-8">
                <button
                    onClick={handleApplyFilters}
                    className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-xl shadow-primary/20 hover:bg-primary-hover hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                    <FaFilter size={16} />
                    החל סינונים
                </button>
            </div>

            {/* Subcategories Section */}
            <div className="mb-10">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 px-1">מותג / קטגוריה</h3>
                <ul className="space-y-1">
                    <li>
                        <StoreLink
                            to={createSubcategoryUrl(null)}
                            onClick={() => window.innerWidth < 768 && setIsMobileOpen(false)}
                            className={`flex items-center justify-between py-3 px-4 rounded-2xl font-bold transition-all ${!selectedSubcategoryName ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <FaChevronLeft size={12} className={!selectedSubcategoryName ? 'opacity-100' : 'opacity-0'} />
                            <span>הכל</span>
                        </StoreLink>
                    </li>

                    {dynamicSubcategories.map(subName => (
                        <li key={subName}>
                            <StoreLink
                                to={createSubcategoryUrl(subName)}
                                onClick={() => window.innerWidth < 768 && setIsMobileOpen(false)}
                                className={`flex items-center justify-between py-3 px-4 rounded-2xl font-bold transition-all ${selectedSubcategoryName === subName ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                <FaChevronLeft size={12} className={selectedSubcategoryName === subName ? 'opacity-100' : 'opacity-0'} />
                                <span>{subName}</span>
                            </StoreLink>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Price Filter */}
            <div className="mb-10">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 px-1">טווח מחירים</h3>
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 relative">
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">מ-</span>
                            <input
                                type="number"
                                className="w-full pr-10 pl-4 py-3 bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-xl text-sm font-bold text-gray-900 transition-all outline-none"
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                            />
                        </div>
                        <div className="flex-1 relative">
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">עד-</span>
                            <input
                                type="number"
                                className="w-full pr-10 pl-4 py-3 bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-xl text-sm font-bold text-gray-900 transition-all outline-none"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Dynamic Variant Filters */}
            {relevantCategory.variantFields.map(field => {
                const translatedField = {
                    color: 'צבע',
                    storage: 'נפח',
                    size: 'גודל',
                    processor: 'מעבד',
                    ram: 'זיכרון RAM'
                }[field] || field;

                return (
                    <div key={field} className="mb-10">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 px-1">{translatedField}</h3>

                        {availableFilters[field] && availableFilters[field].length > 0 ? (
                            <div className="flex flex-wrap flex-row-reverse gap-2">
                                {availableFilters[field].map(value => (
                                    <button
                                        key={value}
                                        onClick={() => toggleVariant(field, value)}
                                        className={`py-2 px-4 rounded-xl text-sm font-bold transition-all border-2 ${isFilterActive(field, value)
                                            ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                                            : 'bg-white border-gray-100 text-gray-600 hover:border-primary/20 hover:text-primary'
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
                                        className="py-2 px-4 rounded-xl text-sm font-black bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                    >
                                        נקה ({localVariants[field].length})
                                    </button>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 italic">אין פילטרים זמינים.</p>
                        )}
                    </div>
                );
            })}
        </div>
    );

    return (
        <>
            {/* Mobile Toggle Button */}
            <div className="md:hidden sticky top-[80px] z-30 mb-6 animate-in slide-in-from-top-4 duration-500">
                <button
                    onClick={() => setIsMobileOpen(true)}
                    className="w-full bg-white/80 backdrop-blur-xl border border-white/40 shadow-xl py-4 px-6 rounded-[2rem] flex items-center justify-between font-black text-gray-900 hover:scale-[1.02] active:scale-95 transition-all"
                >
                    <span className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                            <FaFilter size={14} />
                        </div>
                        סינונים ופילטרים
                    </span>
                    <FaChevronLeft size={14} className="opacity-30" />
                </button>
            </div>

            {/* Mobile Drawer */}
            <div className={`fixed inset-0 z-[100] transition-all duration-500 md:hidden ${isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-md" onClick={() => setIsMobileOpen(false)}></div>
                <div
                    className={`absolute right-0 top-0 h-full w-[85%] max-w-sm bg-white shadow-2xl transition-transform duration-500 ease-out p-8 overflow-y-auto ${isMobileOpen ? 'translate-x-0' : 'translate-x-full'}`}
                >
                    {sidebarContent}
                </div>
            </div>

            {/* Desktop Sidebar */}
            <aside className="hidden md:block w-full md:w-[320px] bg-white p-8 rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border border-gray-50 h-fit sticky top-[100px] animate-in fade-in slide-in-from-right-8 duration-700">
                {sidebarContent}
            </aside>
        </>
    );
};

export default FiltersSidebar;