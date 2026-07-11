// routes/categoryRoutes.js
const express = require("express");
const router = express.Router();
const Category = require("../models/Category");
const Product = require("../models/Product");
const { protect, adminCheck } = require("../middleware/auth");

// GET /api/categories - Fetch all categories (Public)
router.get("/", async (req, res, next) => {
  try {
    const list = await Category.find().sort({ createdAt: 1 });
    res.status(200).json({ success: true, categories: list });
  } catch (err) {
    next(err);
  }
});

// POST /api/categories - Create a category (Admin only)
router.post("/", protect, adminCheck, async (req, res, next) => {
  try {
    const { name, icon } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    const exists = await Category.findOne({ name: name.trim() });
    if (exists) {
      return res.status(400).json({ success: false, message: "Category already exists" });
    }

    const cat = await Category.create({
      name: name.trim(),
      icon: icon ? icon.trim() : "📁",
    });

    res.status(201).json({ success: true, category: cat });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/categories/:id - Delete a category (Admin only)
router.delete("/:id", protect, adminCheck, async (req, res, next) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    // Optional safety check: check if any products still belong to this category!
    const productCount = await Product.countDocuments({ category: cat.name });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category "${cat.name}" because it still contains ${productCount} products. Please edit or delete those products first.`,
      });
    }

    await cat.deleteOne();
    res.status(200).json({ success: true, message: "Category deleted successfully" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
