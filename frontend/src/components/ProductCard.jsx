import StoreLink from './StoreLink';
import { FaArrowLeft, FaWhatsapp, FaShoppingCart } from 'react-icons/fa';
import { useStore } from '../StoreContext';

/**
 * ProductCard Component.
 */
const ProductCard = ({ product, filters = {}, onAddToCart }) => {
    const { store } = useStore();
    const isFullWidth = store?.features?.fullWidthCards;
    const hidePrice = store?.features?.hidePrice;
    const quickBuy = store?.features?.quickBuy;
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

    const CardWrapper = store?.features?.hasCart ? StoreLink : 'div';

    // Dynamic classes based on fullWidthCards feature
    // On mobile: always full-width (no border/shadow/rounded). From sm: respect isFullWidth.
    const wrapperClass = isFullWidth
        ? "group relative bg-white rounded-none sm:rounded-[2rem] shadow-none sm:shadow-sm sm:hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 flex flex-col h-full border-b border-gray-100 sm:border sm:hover:border-primary/20 overflow-hidden"
        : "group relative bg-white rounded-none sm:rounded-[2rem] border-b border-gray-100 sm:border sm:shadow-sm sm:hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] sm:hover:border-primary/20 transition-all duration-500 flex flex-col h-full overflow-hidden";

    const wrapperProps = store?.features?.hasCart
        ? { to: `/products/${product.slug || product._id}`, state: { product }, className: wrapperClass }
        : { className: wrapperClass };

    const whatsappLink = `https://wa.me/${store?.businessInfo?.whatsapp}?text=${encodeURIComponent(`היי, אני מעוניין במוצר: ${product.name}`)}`;

    return (
        <CardWrapper {...wrapperProps}>
            {/* Image Section */}
            <div className={`relative w-full overflow-hidden flex items-center justify-center ${isFullWidth
                ? "h-64 sm:h-72 bg-white p-0"
                : "h-56 bg-white p-4 sm:mb-6 sm:rounded-2xl sm:border sm:border-gray-50"
                }`}>
                <img
                    src={imageUrl}
                    alt={product.name}
                    className={`transition-transform duration-700 ease-out group-hover:scale-110 ${isFullWidth
                        ? "w-full h-full object-cover"
                        : "max-h-full max-w-full object-contain"
                        }`}
                />

                {/* Sale Badge */}
                {store?.features?.hasCart && !hidePrice && primaryVariant.salePrice && (
                    <div className="absolute top-4 left-4 z-10 bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-lg shadow-red-500/20">
                        מבצע חם
                    </div>
                )}

                {!store?.features?.hasCart && (
                    <StoreLink to={`/products/${product.slug || product._id}`} state={{ product: product }} className="absolute inset-0 z-0" />
                )}
            </div>

            {/* Content Section */}
            <div className={`flex flex-col flex-grow text-right relative z-10 p-4 ${isFullWidth ? "sm:p-6 sm:pt-8" : "sm:p-0"}`}>
                <h2 className={`${isFullWidth ? "text-2xl" : "text-xl"} font-black text-gray-900 mb-2 leading-tight group-hover:text-primary transition-colors duration-300`}>
                    {product.name}
                </h2>
                <p className={`text-gray-500 text-sm font-medium leading-relaxed ${isFullWidth ? "text-base mb-8 whitespace-pre-line" : "mb-6 line-clamp-2"
                    }`}>
                    {product.description}
                </p>

                {/* Price & Action Section */}
                <div className="mt-auto flex items-center justify-between gap-4">
                    {hidePrice ? (
                        <span className="text-lg font-black text-primary">צור קשר</span>
                    ) : (
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
                    )}

                    {store?.features?.hasCart && quickBuy ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                if (onAddToCart) {
                                    onAddToCart(product, primaryVariant, [], 0);
                                }
                            }}
                            disabled={store?.features?.showStock !== false && primaryVariant.stock === 0}
                            aria-label="הוסף לסל"
                            className={`${isFullWidth ? "h-14 px-5" : "h-12 px-4"} bg-primary text-white rounded-xl flex items-center justify-center gap-2 font-black text-sm hover:bg-primary-hover active:scale-95 transition-all shadow-lg shadow-primary/20`}
                        >
                            <FaShoppingCart size={isFullWidth ? 18 : 16} />
                            <span>הוסף</span>
                        </button>
                    ) : store?.features?.hasCart ? (
                        <div className={`${isFullWidth ? "w-14 h-14" : "w-12 h-12"} bg-surface-container rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-white group-hover:rotate-[360deg] transition-all duration-700`}>
                            <FaArrowLeft size={isFullWidth ? 20 : 18} />
                        </div>
                    ) : (
                        <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            aria-label="וואטסאפ"
                            className={`flex-1 py-4 px-4 bg-[#25D366] text-white rounded-2xl text-center font-black shadow-lg shadow-[#25D366]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 ${isFullWidth ? "text-base" : "text-sm"
                                }`}
                        >
                            <FaWhatsapp size={isFullWidth ? 24 : 20} />
                            <span>{store?.labels?.contactUsLabel || 'צור קשר בוואטסאפ'}</span>
                        </a>
                    )}
                </div>
            </div>
        </CardWrapper>
    );
};

export default ProductCard;