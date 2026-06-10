import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import useStoreNavigate from '../hooks/useStoreNavigate';
import ProductCard from './ProductCard';
import ConfirmationModal from './ConfirmationModal';
import { Edit, Package, Trash2 } from 'lucide-react';

import { useStore } from '../StoreContext';

/**
 * ProductList Component.
 */
const ProductList = ({ onDeleteProduct, products, onAddToCart }) => {
    const { store } = useStore();
    const { isAdmin } = useAuth();
    const navigate = useStoreNavigate();
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, onConfirm: null, title: '', message: '' });

    const openConfirm = (title, message, onConfirm) => {
        setConfirmConfig({ isOpen: true, title, message, onConfirm: () => { onConfirm(); setConfirmConfig({ ...confirmConfig, isOpen: false }); } });
    };

    if (products.length === 0) {
        return <div className="text-center text-gray-500 py-12">אופס.. נראה שאין תוצאות עבור חיפוש זה</div>;
    }

    const isFullWidth = store?.features?.fullWidthCards;

    return (
        <div className={`sm:container sm:mx-auto py-0 sm:py-4 px-0 ${!isFullWidth ? 'sm:px-4' : ''}`}>
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-0 ${isFullWidth ? 'sm:gap-0' : 'sm:gap-6'}`}>
                {products.map((product) => (
                    <div key={product._id} className={`flex flex-col h-full bg-white border-b border-gray-100 ${isFullWidth ? "sm:rounded-[2rem] sm:border" : "sm:rounded-[2rem] sm:border sm:shadow-sm"
                        } overflow-hidden sm:hover:shadow-2xl sm:hover:shadow-primary/5 transition-all duration-500`}>
                        <div className="flex-grow">
                            <ProductCard product={product} onAddToCart={onAddToCart} />
                        </div>
                        {isAdmin && (
                            <div className="p-4 bg-gray-50/50 border-t border-gray-100 space-y-2">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => navigate(`/product-form/${product._id}`)}
                                        className="flex-1 py-2.5 bg-white text-gray-600 rounded-xl font-bold text-xs hover:bg-primary hover:text-white transition-all shadow-sm flex items-center justify-center gap-1.5"
                                    >
                                        <Edit size={14} />
                                        <span>עריכה</span>
                                    </button>
                                    <button
                                        onClick={() => navigate(`/admin/update-variant/${product._id}`)}
                                        className="flex-1 py-2.5 bg-white text-gray-600 rounded-xl font-bold text-xs hover:bg-primary hover:text-white transition-all shadow-sm flex items-center justify-center gap-1.5"
                                    >
                                        <Package size={14} />
                                        <span>מלאי</span>
                                    </button>
                                </div>
                                <button
                                    onClick={() => openConfirm(
                                        'מחיקת מוצר',
                                        `האם אתה בטוח שברצונך למחוק את המוצר "${product.name}"?`,
                                        () => onDeleteProduct(product._id)
                                    )}
                                    className="w-full py-2.5 bg-red-50 text-red-500 rounded-xl font-bold text-xs hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-1.5"
                                >
                                    <Trash2 size={14} />
                                    <span>מחיקת מוצר</span>
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <ConfirmationModal
                isOpen={confirmConfig.isOpen}
                onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
                onConfirm={confirmConfig.onConfirm}
                title={confirmConfig.title}
                message={confirmConfig.message}
            />
        </div>
    );
};

export default ProductList;