// models/Product.js
// Product schema for the dynamic catalog.
// Enforces: unique SKU, strictly positive price, and non-negative inventory stock.

const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [2, "Product name must be at least 2 characters"],
      maxlength: [140, "Product name cannot exceed 140 characters"],
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true, // forces unique SKUs across the catalog
      trim: true,
      uppercase: true,
      match: [/^[A-Z0-9\-]{3,32}$/, "SKU must be 3-32 chars: A-Z, 0-9, hyphen"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    brand: {
      type: String,
      trim: true,
      default: "Generic",
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      index: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      // strictly positive price
      validate: {
        validator: (value) => value > 0,
        message: "Price must be a strictly positive number",
      },
    },
    mrp: {
      type: Number,
      default: function () {
        return this.price;
      },
      validate: {
        validator: function (value) {
          // MRP must be positive and never below the selling price.
          return value > 0 && value >= this.price;
        },
        message: "MRP must be positive and greater than or equal to price",
      },
    },
    stock: {
      type: Number,
      required: [true, "Stock is required"],
      default: 0,
      // non-negative inventory stock
      min: [0, "Stock cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Stock must be a whole number",
      },
    },
    images: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, "Rating cannot be below 0"],
      max: [5, "Rating cannot exceed 5"],
    },
    numReviews: {
      type: Number,
      default: 0,
      min: [0, "Review count cannot be negative"],
    },
  },
  { timestamps: true }
);

// Auto-generate a URL-friendly slug from the name if one is not provided.
productSchema.pre("validate", function () {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
});

// Convenience virtual: is the product buyable right now?
productSchema.virtual("inStock").get(function () {
  return this.isActive && this.stock > 0;
});

productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Product", productSchema);
