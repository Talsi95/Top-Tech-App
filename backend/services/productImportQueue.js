const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const xlsx = require('xlsx');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const Product = require('../models/product');
const slugify = require('../utils/slugify');

// Use a Redis connection for BullMQ
const connection = new IORedis(process.env.REDIS_URL || 'redis://redis:6379', {
    maxRetriesPerRequest: null
});

const productImportQueue = new Queue('product-import', { connection });

// Helper function to upload an image from a URL to Cloudinary
async function uploadToCloudinary(url) {
    if (!url) return '';
    try {
        const result = await cloudinary.uploader.upload(url.trim(), {
            folder: 'products',
            // resource_type: 'auto'
        });
        return result.secure_url;
    } catch (error) {
        console.error('Error uploading image to Cloudinary:', error);
        return url; // Fallback to original URL if upload fails
    }
}

// Helper to parse technical specs
// Format: "מעבד: A17 Pro | מסך: 6.1 אינץ"
function parseTechnicalSpecs(specsString) {
    if (!specsString) return [];
    return specsString.split('|').map(spec => {
        const [key, value] = spec.split(':').map(s => s.trim());
        if (key && value) {
            return { key, value };
        }
        return null;
    }).filter(Boolean);
}

// Helper to normalize Hebrew & English header names
function normalizeRow(row) {
    const normalized = {};
    const mapping = {
        'סוג שורה': 'Type',
        'סוג': 'Type',
        'type': 'Type',
        
        'מק"ט (sku)': 'SKU',
        'מק"ט': 'SKU',
        'מקט': 'SKU',
        'sku': 'SKU',
        
        'מק"ט אב': 'ParentSKU',
        'מקט אב': 'ParentSKU',
        'parentsku': 'ParentSKU',
        'parent sku': 'ParentSKU',
        
        'שם המוצר': 'Name',
        'שם': 'Name',
        'name': 'Name',
        
        'תיאור מורחב': 'Description',
        'תיאור': 'Description',
        'description': 'Description',
        
        'קטגוריה': 'Category',
        'category': 'Category',
        
        'תת קטגוריה': 'Subcategory',
        'תת-קטגוריה': 'Subcategory',
        'subcategory': 'Subcategory',
        
        'מחיר': 'Price',
        'price': 'Price',
        
        'מלאי': 'Stock',
        'stock': 'Stock',
        
        'במבצע': 'IsOnSale',
        'האם במבצע': 'IsOnSale',
        'isonsale': 'IsOnSale',
        'is on sale': 'IsOnSale',
        
        'מחיר מבצע': 'SalePrice',
        'saleprice': 'SalePrice',
        'sale price': 'SalePrice',
        
        'קישורי תמונות': 'ImageURLs',
        'תמונות': 'ImageURLs',
        'imageurls': 'ImageURLs',
        'image urls': 'ImageURLs',
        'images': 'ImageURLs',
        
        'מפרט טכני': 'TechnicalSpecs',
        'מפרט': 'TechnicalSpecs',
        'technicalspecs': 'TechnicalSpecs',
        'technical specs': 'TechnicalSpecs'
    };

    for (const key of Object.keys(row)) {
        const cleanKey = key.trim().toLowerCase();
        const mappedKey = mapping[cleanKey] || mapping[key.trim()] || key.trim();
        normalized[mappedKey] = row[key];
    }
    return normalized;
}

