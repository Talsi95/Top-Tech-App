import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { useParams } from 'react-router-dom';

const LegalPage = ({ type }) => {
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

    return (
        <div className="max-w-4xl mx-auto px-6 py-12 text-right dir-rtl font-sans prows-g font-medium leading-relaxed">
            <div
                className="prose prose-blue max-w-none"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
        </div>
    );
};

export default LegalPage;