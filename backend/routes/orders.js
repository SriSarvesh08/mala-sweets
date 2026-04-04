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

  console.log(`📠 Sending email TO: ${process.env.ADMIN_NOTIFY_EMAIL} FROM: ${process.env.GMAIL_USER}`);
  
  const mailOptions = {
    from: `"SS Dairy Products" <${process.env.GMAIL_USER}>`,
    to: process.env.ADMIN_NOTIFY_EMAIL,
    subject: `🧈 New Order #${order._id.toString().slice(-6).toUpperCase()} - ₹${order.totalAmount}`,
    html: `
      <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#fffbf5;border:2px solid #c9a84c;border-radius:8px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#8B4513,#c9a84c);padding:24px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:24px;">🧈 SS Dairy Products</h1>
          <p style="color:#ffe8b0;margin:4px 0 0;">New Order Received!</p>
        </div>
        <div style="padding:24px;">
          <h2 style="color:#8B4513;border-bottom:2px solid #c9a84c;padding-bottom:8px;">Customer Details</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px;color:#666;width:40%;">Name</td><td style="padding:6px;font-weight:bold;">${order.customerName}</td></tr>
            <tr><td style="padding:6px;color:#666;">Phone</td><td style="padding:6px;font-weight:bold;">${order.phone}</td></tr>
            <tr><td style="padding:6px;color:#666;">Address</td><td style="padding:6px;">${order.address}</td></tr>
            <tr><td style="padding:6px;color:#666;">Payment</td><td style="padding:6px;text-transform:uppercase;font-weight:bold;color:${order.paymentMethod === 'cod' ? '#e67e22' : '#27ae60'};">${order.paymentMethod === 'cod' ? '💵 Cash on Delivery' : '💳 Razorpay'}</td></tr>
          </table>

          <h2 style="color:#8B4513;border-bottom:2px solid #c9a84c;padding-bottom:8px;margin-top:24px;">Order Items</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <thead>
              <tr style="background:#f5e6cc;">
                <th style="padding:8px;border:1px solid #e8d5b7;text-align:left;">Product</th>
                <th style="padding:8px;border:1px solid #e8d5b7;">Qty</th>
                <th style="padding:8px;border:1px solid #e8d5b7;text-align:right;">Unit Price</th>
                <th style="padding:8px;border:1px solid #e8d5b7;text-align:right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
            <tfoot>
              <tr style="background:#8B4513;color:#fff;">
                <td colspan="3" style="padding:10px;font-weight:bold;text-align:right;">Total Amount</td>
                <td style="padding:10px;font-weight:bold;font-size:16px;text-align:right;">₹${order.totalAmount}</td>
              </tr>
            </tfoot>
          </table>
          <p style="color:#999;font-size:12px;margin-top:20px;">Order ID: ${order._id} | Placed at: ${new Date(order.createdAt).toLocaleString('en-IN')}</p>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}

// POST /api/orders - Place order
router.post('/', async (req, res) => {
  try {
    const { customerName, phone, address, items, totalAmount, paymentMethod, razorpayOrderId, razorpayPaymentId } = req.body;

    if (!customerName || !phone || !address || !items?.length || !totalAmount || !paymentMethod)
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
