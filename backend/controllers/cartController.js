const User = require('../models/user');

const getCart = async (req, res) => {
    const user = await User.findById(req.user.id).populate('cart.product');
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
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
};

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