const axios = require('axios');

const sendSmsViaProvider = async (to, message, smsSettings, storeName) => {
    const { provider, apiKey, senderName } = smsSettings;

    if (!provider || provider === 'none' || !apiKey) {
        console.log(`[SMS] Skipped: Store '${storeName}' has no SMS provider configured.`);
        return;
    }

    const sender = senderName || storeName || 'Shop';

    try {
        if (provider === '019') {
            await axios.post('https://019sms.co.il/api/v1/send', {
                token: apiKey,
                sender: sender,
                destination: to,
                message: message
            });
        }
        else if (provider === 'sms4free') {
            await axios.post('https://api.sms4free.co.il/v1/sendsms', {
                key: apiKey,
                sender: sender,
                phone: to,
                text: message
            });
        }

        console.log(`[SMS] Message sent successfully via ${provider} for store: ${storeName}`);
    } catch (error) {
        console.error(`[SMS API Error] Failed sending via ${provider}:`, error.message);
    }
};


const sendOrderDeliveredSMS = async (phone, customerName, storeName, orderId) => {
    if (!phone) return;

    const messageBody = `היי ${customerName}, שמחים לעדכן שההזמנה שלך מס' #${orderId} מחנות ${storeName} מוכנה ונמסרה! תתחדש/י!`;

    try {
        await sendSmsViaProvider(phone, messageBody, storeName);
        console.log(`[SMS] Delivered notification sent successfully to ${phone} for Order #${orderId}`);
    } catch (error) {
        console.error(`[SMS Error] Failed to send notification for Order #${orderId}:`, error.message);
    }
};

module.exports = {
    sendOrderDeliveredSMS
};