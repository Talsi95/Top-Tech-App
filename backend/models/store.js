const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/cryptoHelper');
const Schema = mongoose.Schema;

const storeSchema = new Schema({
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    customDomain: { type: String, unique: true, sparse: true },
    businessInfo: {
        address: { type: String, default: '' },
        phone: { type: String, default: '' },
        whatsapp: { type: String, default: '' },
        email: { type: String, default: '' },
        facebook: { type: String, default: '' },
        instagram: { type: String, default: '' },
        tiktok: { type: String, default: '' },
        companyNumber: { type: String, default: '' },
    },
    legal: {
        termsOfService: { type: String, default: "" },
        privacyPolicy: { type: String, default: "" },
        useDefaultPrivacy: { type: Boolean, default: true },
        useDefaultTerms: { type: Boolean, default: true },
        showCookieBanner: { type: Boolean, default: true }
    },
    integrations: {
        googleAnalyticsId: { type: String, default: '' },
        facebookPixelId: { type: String, default: '' },
    },
    paymentSettings: {
        provider: {
            type: String,
            enum: ['hyp', 'verifone', 'none'],
            default: 'none'
        },
        hyp: {
            dirName: { type: String, default: '' },
            username: { type: String, default: '' },
            password: { type: String, default: '' },
            apiKey: { type: String, default: '' },
            autoInvoice: { type: Boolean, default: false },
            isSandbox: { type: Boolean, default: true }
        },
        verifone: {
            username: { type: String },
            password: { type: String },
            entityId: { type: String },
            paymentContractId: { type: String }
        }
    },
    invoiceSettings: {
        provider: {
            type: String,
            enum: ['icount', 'green-invoice', 'none'],
            default: 'none'
        },
        icount: {
            iCountToken: { type: String, default: '' }
        },
        greenInvoice: {
            apiKey: { type: String, default: '' },
            apiSecret: { type: String, default: '' }
        }
    },
    design: {
        primaryColor: { type: String, default: '#4f46e5' },
        secondaryColor: { type: String, default: '#1f2937' },
        logoUrl: { type: String, default: '' },
        faviconUrl: { type: String, default: '' }
    },
    labels: {
        technicalSpecs: { type: String, default: 'מפרט טכני' },
        bannerDescription: { type: String, default: 'ברוכים הבאים לחנות שלנו' },
        footerDescription: { type: String, default: 'קניה מהנה ובטוחה' },
        contactUsLabel: { type: String, default: 'צור קשר בוואטסאפ' },
        featuredSectionTitle: { type: String, default: 'הנבחרת שלנו' },
        discoverSectionTitle: { type: String, default: "גלו את המוצרים שלנו" },
        discoverSectionSubtitle: { type: String, default: "הצטרפו לחוויית הקנייה המתקדמת ביותר עם המוצרים המובילים בשוק" }
    },
    features: {
        hasRepairLab: { type: Boolean, default: false },
        hasCart: { type: Boolean, default: true },
        hasUserAccounts: { type: Boolean, default: true },
        hasCheckout: { type: Boolean, default: true },
        fullWidthCards: { type: Boolean, default: false },
        cartDrawer: { type: Boolean, default: true },
        useSubCategories: { type: Boolean, default: true },
        showStock: { type: Boolean, default: true },
        hasArticles: { type: Boolean, default: false },
        hasCashPayment: { type: Boolean, default: true }
    },
    homePageConfig: {
        heroType: {
            type: String,
            enum: ['banner', 'video', 'slider'],
            default: 'banner'
        },
        mediaUrls: [{ type: String }],
        heroTitle: { type: String, default: '' },
        heroSubtitle: { type: String, default: '' }
    },
    gallery: [{
        url: String,
        type: { type: String, enum: ['image', 'video'], default: 'image' },
        title: String
    }],
    shippingOptions: [{
        name: { type: String, required: true },
        price: { type: Number, required: true, default: 0 }
    }]
}, {
    timestamps: true
});


storeSchema.pre('save', async function (next) {
    const store = this;

    if (store.isNew) {
        if (store.paymentSettings?.hyp?.password) {
            store.paymentSettings.hyp.password = encrypt(store.paymentSettings.hyp.password);
        }
        if (store.paymentSettings?.hyp?.apiKey) {
            store.paymentSettings.hyp.apiKey = encrypt(store.paymentSettings.hyp.apiKey);
        }
        if (store.invoiceSettings?.icount?.iCountToken) {
            store.invoiceSettings.icount.iCountToken = encrypt(store.invoiceSettings.icount.iCountToken);
        }
        return next();
    }

    try {
        const originalStore = await store.constructor.findById(store._id);

        if (originalStore) {
            // --- Hyp Password ---
            if (store.paymentSettings?.hyp?.password !== originalStore.paymentSettings?.hyp?.password) {
                if (store.paymentSettings?.hyp?.password) {
                    store.paymentSettings.hyp.password = encrypt(store.paymentSettings.hyp.password);
                }
            }

            // --- Hyp API Key ---
            if (store.paymentSettings?.hyp?.apiKey !== originalStore.paymentSettings?.hyp?.apiKey) {
                if (store.paymentSettings?.hyp?.apiKey) {
                    store.paymentSettings.hyp.apiKey = encrypt(store.paymentSettings.hyp.apiKey);
                }
            }

            // --- iCount Token ---
            if (store.invoiceSettings?.icount?.iCountToken !== originalStore.invoiceSettings?.icount?.iCountToken) {
                if (store.invoiceSettings?.icount?.iCountToken) {
                    store.invoiceSettings.icount.iCountToken = encrypt(store.invoiceSettings.icount.iCountToken);
                }
            }
        }
        next();
    } catch (err) {
        next(err);
    }
});

storeSchema.methods.getDecryptedHypCredentials = function () {
    return {
        password: decrypt(this.paymentSettings.hyp.password),
        apiKey: decrypt(this.paymentSettings.hyp.apiKey)
    };
};
storeSchema.methods.getDecryptedInvoiceCredentials = function () {
    return {
        iCountToken: this.invoiceSettings?.icount?.iCountToken ? decrypt(this.invoiceSettings.icount.iCountToken) : ''
    };
};

const Store = mongoose.model('Store', storeSchema);

module.exports = Store;
