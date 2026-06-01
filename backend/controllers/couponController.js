const Coupon = require('../models/Coupon');
const Product = require('../models/product');
const Category = require('../models/category');

/**
 * Apply a coupon to checkout cartItems.
 * POST /api/checkout/apply-coupon
 * Body: { cartItems: [{ productId, variantId, quantity }], couponCode }
 */
const applyCoupon = async (req, res) => {
    try {
        const { cartItems, couponCode } = req.body;

        if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
            return res.status(400).json({ message: 'העגלה ריקה או לא תקינה' });
        }

        if (!couponCode) {
            return res.status(400).json({ message: 'קוד קופון נדרש' });
        }

        // 1. Fetch coupon and validate basic fields
        const coupon = await Coupon.findOne({
            storeId: req.storeId,
            code: couponCode.toUpperCase().trim()
        });

        if (!coupon) {
            return res.status(404).json({ message: 'קופון לא קיים או שאינו שייך לחנות זו' });
        }

        if (!coupon.isActive) {
            return res.status(400).json({ message: 'קופון זה אינו פעיל' });
        }

        // Validate Date range
        const now = new Date();
        if (now < new Date(coupon.validFrom) || now > new Date(coupon.validTo)) {
            return res.status(400).json({ message: 'פג תוקפו של הקופון או שטרם התחיל' });
        }

        // Validate Usage Limit
        if (coupon.usageLimit !== undefined && coupon.usageLimit !== null) {
            if (coupon.usedCount >= coupon.usageLimit) {
                return res.status(400).json({ message: 'הקופון נוצל במלואו ולא ניתן להשתמש בו יותר' });
            }
        }

        // 2. Fetch all products in the cart from DB (to prevent price tampering)
        const productIds = cartItems.map(item => item.productId || item.product);
        const dbProducts = await Product.find({
            _id: { $in: productIds },
            storeId: req.storeId
        });

        const dbProductsMap = {};
        dbProducts.forEach(prod => {
            dbProductsMap[prod._id.toString()] = prod;
        });

        // 3. If targetType is 'category', fetch the relevant category names for matching
        let categoryNames = [];
        if (coupon.targetType === 'category' && coupon.targetIds && coupon.targetIds.length > 0) {
            const categories = await Category.find({
                _id: { $in: coupon.targetIds },
                storeId: req.storeId
            });
            categoryNames = categories.map(c => c.name.toLowerCase().trim());
        }

        // 4. Calculate prices and qualify items
        let totalBeforeDiscount = 0;
        let qualifyingTotal = 0;

        for (const item of cartItems) {
            const pId = item.productId || item.product;
            const vId = item.variantId || item.variant;
            const quantity = parseInt(item.quantity, 10) || 0;

            if (!pId) continue;

            const dbProduct = dbProductsMap[pId.toString()];
            if (!dbProduct) {
                return res.status(400).json({ message: `מוצר עם מזהה ${pId} לא נמצא בחנות` });
            }

            // Find secure price from DB product details
            let itemPrice = 0;
            if (vId && dbProduct.variants && dbProduct.variants.length > 0) {
                const variant = dbProduct.variants.find(v => v._id.toString() === vId.toString());
                if (variant) {
                    itemPrice = (variant.isOnSale && variant.salePrice && variant.salePrice > 0)
                        ? variant.salePrice
                        : variant.price;
                } else {
                    // Fallback to first variant if variant ID wasn't matched
                    const firstVar = dbProduct.variants[0];
                    itemPrice = (firstVar.isOnSale && firstVar.salePrice && firstVar.salePrice > 0)
                        ? firstVar.salePrice
                        : firstVar.price;
                }
            } else if (dbProduct.variants && dbProduct.variants.length > 0) {
                const firstVar = dbProduct.variants[0];
                itemPrice = (firstVar.isOnSale && firstVar.salePrice && firstVar.salePrice > 0)
                    ? firstVar.salePrice
                    : firstVar.price;
            } else {
                itemPrice = dbProduct.price || 0;
            }

            const itemTotal = itemPrice * quantity;
            totalBeforeDiscount += itemTotal;

            // Determine if this item qualifies for the coupon scope
            let qualifies = false;
            if (coupon.targetType === 'global') {
                qualifies = true;
            } else if (coupon.targetType === 'category') {
                if (dbProduct.category && categoryNames.includes(dbProduct.category.toLowerCase().trim())) {
                    qualifies = true;
                }
            } else if (coupon.targetType === 'product') {
                if (coupon.targetIds && coupon.targetIds.some(id => id.toString() === dbProduct._id.toString())) {
                    qualifies = true;
                }
            }

            if (qualifies) {
                qualifyingTotal += itemTotal;
            }
        }

        // 5. Calculate discount amount
        if (qualifyingTotal === 0) {
            return res.status(400).json({ message: 'הקופון אינו חל על המוצרים שבעגלה שלך' });
        }

        let totalDiscount = 0;
        if (coupon.discountType === 'percentage') {
            totalDiscount = qualifyingTotal * (coupon.discountValue / 100);
        } else if (coupon.discountType === 'fixed') {
            totalDiscount = Math.min(coupon.discountValue, qualifyingTotal);
        }

        // Limit discount to total order amount
        totalDiscount = Math.min(totalDiscount, totalBeforeDiscount);
        const finalPrice = Math.max(0, totalBeforeDiscount - totalDiscount);

        return res.status(200).json({
            success: true,
            couponCode: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            targetType: coupon.targetType,
            totalBeforeDiscount: Number(totalBeforeDiscount.toFixed(2)),
            totalDiscount: Number(totalDiscount.toFixed(2)),
            finalPrice: Number(finalPrice.toFixed(2))
        });

    } catch (error) {
        console.error('Error applying coupon:', error);
        return res.status(500).json({ message: 'שגיאה פנימית בעיבוד הקופון' });
    }
};

