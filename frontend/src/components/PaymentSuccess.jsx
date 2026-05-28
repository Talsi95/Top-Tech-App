import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Loader from '../components/Loader';
import { useStore } from '../StoreContext';
import { useAuth } from '../AuthContext';

const PaymentSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { store } = useStore();
    const { getToken } = useAuth();
    const [statusMessage, setStatusMessage] = useState('מעבד את נתוני התשלום, מייד נעבור לאישור ההזמנה...');

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const orderId = searchParams.get('Order');
        const cCode = searchParams.get('CCode');

        if (orderId && cCode === '0') {

            const processOrderRedirect = async () => {
                try {
                    const token = getToken() || localStorage.getItem('guestTokenForOrder');
                    const storeSlug = localStorage.getItem('currentStoreSlug') || store?.slug || 'default';

                    const response = await axios.get(`${__API_URL__}/orders/${orderId}`, {
                        headers: { 
                            Authorization: `Bearer ${token}`,
                            'x-store-slug': storeSlug
                        },
                        params: {
                            status: 'success',
                            CCode: '0'
                        }
                    });

                    localStorage.removeItem(`cartItems_${storeSlug}`);

                    navigate(`/store/${storeSlug}/order-confirmation/${orderId}?status=success&CCode=0`);

                } catch (error) {
                    console.error("Failed to route order:", error);
                    setStatusMessage('התשלום הצליח, אך נתקלנו בבעיה בהפניה לעמוד החנות. אנא פנה לתמיכה.');
                }
            };

            processOrderRedirect();
        } else {
            navigate('/');
        }
    }, [location, navigate]);

    return (
        <div className="h-screen flex flex-col justify-center items-center bg-gray-50">
            <Loader />
            <p className="mt-4 font-medium text-gray-600 text-lg px-4 text-center">{statusMessage}</p>
        </div>
    );
};

export default PaymentSuccess;