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
      // --- 1. Mobile Repair Kits ---
      {
        name: "Sunshine 120-in-1 Precision Screwdriver Set",
        sku: "SUN-120-KIT",
        category: "Repair Kits",
        brand: "Sunshine",
        price: 699,
        mrp: 1199,
        stock: 50,
        rating: 4.8,
        numReviews: 245,
        images: ["https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&h=600&q=80"],
        description: "Complete precision bit kit for iPhone, iPad, MacBook, Android, and game consoles. Includes magnetic driver, flexible extension, tweezers, and opening pry tools."
      },
      {
        name: "Mechanic B-7000 Glue Frame Adhesive (50ml)",
        sku: "MEC-B7000-50",
        category: "Repair Kits",
        brand: "Mechanic",
        price: 180,
        mrp: 299,
        stock: 150,
        rating: 4.7,
        numReviews: 420,
        images: ["https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&h=600&q=80"],
        description: "Highly elastic, self-leveling phone display frame glue. Ideal for gluing touch screens, glass back covers, and middle frame assembly. Includes fine precision metal needle nozzle."
      },
      {
        name: "Sunshine T12A CPU Motherboard Preheating Platform",
        sku: "SUN-T12A-BASE",
        category: "Repair Kits",
        brand: "Sunshine",
        price: 2450,
        mrp: 3999,
        stock: 12,
        rating: 4.9,
        numReviews: 32,
        images: ["https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&w=600&h=600&q=80"],
        description: "Professional heating station base with adjustable temperature up to 250°C. Perfect for separating dual-layer iPhone motherboards, CPU desoldering, and IC chip repair."
      },
      {
        name: "Sunshine ESD-Safe Tweezers Set (2-Piece)",
        sku: "SUN-ESD-TWEEZER",
        category: "Repair Kits",
        brand: "Sunshine",
        price: 120,
        mrp: 199,
        stock: 80,
        rating: 4.5,
        numReviews: 180,
        images: ["https://images.unsplash.com/photo-1532635241-17e820acf59f?auto=format&fit=crop&w=600&h=600&q=80"],
        description: "Anti-magnetic, anti-acid, and anti-static tweezers. Ideal for fine micro-soldering, picking up small IC chips, jumpers, and precision components under a microscope."
      },
      {
        name: "Sunshine RL-044 Precision Solder Paste (50g)",
        sku: "SUN-RL044-SOLDER",
        category: "Repair Kits",
        brand: "Sunshine",
        price: 140,
        mrp: 249,
        stock: 110,
        rating: 4.6,
        numReviews: 85,
        images: ["https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&w=600&h=600&q=80"],
        description: "Low temperature (138°C) lead-free solder paste. Specially formulated for sensitive motherboard soldering, chip reballing, and flex cable terminal joints."
      },
      {
        name: "Relife RL-001A Anti-Static Tool Storage Box",
        sku: "REL-RL001A-BOX",
        category: "Repair Kits",
        brand: "Relife",
        price: 350,
        mrp: 599,
        stock: 35,
        rating: 4.6,
        numReviews: 110,
        images: ["https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&h=600&q=80"],
        description: "Multi-compartment storage box for screwdrivers, tweezers, solder wire, adhesive, and tiny components. Keeps your technician repair workbench clean and organised."
      },

      // --- 2. Old Phones ---
      {
        name: "Refurbished iPhone 13 Pro (128GB - Sierra Blue - Grade A+)",
        sku: "REF-IP13PRO-128",
        category: "Old Phones",
        brand: "Apple",
        price: 51999,
        mrp: 68000,
        stock: 4,
        rating: 4.8,
        numReviews: 34,
        images: ["https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=600&h=600&q=80"],
        description: "Like-new condition with 100% original parts. Battery health is 91%+. Comes with a free charging cable and 6-month store warranty. Zero scratches on screen."
      },
      {
        name: "Pre-Owned Samsung Galaxy S22 Ultra 5G (256GB - Phantom Black)",
        sku: "PRE-S22ULTRA-256",
        category: "Old Phones",
        brand: "Samsung",
        price: 44999,
        mrp: 58000,
        stock: 3,
        rating: 4.7,
        numReviews: 22,
        images: ["https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=600&h=600&q=80"],
        description: "Grade A condition. Comes with original S-Pen and box. Superb camera quality, fully tested and verified by our store technicians. 6-month warranty included."
      },
      {
        name: "Refurbished OnePlus 10 Pro 5G (128GB - Emerald Forest)",
        sku: "REF-OP10PRO-128",
        category: "Old Phones",
        brand: "OnePlus",
        price: 28999,
        mrp: 38000,
        stock: 5,
        rating: 4.6,
        numReviews: 19,
        images: ["https://images.unsplash.com/photo-1629131726692-1accd0c53cce?auto=format&fit=crop&w=600&h=600&q=80"],
        description: "Hasselblad 2nd gen triple camera. Minor bezel scuffs, otherwise perfect and runs flawlessly. Battery health is 89%. Box and original 80W charger included!"
      },
      {
        name: "Pre-Owned Google Pixel 6 Pro (128GB - Stormy Black)",
        sku: "PRE-PIX6PRO-128",
        category: "Old Phones",
        brand: "Google",
        price: 26999,
        mrp: 35000,
        stock: 4,
        rating: 4.5,
        numReviews: 15,
        images: ["https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&h=600&q=80"],
        description: "Pure Android experience with Magic Eraser camera. Minor screen scratches, Grade B+ exterior. Thoroughly tested on 40 points quality checklist."
      },
      {
        name: "Refurbished iPhone 11 (64GB - Product RED - Good Condition)",
        sku: "REF-IP11-64",
        category: "Old Phones",
        brand: "Apple",
        price: 19499,
        mrp: 28000,
        stock: 7,
        rating: 4.4,
        numReviews: 50,
        images: ["https://images.unsplash.com/photo-1573148195900-7845dcb9b127?auto=format&fit=crop&w=600&h=600&q=80"],
        description: "Bright RED color, fully unlocked. Has some pocket marks on the side. Battery health is 86%. Comes with a bill, box, and charging accessories."
      },
      {
        name: "Vintage Motorola Razr V3 (Classic Silver - Collector's Edition)",
        sku: "VIN-RAZRV3-SLV",
        category: "Old Phones",
        brand: "Motorola",
        price: 1999,
        mrp: 3999,
        stock: 10,
        rating: 4.9,
        numReviews: 140,
        images: ["https://images.unsplash.com/photo-1565849906660-4d6930c68565?auto=format&fit=crop&w=600&h=600&q=80"],
        description: "Legendary flip phone from 2004. Completely restored to working condition with brand new battery. Includes original charger. Perfect for retro phone collectors."
      },

      // --- 3. Cool Gadgets ---
      {
        name: "Anker Magnetic 10000mAh Power Bank (15W MagSafe)",
        sku: "ANK-MAG-10K",
        category: "Cool Gadgets",
        brand: "Anker",
        price: 2199,
        mrp: 3499,
        stock: 40,
        rating: 4.7,
        numReviews: 290,
        images: ["https://images.unsplash.com/photo-1609592424089-9a0026e4e58b?auto=format&fit=crop&w=600&h=600&q=80"],
        description: "High capacity wireless charging power bank. Snaps firmly onto iPhone 12/13/14/15 series. Also features USB-C input/output fast charging."
      },
      {
        name: "Portronics 3-in-1 Foldable Wireless Charging Station",
        sku: "POR-3IN1-DOCK",
        category: "Cool Gadgets",
        brand: "Portronics",
        price: 1499,
        mrp: 2499,
        stock: 25,
        rating: 4.6,
        numReviews: 115,
        images: ["https://images.unsplash.com/photo-1622445262465-2481c4574875?auto=format&fit=crop&w=600&h=600&q=80"],
        description: "Foldable magnetic stand that charges your phone, smartwatch, and wireless earbuds at the same time. Reduces cable clutter on your office desk or bedside table."
      },
      {
        name: "Boat Airdopes 141 True Wireless Earbuds (Bold Black)",
        sku: "BOAT-AD141-BLK",
        category: "Cool Gadgets",
        brand: "Boat",
        price: 1099,
        mrp: 1999,
        stock: 65,
        rating: 4.4,
        numReviews: 540,
        images: ["https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&h=600&q=80"],
        description: "42 hours of total playtime, low latency mode for gaming, IPX4 sweat resistant, ENx environmental noise cancellation technology for clear voice calls."
      },
      {
        name: "Baseus 65W GaN Fast Wall Charger Adapter (3-Port)",
        sku: "BAS-65W-GAN",
        category: "Cool Gadgets",
        brand: "Baseus",
        price: 1899,
        mrp: 2999,
        stock: 30,
        rating: 4.8,
        numReviews: 155,
        images: ["https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&h=600&q=80"],
        description: "Pocket-sized Gallium Nitride adapter featuring 2 USB-C ports and 1 USB-A port. Can fast charge your MacBook Air/Pro, iPad, and iPhone simultaneously."
      },
      {
        name: "Noise ColorFit Pro 4 Calling Smartwatch",
        sku: "NOISE-CFP4-BLU",
        category: "Cool Gadgets",
        brand: "Noise",
        price: 2299,
        mrp: 3999,
        stock: 18,
        rating: 4.3,
        numReviews: 120,
        images: ["https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&w=600&h=600&q=80"],
        description: "1.72\" high-resolution display, dynamic health and fitness monitoring (heart rate, SpO2, sleep tracking), and clear Bluetooth calls right from your wrist."
      },
      {
        name: "Xiaomi Smart RGB LED Light Strip (2 Meter)",
        sku: "XIA-RGB-STRIP",
        category: "Cool Gadgets",
        brand: "Xiaomi",
        price: 899,
        mrp: 1499,
        stock: 50,
        rating: 4.5,
        numReviews: 95,
        images: ["https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=600&h=600&q=80"],
        description: "Flexible adhesive LED strip light controlled via Xiaomi Home app. Works with Google Assistant and Alexa. Features music sync and 16 million colors options."
      }
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
