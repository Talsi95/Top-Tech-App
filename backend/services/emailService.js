// const sgMail = require('@sendgrid/mail');
const { Resend } = require('resend');
const PDFDocument = require('pdfkit');
const path = require('path');
const bidiFactory = require('bidi-js');
const bidi = bidiFactory();

// sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

const shippingMethodsHeaders = {
    'pickup-business': 'איסוף מבית העסק',
    'home-delivery': 'משלוח עד הבית',
    'pickup-point': 'משלוח לנקודת איסוף'
};

const paymentMethodsHeaders = {
    'credit-card': 'כרטיס אשראי',
    'paypal': 'PayPal',
    'bit': 'ביט',
    'cash': 'מזומן'
};

/**
 * Sends a welcome email to a newly registered user, customized by store.
 * @param {string} userEmail - Recipient's email.
 * @param {string} username - Recipient's username.
 * @param {string} storeName - The specific store name.
 */
const sendRegistrationEmail = async (userEmail, username, storeName = 'החנות שלנו') => {
    const msg = {
        to: userEmail,
        from: process.env.SENDER_EMAIL,
        subject: `אישור הרשמה - ${storeName}`,
        html: `
      <div dir="rtl" style="text-align: right; font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px;">
        <h2 style="color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">ברוכים הבאים, ${username}!</h2>
        <p style="font-size: 15px; color: #334155; line-height: 1.6;">תודה שנרשמתם לפלטפורמת המסחר של <strong>${storeName}</strong>. החשבון שלכם נוצר בהצלחה.</p>
        <p style="font-size: 15px; color: #334155; line-height: 1.6;">מעכשיו אתם יכולים להתחבר, לעקוב אחר הזמנות ולרכוש ממגוון המוצרים שלנו בצורה מהירה ומאובטחת.</p>
        <br/>
        <p style="font-size: 14px; color: #64748b; margin-top: 20px; border-top: 1px solid #f1f5f9; padding-top: 15px;">
            בברכה,<br/>
            צוות <strong>${storeName}</strong>
        </p>
      </div>
    `,
    };

    try {
        await resend.emails.send(msg);
        console.log(`Registration email sent successfully to ${userEmail} for store: ${storeName}`);
    } catch (error) {
        console.error('Failed to send registration email:', error.response ? error.response.body.errors : error);
    }
};

/**
 * Sends a password reset link to the user's email.
 * @param {string} userEmail - Recipient's email.
 * @param {string} resetUrl - The password reset URL.
 * @param {string} storeName - The specific store name.
 */
const sendResetPasswordEmail = async (userEmail, resetUrl, storeName = 'החנות שלנו') => {
    try {
        await resend.emails.send({
            from: process.env.SENDER_EMAIL,
            to: userEmail,
            subject: `איפוס סיסמה - ${storeName}`,
            html: `
                <div dir="rtl" style="text-align: right; font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px;">
                    <h2 style="color: #3b82f6; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">בקשה לאיפוס סיסמה</h2>
                    <p style="font-size: 15px; color: #334155;">שלום,</p>
                    <p style="font-size: 15px; color: #334155; line-height: 1.6;">קיבלנו בקשה לאיפוס הסיסמה לחשבונך באתר <strong>${storeName}</strong>.</p>
                    <div style="margin: 25px 0; text-align: center;">
                        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px;">
                            לחץ כאן לאיפוס הסיסמה
                        </a>
                    </div>
                    <p style="font-size: 13px; color: #64748b;">אם לא ביקשת פעולה זו, ניתן להתעלם בבטחה מהמייל. הקישור תקף לשעה אחת בלבד.</p>
                    <br/>
                    <p style="font-size: 14px; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 15px;">בברכה,<br/>צוות <strong>${storeName}</strong></p>
                </div>
            `,
        });
        console.log(`Reset password email sent successfully via Resend to ${userEmail}`);
    } catch (error) {
        console.error('Failed to send reset password email via Resend:', error);
        throw new Error('Failed to send email.');
    }
};

