const express = require('express');
const router = express.Router();
const multer = require('multer');
const Product = require('../models/Product');
const authMiddleware = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// ─── Cloudinary Config ────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ─── Multer + Cloudinary Storage ──────────────────────────────────────────────
// Uses Cloudinary if env vars are set (production), otherwise memory (local dev)
let upload;
if (process.env.CLOUDINARY_CLOUD_NAME) {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'ss-dairy-products',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }]
    }
  });
  upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
} else {
  // No Cloudinary → accept the file in memory but don't save it
  // Admin must use the Image URL field instead when running locally
  upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
}


// GET /api/products - Public
router.get('/', async (req, res) => {
  // ─── Mock Mode Support ─────────────────────────────
  if (process.env.MOCK_DATABASE === 'true') {
    return res.json({
      success: true,
      message: 'Running in Mock Mode',
      products: [
        {
          _id: 'mock1',
          name: 'Pure Cow Ghee',
          price: 499,
          description: 'Made from 100% pure cow milk using traditional bilona method. Rich in aroma and golden color.',
          category: 'ghee',
          weight: '500ml',
          imageUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&q=80',
          featured: true,
          stock: 50
        },
        {
          _id: 'mock2',
          name: 'Premium Bilona Ghee',
          price: 949,
          description: 'Our bestseller! Premium bilona cow ghee. Perfect for families. Rich aroma, golden colour.',
          category: 'ghee',
          weight: '1L',
          imageUrl: 'https://images.unsplash.com/photo-1631451024069-6ba7e74b9d4f?w=600&q=80',
          featured: true,
          stock: 30
        },
        {
          _id: 'mock3',
          name: 'Buffalo Ghee',
          price: 449,
          description: 'Rich, creamy buffalo milk ghee with a distinct flavour. Ideal for rotis, rice, and sweets.',
          category: 'ghee',
          weight: '500ml',
          imageUrl: 'https://images.unsplash.com/photo-1606914501449-5a96b6ce24ca?w=600&q=80',
          featured: false,
          stock: 25
        }
      ]
    });
  }

  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products/:id - Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/products - Admin only
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  if (process.env.MOCK_DATABASE === 'true') {
    return res.status(201).json({ success: true, message: 'Mock Product Created', product: req.body });
  }
  try {
    const { name, price, description, weight, category, featured, stock } = req.body;
    let imageUrl = req.body.imageUrl || '';
    if (req.file) {
      // Cloudinary: req.file.path = full CDN URL (e.g. https://res.cloudinary.com/...)
      imageUrl = req.file.path || req.file.secure_url || '';
    }
    const product = new Product({ name, price: Number(price), description, weight, category: category || 'ghee', featured: featured === 'true', imageUrl, stock: Number(stock) || 100 });
    await product.save();
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/products/:id - Admin only
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
  if (process.env.MOCK_DATABASE === 'true') {
    return res.json({ success: true, message: 'Mock Product Updated', product: req.body });
  }
  try {
    const { name, price, description, weight, category, featured, imageUrl: bodyImageUrl, stock } = req.body;
    const update = { name, price: Number(price), description, weight, category: category || 'ghee', featured: featured === 'true', stock: Number(stock) };
    if (req.file) {
      // Cloudinary: req.file.path = full CDN URL
      update.imageUrl = req.file.path || req.file.secure_url || '';
    } else if (bodyImageUrl) {
      update.imageUrl = bodyImageUrl;
    }
    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/products/:id - Admin only
router.delete('/:id', authMiddleware, async (req, res) => {
  if (process.env.MOCK_DATABASE === 'true') {
    return res.json({ success: true, message: 'Mock Product Deleted Successfully' });
  }
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
