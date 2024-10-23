const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const asyncHandler = require('express-async-handler');

const app = express();
const port = 3000;

// Ensure the 'uploads' directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve the uploads directory publicly
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware to handle multipart form data
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Save images to 'uploads' directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // Name file with current timestamp and original name
  },
});
const upload = multer({ storage: storage });

app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb+srv://mohammadaskarie78632:wtzycRUjrhyrUDdc@cluster0.lujnk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0&tls=true&tlsAllowInvalidCertificates=true&tlsInsecure=true', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', (error) => console.error('Connection error:', error));
db.once('open', () => console.log('Connected to Database'));

// Define Schemas and Models

// Category Schema and Model
const { Schema, model } = mongoose;
const categorySchema = new Schema({
  name: String,
  img: String, // Field to store image path
});
const Category = model('Category', categorySchema);

// SubCategory Schema and Model
const subCategorySchema = new Schema({
  name: String,
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category' }, // Reference to parent category
});
const SubCategory = model('SubCategory', subCategorySchema);

// Brand Schema and Model
const brandSchema = new Schema({
  name: String,
  img: String,
  subcategoryId: { type: Schema.Types.ObjectId, ref: 'SubCategory' }, // Reference to subcategory
});
const Brand = model('Brand', brandSchema);

// VariantType Schema and Model
const variantTypeSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Type is required'],
      trim: true,
    },
  },
  { timestamps: true }
);
const VariantType = model('VariantType', variantTypeSchema);

// Variant Schema and Model
const variantSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    variantTypeId: {
      type: Schema.Types.ObjectId,
      ref: 'VariantType', // Reference to VariantType model
      required: true,
    },
  },
  { timestamps: true }
);
const Variant = model('Variant', variantSchema);

// Product Schema and Model
const productSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    offerPrice: {
      type: Number,
    },
    proCategoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    proSubCategoryId: {
      type: Schema.Types.ObjectId,
      ref: 'SubCategory',
      required: true,
    },
    proBrandId: {
      type: Schema.Types.ObjectId,
      ref: 'Brand',
    },
    proVariantTypeId: {
      type: Schema.Types.ObjectId,
      ref: 'VariantType',
    },
    proVariantId: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Variant',
        required: true,
      },
    ],
    images: [
      {
        image: {
          type: Number,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);
const Product = model('Product', productSchema);

// Poster Schema and Model
const posterSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    img: String, // Field to store image path
  },
  { timestamps: true }
);
const Poster = model('Poster', posterSchema);

// Coupon Schema and Model
const couponSchema = new mongoose.Schema(
  {
    couponCode: {
      type: String,
      required: true,
      unique: true,
    },
    discountType: {
      type: String,
      enum: ['fixed', 'percentage'],
      required: true,
    },
    discountAmount: {
      type: Number,
      required: true,
    },
    minimumPurchaseAmount: {
      type: Number,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    applicableCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    applicableSubCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubCategory',
    },
    applicableProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
  },
  { timestamps: true }
);
const Coupon = mongoose.model('Coupon', couponSchema);

// CRUD ENDPOINTS

// CATEGORIES ENDPOINTS
app.post('/categories', upload.single('img'), asyncHandler(async (req, res) => {
  const { name } = req.body;
  const imgPath = req.file ? `/uploads/${req.file.filename}` : null;
  const newCategory = new Category({ name, img: imgPath });
  await newCategory.save();
  res.status(201).json({ success: true, message: 'Category created', category: newCategory });
}));

app.get('/categories', asyncHandler(async (req, res) => {
  const categories = await Category.find();
  res.status(200).json({ success: true, data: categories });
}));

app.put('/categories/:id', upload.single('img'), asyncHandler(async (req, res) => {
  const { name } = req.body;
  const imgPath = req.file ? `/uploads/${req.file.filename}` : undefined;
  const updateData = {};
  if (name) updateData.name = name;
  if (imgPath !== undefined) updateData.img = imgPath;

  const updatedCategory = await Category.findByIdAndUpdate(req.params.id, updateData, { new: true });
  res.status(200).json({ success: true, message: 'Category updated', category: updatedCategory });
}));

