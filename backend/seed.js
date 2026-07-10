// seed.js
// Database seeder: seeds an Admin, a Customer, and a set of starting products.

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const User = require("./models/User");
const Product = require("./models/Product");

const startSeed = async () => {
  try {
    await connectDB();

    console.log("🧹 Clearing database...");
    await User.deleteMany({});
    await Product.deleteMany({});

    console.log("👤 Seeding Users...");

    // Create Admin User
    const admin = await User.create({
      name: "RJ Admin",
      email: "admin@rjshop.com",
      password: "admin123", // Hashes in pre-save hook
      role: "Admin"
    });
    console.log(`✅ Admin created: ${admin.email} (password: admin123)`);

    // Create Customer User
    const customer = await User.create({
      name: "John Doe",
      email: "customer@rjshop.com",
      password: "customer123", // Hashes in pre-save hook
      role: "Customer",
      addresses: [
        {
          label: "Home",
          fullName: "John Doe",
          phone: "9876543210",
          street: "123 Main Street, Sector 4",
          city: "New Delhi",
          state: "Delhi",
          postalCode: "110001",
          country: "India",
          isDefault: true
        }
      ]
    });
    console.log(`✅ Customer created: ${customer.email} (password: customer123)`);

    console.log("📦 Seeding Products...");

    const DEMO_PRODUCTS = [
      { name: "Wireless Earbuds Pro (ANC)", sku: "RJ-EAR-01", category: "Electronics", brand: "RJ Audio", price: 2499, mrp: 3999, stock: 24, rating: 4.5, numReviews: 214, images: ["https://picsum.photos/seed/rjear/600/600"], description: "Active noise cancellation, 30h battery, IPX5 water resistance." },
      { name: "Premium Cotton Kurta", sku: "RJ-KUR-11", category: "Fashion", brand: "RJ Originals", price: 899, mrp: 1499, stock: 12, rating: 4.2, numReviews: 89, images: ["https://picsum.photos/seed/rjkurta/600/600"], description: "Breathable handloom cotton, regular fit, festive-ready." },
      { name: "Insulated Steel Bottle 1L", sku: "RJ-BOT-07", category: "Home", brand: "RJ Living", price: 449, mrp: 799, stock: 60, rating: 4.7, numReviews: 340, images: ["https://picsum.photos/seed/rjbottle/600/600"], description: "24h cold / 12h hot, leak-proof, food-grade stainless steel." },
      { name: "LED Smart Desk Lamp", sku: "RJ-LMP-02", category: "Home", brand: "RJ Living", price: 1299, mrp: 1999, stock: 8, rating: 4.4, numReviews: 121, images: ["https://picsum.photos/seed/rjlamp/600/600"], description: "Touch dimming, 3 color temperatures, USB charging port." },
      { name: "Running Shoes AirFlex", sku: "RJ-SHO-05", category: "Fashion", brand: "RJ Sport", price: 1799, mrp: 2999, stock: 30, rating: 4.3, numReviews: 156, images: ["https://picsum.photos/seed/rjshoe/600/600"], description: "Lightweight mesh, cushioned sole, all-day comfort." },
      { name: "Mechanical Keyboard RGB", sku: "RJ-KEY-09", category: "Electronics", brand: "RJ Tech", price: 3299, mrp: 4499, stock: 15, rating: 4.6, numReviews: 203, images: ["https://picsum.photos/seed/rjkey/600/600"], description: "Hot-swappable switches, per-key RGB, aluminium frame." },
      { name: "Ceramic Coffee Mug Set", sku: "RJ-MUG-03", category: "Home", brand: "RJ Living", price: 599, mrp: 999, stock: 45, rating: 4.1, numReviews: 67, images: ["https://picsum.photos/seed/rjmug/600/600"], description: "Set of 2 microwave-safe stoneware mugs, 350ml each." },
      { name: "Analog Wrist Watch Classic", sku: "RJ-WAT-06", category: "Fashion", brand: "RJ Time", price: 1499, mrp: 2499, stock: 20, rating: 4.5, numReviews: 98, images: ["https://picsum.photos/seed/rjwatch/600/600"], description: "Genuine leather strap, water-resistant, minimalist dial." },
    ];

    for (const p of DEMO_PRODUCTS) {
      await Product.create(p);
    }
    console.log(`✅ Seeded ${DEMO_PRODUCTS.length} products`);

    console.log("🎉 Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

startSeed();
