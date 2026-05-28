const mongoose = require('mongoose');
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
    paymentSettings: {
        provider: {
            type: String,
            enum: ['stripe', 'hyp', 'none'],
            default: 'none'
        },
        hyp: {
            dirName: { type: String, default: '' },
            username: { type: String, default: '' },
            password: { type: String, default: '' },
            apiKey: { type: String, default: '' },
            isSandbox: { type: Boolean, default: true }
        },
        stripeKey: { type: String, default: '' } // משאירים למקרה שתצטרך בעתיד
    },
    design: {
        primaryColor: { type: String, default: '#4f46e5' }, // Default Indigo 600
        secondaryColor: { type: String, default: '#1f2937' }, // Default Gray 800
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
        hasArticles: { type: Boolean, default: false }
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

const Store = mongoose.model('Store', storeSchema);

module.exports = Store;
