const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Product = require('../models/Product');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required' });

    // Check env-level admin first (simpler setup)
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign({ email, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return res.json({ success: true, token });
    }

    // DB admin fallback
    const admin = await Admin.findOne({ email });
    if (!admin || !(await admin.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign({ id: admin._id, email, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/seed - Seeds default products (run once)
router.post('/seed', async (req, res) => {
  try {
    const count = await Product.countDocuments();
    if (count > 0) return res.json({ message: 'Products already seeded' });

    const products = [
      {
        name: 'Pure Cow Ghee – 500g',
        price: 499,
        description: 'Made from 100% pure cow milk using traditional bilona method. Rich in aroma, deep golden color, and authentic homemade taste.',
        weight: '500g',
        imageUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&q=80',
        featured: true,
        stock: 50
      },
      {
        name: 'Pure Cow Ghee – 1 Kg',
        price: 949,
        description: 'Our bestseller! Double quantity of our premium bilona cow ghee. Perfect for families. Sourced from grass-fed cows, zero additives.',
        weight: '1kg',
        imageUrl: 'https://images.unsplash.com/photo-1631451024069-6ba7e74b9d4f?w=600&q=80',
        featured: true,
        stock: 30
      },
      {
        name: 'Buffalo Ghee – 500g',
        price: 449,
        description: 'Rich, creamy buffalo milk ghee with a distinct flavor. Ideal for rotis, rice, and Indian sweets. 100% natural, no preservatives.',
        weight: '500g',
        imageUrl: 'https://images.unsplash.com/photo-1606914501449-5a96b6ce24ca?w=600&q=80',
        featured: false,
        stock: 25
      },
      {
        name: 'A2 Desi Ghee – 250g',
        price: 299,
        description: 'Premium A2 desi cow ghee – rare, therapeutic, and incredibly aromatic. Smaller pack, ideal for gifting or first-time buyers.',
        weight: '250g',
        imageUrl: 'https://images.unsplash.com/photo-1559181567-c3190bde41f8?w=600&q=80',
        featured: false,
        stock: 15
      }
    ];

    await Product.insertMany(products);
    res.json({ success: true, message: 'Products seeded successfully', count: products.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