// Worker logic
const worker = new Worker('product-import', async (job) => {
    const { filePath, storeId } = job.data;

    try {
        const mongoose = require('mongoose');
        const storeObjectId = new mongoose.Types.ObjectId(storeId);

        // Fix any legacy products imported with storeId as string retroactively
        await Product.updateMany(
            { storeId: storeId },
            [ { $set: { storeId: storeObjectId } } ]
        );

        // 1. Read file
        const workbook = xlsx.readFile(filePath, { codepage: 65001 });
        const sheetName = workbook.SheetNames && workbook.SheetNames[0];
        if (!sheetName) {
            throw new Error('לא נמצאו גיליונות נתונים בקובץ. ודא שהעלית קובץ אקסל או CSV תקין, ולא קובץ RTF או מסמך מעוצב אחר.');
        }
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) {
            throw new Error('לא ניתן לקרוא את גיליון הנתונים מהקובץ.');
        }
        const rows = xlsx.utils.sheet_to_json(sheet);

        let currentProduct = null;
        let productsToUpsert = [];

        // Helper to finalize and push a product
        const finalizeProduct = async (prod) => {
            if (!prod) return;
            
            // If the product has no variants but has parent price/stock/images, create a default variant
            if (prod.variants.length === 0) {
                let imageUrls = [];
                if (prod._tempParentImageURLs) {
                    const urls = prod._tempParentImageURLs.split(',').map(u => u.trim());
                    imageUrls = await Promise.all(urls.map(uploadToCloudinary));
                }
                
                prod.variants.push({
                    sku: prod.sku, // Default to parent SKU
                    price: parseFloat(prod._tempParentPrice) || 0,
                    stock: parseInt(prod._tempParentStock, 10) || 0,
                    isOnSale: prod._tempParentIsOnSale && (prod._tempParentIsOnSale.toString().toLowerCase() === 'true' || prod._tempParentIsOnSale.toString() === '1'),
                    salePrice: prod._tempParentSalePrice ? parseFloat(prod._tempParentSalePrice) : null,
                    imageUrls: imageUrls
                });
            }
            
            // Remove temp fields
            delete prod._tempParentPrice;
            delete prod._tempParentStock;
            delete prod._tempParentIsOnSale;
            delete prod._tempParentSalePrice;
            delete prod._tempParentImageURLs;
            
            productsToUpsert.push(prod);
        };

        // 2. Parse rows (Parent/Child structure)
        for (const rawRow of rows) {
            const row = normalizeRow(rawRow);
            const type = (row.Type || 'Product').toString().trim().toLowerCase();

            if (type === 'product' || type === 'p' || type === 'parent') {
                // Save the previous product
                if (currentProduct) {
                    await finalizeProduct(currentProduct);
                }

                // Initialize new product
                currentProduct = {
                    storeId: storeObjectId,
                    name: row.Name || '',
                    sku: row.SKU ? row.SKU.toString() : '',
                    slug: slugify(row.Name || ''),
                    description: row.Description || '',
                    category: row.Category || 'General',
                    subcategory: row.Subcategory || '',
                    technicalSpecs: parseTechnicalSpecs(row.TechnicalSpecs),
                    variants: [],
                    options: [],
                    // Save temp properties to build default variant if needed
                    _tempParentPrice: row.Price,
                    _tempParentStock: row.Stock,
                    _tempParentIsOnSale: row.IsOnSale,
                    _tempParentSalePrice: row.SalePrice,
                    _tempParentImageURLs: row.ImageURLs
                };
            } else if (type === 'variant' || type === 'v' || type === 'child') {
                if (!currentProduct) {
                    console.warn('Variant row found before a Product row. Skipping.', row);
                    continue;
                }

                // Process variant images
                let imageUrls = [];
                if (row.ImageURLs) {
                    const urls = row.ImageURLs.split(',').map(u => u.trim());
                    imageUrls = await Promise.all(urls.map(uploadToCloudinary));
                }

                const variantData = {
                    sku: row.SKU ? row.SKU.toString() : '',
                    price: parseFloat(row.Price) || 0,
                    stock: parseInt(row.Stock, 10) || 0,
                    isOnSale: row.IsOnSale && (row.IsOnSale.toString().toLowerCase() === 'true' || row.IsOnSale.toString() === '1'),
                    salePrice: row.SalePrice ? parseFloat(row.SalePrice) : null,
                    imageUrls
                };

                // Add any custom/dynamic columns (like color, storage, size, etc.) directly to variant
                const coreKeys = ['Type', 'SKU', 'ParentSKU', 'Name', 'Description', 'Category', 'Subcategory', 'Price', 'Stock', 'IsOnSale', 'SalePrice', 'ImageURLs', 'TechnicalSpecs'];
                for (const key of Object.keys(row)) {
                    if (!coreKeys.includes(key)) {
                        // Map Hebrew terms
                        let targetKey = key;
                        if (key === 'צבע') targetKey = 'color';
                        if (key === 'נפח' || key === 'נפח אחסון') targetKey = 'storage';
                        if (key === 'גודל') targetKey = 'size';
                        
                        variantData[targetKey] = row[key];
                    }
                }

                currentProduct.variants.push(variantData);
            }
        }

        // Push the last product
        if (currentProduct) {
            await finalizeProduct(currentProduct);
        }

        // 3. Process in Chunks (Upsert)
        const CHUNK_SIZE = 50;
        let processedCount = 0;

        for (let i = 0; i < productsToUpsert.length; i += CHUNK_SIZE) {
            const chunk = productsToUpsert.slice(i, i + CHUNK_SIZE);

            const bulkOps = chunk.map(prod => {
                // We upsert by storeId and sku. If sku is missing, we use slug.
                const query = { storeId: prod.storeId };
                if (prod.sku) {
                    query.sku = prod.sku;
                } else {
                    query.slug = prod.slug;
                }

                return {
                    updateOne: {
                        filter: query,
                        update: { $set: prod },
                        upsert: true
                    }
                };
            });

            if (bulkOps.length > 0) {
                await Product.bulkWrite(bulkOps);
            }

            processedCount += chunk.length;
            // Update job progress
            await job.updateProgress(Math.floor((processedCount / productsToUpsert.length) * 100));
        }

        // Cleanup temp file
        fs.unlinkSync(filePath);

        return { success: true, processedCount };

    } catch (error) {
        console.error('Error in product import worker:', error);
        throw error; // Will be caught by BullMQ and marked as failed
    }
}, { connection });

worker.on('completed', (job, result) => {
    console.log(`Job ${job.id} completed! Imported ${result.processedCount} products.`);
});

worker.on('failed', (job, err) => {
    console.log(`Job ${job.id} failed with error ${err.message}`);
});

module.exports = {
    productImportQueue
};
