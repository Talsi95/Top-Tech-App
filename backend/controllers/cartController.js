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

        const formattedCart = user.cart
            .filter(item => item.product) // Filter out items where the product no longer exists
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

        res.json(formattedCart);
    } catch (error) {
        console.error("Error in getCart:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Updates the user's shopping cart in the database.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const updateCart = async (req, res) => {
    try {
        const { cartItems } = req.body;

        const updatedCart = cartItems
            .filter(item => item.product && (typeof item.product === 'string' || item.product._id))
            .map(item => ({
                product: typeof item.product === 'string' ? item.product : item.product._id,
                variant: item.variant ? (typeof item.variant === 'string' ? item.variant : item.variant._id) : null,
                selectedOptions: item.selectedOptions || [],
                quantity: item.quantity
            }));

        const updatedUser = await User.findOneAndUpdate(
            { _id: req.user.id, storeId: req.storeId },
            { cart: updatedCart },
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

module.exports = {
    getCart,
    updateCart
};