/**
 * Sends an order confirmation email containing full details dynamically from the schemas.
 * @param {string} userEmail - Recipient's email.
 * @param {Object} orderDetails - The full Order document from Mongoose.
 * @param {Object|string} store - The store configuration object or name.
 */
const sendOrderConfirmationEmail = async (userEmail, orderDetails, store = null) => {
    const orderId = orderDetails._id;
    const totalPrice = orderDetails.totalPrice ? orderDetails.totalPrice.toFixed(2) : '0.00';
    const shippingPrice = orderDetails.shippingPrice ? orderDetails.shippingPrice.toFixed(2) : '0.00';

    const totalNum = parseFloat(totalPrice);
    const subtotal = (totalNum / 1.17).toFixed(2);
    const tax = (totalNum - parseFloat(subtotal)).toFixed(2);

    let storeName = 'החנות שלנו';
    if (store) {
        storeName = typeof store === 'string' ? store : (store.name || 'החנות שלנו');
    }

    const shippingAddress = orderDetails.shippingAddress || {};
    const customerName = shippingAddress.fullName || orderDetails.user?.username || 'לקוח אורח';
    const fullAddress = `${shippingAddress.street || ''}, ${shippingAddress.city || ''} ${shippingAddress.zipCode || ''}`;

    const methodText = shippingMethodsHeaders[orderDetails.shippingMethod] || orderDetails.shippingMethod || 'משלוח';
    const paymentText = paymentMethodsHeaders[orderDetails.paymentMethod] || orderDetails.paymentMethod || 'שולמו';

    let itemsTableRows = '';
    if (orderDetails.orderItems && orderDetails.orderItems.length > 0) {
        orderDetails.orderItems.forEach((item) => {
            const itemName = item.product?.name || item.name || 'מוצר';
            const itemPrice = item.price ? item.price.toFixed(2) : '0.00';
            const itemQty = item.quantity || 1;
            const itemTotal = (item.price * itemQty).toFixed(2);

            let detailsHtml = '';
            if (item.attributes) {
                const attrs = [];
                const attributesObj = item.attributes.toObject ? item.attributes.toObject() : item.attributes;

                if (attributesObj instanceof Map) {
                    for (const [key, value] of attributesObj.entries()) {
                        attrs.push(`<strong>${key}:</strong> ${value}`);
                    }
                } else {
                    Object.keys(attributesObj).forEach(key => {
                        attrs.push(`<strong>${key}:</strong> ${attributesObj[key]}`);
                    });
                }
                if (attrs.length > 0) {
                    detailsHtml += `<div style="font-size: 12px; color: #64748b; margin-top: 2px;">${attrs.join(', ')}</div>`;
                }
            }

            if (item.selectedOptions && item.selectedOptions.length > 0) {
                item.selectedOptions.forEach(opt => {
                    const priceAddText = opt.priceAddition ? ` (+₪${opt.priceAddition.toFixed(2)})` : '';
                    detailsHtml += `<div style="font-size: 12px; color: #475569; margin-top: 2px;">🎁 ${opt.name}: ${opt.choice}${priceAddText}</div>`;
                });
            }

            itemsTableRows += `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 12px 8px; text-align: right; font-size: 14px; color: #1e293b;">
                        <strong>${itemName}</strong>
                        ${detailsHtml}
                    </td>
                    <td style="padding: 12px 8px; text-align: center; font-size: 14px; color: #334155;">${itemQty}</td>
                    <td style="padding: 12px 8px; text-align: center; font-size: 14px; color: #334155;">₪${itemPrice}</td>
                    <td style="padding: 12px 8px; text-align: left; font-size: 14px; color: #1e293b; font-weight: bold;">₪${itemTotal}</td>
                </tr>
            `;
        });
    }

    const htmlContent = `
        <div dir="rtl" style="text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: auto; border: 1px solid #e2e8f0; padding: 25px; border-radius: 12px; background-color: #ffffff; color: #334155;">
            
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #0f172a; font-size: 24px; margin: 0; font-weight: 800;">${storeName}</h1>
                <p style="color: #10b981; font-size: 16px; margin: 5px 0 0 0; font-weight: 600;">אישור הזמנה בהצלחה 🎉</p>
            </div>
            
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;" />

            <p style="font-size: 16px; line-height: 1.5; color: #334155;">שלום <strong>${customerName}</strong>,</p>
            <p style="font-size: 15px; line-height: 1.5; color: #475569;">תודה רבה שקנית אצלנו! שמחים לעדכן שההזמנה שלך התקבלה ומטופלת ברגעים אלו. הנה סיכום פרטי הרכישה שלך:</p>

            <div style="background-color: #f8fafc; border-right: 4px solid #10b981; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <tr>
                        <td style="padding: 4px 0; color: #64748b;"><strong>מספר הזמנה:</strong></td>
                        <td style="padding: 4px 0; text-align: left; color: #1e293b;">#${orderId}</td>
                    </tr>
                    <tr>
                        <td style="padding: 4px 0; color: #64748b;"><strong>תאריך:</strong></td>
                        <td style="padding: 4px 0; text-align: left; color: #1e293b;">${new Date(orderDetails.createdAt || Date.now()).toLocaleDateString('he-IL')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 4px 0; color: #64748b;"><strong>שיטת תשלום:</strong></td>
                        <td style="padding: 4px 0; text-align: left; color: #1e293b;">${paymentText}</td>
                    </tr>
                </table>
            </div>

            <h3 style="color: #0f172a; font-size: 16px; margin: 20px 0 10px 0; border-bottom: 2px solid #f1f5f9; padding-bottom: 5px;">פרטי משלוח ויצירת קשר</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 25px;">
                <tr>
                    <td style="padding: 6px 0; color: #64748b; width: 120px;"><strong>שם מלא:</strong></td>
                    <td style="padding: 6px 0; color: #1e293b;">${customerName}</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; color: #64748b;"><strong>כתובת למשלוח:</strong></td>
                    <td style="padding: 6px 0; color: #1e293b;">${fullAddress || 'איסוף עצמי'}</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; color: #64748b;"><strong>טלפון:</strong></td>
                    <td style="padding: 6px 0; color: #1e293b; direction: ltr; text-align: right;">${shippingAddress.phone || ''}</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; color: #64748b;"><strong>סוג משלוח:</strong></td>
                    <td style="padding: 6px 0; color: #1e293b;">${methodText}</td>
                </tr>
            </table>

            <h3 style="color: #0f172a; font-size: 16px; margin: 20px 0 10px 0; border-bottom: 2px solid #f1f5f9; padding-bottom: 5px;">פירוט המוצרים</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                    <tr style="background-color: #f1f5f9;">
                        <th style="padding: 10px 8px; text-align: right; font-size: 13px; color: #475569;">מוצר</th>
                        <th style="padding: 10px 8px; text-align: center; font-size: 13px; color: #475569; width: 50px;">כמות</th>
                        <th style="padding: 10px 8px; text-align: center; font-size: 13px; color: #475569; width: 90px;">מחיר יחידה</th>
                        <th style="padding: 10px 8px; text-align: left; font-size: 13px; color: #475569; width: 80px;">סה"כ</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsTableRows}
                </tbody>
            </table>

            <div style="width: 250px; margin-right: auto; margin-left: 0; font-size: 14px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 4px 0; color: #64748b;">דמי משלוח:</td>
                        <td style="padding: 4px 0; text-align: left; color: #1e293b;">₪${shippingPrice}</td>
                    </tr>
                    <tr>
                        <td style="padding: 4px 0; color: #64748b;">לפני מע"מ:</td>
                        <td style="padding: 4px 0; text-align: left; color: #1e293b;">₪${subtotal}</td>
                    </tr>
                    <tr>
                        <td style="padding: 4px 0; color: #64748b;">מע"מ (17%):</td>
                        <td style="padding: 4px 0; text-align: left; color: #1e293b;">₪${tax}</td>
                    </tr>
                    <tr style="border-top: 1px solid #e2e8f0;">
                        <td style="padding: 10px 0; color: #0f172a; font-size: 16px;"><strong>סה"כ כולל מע"מ:</strong></td>
                        <td style="padding: 10px 0; text-align: left; color: #10b981; font-size: 18px; font-weight: bold;">₪${totalPrice}</td>
                    </tr>
                </table>
            </div>

            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0 20px 0;" />
            
            <p style="font-size: 13px; color: #94a3b8; text-align: center; margin: 0;">
                מכתב זה מהווה אישור הזמנה בלבד. חשבונית מס רשמית תישלח בהמשך. קנייה מהנה!
            </p>
            <p style="font-size: 14px; color: #64748b; text-align: center; margin-top: 10px; font-weight: bold;">
                צוות ${storeName}
            </p>
        </div>
    `;

    const msg = {
        to: userEmail,
        from: process.env.SENDER_EMAIL,
        subject: `✅ אישור הזמנה #${orderId} - ${storeName}`,
        html: htmlContent
    };

    try {
        await resend.emails.send(msg);
        console.log(`Order confirmation email sent successfully to ${userEmail} (Store: ${storeName}, Order #${orderId})`);
    } catch (error) {
        console.error('Failed to send order confirmation email:', error);
        throw error;
    }
};

