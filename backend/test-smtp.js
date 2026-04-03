require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

async function testEmail() {
  try {
    console.log('--- SMTP TEST START ---');
    console.log('Sending from:', process.env.GMAIL_USER);
    console.log('Sending to:', process.env.ADMIN_NOTIFY_EMAIL);
    
    await transporter.verify();
    console.log('✅ SMTP Server Connection Verified!');

    const mailOptions = {
      from: `"SS Dairy Test" <${process.env.GMAIL_USER}>`,
      to: process.env.ADMIN_NOTIFY_EMAIL,
      subject: '🧈 SMTP Connection Test — SS Dairy',
      html: `
        <div style="font-family:sans-serif;padding:20px;border:1px solid #ddd;border-radius:8px;">
          <h2 style="color:#8B4513;">SS Dairy Products</h2>
          <p>This is a successful SMTP test! Your email notification system is now 100% functional.</p>
          <p><strong>System Status:</strong> PRODUCTION READY 🚀</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Test Email Sent Successfully!');
    console.log('Message ID:', info.messageId);
    process.exit(0);
  } catch (error) {
    console.error('❌ SMTP TEST FAILED:', error.message);
    process.exit(1);
  }
}

testEmail();
