const Banner = () => {
    return (
        <div className="relative bg-gradient-to-r from-sky-500 to-blue-600 text-white py-16 px-6 rounded-3xl shadow-2xl mb-12 overflow-hidden transform hover:scale-105 transition-transform duration-500 ease-in-out">
            {/* רקע עם צורות גיאומטריות */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-10 rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white opacity-5 rounded-full transform -translate-x-1/2 translate-y-1/2"></div>

            {/* תוכן הבאנר */}
            <div className="relative z-10 text-center">
                <h1 className="text-4xl md:text-6xl font-extrabold mb-4 animate-fade-in-down">
                    בואו לגלות את העתיד של הטכנולוגיה
                </h1>
                <p className="text-lg md:text-xl font-medium mb-8 opacity-90 animate-fade-in-up">
                    מגוון המוצרים החדשניים והגאדג'טים הכי חמים במחירים שלא הכרתם
                </p>
                <button className="bg-white text-blue-600 font-bold py-3 px-8 rounded-full shadow-lg hover:bg-gray-100 transition-colors duration-300 transform hover:scale-110">
                    התחילו לקנות עכשיו
                </button>
            </div>
        </div>
    );
};

export default Banner;