// controllers/productController.js
// Dynamic catalog CRUD. New products are persisted immediately (live instantly).

const Product = require("../models/Product");

/**
 * POST /api/products  (admin)
 * Create a product. Persisted immediately so it is live in the catalog.
 */
const addProduct = async (req, res) => {
  try {
    const {
      name,
      sku,
      description,
      brand,
      category,
      price,
      mrp,
      stock,
      images,
      isActive,
    } = req.body;

    // Strict required-field validation (schema also validates on save).
    if (!name || !sku || !description || !category || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "name, sku, description, category and price are required",
      });
    }
    if (Number(price) <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Price must be a positive number" });
    }
    if (stock !== undefined && (Number(stock) < 0 || !Number.isInteger(Number(stock)))) {
      return res
        .status(400)
        .json({ success: false, message: "Stock must be a non-negative integer" });
    }

    const product = await Product.create({
      name: String(name).trim(),
      sku: String(sku).trim().toUpperCase(),
      description: String(description).trim(),
      brand: brand ? String(brand).trim() : undefined,
      category: String(category).trim(),
      price: Number(price),
      mrp: mrp !== undefined ? Number(mrp) : undefined,
      stock: stock !== undefined ? Number(stock) : 0,
      images: Array.isArray(images) ? images : [],
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    return res.status(201).json({
      success: true,
      message: "Product added and live in catalog",
      product,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || { sku: 1 })[0];
      return res
        .status(409)
        .json({ success: false, message: `Duplicate ${field}: value must be unique` });
    }
    console.error(`addProduct error: ${error.message}`);
    return res.status(500).json({ success: false, message: "Failed to add product" });
  }
};

/**
 * GET /api/products
 * Public dynamic catalog with search, category filter, pagination and sorting.
 */
const getAllProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      inStock,
      includeInactive,
      sort = "-createdAt",
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    // Public catalog hides inactive items unless explicitly requested (admin views).
    if (!includeInactive) query.isActive = true;

    if (category) query.category = category;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }

    if (inStock === "true") query.stock = { $gt: 0 };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query).sort(sort).skip(skip).limit(limitNum),
      Product.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      products,
    });
  } catch (error) {
    console.error(`getAllProducts error: ${error.message}`);
    return res.status(500).json({ success: false, message: "Failed to fetch products" });
  }
};

/**
 * GET /api/products/:id
 * Fetch a single product by id.
 */
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    return res.status(200).json({ success: true, product });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }
    console.error(`getProductById error: ${error.message}`);
    return res.status(500).json({ success: false, message: "Failed to fetch product" });
  }
};

/**
 * PUT /api/products/:id  (admin)
 * Update an existing product. Runs validators on the update.
 */
const updateProduct = async (req, res) => {
  try {
    const allowed = [
      "name",
      "sku",
      "description",
      "brand",
      "category",
      "price",
      "mrp",
      "stock",
      "images",
      "isActive",
    ];

    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No valid fields provided to update" });
    }

    if (updates.sku) updates.sku = String(updates.sku).trim().toUpperCase();
    if (updates.price !== undefined) updates.price = Number(updates.price);
    if (updates.stock !== undefined) updates.stock = Number(updates.stock);

    const product = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
      context: "query",
    });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Product updated",
      product,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || { sku: 1 })[0];
      return res
        .status(409)
        .json({ success: false, message: `Duplicate ${field}: value must be unique` });
    }
    console.error(`updateProduct error: ${error.message}`);
    return res.status(500).json({ success: false, message: "Failed to update product" });
  }
};

/**
 * DELETE /api/products/:id  (admin)
 * Remove a product from the catalog.
 */
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Product deleted",
      productId: product._id,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }
    console.error(`deleteProduct error: ${error.message}`);
    return res.status(500).json({ success: false, message: "Failed to delete product" });
  }
};

module.exports = {
  addProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
