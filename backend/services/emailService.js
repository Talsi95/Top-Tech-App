const sgMail = require('@sendgrid/mail');
const PDFDocument = require('pdfkit');
const path = require('path');
const bidi = require('bidi-js');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const HEBREW_FONT_PATH = path.join(
    __dirname,
    '..',
    'utils',
    'fonts',
    'Noto_Sans_Hebrew',
    'NotoSansHebrew-VariableFont_wdth,wght.ttf'
);

const rtlText = (text) => {
    if (!text) return '';

    const bidiProcessor = (typeof bidi === 'function') ? bidi : bidi.get;

    if (typeof bidiProcessor !== 'function') {
        console.error("Bidi library initialization failed. Check 'bidi-js' installation and export path.");
        return text;
    }

    try {
        const result = bidiProcessor(text);
        return result.reordered;
    } catch (e) {
        console.error("Bidi processing failed, returning original text.", e.message);
        return text;
    }
};

const streamToBase64 = (stream) => {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => {
            resolve(Buffer.concat(chunks).toString('base64'));
        });
    });
};

const generateOrderPdf = async (orderDetails) => {

    const doc = new PDFDocument({ size: 'A4', margin: 50, rtl: true });

    try {
        doc.font(HEBREW_FONT_PATH);
    } catch (e) {
        console.error("Warning: Hebrew font file not found at path. Falling back to default font (may display squares).", e.message);
    }

    const total = orderDetails.totalPrice ? orderDetails.totalPrice.toFixed(2) : '0.00';
    const totalTax = (orderDetails.totalPrice * 0.17).toFixed(2);
    const subtotal = (orderDetails.totalPrice / 1.17).toFixed(2);
    const shippingAddress = orderDetails.shippingAddress || {};


    doc.fontSize(24).text(rtlText('טופ טק - חשבונית הזמנה'), { align: 'center' });
    doc.moveDown(1.5);

    doc.fontSize(12);

    doc.text(rtlText(`תאריך הוצאה: ${new Date().toLocaleDateString('he-IL')}`), { align: 'right' });
    doc.text(rtlText(`מספר הזמנה: ${orderDetails._id}`), { align: 'right' });

    const addressLine = `${shippingAddress.city || 'לא ידוע'}, ${shippingAddress.street || 'לא ידוע'}`;
    doc.text(rtlText(`כתובת למשלוח: ${addressLine}`), { align: 'right' });
    doc.moveDown(2);


    const tableTop = doc.y;
    const itemGap = 220;
    const priceGap = 80;
    const qtyGap = 50;
    const startX = 50;
    const endX = 550;
    const columnWidth = (endX - startX - qtyGap - priceGap * 2) / 1;

    doc.fontSize(10);

    doc.text(rtlText('סה"כ'), endX - priceGap, tableTop, { width: priceGap, align: 'left' });

    doc.text(rtlText('מחיר ליחידה'), endX - priceGap - priceGap, tableTop, { width: priceGap, align: 'center' });

    doc.text(rtlText('כמות'), endX - priceGap - priceGap - qtyGap, tableTop, { width: qtyGap, align: 'center' });

    doc.text(rtlText('שם מוצר'), startX, tableTop, { width: columnWidth, align: 'right' });


    doc.moveTo(startX, tableTop + 15).lineTo(endX, tableTop + 15).stroke();

    let position = tableTop + 30;

    orderDetails.orderItems.forEach(item => {
        const itemName = item.product?.name || item.name || 'מוצר שנמחק';
        const itemPrice = item.price ? item.price.toFixed(2) : '0.00';
        const itemQuantity = item.quantity || 0;
        const itemTotal = (parseFloat(itemPrice) * itemQuantity).toFixed(2);

        const variantName = item.variantName ? ` (${item.variantName})` : '';

        doc.fontSize(10);

        doc.text(`₪${itemTotal}`, endX - priceGap, position, { width: priceGap, align: 'left' });

        doc.text(`₪${itemPrice}`, endX - priceGap - priceGap, position, { width: priceGap, align: 'center' });

        doc.text(itemQuantity.toString(), endX - priceGap - priceGap - qtyGap, position, { width: qtyGap, align: 'center' });

        doc.text(rtlText(`${itemName}${variantName}`), startX, position, { width: columnWidth, align: 'right', lineBreak: false });


        position += 20;
        doc.moveDown(0.5);
    });

    doc.moveTo(startX, position).lineTo(endX, position).stroke();

    doc.moveDown(1);
    doc.fontSize(12).text(rtlText(`סה"כ (ללא מע"מ): ₪${subtotal}`), { align: 'right' });
    doc.text(rtlText(`מע"מ (17%): ₪${totalTax}`), { align: 'right' });

    doc.moveDown(0.5);
    doc.fontSize(14).font('Helvetica-Bold').text(rtlText(`סה"כ לתשלום: ₪${total}`), { align: 'right' });

    doc.end();

    return streamToBase64(doc);
};


