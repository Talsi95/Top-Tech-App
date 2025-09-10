// import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

const ProductList = ({ onAddToCart, onUpdateProduct, onDeleteProduct, products }) => {
    const { isAdmin } = useAuth();
    const navigate = useNavigate();

    if (products.length === 0) {
        return <div className="text-center text-gray-500">No products found. Please add some!</div>;
    }


    return (
        <div className="container mx-auto p-4">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">המוצרים שלנו</h2>
            {products.length === 0 ? (
                <p className="text-center text-gray-500">אין מוצרים עדיין, נא להוסיף!</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {products.map((product) => (
                        <div key={product._id} className="bg-white p-6 rounded-lg shadow-md flex flex-col justify-between">
                            <div className="mb-4">
                                <img src={product.imageUrl} alt={product.name} className="w-full h-48 object-contain rounded-md mb-2 bg-white-100" />
                                <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                                <p className="text-gray-600 text-sm mb-2">{product.description}</p>
                            </div>
                            <div className="mt-auto">
                                {product.isOnSale ? (
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <span className="text-red-600 font-bold text-2xl">${product.salePrice.toFixed(2)}</span>
                                            <span className="text-gray-400 line-through text-sm ml-2">${product.price.toFixed(2)}</span>
                                        </div>
                                        <button
                                            onClick={() => onAddToCart(product)}
                                            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition duration-300"
                                        >
                                            הוסף לסל
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-800 font-bold text-xl">${product.price.toFixed(2)}</span>
                                        <button
                                            onClick={() => onAddToCart(product)}
                                            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition duration-300"
                                        >
                                            הוסף לסל
                                        </button>
                                    </div>
                                )}
                                {isAdmin && (
                                    <div className="flex space-x-2 mt-2">
                                        <button
                                            onClick={() => navigate(`/product-form/${product._id}`)}
                                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded text-xs"
                                        >
                                            עריכה
                                        </button>
                                        <button
                                            onClick={() => onDeleteProduct(product._id)}
                                            className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-xs"
                                        >
                                            מחיקה
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProductList;