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
        subject: 'Registration Confirmation for My Veggies',
        html: `
      <h2>Welcome, ${username}!</h2>
      <p>Thank you for registering to My Veggies app. Your account has been successfully created.</p>
      <p>You can now log in and start shopping for fresh vegetables.</p>
      <br/>
      <p>Best regards,</p>
      <p>The My Veggies Team</p>
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