/**
 * Get all coupons for admin.
 * GET /api/admin/coupons
 */
const getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find({ storeId: req.storeId }).sort({ createdAt: -1 });
        return res.status(200).json(coupons);
    } catch (error) {
        console.error('Error fetching coupons:', error);
        return res.status(500).json({ message: 'שגיאה בשליפת קופונים' });
    }
};

/**
 * Create a new coupon.
 * POST /api/admin/coupons
 */
const createCoupon = async (req, res) => {
    try {
        const {
            code,
            discountType,
            discountValue,
            targetType,
            targetIds,
            validFrom,
            validTo,
            usageLimit,
            isActive
        } = req.body;

        if (!code || !discountType || discountValue === undefined || !targetType || !validFrom || !validTo) {
            return res.status(400).json({ message: 'אנא מלא את כל שדות החובה' });
        }

        // Check if code already exists for this store
        const existingCoupon = await Coupon.findOne({
            storeId: req.storeId,
            code: code.toUpperCase().trim()
        });

        if (existingCoupon) {
            return res.status(400).json({ message: 'קוד קופון זה כבר קיים בחנות שלך' });
        }

        const coupon = new Coupon({
            storeId: req.storeId,
            code: code.toUpperCase().trim(),
            discountType,
            discountValue,
            targetType,
            targetIds: targetIds || [],
            validFrom,
            validTo,
            usageLimit: usageLimit || null,
            isActive: isActive !== undefined ? isActive : true
        });

        await coupon.save();
        return res.status(201).json(coupon);
    } catch (error) {
        console.error('Error creating coupon:', error);
        return res.status(500).json({ message: 'שגיאה ביצירת קופון: ' + error.message });
    }
};

/**
 * Update an existing coupon.
 * PUT /api/admin/coupons/:id
 */
const updateCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            code,
            discountType,
            discountValue,
            targetType,
            targetIds,
            validFrom,
            validTo,
            usageLimit,
            isActive
        } = req.body;

        const coupon = await Coupon.findOne({ _id: id, storeId: req.storeId });
        if (!coupon) {
            return res.status(404).json({ message: 'קופון לא נמצא' });
        }

        // If code is being changed, make sure new code is unique for this store
        if (code && code.toUpperCase().trim() !== coupon.code) {
            const codeExists = await Coupon.findOne({
                storeId: req.storeId,
                code: code.toUpperCase().trim(),
                _id: { $ne: id }
            });
            if (codeExists) {
                return res.status(400).json({ message: 'קוד קופון זה כבר קיים בחנות שלך' });
            }
            coupon.code = code.toUpperCase().trim();
        }

        if (discountType) coupon.discountType = discountType;
        if (discountValue !== undefined) coupon.discountValue = discountValue;
        if (targetType) coupon.targetType = targetType;
        if (targetIds) coupon.targetIds = targetIds;
        if (validFrom) coupon.validFrom = validFrom;
        if (validTo) coupon.validTo = validTo;
        coupon.usageLimit = usageLimit !== undefined ? usageLimit : coupon.usageLimit;
        if (isActive !== undefined) coupon.isActive = isActive;

        await coupon.save();
        return res.status(200).json(coupon);
    } catch (error) {
        console.error('Error updating coupon:', error);
        return res.status(500).json({ message: 'שגיאה בעדכון קופון: ' + error.message });
    }
};

/**
 * Quickly toggle the active state of a coupon.
 * PATCH /api/admin/coupons/:id/toggle
 */
const toggleCouponActive = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        if (isActive === undefined) {
            return res.status(400).json({ message: 'סטטוס פעילות נדרש' });
        }

        const coupon = await Coupon.findOneAndUpdate(
            { _id: id, storeId: req.storeId },
            { $set: { isActive: isActive } },
            { new: true }
        );

        if (!coupon) {
            return res.status(404).json({ message: 'קופון לא נמצא' });
        }

        return res.status(200).json(coupon);
    } catch (error) {
        console.error('Error toggling coupon status:', error);
        return res.status(500).json({ message: 'שגיאה בעדכון סטטוס הקופון' });
    }
};

/**
 * Delete a coupon.
 * DELETE /api/admin/coupons/:id
 */
const deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const coupon = await Coupon.findOneAndDelete({ _id: id, storeId: req.storeId });

        if (!coupon) {
            return res.status(404).json({ message: 'קופון לא נמצא' });
        }

        return res.status(200).json({ message: 'הקופון נמחק בהצלחה' });
    } catch (error) {
        console.error('Error deleting coupon:', error);
        return res.status(500).json({ message: 'שגיאה במחיקת קופון' });
    }
};

module.exports = {
    applyCoupon,
    getCoupons,
    createCoupon,
    updateCoupon,
    toggleCouponActive,
    deleteCoupon
};