/**
 * Sends an email to the customer when the order is marked as ready or shipped.
 * @param {string} userEmail - Recipient's email.
 * @param {Object} orderDetails - The full Order document from Mongoose.
 * @param {Object|string} store - The store configuration object or name.
 */
const sendOrderReadyEmail = async (userEmail, orderDetails, store = null) => {
    const orderId = orderDetails._id;
    let storeName = 'החנות שלנו';
    if (store) {
        storeName = typeof store === 'string' ? store : (store.name || 'החנות שלנו');
    }

    const shippingAddress = orderDetails.shippingAddress || {};
    const customerName = shippingAddress.fullName || orderDetails.user?.username || 'לקוח יקר';

    const isPickup = orderDetails.shippingMethod === 'pickup-business' || 
                     (orderDetails.shippingMethod && (
                         orderDetails.shippingMethod.toLowerCase().includes('pickup') || 
                         orderDetails.shippingMethod.includes('איסוף')
                     ));
    
    let subject, statusTitle, statusMessage;
    if (isPickup) {
        subject = `ההזמנה שלך מוכנה לאיסוף! 🛍️ - ${storeName}`;
        statusTitle = 'ההזמנה מוכנה לאיסוף! 🎉';
        statusMessage = `שמחים לעדכן שההזמנה שלך מספר <strong>#${orderId}</strong> מוכנה וממתינה לך לאיסוף בחנות <strong>${storeName}</strong>.`;
    } else {
        subject = `ההזמנה שלך מוכנה ויוצאת למשלוח! 🚚 - ${storeName}`;
        statusTitle = 'ההזמנה בדרך אליך! 🚀';
        statusMessage = `שמחים לעדכן שההזמנה שלך מספר <strong>#${orderId}</strong> מוכנה ויוצאת כעת למשלוח מחנות <strong>${storeName}</strong>.`;
    }

    const htmlContent = `
        <div dir="rtl" style="text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 25px; border-radius: 12px; background-color: #ffffff; color: #334155;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #0f172a; font-size: 24px; margin: 0; font-weight: 800;">${storeName}</h1>
                <p style="color: #10b981; font-size: 18px; margin: 5px 0 0 0; font-weight: 600;">${statusTitle}</p>
            </div>
            
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;" />

            <p style="font-size: 16px; line-height: 1.5; color: #334155;">שלום <strong>${customerName}</strong>,</p>
            <p style="font-size: 15px; line-height: 1.5; color: #475569;">${statusMessage}</p>

            <div style="background-color: #f8fafc; border-right: 4px solid #10b981; padding: 15px; border-radius: 6px; margin: 20px 0; font-size: 14px;">
                <strong>פרטי ההזמנה:</strong>
                <ul style="list-style-type: none; padding: 0; margin: 10px 0 0 0;">
                    <li style="margin-bottom: 5px;"><strong>מספר הזמנה:</strong> #${orderId}</li>
                    <li style="margin-bottom: 5px;"><strong>שיטת אספקה:</strong> ${shippingMethodsHeaders[orderDetails.shippingMethod] || orderDetails.shippingMethod || 'משלוח'}</li>
                    ${!isPickup && shippingAddress.street ? `<li style="margin-bottom: 5px;"><strong>כתובת למשלוח:</strong> ${shippingAddress.street}, ${shippingAddress.city}</li>` : ''}
                </ul>
            </div>

            <p style="font-size: 15px; line-height: 1.5; color: #475569;">נשמח לראותך שוב בקרוב!</p>

            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0 20px 0;" />
            
            <p style="font-size: 14px; color: #64748b; text-align: center; font-weight: bold; margin: 0;">
                צוות ${storeName}
            </p>
        </div>
    `;

    const msg = {
        to: userEmail,
        from: process.env.SENDER_EMAIL,
        subject: subject,
        html: htmlContent
    };

    try {
        await resend.emails.send(msg);
        console.log(`Order ready/shipped email sent successfully to ${userEmail} (Store: ${storeName}, Order #${orderId})`);
    } catch (error) {
        console.error('Failed to send order ready/shipped email:', error);
        throw error;
    }
};

