const express = require('express');
const router = express.Router();
const crypto = require('crypto');

let Razorpay;
try {
  Razorpay = require('razorpay');
} catch (e) {
  console.warn('Razorpay not available');
}

// POST /api/payment/create-order
router.post('/create-order', async (req, res) => {
  try {
    if (!Razorpay || !process.env.RAZORPAY_KEY_ID) {
      return res.status(503).json({ success: false, message: 'Razorpay not configured. Use COD.' });
    }

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    const { amount } = req.body; // amount in paise (INR * 100)
    const order = await instance.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: 'receipt_' + Date.now()
    });

    res.json({ success: true, order, key: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/payment/verify
router.post('/verify', (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      // Payment is verified. Razorpay automatically captures payments for Orders if configured in dashboard.
      console.log(`✅ Payment Verified: Order ${razorpay_order_id}, Payment ${razorpay_payment_id}`);
      res.json({ success: true, message: 'Payment verified and ready for capture.' });
    } else {
      console.error(`❌ Payment Signature Mismatch! Order ${razorpay_order_id}`);
      res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
