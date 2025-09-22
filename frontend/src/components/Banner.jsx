import { Link } from 'react-router-dom';
import laptopsImg from '../assets/laptops.png';
import smartphonesImg from '../assets/smartphones.png';
import gamingConsolesImg from '../assets/consoles.png';
import headphonesImg from '../assets/headphones.png';
import tvImg from '../assets/tv.png';

// Import the categories array from your external file
import { categories } from './categoriesData';

// A mapping to link category names to their respective images
const categoryImages = {
    'מכשירים ניידים': smartphonesImg,
    'קונסולות משחק': gamingConsolesImg,
    'מחשבים ניידים': laptopsImg,
    'טלוויזיות': tvImg,
    'אוזניות': headphonesImg,
};

const Banner = () => {
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
                    {categories.map((category, index) => (
                        <Link to={`/products?category=${category.name}`} key={index} className="flex flex-col items-center group">
                            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-full flex items-center justify-center p-2 shadow-lg hover:bg-gray-100 transition-all duration-300 ease-in-out transform group-hover:scale-110">
                                <img src={categoryImages[category.name]} alt={category.name} className="w-16 h-16 sm:w-20 sm:h-20 object-contain" />
                            </div>
                            <span className="mt-3 text-sm sm:text-base font-semibold text-white text-shadow-sm group-hover:underline">
                                {category.name}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Banner;