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
    const [statusMessage, setStatusMessage] = useState('מאמת את נתוני התשלום מול שרתי האבטחה, מייד נעבור לאישור ההזמנה...');

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);

        // שליפת הפרמטרים המרכזיים
        const orderId = searchParams.get('Order');
        const cCode = searchParams.get('CCode');
        const errorCode = searchParams.get('error_code');

        // המרת כל הפרמטרים שחזרו ב-URL לאובייקט JS נקי (חיוני עבור ה-Verify של Hyp)
        const allParams = Object.fromEntries(searchParams.entries());

        if (orderId) {
            const storeSlug = localStorage.getItem('currentStoreSlug') || store?.slug || 'default';
            if (errorCode && errorCode !== '0') {
                console.warn(`Payment failed or declined by Verifone. Error code: ${errorCode}`);

                // אנחנו *לא* מוחקים את ה-localStorage של העגלה! 
                // מחזירים את המשתמש ישירות לצ'קאאוט כדי שינסה שוב או יחליף כרטיס
                navigate(`/store/${storeSlug}/checkout?Order=${orderId}&payment_error=true&error_code=${errorCode}`);
                return; // עוצרים את המשך הפונקציה ולא פונים לבאקאנד
            }
            const processOrderVerification = async () => {
                try {
                    const token = getToken() || localStorage.getItem('guestTokenForOrder');
                    const searchParams = new URLSearchParams(location.search);
                    const queryParams = Object.fromEntries(searchParams.entries());

                    const response = await axios.post(`${__API_URL__}/orders/${orderId}/verify-payment`,
                        {
                            queryParams: queryParams // נשלח את הפרמטרים בתוך ה-body כפי שהבקאנד מצפה לקבל
                        },
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                'x-store-slug': storeSlug
                            }
                        }
                    );

                    // ניקוי העגלה קורה רק לאחר שהבקאנד החזיר 200 OK (כלומר התשלום אומת לחלוטין)
                    localStorage.removeItem(`cartItems_${storeSlug}`);

                    // מעבר חלק לעמוד סיום ההזמנה החגיגי והמאובטח
                    navigate(`/store/${storeSlug}/order-confirmation/${orderId}?status=success&CCode=0`);

                } catch (error) {
                    console.error("Failed to verify payment and route order:", error);
                    setStatusMessage('התשלום נקלט בחברת הסליקה, אך חלה שגיאה באבטחת נתוני האימות בשרת. אנא פנה לשירות הלקוחות עם מספר ההזמנה שלך.');
                }
            };

            processOrderVerification();
        } else {
            navigate('/');
        }
    }, [location, navigate, store, getToken]);

    return (
        <div className="h-screen flex flex-col justify-center items-center bg-gray-50">
            <Loader />
            <p className="mt-4 font-medium text-gray-600 text-lg px-4 text-center">{statusMessage}</p>
        </div>
    );
};

export default PaymentSuccess;

// import React, { useEffect, useState } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import Loader from '../components/Loader';
// import { useStore } from '../StoreContext';
// import { useAuth } from '../AuthContext';

// const PaymentSuccess = () => {
//     const location = useLocation();
//     const navigate = useNavigate();
//     const { store } = useStore();
//     const { getToken } = useAuth();
//     const [statusMessage, setStatusMessage] = useState('מעבד את נתוני התשלום, מייד נעבור לאישור ההזמנה...');

//     useEffect(() => {
//         const searchParams = new URLSearchParams(location.search);
//         const orderId = searchParams.get('Order');
//         const cCode = searchParams.get('CCode');

//         if (orderId && cCode === '0') {

//             const processOrderRedirect = async () => {
//                 try {
//                     const token = getToken() || localStorage.getItem('guestTokenForOrder');
//                     const storeSlug = localStorage.getItem('currentStoreSlug') || store?.slug || 'default';

//                     const response = await axios.get(`${__API_URL__}/orders/${orderId}`, {
//                         headers: {
//                             Authorization: `Bearer ${token}`,
//                             'x-store-slug': storeSlug
//                         },
//                         params: {
//                             status: 'success',
//                             CCode: '0'
//                         }
//                     });

//                     localStorage.removeItem(`cartItems_${storeSlug}`);

//                     navigate(`/store/${storeSlug}/order-confirmation/${orderId}?status=success&CCode=0`);

//                 } catch (error) {
//                     console.error("Failed to route order:", error);
//                     setStatusMessage('התשלום הצליח, אך נתקלנו בבעיה בהפניה לעמוד החנות. אנא פנה לתמיכה.');
//                 }
//             };

//             processOrderRedirect();
//         } else {
//             navigate('/');
//         }
//     }, [location, navigate]);

//     return (
//         <div className="h-screen flex flex-col justify-center items-center bg-gray-50">
//             <Loader />
//             <p className="mt-4 font-medium text-gray-600 text-lg px-4 text-center">{statusMessage}</p>
//         </div>
//     );
// };

// export default PaymentSuccess;