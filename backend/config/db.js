// config/db.js
// Handles a clean, resilient MongoDB connection using process.env.MONGO_URI.

const mongoose = require("mongoose");

/**
 * Connect to MongoDB.
 * Reads the connection string from process.env.MONGO_URI.
 * Exits the process on failure so the app never runs in a broken state.
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("❌ MONGO_URI is not defined. Check your .env file.");
    process.exit(1);
  }

  try {
    // Fail fast instead of buffering queries forever if the DB is unreachable.
    mongoose.set("strictQuery", true);

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }

  // Log runtime connection issues after the initial handshake.
  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️  MongoDB disconnected.");
  });

  mongoose.connection.on("error", (err) => {
    console.error(`❌ MongoDB runtime error: ${err.message}`);
  });
};

module.exports = connectDB;
