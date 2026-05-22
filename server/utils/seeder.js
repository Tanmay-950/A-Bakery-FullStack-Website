const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config({ path: '../.env' });

const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');

const connectDB = require('../config/db');

const categories = [
  { name: 'Pizza', slug: 'pizza', emoji: '🍕', description: 'Wood-fired and oven-baked pizzas', sortOrder: 1 },
  { name: 'Cakes', slug: 'cakes', emoji: '🎂', description: 'Custom and signature cakes', sortOrder: 2 },
  { name: 'Pastries', slug: 'pastries', emoji: '🥐', description: 'Freshly baked pastries and breads', sortOrder: 3 },
  { name: 'Snacks', slug: 'snacks', emoji: '🧀', description: 'Savory bites and light snacks', sortOrder: 4 },
  { name: 'Drinks', slug: 'drinks', emoji: '🥤', description: 'Fresh juices, shakes and beverages', sortOrder: 5 },
  { name: 'Birthday Specials', slug: 'birthday', emoji: '🎉', description: 'Special birthday cakes and combos', sortOrder: 6 },
  { name: 'Anniversary Cakes', slug: 'anniversary', emoji: '💑', description: 'Romantic anniversary cakes', sortOrder: 7 },
  { name: 'Kids Cakes', slug: 'kids', emoji: '🧸', description: 'Fun cakes for little ones', sortOrder: 8 },
];