const sendRegistrationEmail = async (userEmail, username) => {
    const msg = {
        to: userEmail,
        from: process.env.SENDER_EMAIL,
        subject: 'אישור הרשמה לטופ טק',
        html: `
      <div dir="rtl" style="text-align: right;">
      <h2>ברוכים הבאים, ${username}!</h2>
      <p>תודה שנרשמתם לאפליקציית טופ טק. חשבונכם נוצר בהצלחה.</p>
      <p>עכשיו אתם יכולים להתחבר ולהתחיל לקנות ממוצרי הטכנולוגיה שלנו.</p>
      <br/>
      <p>בברכה,</p>
      <p>הצוות של טופ טק</p>
      </div>
    `,
    };

    try {
        await sgMail.send(msg);
        console.log('Registration email sent successfully to', userEmail);
    } catch (error) {
        console.error('Failed to send registration email:', error.response ? error.response.body.errors : error);
    }
};

const sendResetPasswordEmail = async (userEmail, resetUrl) => {
    const msg = {
        to: userEmail,
        from: process.env.SENDER_EMAIL,
        subject: 'איפוס סיסמה - טופ טק',
        html: `
            <div dir="rtl" style="text-align: right;">
                <h2>שלום!</h2>
                <p>קיבלנו בקשה לאיפוס הסיסמה לחשבון שלך.</p>
                <p>כדי לאפס את הסיסמה שלך, אנא לחץ על הקישור הבא:</p>
                <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
                    אפס את הסיסמה
                </a>
                <p>אם לא ביקשת איפוס סיסמה, אנא התעלם ממייל זה.</p>
                <p>הקישור תקף לשעה אחת בלבד.</p>
                <br/>
                <p>בברכה,</p>
                <p>הצוות של טופ טק</p>
            </div>
        `,
    };

    try {
        await sgMail.send(msg);
        console.log('Reset password email sent successfully to', userEmail);
    } catch (error) {
        console.error('Failed to send reset password email:', error.response ? error.response.body.errors : error);
        throw new Error('Failed to send email.');
    }
};

const sendOrderConfirmationEmail = async (userEmail, orderDetails) => {
    const orderId = orderDetails._id;
    const total = orderDetails.totalPrice ? orderDetails.totalPrice.toFixed(2) : 'N/A';

    let pdfBase64;
    try {
        pdfBase64 = await generateOrderPdf(orderDetails);
    } catch (e) {
        console.error("Failed to generate PDF:", e);
        pdfBase64 = null;
    }

    const emailBody = pdfBase64 ?
        'פרטי ההזמנה המלאים וחשבונית רשמית מצורפים כקובץ PDF.' :
        'הזמנתך אושרה. פרטים נוספים ניתן למצוא בחשבונך.';

    const msg = {
        to: userEmail,
        from: process.env.SENDER_EMAIL,
        subject: `✅ אישור הזמנה #${orderId} - טופ טק`,
        html: `
            <div dir="rtl" style="text-align: right; font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                <h2 style="color: #4CAF50;">תודה רבה על הזמנתך!</h2>
                <p>הזמנתך התקבלה בהצלחה.</p>
                <p><strong>מספר הזמנה:</strong> ${orderId}</p>
                <p><strong>סה"כ לתשלום:</strong> ₪${total}</p>
                <p style="font-weight: bold;">${emailBody}</p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                
                <p>בברכה,<br/>הצוות של טופ טק</p>
            </div>
        `,
        attachments: pdfBase64 ? [
            {
                content: pdfBase64,
                filename: `Invoice_Order_${orderId}.pdf`,
                type: 'application/pdf',
                disposition: 'attachment',
            },
        ] : [],
    };

    try {
        await sgMail.send(msg);
        console.log(`Order confirmation email with PDF sent successfully to ${userEmail} (Order #${orderId})`);
    } catch (error) {
        console.error('Failed to send order confirmation email:', error.response ? error.response.body.errors : error);
        throw error;
    }
};

const sendOTPEmail = async (userEmail, otp) => {
    const msg = {
        to: userEmail,
        from: process.env.SENDER_EMAIL,
        subject: 'קוד אימות חד פעמי (OTP) - טופ טק',
        html: `
            <div dir="rtl" style="text-align: right; font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                <h2 style="color: #007bff;">אימות הזמנה כאורח</h2>
                <p>השתמש בקוד האימות החד-פעמי הבא כדי להשלים את ההזמנה שלך:</p>
                <div style="background-color: #f0f0f0; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
                    <span style="font-size: 24px; font-weight: bold; color: #333;">${otp}</span>
                </div>
                <p>קוד זה תקף ל-10 דקות בלבד. אנא חזור לעמוד הקופה והכנס אותו.</p>
                <p>אם לא ביקשת קוד זה, אנא התעלם ממייל זה.</p>
                <br/>
                <p>בברכה,</p>
                <p>הצוות של טופ טק</p>
            </div>
        `,
    };

    try {
        await sgMail.send(msg);
        const response = await sgMail.send(msg);
        console.log('OTP email sent successfully to', userEmail);
        console.log('SendGrid Response (Status Code 202):', response[0].statusCode);
        console.log('SendGrid Response Body (Headers):', response[0].headers);
    } catch (error) {
        console.error('Failed to send OTP email:', error.response ? error.response.body.errors : error);
        throw new Error('Failed to send OTP email.');
    }
};

module.exports = {
    sendRegistrationEmail,
    sendResetPasswordEmail,
    sendOrderConfirmationEmail,
    sendOTPEmail
};