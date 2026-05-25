import { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../StoreContext';
import useStoreNavigate from '../hooks/useStoreNavigate';

const CategorySlider = () => {
    const { store, categories, isLoadingCategories } = useStore();
    const navigate = useStoreNavigate();
    const [currentIndex, setCurrentIndex] = useState(0);

    const [touchStartX, setTouchStartX] = useState(null);
    const [touchEndX, setTouchEndX] = useState(null);
    const minSwipeDistance = 50;

    useEffect(() => {
        if (categories.length > 0) {
            const timer = setInterval(() => {
                setCurrentIndex(prev => (prev + 1) % categories.length);
            }, 4000);
            return () => clearInterval(timer);
        }
    }, [categories]);

    const next = () => setCurrentIndex(prev => (prev + 1) % categories.length);
    const prev = () => setCurrentIndex(prev => (prev - 1 + categories.length) % categories.length);

    const onTouchStart = (e) => {
        setTouchEndX(null);
        setTouchStartX(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => {
        setTouchEndX(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStartX || !touchEndX) return;
        const distance = touchStartX - touchEndX;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            prev();
        } else if (isRightSwipe) {
            next();
        }
    };

    if (isLoadingCategories || categories.length === 0) return null;

    return (
        <div
            className="relative w-full h-[500px] overflow-hidden rounded-[3rem] mb-16 group"
            dir="rtl"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            <div

                className="flex transition-transform duration-700 ease-out h-full"
                style={{ transform: `translateX(${currentIndex * 100}%)` }}
            >
                {categories.map((category) => (
                    <div
                        key={category._id}
                        className="w-full h-full flex-shrink-0 relative cursor-pointer"
                        onClick={() => navigate(
                            `/products?category=${encodeURIComponent(category.name)}`,
                            { state: { categoryName: category.name } }
                        )}
                    >
                        <img
                            src={category.imageUrl || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=2000'}
                            alt={category.name}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-12 text-right">
                            <span className="text-primary font-black tracking-widest uppercase mb-4 block animate-in fade-in slide-in-from-right-4 duration-500">
                                קולקציה חדשה
                            </span>
                            <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                                {category.name}
                            </h2>
                            <button className="bg-white text-gray-900 px-10 py-4 rounded-2xl font-black text-lg w-fit hover:bg-primary hover:text-white transition-all shadow-xl active:scale-95">
                                צפה במוצרים
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation Arrows */}
            <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                aria-label="שמאלה"
                className="absolute left-8 top-1/2 -translate-y-1/2 w-16 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-gray-900 z-20"
            >
                <ChevronLeft size={32} />
            </button>
            <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                aria-label="ימינה"
                className="absolute right-8 top-1/2 -translate-y-1/2 w-16 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-gray-900 z-20"
            >
                <ChevronRight size={32} />
            </button>

            {/* Dots */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                {categories.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                        aria-label={`החלקה ${idx + 1}`}
                        className={`h-2 rounded-full transition-all duration-500 ${currentIndex === idx ? 'w-12 bg-primary' : 'w-2 bg-white/50'}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default CategorySlider;
