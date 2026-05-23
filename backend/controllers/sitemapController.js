const Store = require('../models/store');
const Product = require('../models/product');
const Category = require('../models/category');
const Article = require('../models/article');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * Escapes special XML characters to prevent parsing issues.
 * @param {string} unsafe - The unsafe string.
 * @returns {string} The escaped string.
 */
const escapeXml = (unsafe) => {
    if (!unsafe) return '';
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
};

/**
 * Generates a dynamic XML sitemap for a store.
 * Route: GET /store/:slug/sitemap.xml
 */
const getSitemap = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    // Find the store
    const store = await Store.findOne({ slug });
    if (!store) {
        return res.status(404).send('Store not found');
    }

    // Determine the base URL (prefer FRONTEND_URL environment variable if set)
    const host = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
    const baseUrl = `${host.replace(/\/+$/, '')}/store/${slug}`;

    const urls = [];

    // 1. Store Homepage
    urls.push({
        loc: baseUrl,
        changefreq: 'daily',
        priority: '1.0'
    });

    // 2. Category Pages
    const categories = await Category.find({ storeId: store._id });
    for (const category of categories) {
        urls.push({
            loc: `${baseUrl}/products?category=${encodeURIComponent(category.name)}`,
            changefreq: 'weekly',
            priority: '0.8'
        });
    }

    // 3. Product Pages
    const products = await Product.find({ storeId: store._id });
    for (const product of products) {
        const productSlug = product.slug || product._id.toString();
        urls.push({
            loc: `${baseUrl}/products/${productSlug}`,
            changefreq: 'weekly',
            priority: '0.7'
        });
    }

    // 4. Article Pages (only if enabled for this store)
    if (store.features?.hasArticles) {
        const articles = await Article.find({ storeId: store._id });
        for (const article of articles) {
            const articleSlug = article.slug || article._id.toString();
            urls.push({
                loc: `${baseUrl}/articles/${articleSlug}`,
                changefreq: 'weekly',
                priority: '0.6'
            });
        }
    }

    // Build the XML output
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    for (const url of urls) {
        xml += '  <url>\n';
        xml += `    <loc>${escapeXml(url.loc)}</loc>\n`;
        xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
        xml += `    <priority>${url.priority}</priority>\n`;
        xml += '  </url>\n';
    }

    xml += '</urlset>';

    // Send sitemap response with XML header
    res.header('Content-Type', 'application/xml');
    res.status(200).send(xml);
});

module.exports = { getSitemap };
