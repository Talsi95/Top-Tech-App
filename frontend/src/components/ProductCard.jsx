import { Link } from 'react-router-dom';

/**
 * ProductCard Component.
 * A concise summary view of a product, used within lists and grids.
 * 
 * @param {Object} props - Component props.
 * @param {Object} props.product - The product data to display.
 * @param {Object} props.filters - Active filters to determine which variant price to show.
 */
const ProductCard = ({ product, filters = {} }) => {
    const hasFilters = Object.keys(filters).length > 0;

    // Find a variant that matches the active filters. 
    // If multiple filters are active, we try to find one that satisfies all of them.
    const matchingVariant = product.variants?.find(v => {
        return Object.entries(filters).every(([key, values]) => {
            if (!values || values.length === 0) return true;
            return values.includes(String(v[key]));
        });
    });

    const primaryVariant = matchingVariant || product.variants?.[0] || {};

    // Calculate minimum and maximum price to check if there is a difference
    const allPrices = (product.variants || []).map(v => v.salePrice || v.price);
    const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : primaryVariant.price;
    const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : primaryVariant.price;
    
    // Only show "Starting at" if there are no filters and there is a real price difference between variants
    const hasPriceDifference = maxPrice > minPrice;
    const showStartingAt = !hasFilters && product.variants?.length > 1 && hasPriceDifference;

    const imageUrl = (primaryVariant.imageUrls && primaryVariant.imageUrls.length > 0)
        ? primaryVariant.imageUrls[0]
        : (primaryVariant.imageUrl || (product.variants?.[0]?.imageUrl));

    return (
        <Link 
            to={`/product/${product._id}`}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center group cursor-pointer h-full"
        >
            {imageUrl && (
                <div className="w-full h-48 mb-4 overflow-hidden rounded-md">
                    <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-300"
                    />
                </div>
            )}
            <h2 className="text-xl font-bold mb-2 group-hover:text-blue-600 transition-colors">{product.name}</h2>
            <p className="text-gray-600 flex-grow mb-4 text-sm line-clamp-2">{product.description}</p>

            <div className="mt-auto w-full">
                <div className="text-2xl font-semibold text-gray-800 mb-4">
                    {showStartingAt ? (
                        <div className="flex flex-col items-center">
                            <span className="text-gray-500 text-sm font-normal">החל מ-</span>
                            <span className="text-green-600">₪{minPrice.toFixed(2)}</span>
                        </div>
                    ) : (
                        primaryVariant.price && (
                            primaryVariant.salePrice ? (
                                <div className="flex flex-col items-center">
                                    <span className="line-through text-gray-400 text-sm">₪{primaryVariant.price.toFixed(2)}</span>
                                    <span className="text-red-600">₪{primaryVariant.salePrice.toFixed(2)}</span>
                                </div>
                            ) : (
                                <span>₪{primaryVariant.price.toFixed(2)}</span>
                            )
                        )
                    )}
                </div>

                <div className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-md group-hover:bg-blue-600 transition-colors">
                    בחר תצורה
                </div>
            </div>
        </Link>
    );
};

export default ProductCard;