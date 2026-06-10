import React from 'react';
import { Helmet } from 'react-helmet-async';
import StoreLink from '../components/StoreLink';
import { useStore } from '../StoreContext';

const AccessibilityPage = () => {
    const { store } = useStore();
    const storeName = store?.name || 'PowerDev';
    return (
        <>
            <Helmet>
                <title>{`הצהרת נגישות | ${storeName}`}</title>
                <meta name="description" content={`הצהרת נגישות של ${storeName}. אנו פועלים להנגיש את האתר לכלל האוכלוסייה, כולל אנשים עם מוגבלויות, בהתאם לתקנות שוויון זכויות לאנשים עם מוגבלות.`} />
                <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : ''} />
                <meta property="og:title" content={`הצהרת נגישות | ${storeName}`} />
                <meta property="og:description" content={`הצהרת נגישות של ${storeName}. פועלים למתן שירות שוויוני ונגיש לכלל האוכלוסייה.`} />
                <meta property="og:type" content="website" />
            </Helmet>

            <div className="max-w-4xl mx-auto px-4 py-12 md:py-16 font-sans animate-in fade-in duration-300" dir="rtl">

                <nav className="text-sm mb-6 text-gray-500" aria-label="נתיב ניווט">
                    <ol className="list-none p-0 inline-flex space-x-2 space-x-reverse">
                        <li>
                            <StoreLink to="/" className="hover:text-blue-600 hover:underline transition-colors">דף הבית</StoreLink>
                        </li>
                        <li><span className="mx-2 text-gray-400">/</span></li>
                        <li className="text-gray-700 font-medium" aria-current="page">הצהרת נגישות</li>
                    </ol>
                </nav>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10 space-y-8">

                    <div className="border-b border-gray-100 pb-6 text-right">
                        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">
                            הצהרת נגישות – {store?.name || "Top Tech"}
                        </h1>
                        <p className="text-gray-600 max-w-3xl leading-relaxed">
                            אנו ב-{store?.name || "Top Tech"} רואים בחשיבות עליונה את מתן השירות השוויוני והנגיש לכלל הלקוחות, ובכלל זה לאנשים עם מוגבלויות. השקענו משאבים רבים בהנגשת האתר על מנת לאפשר חוויית גלישה נוחה, מכבדת ופשוטה לכלל האוכלוסייה.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <span className="inline-block w-2 h-6 bg-primary rounded-full"></span>
                            רמת הנגישות באתר
                        </h2>
                        <p className="text-gray-600 leading-relaxed pr-4">
                            אתר זה עומד בדרישות תקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשס"ג-2013.
                            התאמות הנגישות בוצעו על פי המלצות התקן הישראלי (ת"י 5568) לנגישות תכנים באינטרנט ברמת <strong className="text-gray-900 font-semibold">AA</strong> ועל פי מסמך WCAG2.0 הבינלאומי.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <span className="inline-block w-2 h-6 bg-primary rounded-full"></span>
                            רכיבי הנגישות הפעילים באתר
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pr-4">
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-lg">
                                    🎛️
                                </div>
                                <h3 className="font-bold text-gray-800 text-sm">תפריט נגישות צף</h3>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    לחיצה על סמל הנגישות בפינת המסך פותחת תפריט המאפשר הגדלת גופנים, מעבר למצב ניגודיות גבוהה והדגשת קישורים גלובלית.
                                </p>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-lg">
                                    ⌨️
                                </div>
                                <h3 className="font-bold text-gray-800 text-sm">ניווט מלא במקלדת</h3>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    האתר מותאם לחלוטין לניווט בעזרת מקש <kbd className="bg-white border px-1 rounded shadow-sm text-[10px]">Tab</kbd>, מקשי החצים ומקש <kbd className="bg-white border px-1 rounded shadow-sm text-[10px]">Enter</kbd> לבחירה.
                                </p>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-lg">
                                    🗣️
                                </div>
                                <h3 className="font-bold text-gray-800 text-sm">התאמה לקוראי מסך</h3>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    כל כפתורי האייקונים, הקישורים והלוגו באתר כוללים תגיות תיאוריות (<code className="text-blue-600 font-mono text-[11px]">aria-label</code>) לטובת טכנולוגיות מסייעות.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 bg-blue-50/50 p-5 rounded-xl border border-blue-100/50">
                        <h2 className="text-base font-bold text-blue-900 flex items-center gap-2">
                            ⚠️ סייגים לנגישות
                        </h2>
                        <p className="text-xs text-blue-800 leading-relaxed">
                            אנו עושים מאמצים רציפים לשמור על נגישות האתר ברמה הגבוהה ביותר בכל רגע נתון. עם זאת, ייתכן כי במהלך גלישה באתר תיתקלו ברכיבים או דפים דינמיים מסוימים (כגון מערכות סליקה חיצוניות, פלאגינים או תכנים המועלים על ידי ספקים) שטרם הונגשו בצורה מלאה או שנמצאים בשלבי הנגשה.
                        </p>
                    </div>

                    <div className="space-y-4 border-t border-gray-100 pt-6">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <span className="inline-block w-2 h-6 bg-primary rounded-full"></span>
                            פרטי רכז הנגישות ויצירת קשר
                        </h2>
                        <p className="text-gray-600 text-sm leading-relaxed pr-4">
                            אם מצאתם תקלה, אם קורא המסך התקשה לקרוא אלמנט מסוים, או אם יש לכם הצעת שיפור – נשמח מאוד לשמוע מכם ולתקן במהירות:
                        </p>

                        <div className="bg-gray-50/50 rounded-xl p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 border border-gray-100 text-sm pr-4">
                            <div className="flex flex-col space-y-1">
                                <span className="text-gray-400 text-xs">שם רכז הנגישות</span>
                                <span className="font-bold text-gray-800">טל - מנהל האתר</span>
                            </div>
                            <div className="flex flex-col space-y-1">
                                <span className="text-gray-400 text-xs">אימייל לפניות נגישות</span>
                                <a href={`mailto:${store?.businessInfo?.email || "[EMAIL_ADDRESS]"}`} className="font-bold text-blue-600 hover:underline break-all">
                                    {store?.businessInfo?.email || "[EMAIL_ADDRESS]"}
                                </a>
                            </div>
                            <div className="flex flex-col space-y-1">
                                <span className="text-gray-400 text-xs">טלפון / וואטסאפ</span>
                                <span className="font-bold text-gray-800">{store?.businessInfo?.phone || "050-XXXXXXX"}</span>
                            </div>
                        </div>
                    </div>

                    <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-50">
                        הצהרת הנגישות עודכנה לאחרונה בתאריך: <span className="font-medium text-gray-500">מאי 2026</span>
                    </div>

                </div>
            </div>
        </>
    );
};

export default AccessibilityPage;