import React from 'react';
import { FaWhatsapp, FaFacebook, FaInstagram, FaTiktok, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaLock } from 'react-icons/fa';
import { useStore } from '../StoreContext';
import StoreLink from './StoreLink';

/**
 * Footer Component.
 * A comprehensive footer with contact info, social links, and business details.
 */
const Footer = () => {
    const { store } = useStore();

    return (
        <footer className="bg-gray-900 text-gray-300 py-12 mt-auto border-t border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-right" dir="rtl">

                    {/* Business Info */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-white mb-6">{store?.name || "Top Tech"}</h3>
                        <p className="text-sm leading-relaxed text-gray-300">
                            {store?.labels?.footerDescription || `היעד המוביל שלכם למוצרי טכנולוגיה${store?.features?.hasRepairLab ? ', סמארטפונים ומעבדת תיקונים מקצועית' : ' וסמארטפונים'}. איכות, אמינות ושירות ללא פשרות.`}
                        </p>
                        <div className="flex gap-4 pt-4 justify-end inline-flex items-center justify-end flex-row-reverse">
                            <a
                                href={store?.businessInfo?.tiktok || "https://tiktok.com"}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="טיקטוק"
                                className="bg-white/10 text-white p-2 rounded-full hover:bg-white hover:text-black transition-all duration-300 inline-flex items-center justify-end flex-row-reverse"
                            >
                                <FaTiktok className="w-5 h-5" />
                            </a>
                            <a href={store?.businessInfo?.facebook || "https://facebook.com"}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="פייסבוק"
                                className="bg-blue-600/20 text-blue-500 p-2 rounded-full hover:bg-blue-600 hover:text-white transition-all duration-300">
                                <FaFacebook className="w-6 h-6" />
                            </a>
                            <a href={store?.businessInfo?.instagram || "https://instagram.com"}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="אינסטגרם"
                                className="bg-pink-600/20 text-pink-500 p-2 rounded-full hover:bg-pink-600 hover:text-white transition-all duration-300 inline-flex items-center justify-end flex-row-reverse">
                                <FaInstagram className="w-6 h-6" />
                            </a>
                            <a href={`https://wa.me/${store?.businessInfo?.whatsapp?.replace(/[^0-9]/g, '') || "972500000000"}`} target="_blank" rel="noopener noreferrer" aria-label="וואטצאפ" className="bg-green-600/20 text-green-500 p-2 rounded-full hover:bg-green-600 hover:text-white transition-all duration-300 inline-flex items-center justify-end flex-row-reverse">
                                <FaWhatsapp className="w-6 h-6" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-white mb-6">יצירת קשר</h3>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 justify-end flex-row-reverse">
                                <span>{store?.businessInfo?.phone || "050-1234567"}</span>
                                <FaPhoneAlt className="text-sky-500" />
                            </li>
                            <li className="flex items-center gap-3 justify-end flex-row-reverse">
                                <a href={`mailto:${store?.businessInfo?.email || "info@toptech.co.il"}`} className="hover:text-white transition-colors">{store?.businessInfo?.email || "info@toptech.co.il"}</a>
                                <FaEnvelope className="text-sky-500" />
                            </li>
                            <li className="flex items-center gap-3 justify-end flex-row-reverse">
                                <span>{store?.businessInfo?.address || "רחוב הרצל 10, תל אביב"}</span>
                                <FaMapMarkerAlt className="text-sky-500" />
                            </li>
                        </ul>
                    </div>

                    {/* Security & Payment */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-white mb-6">קנייה בטוחה</h3>
                        <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700/50">
                            <div className="flex items-center gap-3 justify-end mb-3 text-green-400 font-semibold flex-row-reverse">
                                <span>תשלום מאובטח SSL</span>
                                <FaLock className="w-4 h-4" />
                            </div>
                            <p className="text-xs text-gray-300 leading-relaxed">
                                האתר מאובטח בטכנולוגיית ההצפנה המתקדמת ביותר. פרטי התשלום שלכם מוגנים ואינם נשמרים במערכת.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-end opacity-50 grayscale hover:grayscale-0 transition-all duration-500 flex-row-reverse">
                            {/* Payment placeholders could be images or simple text-based badges */}
                            <div className="bg-white/10 px-2 py-1 rounded text-[10px] text-white">VISA</div>
                            <div className="bg-white/10 px-2 py-1 rounded text-[10px] text-white">MASTERCARD</div>
                            <div className="bg-white/10 px-2 py-1 rounded text-[10px] text-white">BIT</div>
                        </div>
                    </div>

                    {/* Store Info */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-white mb-6">מידע נוסף</h3>
                        <ul className="space-y-2 text-gray-300">
                            {store?.features?.hasArticles && (
                                <li className="mb-4">
                                    <StoreLink to="/articles" className="text-primary hover:underline font-bold transition-all">הבלוג והמאמרים שלנו</StoreLink>
                                </li>
                            )}
                            <li>א' - ה': 09:00 - 19:00</li>
                            <li>יום ו': 09:00 - 14:00</li>
                            <li>שבת: סגור</li>
                        </ul>
                        <StoreLink to="/accessibility" className="hover:underline transition-all">הצהרת נגישות</StoreLink>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-gray-800 text-center">
                    <p className="text-sm text-gray-300 font-medium">
                        &copy; {new Date().getFullYear()} {store?.name || "Top Tech"}. כל הזכויות שמורות.
                    </p>
                    <p className="text-sm text-gray-300 font-medium">האתר פותח עוצב והונגש ע״י טלסי ווב - פיתוח אתרים</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;