/**
 * Sends a one-time password (OTP) email for guest checkout verification.
 * @param {string} userEmail - Recipient's email.
 * @param {string} otp - The OTP code.
 * @param {string} storeName - The name of the store.
 */
const sendOTPEmail = async (userEmail, otp, storeName = 'החנות שלנו') => {
    const msg = {
        to: userEmail,
        from: process.env.SENDER_EMAIL,
        subject: `קוד אימות חד פעמי (OTP) - ${storeName}`,
        html: `
            <div dir="rtl" style="text-align: right; font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px;">
                <h2 style="color: #2563eb; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">אימות הזמנה כאורח</h2>
                <p style="font-size: 15px; color: #334155; line-height: 1.6;">הנך מבצע רכישה כאורח בחנות <strong>${storeName}</strong>. השתמש בקוד החד-פעמי הבא על מנת לאמת ולאשר סופית את העסקה:</p>
                
                <div style="background-color: #f1f5f9; padding: 18px; border-radius: 8px; text-align: center; margin: 25px 0; border: 1px dashed #cbd5e1;">
                    <span style="font-size: 28px; font-weight: bold; color: #1e293b; letter-spacing: 2px;">${otp}</span>
                </div>
                
                <p style="font-size: 13px; color: #ef4444; font-weight: 500;">שים לב: קוד זה תקף ל-10 דקות בלבד. אנא הזן אותו במסך הקופה על מנת להשלים את התהליך.</p>
                <p style="font-size: 13px; color: #64748b;">אם לא ביקשת קוד זה, אנא התעלם ממייל זה.</p>
                <br/>
                <p style="font-size: 14px; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 15px;">
                    בברכה,<br/>
                    צוות <strong>${storeName}</strong>
                </p>
            </div>
        `,
    };

    try {
        const response = await sgMail.send(msg);
        console.log(`OTP email sent successfully to ${userEmail} for store: ${storeName}`);
    } catch (error) {
        console.error('Failed to send OTP email:', error.response ? error.response.body.errors : error);
        throw new Error('Failed to send OTP email.');
    }
};

module.exports = {
    sendRegistrationEmail,
    sendResetPasswordEmail,
    sendOrderConfirmationEmail,
    sendOrderReadyEmail,
    sendOTPEmail,
};