app.delete('/categories/:id', asyncHandler(async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: 'Category deleted' });
}));

// SUBCATEGORIES ENDPOINTS
app.post('/subcategories', asyncHandler(async (req, res) => {
  const { name, categoryId } = req.body;
  const newSubCategory = new SubCategory({ name, categoryId });
  await newSubCategory.save();
  res.status(201).json({ success: true, message: 'Subcategory created', subCategory: newSubCategory });
}));

app.get('/subcategories', asyncHandler(async (req, res) => {
  const subCategories = await SubCategory.find().populate('categoryId', 'name');
  res.status(200).json({ success: true, data: subCategories });
}));

app.put('/subcategories/:id', asyncHandler(async (req, res) => {
  const { name, categoryId } = req.body;
  const updateData = {};
  if (name) updateData.name = name;
  if (categoryId) updateData.categoryId = categoryId;

  const updatedSubCategory = await SubCategory.findByIdAndUpdate(req.params.id, updateData, { new: true });
  res.status(200).json({ success: true, message: 'Subcategory updated', subCategory: updatedSubCategory });
}));

app.delete('/subcategories/:id', asyncHandler(async (req, res) => {
  await SubCategory.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: 'Subcategory deleted' });
}));

// BRANDS ENDPOINTS
app.post('/brands', upload.single('img'), asyncHandler(async (req, res) => {
  const { name, subcategoryId } = req.body;
  const imgPath = req.file ? `/uploads/${req.file.filename}` : null;
  const newBrand = new Brand({ name, img: imgPath, subcategoryId });
  await newBrand.save();
  res.status(201).json({ success: true, message: 'Brand created', brand: newBrand });
}));

app.get('/brands', asyncHandler(async (req, res) => {
  const brands = await Brand.find().populate('subcategoryId', 'name');
  res.status(200).json({ success: true, data: brands });
}));

app.put('/brands/:id', upload.single('img'), asyncHandler(async (req, res) => {
  const { name, subcategoryId } = req.body;
  const imgPath = req.file ? `/uploads/${req.file.filename}` : undefined;
  const updateData = {};
  if (name) updateData.name = name;
  if (subcategoryId) updateData.subcategoryId = subcategoryId;
  if (imgPath !== undefined) updateData.img = imgPath;

  const updatedBrand = await Brand.findByIdAndUpdate(req.params.id, updateData, { new: true });
  res.status(200).json({ success: true, message: 'Brand updated', brand: updatedBrand });
}));

app.delete('/brands/:id', asyncHandler(async (req, res) => {
  await Brand.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: 'Brand deleted' });
}));

// VARIANT TYPES ENDPOINTS
app.post('/variantTypes', asyncHandler(async (req, res) => {
  const { name, type } = req.body;
  const newVariantType = new VariantType({ name, type });
  await newVariantType.save();
  res.status(201).json({ success: true, message: 'Variant Type created', variantType: newVariantType });
}));

app.get('/variantTypes', asyncHandler(async (req, res) => {
  const variantTypes = await VariantType.find();
  res.status(200).json({ success: true, data: variantTypes });
}));

app.put('/variantTypes/:id', asyncHandler(async (req, res) => {
  const { name, type } = req.body;
  const updateData = {};
  if (name) updateData.name = name;
  if (type) updateData.type = type;

  const updatedVariantType = await VariantType.findByIdAndUpdate(req.params.id, updateData, { new: true });
  res.status(200).json({ success: true, message: 'Variant Type updated', variantType: updatedVariantType });
}));

app.delete('/variantTypes/:id', asyncHandler(async (req, res) => {
  await VariantType.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: 'Variant Type deleted' });
}));

