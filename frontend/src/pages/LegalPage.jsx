import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { useParams } from 'react-router-dom';
import { useStore } from '../StoreContext';

const LegalPage = ({ type }) => {
    const { store } = useStore();
    const { slug } = useParams();
    const [htmlContent, setHtmlContent] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`${__API_URL__}/stores/${slug}`)
            .then(res => {
                const text = res.data.legal?.[type] || 'לא נמצא מסמך';
                setHtmlContent(DOMPurify.sanitize(text));
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [slug, type]);

    if (loading) return <div>טוען...</div>;

    const storeName = store?.name || 'PowerDev';
    const titles = {
        termsOfService: `תקנון ותנאי שימוש | ${storeName}`,
        privacyPolicy: `מדיניות פרטיות | ${storeName}`
    };
    const descriptions = {
        termsOfService: `תקנון האתר ותנאי השימוש של ${storeName}. מידע חשוב על השימוש באתר, הזמנות, משלוחים, החזרות ועוד.`,
        privacyPolicy: `מדיניות הפרטיות של ${storeName}. כיצד אנו אוספים, משתמשים ומגנים על המידע האישי שלך.`
    };
    const pageTitle = titles[type] || `${storeName}`;
    const pageDescription = descriptions[type] || '';

    return (
        <>
            <Helmet>
                <title>{pageTitle}</title>
                <meta name="description" content={pageDescription} />
                <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : ''} />
                <meta name="robots" content="index, follow" />
                <meta property="og:title" content={pageTitle} />
                <meta property="og:description" content={pageDescription} />
                <meta property="og:type" content="website" />
            </Helmet>

            <div className="max-w-4xl mx-auto px-6 py-12 text-right dir-rtl font-sans prows-g font-medium leading-relaxed">
                <div
                    className="prose prose-blue max-w-none"
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
            </div>
        </>
    );
};

export default LegalPage;