const seedDB = async () => {
  await connectDB();

  console.log('🗑️  Clearing existing data...');
  await User.deleteMany();
  await Category.deleteMany();
  await Product.deleteMany();
  await Coupon.deleteMany();

  // Admin user
  console.log('👤 Creating admin user...');
  await User.create({
    name: 'Ghochu Admin',
    email: 'admin@ghochupizza.com',
    password: 'Admin@123',
    role: 'admin',
    isVerified: true,
    phone: '9876543210',
  });

  // Test user
  await User.create({
    name: 'Test Customer',
    email: 'customer@test.com',
    password: 'Test@123',
    role: 'user',
    isVerified: true,
    phone: '9876543211',
  });

  console.log('📁 Creating categories...');
  const createdCategories = await Category.insertMany(categories);
  const catMap = {};
  createdCategories.forEach(c => (catMap[c.slug] = c._id));

  console.log('🍕 Creating products...');
  const products = [
    // Pizza
    { name: 'Margherita Classic', category: catMap['pizza'], price: 249, description: 'Fresh mozzarella, tomato basil sauce, extra virgin olive oil drizzle on our signature thin crust. The timeless Italian classic made with love.', shortDesc: 'Classic tomato, mozzarella & basil', isVeg: true, isFeatured: true, isBestSeller: true, badge: 'bestseller', tags: ['pizza', 'veg', 'classic'], images: [{ url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600', alt: 'Margherita Pizza' }] },
    { name: 'Chicken Supreme Pizza', category: catMap['pizza'], price: 349, discountPrice: 299, description: 'Juicy grilled chicken chunks, tri-colored bell peppers, caramelized onions, jalapeños, and double mozzarella on herb-infused tomato sauce.', shortDesc: 'Grilled chicken, peppers, jalapeños', isVeg: false, isFeatured: true, badge: 'hot', tags: ['pizza', 'non-veg', 'spicy'], images: [{ url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600', alt: 'Chicken Supreme Pizza' }] },
    { name: 'Pepperoni Feast', category: catMap['pizza'], price: 399, description: 'Double-layered premium pepperoni, extra mozzarella, signature tomato sauce, herbs. The meat lover\'s dream pizza.', shortDesc: 'Double pepperoni, extra cheese', isVeg: false, isBestSeller: true, badge: 'bestseller', tags: ['pizza', 'non-veg', 'meaty'], images: [{ url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600', alt: 'Pepperoni Pizza' }] },
    { name: 'Paneer Tikka Pizza', category: catMap['pizza'], price: 329, description: 'Tandoori-marinated paneer cubes, onion, capsicum, and tikka sauce on our crispy base. An Indian twist on Italian perfection.', shortDesc: 'Tandoori paneer, tikka sauce', isVeg: true, badge: 'trending', tags: ['pizza', 'veg', 'indian'], images: [{ url: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=600', alt: 'Paneer Tikka Pizza' }] },

    // Cakes
    { name: 'Chocolate Fantasy Cake', category: catMap['cakes'], price: 599, description: 'Five layers of rich dark chocolate sponge with Belgian ganache frosting, cocoa cream filling, and chocolate shavings. A chocoholic\'s heaven.', shortDesc: 'Dark chocolate, ganache, shavings', isVeg: true, isFeatured: true, badge: 'premium', tags: ['cake', 'chocolate', 'birthday'], images: [{ url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600', alt: 'Chocolate Cake' }] },
    { name: 'Black Forest Delight', category: catMap['cakes'], price: 699, description: 'Classic Black Forest with cherry-soaked chocolate layers, fresh whipped cream, Maraschino cherries, and dark chocolate shavings.', shortDesc: 'Cherries, cream, chocolate layers', isVeg: true, tags: ['cake', 'blackforest'], images: [{ url: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600', alt: 'Black Forest Cake' }] },
    { name: 'Red Velvet Dream', category: catMap['cakes'], price: 649, description: 'Velvety red layers with tangy cream cheese frosting, moist cocoa sponge, and elegant red velvet crumb decoration.', shortDesc: 'Velvet red cake, cream cheese', isVeg: true, badge: 'trending', isFeatured: true, tags: ['cake', 'redvelvet'], images: [{ url: 'https://images.unsplash.com/photo-1586788680434-30d324b2d46f?w=600', alt: 'Red Velvet Cake' }] },
    { name: 'Butterscotch Cloud', category: catMap['cakes'], price: 549, description: 'Light butterscotch sponge with silky caramel buttercream, praline crunch layers, and a golden butterscotch glaze topping.', shortDesc: 'Butterscotch, caramel, praline', isVeg: true, tags: ['cake', 'butterscotch'], images: [{ url: 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=600', alt: 'Butterscotch Cake' }] },

    // Birthday
    { name: 'Unicorn Birthday Cake', category: catMap['birthday'], price: 999, description: 'Magical unicorn theme with rainbow-colored sponge layers, edible glitter, fondant horn and ears, whipped cream rosettes in pastel hues.', shortDesc: 'Rainbow layers, edible glitter, fondant', isVeg: true, isFeatured: true, badge: 'special', tags: ['cake', 'birthday', 'kids', 'unicorn'], images: [{ url: 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=600', alt: 'Unicorn Cake' }] },

    // Anniversary
    { name: 'Anniversary Rose Cake', category: catMap['anniversary'], price: 1199, description: 'Elegant two-tier cake adorned with hand-crafted fondant roses, gold leaf accents, and personalized message plaque. Perfect for your special day.', shortDesc: 'Two-tier, fondant roses, gold leaf', isVeg: true, badge: 'premium', isFeatured: true, tags: ['cake', 'anniversary', 'wedding', 'romantic'], images: [{ url: 'https://images.unsplash.com/photo-1562440499-64c9a111f713?w=600', alt: 'Anniversary Cake' }] },

    // Kids
    { name: 'Cartoon Character Cake', category: catMap['kids'], price: 799, description: 'Customizable cartoon character cake featuring your child\'s favorite character in vibrant edible colors with surprise candy filling.', shortDesc: 'Custom character, candy filling', isVeg: true, tags: ['cake', 'kids', 'cartoon'], images: [{ url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600', alt: 'Kids Cake' }] },

    // Pastries
    { name: 'Butter Croissant', category: catMap['pastries'], price: 89, description: 'Authentic French-style laminated croissant made with 84% fat butter, 27 layers, baked golden to perfection. Crispy outside, flaky inside.', shortDesc: 'Authentic French, 27 layers, golden', isVeg: true, tags: ['pastry', 'french', 'breakfast'], images: [{ url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600', alt: 'Croissant' }] },
    { name: 'Assorted Puff Pastry Set', category: catMap['pastries'], price: 149, description: 'Box of 6 puff pastries – 3 sweet (apple, custard, chocolate) and 3 savory (paneer, spinach cheese, mushroom). Perfect tea-time treat.', shortDesc: '6-piece: sweet & savory puffs', isVeg: true, tags: ['pastry', 'set', 'assorted'], images: [{ url: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600', alt: 'Puff Pastry' }] },

    // Snacks
    { name: 'Loaded Cheese Nachos', category: catMap['snacks'], price: 179, description: 'Crispy corn tortilla chips loaded with two-cheese fondue, jalapeños, black olives, salsa, and sour cream. The ultimate shareable snack.', shortDesc: 'Two-cheese fondue, jalapeños, salsa', isVeg: true, badge: 'spicy', tags: ['snack', 'nachos', 'cheese'], images: [{ url: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=600', alt: 'Nachos' }] },
    { name: 'Chicken Momo Basket', category: catMap['snacks'], price: 199, description: 'Steamed Himalayan-style chicken dumplings (12 pcs) served with fiery tomato-sesame chutney and clear broth. Fresh minced chicken filling.', shortDesc: '12 pcs steamed, chutney & broth', isVeg: false, badge: 'hot', tags: ['snack', 'momo', 'chicken', 'spicy'], images: [{ url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600', alt: 'Momos' }] },

    // Drinks
    { name: 'Alphonso Mango Smoothie', category: catMap['drinks'], price: 129, description: 'Fresh Alphonso mango pulp blended with thick yogurt, honey, cardamom, and a pinch of saffron. Pure tropical indulgence.', shortDesc: 'Alphonso mango, yogurt, saffron', isVeg: true, badge: 'loved', tags: ['drink', 'mango', 'smoothie'], images: [{ url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600', alt: 'Mango Smoothie' }] },
    { name: 'Oreo Chocolate Shake', category: catMap['drinks'], price: 149, description: 'Thick and creamy milkshake blended with Oreo cookies, premium chocolate ice cream, whole milk, topped with whipped cream and crumbled Oreos.', shortDesc: 'Oreo, choco ice cream, whipped cream', isVeg: true, tags: ['drink', 'milkshake', 'chocolate'], images: [{ url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600', alt: 'Chocolate Shake' }] },
  ];

  for (const p of products) {
    const prod = new Product(p);
    prod.ratings = (4.5 + Math.random() * 0.5).toFixed(1);
    prod.numReviews = Math.floor(80 + Math.random() * 500);
    await prod.save();
  }

  // Coupons
  console.log('🎟️  Creating coupons...');
  await Coupon.insertMany([
    { code: 'GHOCHU20', description: '20% off on all orders', discountType: 'percentage', discountValue: 20, maxDiscountAmount: 200, minOrderAmount: 299, usageLimit: 1000, validUntil: new Date('2027-12-31'), isPublic: true },
    { code: 'FIRST50', description: '₹50 flat off on first order', discountType: 'fixed', discountValue: 50, minOrderAmount: 199, usageLimit: 5000, validUntil: new Date('2027-12-31'), isPublic: true },
    { code: 'WELCOME100', description: '₹100 off on orders above ₹599', discountType: 'fixed', discountValue: 100, minOrderAmount: 599, usageLimit: 2000, validUntil: new Date('2027-12-31'), isPublic: false },
    { code: 'PARTY15', description: '15% off on orders above ₹999', discountType: 'percentage', discountValue: 15, maxDiscountAmount: 300, minOrderAmount: 999, usageLimit: 500, validUntil: new Date('2027-12-31'), isPublic: true },
  ]);

  console.log('\n✅ Database seeded successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👤 Admin:    admin@ghochupizza.com / Admin@123');
  console.log('👤 Customer: customer@test.com / Test@123');
  console.log('🎟️  Coupons: GHOCHU20, FIRST50, WELCOME100, PARTY15');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  process.exit(0);
};

seedDB().catch(err => {
  console.error('❌ Seeder error:', err);
  process.exit(1);
});
