import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Store, ArrowLeft, Search, Mail, Phone, MapPin, ShieldCheck } from 'lucide-react';
import PowerDevLogo from '../../public/PowerDevLogo.png';
import PowerDevHeroImg from '../../public/PowerDevHero.png';

const PlatformLanding = () => {
    const navigate = useNavigate();
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchStores = async () => {
            try {
                const { data } = await axios.get(`${__API_URL__}/stores/public-list`);
                setStores(data);
                setError(null);
            } catch (err) {
                console.error("Error fetching stores:", err);
                setError("אירעה שגיאה בטעינת החנויות. אנא נסו שנית מאוחר יותר.");
            } finally {
                setLoading(false);
            }
        };
        fetchStores();
    }, []);

    const filteredStores = stores.filter(store =>
        store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (store.businessInfo?.address && store.businessInfo.address.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <>
            <Helmet>
                <title>PowerDev Platform - פלטפורמת חנויות חכמות</title>
                <meta name="description" content="PowerDev Platform - פלטפורמת החנויות החכמות המובילה. גלו וקנו ישירות במגוון חנויות מתקדמות. המוצרים האיכותיים ביותר, המותגים המובילים והזמנה מהירה ומאובטחת." />
                <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : ''} />
                <meta property="og:title" content="PowerDev Platform - פלטפורמת חנויות חכמות" />
                <meta property="og:description" content="גלו וקנו ישירות במגוון חנויות מתקדמות. המוצרים האיכותיים ביותר במקום אחד." />
                <meta property="og:type" content="website" />
                <meta property="og:image" content={PowerDevLogo} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="PowerDev Platform - פלטפורמת חנויות חכמות" />
                <meta name="twitter:description" content="גלו וקנו ישירות במגוון חנויות מתקדמות." />
            </Helmet>

            <div className="min-h-screen bg-[#f8f9fb] text-[#191c1e] flex flex-col font-sans" dir="rtl">
                {/* Top Header Bar */}
                <header className="sticky top-0 z-50 backdrop-blur-md bg-white/75 border-b border-gray-100 px-6 py-4 shadow-sm">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            {/* <div className="p-2 bg-indigo-600 text-white rounded-xl">
                            <Store className="w-6 h-6" />
                        </div> */}
                            {/* <span className="text-xl font-black tracking-tight text-gray-900 font-montserrat">PowerDev Platform</span> */}
                            <img src={PowerDevLogo} alt="PowerDev Logo" className="h-14 w-auto" />
                        </div>
                        {/* <div className="flex items-center transition-transform hover:scale-102">
                        <Logo className="h-14 w-auto" />
                    </div> */}
                        <button
                            onClick={() => navigate('/super-admin')}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 hover:border-indigo-600 rounded-xl text-sm font-semibold text-gray-600 hover:text-indigo-600 bg-white shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer"
                        >
                            <ShieldCheck className="w-4 h-4" />
                            <span>כניסת מנהל מערכת</span>
                        </button>
                    </div>
                </header>

                {/* Hero Section */}
                <section className="relative overflow-hidden py-12 md:py-20 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.15),transparent_60%)]" />
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />

                    <div className="relative max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-10 md:gap-16">
                        {/* Visual side — Hero Image */}
                        <div className="w-full md:w-1/2 flex justify-center md:justify-start order-2 md:order-1">
                            <div className="relative group">
                                <div className="absolute -inset-6 bg-indigo-500/20 rounded-full blur-3xl opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
                                <img
                                    src={PowerDevHeroImg}
                                    alt="PowerDev Platform Hero"
                                    className="relative w-full max-w-lg h-auto drop-shadow-2xl transform group-hover:scale-[1.02] group-hover:-translate-y-2 transition-all duration-500 ease-out"
                                    style={{
                                        filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.4)) drop-shadow(0 8px 16px rgba(99,102,241,0.2))",
                                        borderRadius: "2rem",
                                    }}
                                />
                            </div>
                        </div>

                        {/* Text Content side */}
                        <div className="w-full md:w-1/2 text-center md:text-right order-1 md:order-2">
                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-none mb-6">
                                ברוכים הבאים לפלטפורמת החנויות החכמות
                            </h1>
                            <p className="text-base sm:text-lg md:text-xl text-indigo-200/90 font-medium max-w-xl mx-auto md:mx-0 leading-relaxed mb-8">
                                גלו וקנו ישירות במגוון חנויות מתקדמות. המוצרים האיכותיים ביותר, המותגים המובילים והזמנה מהירה ומאובטחת במקום אחד.
                            </p>

                            {/* Live Search Bar */}
                            <div className="max-w-xl mx-auto md:mx-0">
                                <div className="relative group">
                                    <input
                                        type="text"
                                        placeholder="חיפוש חנות לפי שם או מיקום..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-4 pr-12 py-4 bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-slate-900 placeholder-indigo-200/60 focus:placeholder-slate-400 border border-white/20 focus:border-white rounded-2xl shadow-inner focus:shadow-lg focus:outline-none transition-all duration-300 text-lg font-medium text-right"
                                    />
                                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-indigo-200/60 group-focus-within:text-slate-400 pointer-events-none transition-colors" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Main Content */}
                <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-12">
                    <div className="flex items-center justify-between mb-8 gap-4">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                                החנויות הפעילות במערכת
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                בחרו חנות כדי להתחיל לקנות
                            </p>
                        </div>
                        {stores.length > 0 && (
                            <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full">
                                {filteredStores.length} חנויות נמצאו
                            </span>
                        )}
                    </div>

                    {loading ? (
                        /* Skeleton Loaders */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3].map((n) => (
                                <div key={n} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm animate-pulse space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-gray-200 rounded-2xl" />
                                        <div className="flex-grow space-y-2">
                                            <div className="h-6 bg-gray-200 rounded w-2/3" />
                                            <div className="h-4 bg-gray-200 rounded w-1/2" />
                                        </div>
                                    </div>
                                    <div className="space-y-2 pt-2">
                                        <div className="h-4 bg-gray-200 rounded w-full" />
                                        <div className="h-4 bg-gray-200 rounded w-5/6" />
                                    </div>
                                    <div className="h-12 bg-gray-200 rounded-2xl w-full pt-4" />
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center text-red-700 max-w-lg mx-auto">
                            <p className="font-semibold text-lg mb-2">אופס, משהו השתבש</p>
                            <p>{error}</p>
                        </div>
                    ) : filteredStores.length === 0 ? (
                        <div className="text-center py-20 bg-white border border-gray-100 rounded-3xl p-8 max-w-xl mx-auto shadow-sm">
                            <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-700 mb-1">לא נמצאו חנויות תואמות</h3>
                            <p className="text-gray-500 mb-6">לא מצאנו חנויות המתאימות לחיפוש שלכם. נסו מילות מפתח אחרות.</p>
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all active:scale-95 cursor-pointer"
                                >
                                    איפוס חיפוש
                                </button>
                            )}
                        </div>
                    ) : (
                        /* Stores Grid */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredStores.map((store) => {
                                const hasLogo = store.design?.logoUrl;
                                const primaryColor = store.design?.primaryColor || '#4f46e5';
                                const fallbackLetter = store.name ? store.name.charAt(0) : 'S';

                                return (
                                    <div
                                        key={store.slug}
                                        className="group relative bg-white border border-gray-100 hover:border-indigo-100 rounded-3xl p-6 shadow-md shadow-gray-100/40 hover:shadow-xl hover:shadow-indigo-100/30 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
                                    >
                                        <div>
                                            {/* Store Header Details */}
                                            <div className="flex items-center gap-4 mb-5">
                                                {hasLogo ? (
                                                    <img
                                                        src={store.design.logoUrl}
                                                        alt={store.name}
                                                        className="w-16 h-16 object-contain rounded-2xl bg-gray-50 p-2 border border-gray-100"
                                                    />
                                                ) : (
                                                    <div
                                                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-inner"
                                                        style={{
                                                            background: `linear-gradient(135deg, ${primaryColor}, #1e1b4b)`
                                                        }}
                                                    >
                                                        {fallbackLetter}
                                                    </div>
                                                )}
                                                <div>
                                                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                                        {store.name}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 font-medium font-mono">
                                                        {store.slug}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Contact & Business Info */}
                                            <div className="space-y-2.5 my-4 border-t border-gray-50 pt-4 text-sm text-gray-600">
                                                {store.businessInfo?.address ? (
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                                                        <span className="truncate">{store.businessInfo.address}</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-gray-400 italic">
                                                        <MapPin className="w-4 h-4 shrink-0" />
                                                        <span>כתובת לא צוינה</span>
                                                    </div>
                                                )}
                                                {store.businessInfo?.phone && (
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                                                        <span>{store.businessInfo.phone}</span>
                                                    </div>
                                                )}
                                                {store.businessInfo?.email && (
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                                                        <span className="truncate">{store.businessInfo.email}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <div className="mt-6 pt-4 border-t border-gray-50">
                                            <button
                                                onClick={() => navigate(`/store/${store.slug}`)}
                                                className="w-full py-3.5 px-4 bg-indigo-50 group-hover:bg-indigo-600 text-indigo-700 group-hover:text-white font-bold rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 shadow-sm group-hover:shadow-lg group-hover:shadow-indigo-600/20 active:scale-95 cursor-pointer"
                                            >
                                                <span>כניסה לחנות</span>
                                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>

                {/* Platform Footer */}
                <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-10 mt-20 text-center text-sm px-6">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-2 text-white">
                            <Store className="w-5 h-5 text-indigo-400" />
                            <span className="font-bold">פלטפורמת PowerDev החנויות החכמות</span>
                        </div>
                        <p>© {new Date().getFullYear()} כל הזכויות שמורות ל-PowerDev. פתרונות מסחר מתקדמים.</p>
                    </div>
                </footer>
            </div>
        </>
    );
};

export default PlatformLanding;
