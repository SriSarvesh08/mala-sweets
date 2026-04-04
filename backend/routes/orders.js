const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Order = require('../models/Order');
const authMiddleware = require('../middleware/auth');

// ─── Email Transporter ────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

async function sendOrderEmail(order) {
  const itemsHtml = order.items.map(item =>
    `<tr>
      <td style="padding:8px;border:1px solid #e8d5b7;">${item.name}</td>
      <td style="padding:8px;border:1px solid #e8d5b7;text-align:center;">${item.quantity}</td>
      <td style="padding:8px;border:1px solid #e8d5b7;text-align:right;">₹${item.price}</td>
      <td style="padding:8px;border:1px solid #e8d5b7;text-align:right;">₹${item.price * item.quantity}</td>
    </tr>`
  ).join('');

  console.log(`📠 Sending email TO: ${process.env.ADMIN_NOTIFY_EMAIL}, ${order.customerEmail} FROM: ${process.env.GMAIL_USER}`);
  
  const mailOptions = {
    from: `"Mala Sweets and Ghee" <${process.env.GMAIL_USER}>`,
    to: [process.env.ADMIN_NOTIFY_EMAIL, order.customerEmail],
    subject: `🍬 Order Confirmed! #${order._id.toString().slice(-6).toUpperCase()} - Mala Sweets and Ghee`,
    html: `
      <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#fffaf0;border:1px solid #e8d5b7;border-radius:12px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,0.1);">
        <div style="background:linear-gradient(135deg,#5D4037,#8D6E63);padding:30px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:28px;letter-spacing:1px;">Mala Sweets and Ghee</h1>
          <p style="color:#dcedc8;margin:8px 0 0;font-size:16px;">Pure • Homemade • Traditional</p>
        </div>
        <div style="padding:30px;background:#fff;">
          <div style="text-align:center;margin-bottom:25px;">
             <h2 style="color:#5D4037;margin:0;font-size:20px;">Order Confirmation</h2>
             <p style="color:#777;margin:5px 0;">Thank you for your order, ${order.customerName}!</p>
          </div>

          <h3 style="color:#8D6E63;border-bottom:1px solid #eee;padding-bottom:10px;font-size:16px;">Delivery Details</h3>
          <table style="width:100%;margin-bottom:20px;font-size:14px;color:#444;">
            <tr><td style="padding:5px 0;width:30%;">Phone:</td><td style="font-weight:bold;">${order.phone}</td></tr>
            <tr><td style="padding:5px 0;">Address:</td><td>${order.address}</td></tr>
            <tr><td style="padding:5px 0;">Payment:</td><td style="font-weight:bold;color:${order.paymentMethod === 'cod' ? '#d84315' : '#2e7d32'};">${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid Online (Razorpay)'}</td></tr>
          </table>

          <h3 style="color:#8D6E63;border-bottom:1px solid #eee;padding-bottom:10px;font-size:16px;">Your Items</h3>
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">
            <thead>
              <tr style="background:#f9f5f0;color:#5D4037;">
                <th style="padding:12px;text-align:left;border-bottom:2px solid #e8d5b7;">Product</th>
                <th style="padding:12px;text-align:center;border-bottom:2px solid #e8d5b7;">Qty</th>
                <th style="padding:12px;text-align:right;border-bottom:2px solid #e8d5b7;">Price</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding:15px 12px;font-weight:bold;text-align:right;color:#5D4037;font-size:16px;">Total Amount Paid</td>
                <td style="padding:15px 12px;font-weight:bold;font-size:18px;text-align:right;color:#5D4037;">₹${order.totalAmount}</td>
              </tr>
            </tfoot>
          </table>
          
          <div style="background:#fdfcf0;padding:20px;border-radius:8px;text-align:center;border:1px dashed #c9a84c;">
            <p style="margin:0;color:#8B4513;font-weight:bold;">We've received your order and are preparing it fresh!</p>
            <p style="margin:5px 0 0;font-size:13px;color:#666;">You'll receive another update once your order is shipped.</p>
          </div>

          <div style="margin-top:30px;padding-top:20px;border-top:1px solid #eee;text-align:center;color:#999;font-size:12px;">
            <p>Order ID: ${order._id} | ${new Date(order.createdAt).toLocaleString('en-IN')}</p>
            <p>© 2024 Mala Sweets and Ghee. All rights reserved.</p>
          </div>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}

// POST /api/orders - Place order
router.post('/', async (req, res) => {
  try {
    const { customerName, phone, customerEmail, address, items, totalAmount, paymentMethod, razorpayOrderId, razorpayPaymentId } = req.body;

    if (!customerName || !phone || !customerEmail || !address || !items?.length || !totalAmount || !paymentMethod)
      return res.status(400).json({ success: false, message: 'Missing required fields' });

    // ─── Mock Mode: Skip DB validation ────────────────────────────────────────
    if (process.env.MOCK_DATABASE === 'true') {
      const mockOrder = {
        _id: 'mock_order_' + Date.now(),
        customerName,
        phone,
        address,
        items,
        totalAmount,
        paymentMethod,
        paymentStatus: paymentMethod === 'razorpay' ? 'paid' : 'pending',
        orderStatus: 'placed',
        createdAt: new Date()
      };
      return res.status(201).json({ success: true, order: mockOrder, message: 'Order placed successfully! (Mock Mode)' });
    }

    // ─── Server-side validation ───────────────────────────────────────────────
    // 1. Recalculate total based on DB prices to prevent manipulation
    const Product = require('../models/Product');
    let calculatedSubtotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      const dbProduct = await Product.findById(item.productId);
      if (!dbProduct) return res.status(404).json({ success: false, message: `Product ${item.name} not found` });
      
      // New: Calculate Price based on Weight
      let weightFactor = 1.0;
      if (item.name.toLowerCase().includes('250g')) weightFactor = 0.25;
      else if (item.name.toLowerCase().includes('500g')) weightFactor = 0.5;

      const unitPrice = Math.round(dbProduct.price * weightFactor);
      calculatedSubtotal += unitPrice * item.quantity;
      
      verifiedItems.push({
        productId: dbProduct._id,
        name: item.name, // Use the name with weight (e.g. Laddu (250g))
        price: unitPrice, 
        quantity: item.quantity
      });
    }

    const deliveryCharge = 0;
    const finalTotal = calculatedSubtotal;


    // Optional: Log the difference if someone tried to cheat
    if (Math.abs(finalTotal - totalAmount) > 1) {
      console.warn(`⚠️ Potential price manipulation attempt from ${customerName}. Reported Total: ${totalAmount}, Calculated: ${finalTotal}`);
      // For security, we override with our calculated total
    }

    const order = new Order({
      customerName, 
      phone, 
      customerEmail,
      address, 
      items: verifiedItems, 
      totalAmount: finalTotal, // Use our verified total
      paymentMethod,
      razorpayOrderId, 
      razorpayPaymentId,
      paymentStatus: paymentMethod === 'razorpay' ? 'paid' : 'pending'
    });
    
    await order.save();

    // Send email notification (non-blocking)
    console.log(`📧 Attempting to send order email for Order #${order._id}...`);
    sendOrderEmail(order)
      .then(() => console.log('✅ Order notification email sent!'))
      .catch(err => console.error('❌ CRITICAL Email error:', err.message));

    res.status(201).json({ success: true, order, message: 'Order placed successfully!' });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// GET /api/orders - Admin only
router.get('/', authMiddleware, async (req, res) => {
  if (process.env.MOCK_DATABASE === 'true') {
    return res.json({
      success: true,
      orders: [
        {
          _id: 'ord123456',
          customerName: 'Sri Sarvesh',
          phone: '9876543210',
          address: '123, Dairy St, Coimbatore, TN',
          items: [{ name: 'Pure Cow Ghee – 1 Kg', quantity: 1, price: 949 }],
          totalAmount: 949,
          paymentMethod: 'razorpay',
          paymentStatus: 'paid',
          orderStatus: 'delivered',
          createdAt: new Date()
        },
        {
          _id: 'ord789012',
          customerName: 'John Doe',
          phone: '9123456789',
          address: '45, Butter Lake, Chennai, TN',
          items: [{ name: 'Buffalo Ghee – 500g', quantity: 2, price: 449 }],
          totalAmount: 958,
          paymentMethod: 'cod',
          paymentStatus: 'pending',
          orderStatus: 'processing',
          createdAt: new Date(Date.now() - 86400000)
        }
      ]
    });
  }
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/orders/:id/status - Admin only
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { orderStatus } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { orderStatus }, { new: true });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
