import { Helmet } from 'react-helmet-async';
import { useStore } from '../StoreContext';

export const OrganizationSchema = () => {
  const { store } = useStore();
  if (!store) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: store.name,
    url: typeof window !== 'undefined' ? window.location.origin : '',
    logo: store.design?.logoUrl || '',
    description: store.labels?.footerDescription || store.labels?.bannerDescription || '',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: store.businessInfo?.phone || '',
      email: store.businessInfo?.email || '',
      contactType: 'customer service',
      availableLanguage: ['Hebrew']
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: store.businessInfo?.address || '',
      telephone: store.businessInfo?.phone || ''
    }
  };

  const socialLinks = [
    store.businessInfo?.facebook,
    store.businessInfo?.instagram,
    store.businessInfo?.tiktok
  ].filter(Boolean);
  if (socialLinks.length > 0) {
    schema.sameAs = socialLinks;
  }

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

export const WebSiteSchema = () => {
  const { store } = useStore();
  if (!store) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: store.name,
    url: typeof window !== 'undefined' ? window.location.origin : '',
    description: store.labels?.footerDescription || '',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${typeof window !== 'undefined' ? window.location.origin : ''}/products?search={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

export const BreadcrumbSchema = ({ items = [] }) => {
  if (!items || items.length === 0) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

export const CollectionPageSchema = ({ name, description, products = [] }) => {
  const { store } = useStore();
  const storeName = store?.name || '';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${name} | ${storeName}`,
    description: description || `דפדפו בקטגוריית ${name} במגוון המוצרים הרחב שלנו`,
    url: typeof window !== 'undefined' ? window.location.href : '',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: products.slice(0, 20).map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: product.name,
          image: product.images?.[0] || '',
          url: typeof window !== 'undefined'
            ? `${window.location.origin}/products/${product.slug}`
            : ''
        }
      }))
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};
