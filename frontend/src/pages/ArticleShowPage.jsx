import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useStore } from '../StoreContext';
import StoreLink from '../components/StoreLink';
import Loader from '../components/Loader';
import { FaBookOpen, FaCalendarAlt, FaArrowRight, FaClock } from 'react-icons/fa';

/**
 * ArticleShowPage Component.
 * Displays a single article in a premium, highly readable layout.
 */
const ArticleShowPage = () => {
    const { articleSlug } = useParams();
    const { store } = useStore();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const { data } = await axios.get(`${__API_URL__}/articles/${articleSlug}`);
                setArticle(data);
            } catch (err) {
                console.error("Error fetching article:", err);
                setError("המאמר שחיפשתם לא נמצא או שהוסר");
            } finally {
                setLoading(false);
            }
        };

        if (articleSlug) {
            fetchArticle();
        }
    }, [articleSlug]);

    const getReadingTime = (content) => {
        const words = content?.split(/\s+/)?.length || 0;
        const minutes = Math.ceil(words / 200);
        return `${minutes} דקות קריאה`;
    };

    if (loading) return <Loader />;

    if (error || !article) {
        return (
            <div className="min-h-screen bg-gray-50/50 py-20 px-6 text-center flex flex-col items-center justify-center" dir="rtl">
                <div className="bg-white p-12 rounded-[3rem] border border-gray-100 shadow-sm max-w-xl space-y-6">
                    <div className="text-red-500 font-bold text-lg">{error || "המאמר לא נמצא"}</div>
                    <StoreLink to="/articles" className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                        <FaArrowRight size={14} />
                        <span>חזרה לכל המאמרים</span>
                    </StoreLink>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 py-12 px-6 lg:px-12" dir="rtl">
            <div className="max-w-[900px] mx-auto">
                
                {/* Back Button */}
                <div className="mb-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    <StoreLink
                        to="/articles"
                        className="inline-flex items-center gap-3 px-6 py-3 bg-white hover:bg-gray-50 border border-gray-100 text-gray-700 font-black rounded-2xl shadow-sm transition-all hover:scale-105 active:scale-95"
                    >
                        <FaArrowRight size={14} />
                        <span>חזרה למאמרים</span>
                    </StoreLink>
                </div>

                {/* Article Container */}
                <article className="bg-white rounded-[3rem] border border-gray-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.03)] overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
                    
                    {/* Header Cover Image */}
                    {article.image && (
                        <div className="relative aspect-[21/9] w-full overflow-hidden bg-gray-100">
                            <img
                                src={article.image}
                                alt={article.title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                        </div>
                    )}

                    {/* Content Section */}
                    <div className="p-8 lg:p-16 space-y-8">
                        
                        {/* Meta */}
                        <div className="flex flex-wrap gap-6 items-center text-sm font-bold text-gray-400">
                            <div className="flex items-center gap-2">
                                <FaCalendarAlt className="text-primary" size={14} />
                                <span>{new Date(article.createdAt).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FaClock className="text-primary" size={14} />
                                <span>{getReadingTime(article.content)}</span>
                            </div>
                        </div>

                        {/* Title */}
                        <h1 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tighter leading-tight">
                            {article.title}
                        </h1>

                        <hr className="border-gray-100" />

                        {/* Text Body */}
                        <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed font-medium space-y-6 text-lg">
                            {article.content?.split('\n')?.map((para, idx) => {
                                const trimmed = para.trim();
                                if (!trimmed) return null;
                                return (
                                    <p key={idx} className="whitespace-pre-line leading-loose text-justify">
                                        {trimmed}
                                    </p>
                                );
                            })}
                        </div>

                    </div>
                </article>

            </div>
        </div>
    );
};

export default ArticleShowPage;
