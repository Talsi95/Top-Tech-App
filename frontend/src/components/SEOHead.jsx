import { Helmet } from 'react-helmet-async';
import { useStore } from '../StoreContext';

/**
 * SEOHead Component.
 * Provides global/default meta tags for every page, including store name,
 * favicon, language, and default OG tags.
 * Wraps children and applies a base Helmet that can be overridden by page-level Helmet.
 */
const SEOHead = ({ children }) => {
  const { store } = useStore();
  const storeName = store?.name || 'PowerDev';
  const defaultDescription = store?.labels?.footerDescription ||
    'ברוכים הבאים לחנות האונליין שלנו. מוצרים איכותיים, מחירים תחרותיים, שירות אדיב ומקצועי.';
  const logoUrl = store?.design?.logoUrl || '';
  const primaryColor = store?.design?.primaryColor || '#4f46e5';
  const faviconUrl = store?.design?.faviconUrl || store?.design?.logoUrl || '/pdfavicon.svg';

  return (
    <>
      <Helmet>
        {/* Default title (can be overridden) */}
        <title>{storeName}</title>

        {/* Charset & Viewport */}
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        {/* Language & Locale */}
        <html lang="he" dir="rtl" />
        <meta httpEquiv="content-language" content="he" />
        <link rel="alternate" href={typeof window !== 'undefined' ? window.location.href : ''} hrefLang="he" />

        {/* Favicon */}
        <link rel="icon" type="image/svg+xml" href={faviconUrl} />
        <link rel="apple-touch-icon" href={faviconUrl} />

        {/* Default Meta */}
        <meta name="description" content={defaultDescription} />
        <meta name="theme-color" content={primaryColor} />

        {/* Open Graph Defaults */}
        <meta property="og:site_name" content={storeName} />
        <meta property="og:locale" content="he_IL" />
        {logoUrl && <meta property="og:image" content={logoUrl} />}
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter Card Defaults */}
        <meta name="twitter:card" content="summary_large_image" />
        {logoUrl && <meta name="twitter:image" content={logoUrl} />}
      </Helmet>
      {children}
    </>
  );
};

export default SEOHead;
