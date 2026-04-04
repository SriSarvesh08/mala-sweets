const nodemailer = require('nodemailer');

async function test() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: { user: 'vincenza.zieme13@ethereal.email', pass: 'CjU153F54uA6x3hSjw' }
  });

  try {
    const info = await transporter.sendMail({
      from: 'test@test.com',
      to: ['test1@test.com', undefined],
      subject: 'Test',
      text: 'Test Body'
    });
    console.log('Success:', info.messageId);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