// VARIANTS ENDPOINTS
app.post('/variants', asyncHandler(async (req, res) => {
  const { name, variantTypeId } = req.body;
  const newVariant = new Variant({ name, variantTypeId });
  await newVariant.save();
  res.status(201).json({ success: true, message: 'Variant created', variant: newVariant });
}));

app.get('/variants', asyncHandler(async (req, res) => {
  const variants = await Variant.find().populate('variantTypeId', 'name type');
  res.status(200).json({ success: true, data: variants });
}));

app.put('/variants/:id', asyncHandler(async (req, res) => {
  const { name, variantTypeId } = req.body;
  const updateData = {};
  if (name) updateData.name = name;
  if (variantTypeId) updateData.variantTypeId = variantTypeId;

  const updatedVariant = await Variant.findByIdAndUpdate(req.params.id, updateData, { new: true });
  res.status(200).json({ success: true, message: 'Variant updated', variant: updatedVariant });
}));

app.delete('/variants/:id', asyncHandler(async (req, res) => {
  await Variant.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: 'Variant deleted' });
}));

// PRODUCTS ENDPOINTS
app.post('/products', upload.array('images', 10), asyncHandler(async (req, res) => {
  const {
    name,
    description,
    quantity,
    price,
    offerPrice,
    proCategoryId,
    proSubCategoryId,
    proBrandId,
    proVariantTypeId,
    proVariantId,
  } = req.body;

  // Validate required fields
  if (!name || !quantity || !price || !proCategoryId || !proSubCategoryId) {
    return res.status(400).json({
      success: false,
      message: 'Required fields are missing: name, quantity, price, proCategoryId, and proSubCategoryId are mandatory.',
    });
  }

  // Validate images
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No image files provided' });
  }

  // Map uploaded files to image objects
  const imageFiles = req.files.map((file) => ({
    image: Date.now(),
    url: `/uploads/${file.filename}`,
  }));

  // Create new Product instance
  const newProduct = new Product({
    name,
    description,
    quantity,
    price,
    offerPrice,
    proCategoryId,
    proSubCategoryId,
    proBrandId,
    proVariantTypeId,
    proVariantId: Array.isArray(proVariantId) ? proVariantId : [proVariantId],
    images: imageFiles,
  });

  try {
    await newProduct.save();
    res.status(201).json({ success: true, message: 'Product created successfully', product: newProduct });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error creating product', error });
  }
}));

app.get('/products', asyncHandler(async (req, res) => {
  const products = await Product.find()
    .populate('proCategoryId', 'name')
    .populate('proSubCategoryId', 'name')
    .populate('proBrandId', 'name')
    .populate('proVariantTypeId', 'name type')
    .populate('proVariantId', 'name'); // Populate Variant details
  res.status(200).json({ success: true, data: products });
}));

app.get('/products/:id', asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('proCategoryId', 'name')
    .populate('proSubCategoryId', 'name')
    .populate('proBrandId', 'name')
    .populate('proVariantTypeId', 'name type')
    .populate('proVariantId', 'name'); // Populate Variant details
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.status(200).json({ success: true, product });
}));

app.put('/products/:id', upload.array('images', 10), asyncHandler(async (req, res) => {
  const {
    name,
    description,
    quantity,
    price,
    offerPrice,
    proCategoryId,
    proSubCategoryId,
    proBrandId,
    proVariantTypeId,
    proVariantId,
  } = req.body;

  // Validate required fields
  if (!name || !quantity || !price || !proCategoryId || !proSubCategoryId) {
    return res.status(400).json({
      success: false,
      message: 'Required fields are missing: name, quantity, price, proCategoryId, and proSubCategoryId are mandatory.',
    });
  }

  // Process image files if any
  let imageFiles = [];
  if (req.files && req.files.length > 0) {
    imageFiles = req.files.map((file) => ({
      image: Date.now(),
      url: `/uploads/${file.filename}`,
    }));
  }

  const updateData = {
    name,
    description,
    quantity,
    price,
    offerPrice,
    proCategoryId,
    proSubCategoryId,
    proBrandId,
    proVariantTypeId,
    proVariantId: Array.isArray(proVariantId) ? proVariantId : [proVariantId],
  };

  if (imageFiles.length) {
    updateData.images = imageFiles;
  }

  const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
  res.status(200).json({ success: true, message: 'Product updated', product: updatedProduct });
}));

