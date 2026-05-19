import StoreLink from './StoreLink';
import { useState, useEffect } from 'react';
import { useStore } from '../StoreContext';
import axios from 'axios';
import laptopsImg from '../assets/laptops.png';
import smartphonesImg from '../assets/smartphones.png';
import gamingConsolesImg from '../assets/consoles.png';
import headphonesImg from '../assets/headphones.png';
import tvImg from '../assets/tv.png';
import chargersImg from '../assets/chargers.png';
import storageImg from '../assets/storage.png';

const categoryImages = {
    'מכשירים ניידים': smartphonesImg,
    'קונסולות משחק': gamingConsolesImg,
    'מחשבים ניידים': laptopsImg,
    'טלוויזיות': tvImg,
    'אוזניות': headphonesImg,
    'מטענים': chargersImg,
    'גיבוי ואחסון': storageImg
};

const DEFAULT_CATEGORY_ICON = 'https://img.icons8.com/ios-filled/100/ffffff/box.png';

/**
 * Banner Component.
 */
const Banner = () => {
    const [categories, setCategories] = useState([]);
    const { store } = useStore();

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get(`${__API_URL__}/categories`);
                setCategories(response.data);
            } catch (err) {
                console.error("Failed to fetch categories for banner:", err);
            }
        };

        fetchCategories();
    }, []);

    return (
        <div className="relative min-h-[500px] bg-gradient-to-br from-gray-900 via-primary to-primary-hover text-white py-20 px-8 rounded-[3rem] shadow-2xl mb-16 overflow-hidden flex items-center justify-center">
            {/* Animated background elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-400 opacity-10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

            <div className="relative z-10 w-full max-w-5xl text-center">
                <div className="space-y-6 mb-16">
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-tight animate-in fade-in slide-in-from-top-8 duration-700">
                        {/* העתיד כבר כאן. <br /> */}
                        <span className="text-transparent bg-clip-text bg-gradient-to-l from-blue-200 to-white">{store?.name || "גלו את הטכנולוגיה הבאה שלכם"}</span>
                    </h1>
                    <p className="text-xl md:text-2xl font-medium opacity-80 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        {store?.labels?.bannerDescription || "המקום המושלם לגאדג'טים הכי חמים, מחשבים עוצמתיים וכל מה שחדש בעולם הדיגיטלי"}
                    </p>
                </div>

                {/* Category bubbles grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 px-4">
                    {categories.map((category, index) => {
                        const image = categoryImages[category.name] || category.imageUrl || DEFAULT_CATEGORY_ICON;
                        return (
                            <StoreLink
                                to={`/products?category=${category.name}`}
                                key={index}
                                className="group flex flex-col items-center animate-in fade-in zoom-in duration-500"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className="w-24 h-24 lg:w-28 lg:h-28 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center p-4 border border-white/30 shadow-xl group-hover:bg-white transition-all duration-500">
                                    <img
                                        src={image}
                                        alt={category.name}
                                        className="w-full h-full object-contain transition-all duration-500"
                                    />
                                </div>
                                <span className="mt-4 text-sm font-black text-white/90 group-hover:text-white transition-colors">
                                    {category.name}
                                </span>
                            </StoreLink>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Banner;