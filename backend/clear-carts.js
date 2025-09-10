const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/user'); // Assuming this is your User model path

dotenv.config();

const clearAllUserCarts = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB successfully.');

        // Update every user document and set the 'cart' field to an empty array
        const result = await User.updateMany({}, { $set: { cart: [] } });

        console.log(`Successfully cleared the cart for ${result.modifiedCount} users.`);
    } catch (error) {
        console.error('Error clearing user carts:', error);
    } finally {
        // Disconnect from MongoDB
        mongoose.disconnect();
    }
};

clearAllUserCarts();