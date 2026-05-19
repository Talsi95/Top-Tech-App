import { useState, useEffect } from 'react';
import axios from 'axios';
import { useStore } from '../StoreContext';
import StoreLink from '../components/StoreLink';
import Loader from '../components/Loader';
import { FaBookOpen, FaCalendarAlt, FaChevronRight } from 'react-icons/fa';

/**
 * ArticlesPage Component.
 * Displays a premium responsive grid of all store blog articles.
 */
const ArticlesPage = () => {
    const { store } = useStore();
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchArticles = async () => {
            try {
                const { data } = await axios.get(`${__API_URL__}/articles`);
                setArticles(data);
            } catch (err) {
                console.error("Error fetching articles:", err);
                setError("אירעה שגיאה בטעינת המאמרים");
            } finally {
                setLoading(false);
            }
        };

        fetchArticles();
    }, []);

    // Calculate reading time based on words count
    const getReadingTime = (content) => {
        const words = content?.split(/\s+/)?.length || 0;
        const minutes = Math.ceil(words / 200); // Average 200 words per minute
        return `${minutes} דק׳ קריאה`;
    };

    if (loading) return <Loader />;

    return (
        <div className="min-h-screen bg-gray-50/50 py-16 px-6 lg:px-12" dir="rtl">
            <div className="max-w-[1440px] mx-auto">
                
                {/* Header Section */}
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-black uppercase tracking-wider">
                        <FaBookOpen size={14} />
                        <span>הבלוג והמאמרים שלנו</span>
                    </div>
                    <h1 className="text-4xl lg:text-6xl font-black text-gray-900 tracking-tighter">
                        כתבות, מדריכים ועדכונים מבית <span className="text-primary">{store?.name || 'האתר'}</span>
                    </h1>
                    <p className="text-lg text-gray-500 font-medium leading-relaxed">
                        כל מה שאתם צריכים לדעת על המוצרים שלנו, טיפים מקצועיים, מתכונים מנצחים והמלצות חמות ישירות מהמומחים שלנו.
                    </p>
                </div>

                {error && (
                    <div className="text-center py-12 text-red-500 text-lg font-semibold bg-red-50 rounded-[2rem] border border-red-100 max-w-xl mx-auto">
                        {error}
                    </div>
                )}

                {!error && articles.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-[3rem] border border-gray-100 shadow-sm max-w-2xl mx-auto space-y-6">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                            <FaBookOpen size={36} />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900">טרם פורסמו מאמרים</h3>
                        <p className="text-gray-500 font-medium max-w-md mx-auto px-6">
                            הבלוג שלנו מתעדכן באופן שוטף. בקרוב נעלה לכאן כתבות ומדריכים מרתקים, שווה לעקוב!
                        </p>
                        <StoreLink to="/" className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                            חזרה לדף הבית
                        </StoreLink>
                    </div>
                )}

                {/* Articles Grid */}
                {!error && articles.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {articles.map((article, idx) => (
                            <StoreLink
                                key={article._id}
                                to={`/articles/${article.slug}`}
                                className="group bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col animate-in fade-in slide-in-from-bottom-8"
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                {/* Cover Image */}
                                <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                                    {article.image ? (
                                        <img
                                            src={article.image}
                                            alt={article.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                                            <FaBookOpen size={48} className="opacity-20" />
                                        </div>
                                    )}
                                    <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold text-gray-700 shadow-sm flex items-center gap-1.5">
                                        <FaCalendarAlt size={11} className="text-primary" />
                                        <span>{new Date(article.createdAt).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}</span>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="p-8 flex-1 flex flex-col justify-between">
                                    <div className="space-y-3">
                                        <div className="text-xs font-black text-primary/80 uppercase tracking-widest">
                                            {getReadingTime(article.content)}
                                        </div>
                                        <h3 className="text-2xl font-black text-gray-900 group-hover:text-primary transition-colors leading-tight">
                                            {article.title}
                                        </h3>
                                        <p className="text-gray-500 font-medium leading-relaxed text-sm line-clamp-3">
                                            {article.content?.replace(/<[^>]*>/g, '') || ''}
                                        </p>
                                    </div>

                                    {/* Action link */}
                                    <div className="flex items-center gap-2 text-primary font-black text-sm mt-6 group-hover:gap-3 transition-all pt-4 border-t border-gray-50">
                                        <span>קרא עוד</span>
                                        <FaChevronRight size={12} className="rotate-180 transition-transform" />
                                    </div>
                                </div>
                            </StoreLink>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
};

export default ArticlesPage;
