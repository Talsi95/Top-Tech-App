const axios = require('axios');

const sendInvoice = async (order, store) => {
    const provider = store?.invoiceSettings?.provider || 'none';

    if (provider === 'none') {
        console.log(`[InvoiceService]: No invoice provider configured for store: ${store?.name}`);
        return null;
    }

    if (provider === 'icount') {
        const credentials = store.getDecryptedInvoiceCredentials();
        const apiToken = credentials.iCountToken;

        if (!apiToken) {
            throw new Error("מפתח ה-API של iCount חסר בהגדרות החנות.");
        }

        const ICOUNT_BASE_URL = 'https://api.icount.co.il/api/v3.php/';

        const items = order.orderItems.map(item => ({
            description: item.product?.name || 'מוצר כללי',
            unit_price: item.price,
            quantity: item.quantity
        }));

        if (order.shippingPrice > 0) {
            items.push({
                description: `משלוח - ${order.shippingMethod || 'סטנדרטי'}`,
                unit_price: order.shippingPrice,
                quantity: 1
            });
        }

        const payload = {
            client_name: order.shippingAddress?.fullName || 'אורח',
            email: order.shippingAddress?.email || '',
            phone: order.shippingAddress?.phone || '',
            items: items,
            currency: 'ILS',
            payment_method: 'credit-card',
            comments: `הופק אוטומטית עבור הזמנה מספר: ${order._id}`
        };

        const response = await axios.post(`${ICOUNT_BASE_URL}doc/create`, payload, {
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data && response.data.status === 'success') {
            return response.data;
        } else {
            throw new Error(response.data?.message || 'שגיאה לא ידועה בהפקת מסמך ב-iCount');
        }
    }

    if (provider === 'green-invoice') {
        console.log(`[InvoiceService]: Green Invoice integration placeholder for order ${order._id}`);
        return null;
    }
};

module.exports = { sendInvoice };