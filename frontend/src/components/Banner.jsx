import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import laptopsImg from '../assets/laptops.png';
import smartphonesImg from '../assets/smartphones.png';
import gamingConsolesImg from '../assets/consoles.png';
import headphonesImg from '../assets/headphones.png';
import tvImg from '../assets/tv.png';

const categoryImages = {
    'מכשירים ניידים': smartphonesImg,
    'קונסולות משחק': gamingConsolesImg,
    'מחשבים ניידים': laptopsImg,
    'טלוויזיות': tvImg,
    'אוזניות': headphonesImg,
    'מטענים': 'https://img.ksp.co.il/item/373751/b_3.jpg?v=1742386178',
    'גיבוי ואחסון': 'https://img.ksp.co.il/item/124705/b_1.jpg?v=1606377429'
};

const DEFAULT_CATEGORY_ICON = 'https://img.icons8.com/ios-filled/100/ffffff/box.png';

/**
 * Banner Component.
 * A visually engaging hero section for the home page, featuring category shortcuts and promotional text.
 */
const Banner = () => {
    const [categories, setCategories] = useState([]);

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
        <div className="relative bg-gradient-to-r from-sky-500 to-blue-600 text-white py-16 px-6 rounded-3xl shadow-2xl mb-12 overflow-hidden transform hover:scale-105 transition-transform duration-500 ease-in-out">
            {/* Background geometric shapes */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-10 rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white opacity-5 rounded-full transform -translate-x-1/2 translate-y-1/2"></div>

            {/* Banner content */}
            <div className="relative z-10 text-center">
                <h1 className="text-4xl md:text-6xl font-extrabold mb-4 animate-fade-in-down">
                    בואו לגלות את העתיד של הטכנולוגיה
                </h1>
                <p className="text-lg md:text-xl font-medium mb-8 opacity-90 animate-fade-in-up">
                    מגוון המוצרים החדשניים והגאדג'טים הכי חמים במחירים שלא הכרתם
                </p>

                {/* Category bubbles grid */}
                <div className="flex flex-wrap justify-center gap-6 mt-10">
                    {categories.map((category, index) => {
                        const image = categoryImages[category.name] || DEFAULT_CATEGORY_ICON;
                        return (
                            <Link to={`/products?category=${category.name}`} key={index} className="flex flex-col items-center group">
                                <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-full flex items-center justify-center p-2 shadow-lg hover:bg-gray-100 transition-all duration-300 ease-in-out transform group-hover:scale-110">
                                    <img
                                        src={image}
                                        alt={category.name}
                                        className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                                    />
                                </div>
                                <span className="mt-3 text-sm sm:text-base font-semibold text-white text-shadow-sm group-hover:underline">
                                    {category.name}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Banner;