app.delete('/products/:id', asyncHandler(async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: 'Product deleted' });
}));

// POSTERS ENDPOINTS
app.post('/posters', upload.single('img'), asyncHandler(async (req, res) => {
  const { title } = req.body;
  const imgPath = req.file ? `/uploads/${req.file.filename}` : null;

  // Validate required fields
  if (!title) {
    return res.status(400).json({
      success: false,
      message: 'Title is required.',
    });
  }

  const newPoster = new Poster({ title, img: imgPath });
  await newPoster.save();
  res.status(201).json({ success: true, message: 'Poster created', poster: newPoster });
}));

app.get('/posters', asyncHandler(async (req, res) => {
  const posters = await Poster.find();
  res.status(200).json({ success: true, data: posters });
}));

app.get('/posters/:id', asyncHandler(async (req, res) => {
  const poster = await Poster.findById(req.params.id);
  if (!poster) {
    return res.status(404).json({ success: false, message: 'Poster not found' });
  }
  res.status(200).json({ success: true, poster });
}));

app.put('/posters/:id', upload.single('img'), asyncHandler(async (req, res) => {
  const { title } = req.body;
  const imgPath = req.file ? `/uploads/${req.file.filename}` : undefined;

  // Prepare update data
  const updateData = {};
  if (title) updateData.title = title;
  if (imgPath !== undefined) updateData.img = imgPath;

  // Validate that at least one field is provided for update
  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'At least one field (title, img) is required to update.',
    });
  }

  const updatedPoster = await Poster.findByIdAndUpdate(req.params.id, updateData, { new: true });
  if (!updatedPoster) {
    return res.status(404).json({ success: false, message: 'Poster not found' });
  }
  res.status(200).json({ success: true, message: 'Poster updated', poster: updatedPoster });
}));

app.delete('/posters/:id', asyncHandler(async (req, res) => {
  const deletedPoster = await Poster.findByIdAndDelete(req.params.id);
  if (!deletedPoster) {
    return res.status(404).json({ success: false, message: 'Poster not found' });
  }
  res.status(200).json({ success: true, message: 'Poster deleted' });
}));

