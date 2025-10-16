import { Elements, useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import axios from 'axios';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = ({ orderAmount, orderId }) => {
    const stripe = useStripe();
    const elements = useElements();

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!stripe || !elements) return;

        const cardElement = elements.getElement(CardElement);
        const { token, error } = await stripe.createToken(cardElement);

        if (error) {
            console.log(error);
            return;
        }

        try {
            const response = await axios.post('/api/orders/checkout', {
                tokenID: token.id,
                amount: orderAmount,
                orderId: orderId,
            });

            if (response.data.success) {
                alert('ההזמנה בוצעה בהצלחה!');
            }
        } catch (error) {
            alert('שגיאה בביצוע החיוב.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 border rounded-lg">
            <h3 className="mb-4 font-bold">פרטי אשראי</h3>
            <CardElement className="p-3 border rounded-md" />
            <button type="submit" disabled={!stripe} className="mt-4 bg-green-600 text-white p-2 rounded w-full">
                שלם {orderAmount} ש"ח
            </button>
        </form>
    );
};

const PaymentWrapper = ({ orderAmount, orderId }) => (
    <Elements stripe={stripePromise}>
        <CheckoutForm orderAmount={orderAmount} orderId={orderId} />
    </Elements>
);

export default PaymentWrapper;