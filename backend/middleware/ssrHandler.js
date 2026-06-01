const fs = require('fs');
const path = require('path');
const Store = require('../models/store');
const Product = require('../models/product');
const Article = require('../models/article');
const serialize = require('serialize-javascript');

let render = null;
let template = null;

/**
 * Dynamically imports the ESM Vite SSR bundle and reads the index.html template.
 */
const loadSSR = async () => {
    try {
        const templatePath = path.resolve(__dirname, '../dist/client/index.html');
        if (fs.existsSync(templatePath)) {
            template = fs.readFileSync(templatePath, 'utf-8');
        } else {
            console.warn('SSR Warning: client index.html template not found at', templatePath);
        }

        const serverEntryPath = path.resolve(__dirname, '../dist/server/entry-server.js');
        if (fs.existsSync(serverEntryPath)) {
            // Dynamic import of ESM module from CJS. We append 'file://' to make it a valid URL on all platforms (including Windows).
            const entryServer = await import('file://' + serverEntryPath);
            render = entryServer.render;
            console.log('SSR: Dynamic ESM bundle loaded successfully.');
        } else {
            console.warn('SSR Warning: server entry-server.js bundle not found at', serverEntryPath);
        }
    } catch (err) {
        console.error('Failed to load SSR bundle:', err);
    }
};

// Initial load attempt
loadSSR();

/**
 * Express middleware for Server-Side Rendering (SSR).
 */
const ssrHandler = async (req, res, next) => {
    // If it's an API request, let Express API routing handle it
    if (req.originalUrl.startsWith('/api')) {
        return next();
    }

    // Try to load SSR bundle on the fly if not loaded yet (e.g. during dev startup build delays)
    if (!render || !template) {
        await loadSSR();
    }

    if (!render || !template) {
        // Fallback: send client-side rendering index.html if it exists
        const clientIndex = path.resolve(__dirname, '../dist/client/index.html');
        if (fs.existsSync(clientIndex)) {
            return res.sendFile(clientIndex);
        }
        return next();
    }

    try {
        let initialData = {
            store: null,
            product: null,
            article: null
        };

        // Extract parameters from URL
        const storeMatch = req.originalUrl.match(/^\/store\/([^/]+)/);
        const storeSlug = storeMatch ? decodeURIComponent(storeMatch[1]) : null;

        const productSlugMatch = req.originalUrl.match(/\/products\/([^/]+)/);
        const productSlug = productSlugMatch ? decodeURIComponent(productSlugMatch[1]) : null;

        const productIdMatch = req.originalUrl.match(/\/product\/([^/]+)/);
        const productId = productIdMatch ? decodeURIComponent(productIdMatch[1]) : null;

        const articleSlugMatch = req.originalUrl.match(/\/articles\/([^/]+)/);
        const articleSlug = articleSlugMatch ? decodeURIComponent(articleSlugMatch[1]) : null;

        let store = null;
        const incomingHost = req.headers.host || '';
        const isMainPlatform = incomingHost.includes('localhost') || incomingHost.includes('onrender.com') || incomingHost.includes('top-tech.co.il');

        if (storeSlug) {
            store = await Store.findOne({ slug: storeSlug });
        } else if (!isMainPlatform) {
            const cleanDomain = incomingHost.replace('www.', '').split(':')[0];
            store = await Store.findOne({ customDomain: cleanDomain });
        }
        if (store) {
            initialData.store = store;

            // Load product details if matching route
            if (productSlug) {
                const product = await Product.findOne({ storeId: store._id, slug: productSlug });
                if (product) {
                    initialData.product = product;
                }
            } else if (productId) {
                const mongoose = require('mongoose');
                let query = { storeId: store._id };
                if (mongoose.Types.ObjectId.isValid(productId)) {
                    query.$or = [{ _id: productId }, { slug: productId }];
                } else {
                    query.slug = productId;
                }
                const product = await Product.findOne(query);
                if (product) {
                    initialData.product = product;
                }
            }

            // Load article details if matching route
            if (articleSlug) {
                const article = await Article.findOne({ storeId: store._id, slug: articleSlug });
                if (article) {
                    initialData.article = article;
                }
            }
        }

        // Render HTML
        const { html, helmetContext } = await render(req.originalUrl, initialData);

        const { helmet } = helmetContext;

        // Construct Helmet tags string
        const helmetString = helmet ? [
            helmet.title?.toString(),
            helmet.meta?.toString(),
            helmet.link?.toString(),
            helmet.script?.toString()
        ].filter(Boolean).join('\n') : '';

        // Inject initial preloaded data state
        const stateScript = `<script>window.__INITIAL_DATA__ = ${serialize(initialData, { isJSON: true })};</script>`;
        // Replace placeholders in index.html template
        let renderedHtml = template
            .replace('<!--ssr-helmet-->', helmetString)
            .replace('<!--app-html-->', html)
            .replace('<!--ssr-state-->', stateScript);

        res.status(200).set({ 'Content-Type': 'text/html' }).end(renderedHtml);
    } catch (err) {
        console.error(`SSR rendering failed for URL ${req.originalUrl}:`, err);
        // Fallback to sending standard index.html
        const clientIndex = path.resolve(__dirname, '../dist/client/index.html');
        if (fs.existsSync(clientIndex)) {
            return res.sendFile(clientIndex);
        }
        next(err);
    }
};

module.exports = ssrHandler;
