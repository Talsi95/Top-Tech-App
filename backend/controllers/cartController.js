const User = require('../models/user');

/**
 * Fetches the user's current shopping cart from the database.
 * Populates product details and adjusts prices based on current sales.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getCart = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('cart.product');
        if (!user) {
            return res.json([]);
        }

        const formattedCart = user.cart.map(item => {
            const productData = item.product;
            const priceToUse = productData.isOnSale ? productData.salePrice : productData.price;

            return {
                _id: item._id,
                product: {
                    ...productData.toObject(),
                    price: priceToUse
                },
                quantity: item.quantity
            };
        });

        res.json(formattedCart);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Updates the user's shopping cart in the database.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const updateCart = async (req, res) => {
    const { cartItems } = req.body;

    const updatedCart = cartItems.map(item => ({
        product: item.product,
        quantity: item.quantity
    }));

    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { cart: updatedCart },
        { new: true, runValidators: true }
    ).populate('cart.product');

    if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(updatedUser.cart);
};

module.exports = {
    getCart,
    updateCart
};