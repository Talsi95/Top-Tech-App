const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);


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

module.exports = { sendRegistrationEmail, sendResetPasswordEmail };