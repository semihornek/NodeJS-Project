const { validationResult } = require("express-validator");
const Product = require("../models/product");
const { deleteFile } = require("../utils/file");

const ITEMS_PER_PAGE = 2;

exports.getAddProduct = (req, res, next) => {
  if (!req.session.isLoggedIn) return res.redirect("/login");
  // Get an array of flash messages by passing the key to req.flash()
  let errorMessage = req.flash("error");
  errorMessage = errorMessage.length > 0 ? errorMessage[0] : null;

  res.render("admin/edit-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
    hasError: false,
    errorMessage,
    validationErrors: [],
  });
};

exports.postAddProduct = async (req, res, next) => {
  const { title, price, description } = req.body;
  // Get file from multer
  const image = req.file;
  if (!image)
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      hasError: true,
      errorMessage: "Attached file is not an image",
      product: { title, price, description },
      validationErrors: [],
    });

  try {
    // Validation Result Check
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(422).render("admin/edit-product", {
        pageTitle: "Add Product",
        path: "/admin/add-product",
        editing: false,
        hasError: true,
        errorMessage: errors.array()[0].msg,
        product: { title, price, description },
        validationErrors: errors.array(),
      });

    // Create a product with Product model
    const product = new Product({
      title,
      price,
      description,
      imageUrl: image.path,
      userId: req.user,
    });
    await product.save();
    console.log("Created Product");
    res.redirect("/admin/products");
  } catch (error) {
    // return res.status(500).render("admin/edit-product", {
    //   pageTitle: "Add Product",
    //   path: "/admin/add-product",
    //   editing: false,
    //   hasError: true,
    //   errorMessage: "Database operation failed, please try again.",
    //   product: { title, image, price, description },
    //   validationErrors: [],
    // });
    // res.redirect("/500");
    error = new Error(error);
    error.httpStatusCode = 500;
    next(error);
  }
};

exports.getProducts = async (req, res, next) => {
  const page = +req.query.page || 1;
  try {
    // Get products with pagination
    const totalProducts = await Product.find({ userId: req.user._id }).countDocuments();

    // Get the products with Product model
    // const prods = await Product.find().select("title price -_id").populate("userId", "name");
    const prods = await Product.find({ userId: req.user._id })
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);

    res.render("admin/products", {
      pageTitle: "Admin Products",
      path: "/admin/products",
      prods,
      currentPage: page,
      hasNextPage: ITEMS_PER_PAGE * page < totalProducts,
      nextPage: page + 1,
      hasPreviousPage: page > 1,
      previousPage: page - 1,
      lastPage: Math.ceil(totalProducts / ITEMS_PER_PAGE),
    });
  } catch (error) {
    error = new Error(error);
    error.httpStatusCode = 500;
    next(error);
  }
};

exports.getEditProduct = async (req, res, next) => {
  const editMode = req.query.edit;
  const { productId } = req.params;
  try {
    // Get the product with Product model
    const product = await Product.findById(productId);
    if (!product) return res.redirect("/");
    res.render("admin/edit-product", {
      pageTitle: "Edit Product",
      path: "/admin/add-product",
      editing: editMode,
      hasError: false,
      errorMessage: null,
      product,
      validationErrors: [],
    });
  } catch (error) {
    error = new Error(error);
    error.httpStatusCode = 500;
    next(error);
  }
};

exports.postEditProduct = async (req, res, next) => {
  const { productId, title, price, description } = req.body;
  // Get file from multer
  const image = req.file;
  try {
    // Validation Result Check
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.render("admin/edit-product", {
        pageTitle: "Edit Product",
        path: "/admin/add-product",
        editing: true,
        hasError: true,
        errorMessage: errors.array()[0].msg,
        product: { title, price, description, _id: productId },
        validationErrors: errors.array(),
      });

    const product = await Product.findOne({ _id: productId, userId: req.user._id });
    if (!product) return res.redirect("/");
    (product.title = title), (product.description = description), (product.price = price);
    if (image) {
      deleteFile(product.imageUrl);
      product.imageUrl = image.path;
    }

    await product.save();
    console.log("Updated Product");
    res.redirect("/admin/products");
  } catch (error) {
    error = new Error(error);
    error.httpStatusCode = 500;
    next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const productId = req.params.productId;

    const product = await Product.findById(productId);
    if (!product) return next(new Error("Product not found!"));
    deleteFile(product.imageUrl);

    // Delete with model
    await Product.findOneAndRemove({ _id: productId, userId: req.user._id });
    // Remove from the user cart if it exists
    await req.user.removeFromCart(productId);

    res.status(200).json({ message: "Success!" });
    console.log("Product Destroyed");
  } catch (error) {
    res.status(500).json({ message: "Deleting product failed." });
  }
};
