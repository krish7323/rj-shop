// create-dummy.js
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const User = require("./models/User");

const seedDummyUsers = async () => {
  try {
    await connectDB();
    console.log("👤 Syncing dummy verification test users...");

    // 1. Verified Customer
    const verifiedEmail = "demo@rjmobilestore.com";
    const existingVerified = await User.findOne({ email: verifiedEmail });
    if (!existingVerified) {
      await User.create({
        name: "Demo Customer (Verified)",
        email: verifiedEmail,
        password: "demo12345",
        role: "Customer",
        isVerified: true,
      });
      console.log(`✅ Created verified dummy user: ${verifiedEmail} (password: demo12345)`);
    } else {
      console.log(`ℹ️ Verified dummy user already exists: ${verifiedEmail}`);
    }

    // 2. Unverified Customer for OTP Testing
    const unverifiedEmail = "testotp@rjmobilestore.com";
    const existingUnverified = await User.findOne({ email: unverifiedEmail });
    if (existingUnverified) {
      // Always recreate or update to reset OTP to 123456
      existingUnverified.otpCode = "123456";
      existingUnverified.otpExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours expiry
      existingUnverified.isVerified = false;
      await existingUnverified.save();
      console.log(`✅ Reset OTP test user: ${unverifiedEmail} to OTP: 123456`);
    } else {
      await User.create({
        name: "Test OTP Customer",
        email: unverifiedEmail,
        password: "demo12345",
        role: "Customer",
        isVerified: false,
        otpCode: "123456",
        otpExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });
      console.log(`✅ Created OTP test user: ${unverifiedEmail} (password: demo12345) with test OTP: 123456`);
    }

    console.log("🎉 Test users setup completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to setup test users:", error);
    process.exit(1);
  }
};

seedDummyUsers();
