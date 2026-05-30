const User = require('../models/user');

/**
 * Fetches the user's current shopping cart from the database.
 * Populates product details and adjusts prices based on current sales.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getCart = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.user.id, storeId: req.storeId }).populate('cart.product');
        if (!user) {
            return res.json([]);
        }

        const showStockFeature = req.store?.features?.showStock !== false;
        let hasChanges = false;
        const validatedCartItems = [];

        for (const item of user.cart) {
            if (!item.product) {
                hasChanges = true;
                continue;
            }

            const productData = item.product;
            const variantObj = productData.variants.find(v => v._id.toString() === item.variant?.toString());

            if (!variantObj) {
                hasChanges = true;
                continue;
            }

            let quantity = item.quantity;
            if (showStockFeature) {
                const stock = variantObj.stock || 0;
                if (stock <= 0) {
                    hasChanges = true;
                    continue;
                }
                if (quantity > stock) {
                    quantity = stock;
                    hasChanges = true;
                }
            }

            validatedCartItems.push({
                _id: item._id,
                product: productData.toObject(),
                variant: variantObj.toObject(),
                selectedOptions: item.selectedOptions || [],
                quantity
            });
        }

        if (hasChanges) {
            const dbCart = validatedCartItems.map(item => ({
                product: item.product._id,
                variant: item.variant._id,
                selectedOptions: item.selectedOptions,
                quantity: item.quantity
            }));
            user.cart = dbCart;
            await user.save();
        }

        res.json(validatedCartItems);
    } catch (error) {
        console.error("Error in getCart:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateCart = async (req, res) => {
    try {
        const { cartItems } = req.body;
        const showStockFeature = req.store?.features?.showStock !== false;

        const validatedCartItems = [];
        const Product = require('../models/product');

        for (const item of cartItems) {
            if (!item.product) {
                continue;
            }

            const productId = typeof item.product === 'string' ? item.product : (item.product._id || item.product);
            const variantId = item.variant ? (typeof item.variant === 'string' ? item.variant : (item.variant._id || item.variant)) : null;

            const product = await Product.findOne({ _id: productId, storeId: req.storeId });
            if (!product) {
                continue;
            }

            const variantObj = product.variants.find(v => v._id.toString() === variantId?.toString());
            if (!variantObj) {
                continue;
            }

            let quantity = item.quantity;
            if (showStockFeature) {
                const stock = variantObj.stock || 0;
                if (stock <= 0) {
                    continue;
                }
                if (quantity > stock) {
                    quantity = stock;
                }
            }

            validatedCartItems.push({
                product,
                variant: variantObj,
                selectedOptions: item.selectedOptions || [],
                quantity
            });
        }

        const dbCart = validatedCartItems.map(item => ({
            product: item.product._id,
            variant: item.variant._id,
            selectedOptions: item.selectedOptions,
            quantity: item.quantity
        }));

        const updatedUser = await User.findOneAndUpdate(
            { _id: req.user.id, storeId: req.storeId },
            { cart: dbCart },
            { new: true, runValidators: true }
        ).populate('cart.product');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const formattedCart = updatedUser.cart
            .filter(item => item.product)
            .map(item => {
                const productData = item.product;
                const variantObj = productData.variants.find(v => v._id.toString() === item.variant?.toString());

                return {
                    _id: item._id,
                    product: productData.toObject(),
                    variant: variantObj ? variantObj.toObject() : null,
                    selectedOptions: item.selectedOptions || [],
                    quantity: item.quantity
                };
            });

        res.status(200).json(formattedCart);
    } catch (error) {
        console.error("Error in updateCart:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

const syncGuestCart = async (req, res) => {
    try {
        const { cartItems } = req.body;
        if (!cartItems || !Array.isArray(cartItems)) {
            return res.json([]);
        }

        const showStockFeature = req.store?.features?.showStock !== false;
        const validatedCartItems = [];
        const Product = require('../models/product');

        for (const item of cartItems) {
            if (!item.product) {
                continue;
            }

            const productId = typeof item.product === 'string' ? item.product : (item.product._id || item.product);
            const variantId = item.variant ? (typeof item.variant === 'string' ? item.variant : (item.variant._id || item.variant)) : null;

            const product = await Product.findOne({ _id: productId, storeId: req.storeId });
            if (!product) {
                continue;
            }

            const variantObj = product.variants.find(v => v._id.toString() === variantId?.toString());
            if (!variantObj) {
                continue;
            }

            let quantity = item.quantity;
            if (showStockFeature) {
                const stock = variantObj.stock || 0;
                if (stock <= 0) {
                    continue;
                }
                if (quantity > stock) {
                    quantity = stock;
                }
            }

            validatedCartItems.push({
                _id: item._id,
                product: product.toObject(),
                variant: variantObj.toObject(),
                selectedOptions: item.selectedOptions || [],
                quantity
            });
        }

        res.json(validatedCartItems);
    } catch (error) {
        console.error("Error in syncGuestCart:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getCart,
    updateCart,
    syncGuestCart
};