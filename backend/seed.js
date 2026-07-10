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
      // 1. Mobile Repair Kits
      { name: "Professional 24-in-1 Screwdriver Set", sku: "RJ-KIT-01", category: "Repair Kits", brand: "RJ Tools", price: 499, mrp: 799, stock: 45, rating: 4.6, numReviews: 120, images: ["https://picsum.photos/seed/rjkit1/600/600"], description: "Magnetic S2 steel precision bits, non-slip aluminum handle, ideal for iPhone and Android repairs." },
      { name: "LCD Screen Suction Cup & Spudger Kit", sku: "RJ-KIT-02", category: "Repair Kits", brand: "RJ Tools", price: 299, mrp: 499, stock: 60, rating: 4.3, numReviews: 75, images: ["https://picsum.photos/seed/rjkit2/600/600"], description: "Heavy duty suction cups, nylon spudgers, and metal pry tools for safe mobile opening." },
      { name: "B-7000 Glue Frame Adhesive (50ml)", sku: "RJ-KIT-03", category: "Repair Kits", brand: "RJ Liquid", price: 199, mrp: 299, stock: 120, rating: 4.7, numReviews: 310, images: ["https://picsum.photos/seed/rjkit3/600/600"], description: "Multi-purpose glue adhesive, precision needle design, highly elastic for phone screen bonding." },

      // 2. Old Phones
      { name: "Pre-Owned iPhone 12 Pro (128GB)", sku: "RJ-PHN-01", category: "Old Phones", brand: "Apple", price: 34999, mrp: 45000, stock: 6, rating: 4.5, numReviews: 18, images: ["https://picsum.photos/seed/rjphn1/600/600"], description: "Pacific Blue, Grade A refurbished, 88% battery health, completely tested and verified." },
      { name: "Refurbished OnePlus 9 5G (128GB)", sku: "RJ-PHN-02", category: "Old Phones", brand: "OnePlus", price: 18999, mrp: 25000, stock: 8, rating: 4.2, numReviews: 14, images: ["https://picsum.photos/seed/rjphn2/600/600"], description: "Astral Black, minor screen scratches, fully functional with Hasselblad camera system." },
      { name: "Vintage Nokia 3310 (Classic Grey)", sku: "RJ-PHN-03", category: "Old Phones", brand: "Nokia", price: 1199, mrp: 1999, stock: 15, rating: 4.8, numReviews: 92, images: ["https://picsum.photos/seed/rjphn3/600/600"], description: "Legendary durability, original battery pack, retro gaming classic with Snake game installed." },

      // 3. Cool Gadgets
      { name: "Magnetic 10000mAh Power Bank", sku: "RJ-GDG-01", category: "Cool Gadgets", brand: "RJ Power", price: 1499, mrp: 2499, stock: 32, rating: 4.6, numReviews: 215, images: ["https://picsum.photos/seed/rjgdg1/600/600"], description: "15W wireless MagSafe compatible fast charging, sleek pocket-sized design." },
      { name: "RGB LED Smart Bluetooth Speaker", sku: "RJ-GDG-02", category: "Cool Gadgets", brand: "RJ Audio", price: 999, mrp: 1999, stock: 40, rating: 4.4, numReviews: 134, images: ["https://picsum.photos/seed/rjgdg2/600/600"], description: "360-degree surround sound, dynamic reactive lighting modes, 8h playtime." },
      { name: "3-in-1 Wireless Charging Stand", sku: "RJ-GDG-03", category: "Cool Gadgets", brand: "RJ Power", price: 1299, mrp: 1999, stock: 22, rating: 4.5, numReviews: 89, images: ["https://picsum.photos/seed/rjgdg3/600/600"], description: "Simultaneous charging station for phone, watch, and earbuds. Tidy desk accessory." },
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
