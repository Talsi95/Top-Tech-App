import { useNavigate } from 'react-router-dom';

const ProductCard = ({ product }) => {
    const navigate = useNavigate();
    const primaryVariant = product.variants?.[0] || {};


    return (
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col items-center text-center">
            {primaryVariant.imageUrl && (
                <img
                    src={primaryVariant.imageUrl}
                    alt={product.name}
                    className="w-full h-48 object-contain mb-4 rounded-md"
                />
            )}
            <h2 className="text-xl font-bold mb-2">{product.name}</h2>
            <p className="text-gray-600 flex-grow mb-4">{product.description}</p>

            {primaryVariant.price && (
                <div className="text-2xl font-semibold text-gray-800">
                    {primaryVariant.salePrice ? (
                        <>
                            <span className="line-through text-gray-400 text-lg mr-2">₪{primaryVariant.price.toFixed(2)}</span>
                            <span>₪{primaryVariant.salePrice.toFixed(2)}</span>
                        </>
                    ) : (
                        <span>₪{primaryVariant.price.toFixed(2)}</span>
                    )}
                </div>
            )}

            <button
                onClick={() => navigate(`/product/${product._id}`)}
                className="mt-4 w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
            >
                בחר תצורה
            </button>
        </div>
    );
};

export default ProductCard;