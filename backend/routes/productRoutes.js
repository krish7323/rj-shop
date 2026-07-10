// routes/productRoutes.js
// Catalog routes. Reads are public; writes require an authenticated admin.

const express = require("express");
const router = express.Router();

const {
  addProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const { protect, adminCheck } = require("../middleware/auth");

// Public reads
router.get("/", getAllProducts);
router.get("/:id", getProductById);

// Admin-only writes
router.post("/", protect, adminCheck, addProduct);
router.put("/:id", protect, adminCheck, updateProduct);
router.delete("/:id", protect, adminCheck, deleteProduct);

module.exports = router;
