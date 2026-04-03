require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const newProducts = [
  {
    name: 'Mala Laddu (Sweet)',
    price: 250,
    description: 'Traditional homemade laddus made with pure ghee and premium ingredients. Melt-in-your-mouth texture.',
    weight: '1 Kg',
    imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    stock: 50,
    featured: true
  },
  {
    name: 'Mysurpak (Premium)',
    price: 280,
    description: 'Crispy and porous premium mysurpak made with pure ghee. A traditional South Indian delicacy.',
    weight: '1 Kg',
    imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    stock: 35,
    featured: true
  },
  {
    name: 'Crunchy Muruku',
    price: 350,
    description: 'Freshly made crispy muruku, perfect for tea-time. Made with special home ingredients.',
    weight: '1 Kg',
    imageUrl: 'https://images.unsplash.com/photo-1605065593343-709f997ce803?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    stock: 60,
    featured: true
  }
];

async function seedMalaProducts() {
  try {
    console.log('--- MALA PRODUCT SEED START ---');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Optional: Keep current Ghee products if they exist
    // Just add the new ones
    for (const prod of newProducts) {
      const exists = await Product.findOne({ name: prod.name });
      if (exists) {
        console.log(`Skipping: ${prod.name} (already exists)`);
      } else {
        await Product.create(prod);
        console.log(`✅ Added: ${prod.name}`);
      }
    }

    console.log('--- SEED COMPLETE ---');
    process.exit(0);
  } catch (err) {
    console.error('❌ SEED FAILED:', err.message);
    process.exit(1);
  }
}

seedMalaProducts();
