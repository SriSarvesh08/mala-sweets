/**
 * fix-product-images.js
 * Run this ONCE to update any products in MongoDB that have broken /uploads/ imageUrls.
 * It replaces them with permanent Unsplash placeholder images.
 *
 * Usage (from /backend folder):
 *   node fix-product-images.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

// Good fallback images from Unsplash (permanent, no sign-in needed)
const GHEE_IMAGES = [
  'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&q=80',
  'https://images.unsplash.com/photo-1631451024069-6ba7e74b9d4f?w=600&q=80',
  'https://images.unsplash.com/photo-1606914501449-5a96b6ce24ca?w=600&q=80',
];
const SWEET_IMAGES = [
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&q=80',
  'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&q=80',
  'https://images.unsplash.com/photo-1605065593343-709f997ce803?w=600&q=80',
];

function isBroken(url) {
  if (!url) return true;
  // Broken if it's a local /uploads/ path (Render ephemeral FS)
  if (url.startsWith('/uploads/')) return true;
  // Broken if it's an old absolute Render uploads URL
  if (url.includes('onrender.com/uploads/')) return true;
  return false;
}

async function fixImages() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  console.log('✅ Connected');

  const products = await Product.find({});
  console.log(`Found ${products.length} products`);

  let fixed = 0;
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    if (isBroken(p.imageUrl)) {
      const pool = p.category === 'ghee' ? GHEE_IMAGES : SWEET_IMAGES;
      const newUrl = pool[i % pool.length];
      await Product.findByIdAndUpdate(p._id, { imageUrl: newUrl });
      console.log(`✅ Fixed: "${p.name}" → ${newUrl}`);
      fixed++;
    } else {
      console.log(`⏭️  Skipped: "${p.name}" (image already OK)`);
    }
  }

  console.log(`\n🎉 Done! Fixed ${fixed} / ${products.length} products.`);
  process.exit(0);
}

fixImages().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
