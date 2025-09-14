const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
});

const sendRegistrationEmail = async (userEmail, username) => {
    const mailOptions = {
        from: process.env.GMAIL_USER,
        to: userEmail,
        subject: 'אישור הרשמה לטופ טק',
        html: `
      <h2>ברוכים הבאים, ${username}!</h2>
      <p>תודה שנרשמת לאפליקציית טופ טק. חשבונך נוצר בהצלחה.</p>
      <p>עכשיו אתם יכולים להתחבר ולהתחיל לקנות ממוצרי הטכנולוגיה שלנו.</p>
      <br/>
      <p>בברכה,</p>
      <p>הצוות של טופ טק</p>
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Registration email sent successfully to', userEmail);
    } catch (error) {
        console.error('Failed to send registration email:', error);
    }
};

module.exports = { sendRegistrationEmail };