// COUPONS ENDPOINTS
app.get('/coupons', asyncHandler(async (req, res) => {
  try {
    const coupons = await Coupon.find()
      .populate('applicableCategory', 'id name')
      .populate('applicableSubCategory', 'id name')
      .populate('applicableProduct', 'id name');
    res.json({ success: true, message: 'Coupons retrieved successfully.', data: coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

app.get('/coupons/:id', asyncHandler(async (req, res) => {
  try {
    const couponID = req.params.id;
    const coupon = await Coupon.findById(couponID)
      .populate('applicableCategory', 'id name')
      .populate('applicableSubCategory', 'id name')
      .populate('applicableProduct', 'id name');
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found.' });
    }
    res.json({ success: true, message: 'Coupon retrieved successfully.', data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

app.post('/coupons', asyncHandler(async (req, res) => {
  const {
    couponCode,
    discountType,
    discountAmount,
    minimumPurchaseAmount,
    endDate,
    status,
    applicableCategory,
    applicableSubCategory,
    applicableProduct,
  } = req.body;
  if (!couponCode || !discountType || !discountAmount || !endDate || !status) {
    return res.status(400).json({
      success: false,
      message: 'couponCode, discountType, discountAmount, endDate, and status are required.',
    });
  }

  try {
    const coupon = new Coupon({
      couponCode,
      discountType,
      discountAmount,
      minimumPurchaseAmount,
      endDate,
      status,
      applicableCategory,
      applicableSubCategory,
      applicableProduct,
    });

    const newCoupon = await coupon.save();
    res.json({ success: true, message: 'Coupon created successfully.', data: newCoupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

app.put('/coupons/:id', asyncHandler(async (req, res) => {
  try {
    const couponID = req.params.id;
    const {
      couponCode,
      discountType,
      discountAmount,
      minimumPurchaseAmount,
      endDate,
      status,
      applicableCategory,
      applicableSubCategory,
      applicableProduct,
    } = req.body;

    if (!couponCode || !discountType || !discountAmount || !endDate || !status) {
      return res.status(400).json({
        success: false,
        message: 'couponCode, discountType, discountAmount, endDate, and status are required.',
      });
    }

    const updatedCoupon = await Coupon.findByIdAndUpdate(
      couponID,
      {
        couponCode,
        discountType,
        discountAmount,
        minimumPurchaseAmount,
        endDate,
        status,
        applicableCategory,
        applicableSubCategory,
        applicableProduct,
      },
      { new: true }
    );

    if (!updatedCoupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found.' });
    }

    res.json({ success: true, message: 'Coupon updated successfully.', data: updatedCoupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

app.delete('/coupons/:id', asyncHandler(async (req, res) => {
  try {
    const couponID = req.params.id;
    const deletedCoupon = await Coupon.findByIdAndDelete(couponID);
    if (!deletedCoupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found.' });
    }
    res.json({ success: true, message: 'Coupon deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

app.post('/coupons/check-coupon', asyncHandler(async (req, res) => {
  const { couponCode, productIds, purchaseAmount } = req.body;

  try {
    // Find the coupon with the provided coupon code
    const coupon = await Coupon.findOne({ couponCode });

    // If coupon is not found, return false
    if (!coupon) {
      return res.json({ success: false, message: 'Coupon not found.' });
    }

    // Check if the coupon is expired
    const currentDate = new Date();
    if (coupon.endDate < currentDate) {
      return res.json({ success: false, message: 'Coupon is expired.' });
    }

    // Check if the coupon is active
    if (coupon.status !== 'active') {
      return res.json({ success: false, message: 'Coupon is inactive.' });
    }

    // Check if the purchase amount meets the minimum purchase amount
    if (coupon.minimumPurchaseAmount && purchaseAmount < coupon.minimumPurchaseAmount) {
      return res.json({ success: false, message: 'Minimum purchase amount not met.' });
    }

    // Check if the coupon is applicable for all orders
    if (!coupon.applicableCategory && !coupon.applicableSubCategory && !coupon.applicableProduct) {
      return res.json({ success: true, message: 'Coupon is applicable for all orders.', data: coupon });
    }

    // Fetch the products from the database using the provided product IDs
    const products = await Product.find({ _id: { $in: productIds } });

    // Check if any product in the list is not applicable for the coupon
    const isValid = products.every((product) => {
      if (
        coupon.applicableCategory &&
        coupon.applicableCategory.toString() !== product.proCategoryId.toString()
      ) {
        return false;
      }
      if (
        coupon.applicableSubCategory &&
        coupon.applicableSubCategory.toString() !== product.proSubCategoryId.toString()
      ) {
        return false;
      }
      if (
        coupon.applicableProduct &&
        coupon.applicableProduct.toString() !== product._id.toString()
      ) {
        return false;
      }
      return true;
    });

    if (isValid) {
      return res.json({
        success: true,
        message: 'Coupon is applicable for the provided products.',
        data: coupon,
      });
    } else {
      return res.json({
        success: false,
        message: 'Coupon is not applicable for the provided products.',
      });
    }
  } catch (error) {
    console.error('Error checking coupon code:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}));

// Start the server
app.listen(port, () => {
  console.log(`Server is running on: ${port}`);
});
