import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

/**
 * ProductCard Component.
 */
const ProductCard = ({ product, filters = {} }) => {
    const hasFilters = Object.keys(filters).length > 0;

    const matchingVariant = product.variants?.find(v => {
        return Object.entries(filters).every(([key, values]) => {
            if (!values || values.length === 0) return true;
            return values.includes(String(v[key]));
        });
    });

    const primaryVariant = matchingVariant || product.variants?.[0] || {};
    const allPrices = (product.variants || []).map(v => v.salePrice || v.price);
    const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : primaryVariant.price;
    const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : primaryVariant.price;
    const hasPriceDifference = maxPrice > minPrice;
    const showStartingAt = !hasFilters && product.variants?.length > 1 && hasPriceDifference;

    const imageUrl = (primaryVariant.imageUrls && primaryVariant.imageUrls.length > 0)
        ? primaryVariant.imageUrls[0]
        : (primaryVariant.imageUrl || (product.variants?.[0]?.imageUrl));

    return (
        <Link 
            to={`/product/${product._id}`}
            className="group relative bg-white p-6 rounded-[2rem] shadow-sm hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 flex flex-col h-full border border-gray-100 hover:border-primary/20"
        >
            {/* Sale Badge */}
            {primaryVariant.salePrice && (
                <div className="absolute top-4 left-4 z-10 bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-lg shadow-red-500/20">
                    מבצע חם
                </div>
            )}

            {/* Image Section */}
            <div className="relative w-full h-56 mb-6 overflow-hidden rounded-2xl bg-white border border-gray-50 flex items-center justify-center p-4">
                <img
                    src={imageUrl}
                    alt={product.name}
                    className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-700 ease-out"
                />
            </div>

            {/* Content Section */}
            <div className="flex flex-col flex-grow text-right">
                <h2 className="text-xl font-black text-gray-900 mb-2 leading-tight group-hover:text-primary transition-colors duration-300">
                    {product.name}
                </h2>
                <p className="text-gray-500 text-sm font-medium mb-6 line-clamp-2 leading-relaxed">
                    {product.description}
                </p>

                {/* Price & Action Section */}
                <div className="mt-auto flex items-center justify-between">
                    <div className="flex flex-col">
                        {showStartingAt ? (
                            <>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">החל מ-</span>
                                <span className="text-2xl font-black text-primary">₪{minPrice.toFixed(2)}</span>
                            </>
                        ) : (
                            primaryVariant.price && (
                                primaryVariant.salePrice ? (
                                    <>
                                        <span className="line-through text-gray-300 text-xs font-medium mb-1">₪{primaryVariant.price.toFixed(2)}</span>
                                        <span className="text-2xl font-black text-red-500">₪{primaryVariant.salePrice.toFixed(2)}</span>
                                    </>
                                ) : (
                                    <span className="text-2xl font-black text-gray-900">₪{primaryVariant.price.toFixed(2)}</span>
                                )
                            )
                        )}
                    </div>

                    <div className="w-12 h-12 bg-surface-container rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-white group-hover:rotate-[360deg] transition-all duration-700">
                        <FaArrowLeft size={18} />
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default ProductCard;