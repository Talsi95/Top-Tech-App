import { Link, useSearchParams } from 'react-router-dom';

const FiltersSidebar = ({
    selectedCategoryName,
    selectedSubcategoryName,
    relevantCategory,
    activeFilters,
    availableFilters,
    onFilterChange,
    dynamicSubcategories
}) => {

    const [searchParams] = useSearchParams();

    const isFilterActive = (key, value) => activeFilters[key] === value;

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

    return (
        <aside className="w-full md:w-1/4 bg-white p-6 rounded-lg shadow-md">

            <div className="mb-8 border-b pb-4">
                <h2 className="text-xl font-bold mb-4">מותג/חברה</h2>
                <ul className="space-y-2">
                    <li>
                        <Link
                            to={createSubcategoryUrl(null)}
                            className={`block py-2 px-4 rounded-md transition-colors ${!selectedSubcategoryName ? 'bg-sky-500 text-white' : 'hover:bg-gray-200 text-gray-800'}`}
                        >
                            הכל
                        </Link>
                    </li>

                    {dynamicSubcategories.map(subName => (
                        <li key={subName}>
                            <Link
                                to={createSubcategoryUrl(subName)}
                                className={`block py-2 px-4 rounded-md transition-colors ${selectedSubcategoryName === subName ? 'bg-sky-500 text-white' : 'hover:bg-gray-200 text-gray-800'}`}
                            >
                                {subName}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>

            {relevantCategory.variantFields.map(field => (
                <div key={field} className="mb-8 border-b pb-4">
                    <h2 className="text-xl font-bold mb-4 capitalize">סינון לפי {field}</h2>

                    {availableFilters[field] && availableFilters[field].length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {availableFilters[field].map(value => (
                                <button
                                    key={value}
                                    onClick={() => onFilterChange(field, isFilterActive(field, value) ? null : value)}
                                    className={`py-1 px-3 border rounded-full text-sm transition-colors ${isFilterActive(field, value)
                                        ? 'bg-sky-600 text-white border-sky-600'
                                        : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'
                                        }`}
                                >
                                    {value}
                                </button>
                            ))}

                            {activeFilters[field] && (
                                <button
                                    onClick={() => onFilterChange(field, null)}
                                    className="py-1 px-3 border rounded-full text-sm bg-red-100 text-red-600 border-red-300 hover:bg-red-200"
                                >
                                    ❌ נקה {field}
                                </button>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">אין פילטרים זמינים.</p>
                    )}
                </div>
            ))}
        </aside>
    );
};

export default FiltersSidebar;