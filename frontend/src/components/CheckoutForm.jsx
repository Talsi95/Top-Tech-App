import { useState } from 'react';

const CheckoutForm = ({ cartItems, showNotification, onOrderComplete }) => {
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        city: '',
        phone: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (cartItems.length === 0) {
            showNotification('Your cart is empty. Please add items before ordering.', 'error');
            return;
        }

        // הדפסת הנתונים למסוף כרגע, ללא שליחה לשרת
        console.log('Order Details:', {
            ...formData,
            items: cartItems,
            total: cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2)
        });

        showNotification('Order placed successfully!', 'success');
        onOrderComplete(); // איפוס העגלה והחזרה לדף הראשי
    };

    return (
        <div className="p-8 max-w-lg mx-auto bg-white rounded-lg shadow-md mt-10">
            <h2 className="text-2xl font-bold mb-6 text-center">Checkout</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Name</label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Address</label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight"
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">City</label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight"
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Phone Number</label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight"
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="flex items-center justify-center">
                    <button
                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                        type="submit"
                    >
                        Place Order
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CheckoutForm;