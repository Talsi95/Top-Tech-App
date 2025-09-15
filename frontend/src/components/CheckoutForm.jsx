import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CheckoutForm = ({ cartItems, showNotification, onOrderComplete }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        street: '',
        city: '',
        zipCode: '',
        phone: '',
        paymentMethod: '',
    });


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Corrected function to handle variants
    const calculateTotal = () => {
        return cartItems.reduce((acc, item) => {
            // Check for the price on the variant first, then fall back to the product price
            const priceToUse = item.variant?.price ?? item.product?.price ?? 0;

            if (typeof priceToUse === 'number' && typeof item.quantity === 'number') {
                return acc + priceToUse * item.quantity;
            }
            return acc;
        }, 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (cartItems.length === 0) {
            showNotification('העגלה שלך ריקה', 'error');
            return;
        }

        const orderData = {
            orderItems: cartItems.map(item => ({
                // This is the crucial fix: include the variant ID
                product: item.product._id,
                variant: item.variant ? item.variant._id : null,
                quantity: item.quantity
            })),
            shippingAddress: {
                street: formData.street,
                city: formData.city,
                zipCode: formData.zipCode,
            },
            paymentMethod: formData.paymentMethod,
            totalPrice: calculateTotal(),
        };

        const result = await onOrderComplete(orderData);

        if (result.success) {
            showNotification('הזמנה בוצעה בהצלחה', 'success');
            navigate('/profile');
        }
    };

    const isFormIncomplete = !formData.name || !formData.street || !formData.city || !formData.zipCode || !formData.phone || !formData.paymentMethod;

    return (
        <div className="p-8 max-w-lg mx-auto bg-white rounded-lg shadow-md mt-10">
            <h2 className="text-2xl font-bold mb-6 text-center">פרטי הזמנה</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">שם מלא</label>
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
                    <label className="block text-gray-700 text-sm font-bold mb-2">רחוב</label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight"
                        type="text"
                        name="street"
                        value={formData.street}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">עיר</label>
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
                    <label className="block text-gray-700 text-sm font-bold mb-2">מיקוד</label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight"
                        type="tel"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2">מספר טלפון</label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight"
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="mb-6">
                    <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange}>
                        <option value="">בחר שיטת תשלום</option>
                        <option value="credit-card">כרטיס אשראי</option>
                        <option value="cash">מזומן</option>
                    </select>
                </div>
                <div className="flex justify-between items-center bg-gray-100 p-4 rounded-md mb-6">
                    <h3 className="text-xl font-bold text-gray-800">סה״כ: </h3>
                    <p className="text-xl font-bold text-green-600">₪{calculateTotal().toFixed(2)}</p>
                </div>
                <div className="flex items-center justify-center">
                    <button type="submit" disabled={isFormIncomplete}
                        className={`w-full text-white font-bold py-2 px-4 rounded-md transition-colors duration-300
                    ${isFormIncomplete ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}`}>
                        שלח הזמנה
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CheckoutForm;