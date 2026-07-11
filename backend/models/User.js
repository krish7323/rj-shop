// models/User.js
// User schema: Name, Email, Password, Role (Admin/Customer), and an Addresses array.
// Passwords are hashed with bcryptjs before save; a helper compares plaintext on login.

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Sub-schema for a single shipping/billing address.
const addressSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      trim: true,
      default: "Home",
    },
    fullName: {
      type: String,
      required: [true, "Recipient full name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Address phone number is required"],
      trim: true,
      match: [/^[0-9]{10}$/, "Phone number must be 10 digits"],
    },
    street: {
      type: String,
      required: [true, "Street/House details are required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },
    postalCode: {
      type: String,
      required: [true, "Postal code is required"],
      trim: true,
      match: [/^[0-9]{6}$/, "Postal code must be a 6-digit PIN"],
    },
    country: {
      type: String,
      default: "India",
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true, timestamps: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [60, "Name cannot exceed 60 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // never return the hash by default
    },
    role: {
      type: String,
      enum: {
        values: ["Admin", "Customer"],
        message: "Role must be either Admin or Customer",
      },
      default: "Customer",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otpCode: {
      type: String,
      default: null,
    },
    otpExpires: {
      type: Date,
      default: null,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    currentDevice: {
      type: String,
      default: "",
      trim: true,
    },
    addresses: {
      type: [addressSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Hash the password whenever it is set/changed.
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

// Compare a plaintext candidate against the stored hash.
userSchema.methods.matchPassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
