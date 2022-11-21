const router = require("express").Router();
const { check, body } = require("express-validator");

const adminController = require("../controllers/admin");
const isAuth = require("../middleware/is-auth");

// /admin/add-product => GET
router.get("/add-product", isAuth, adminController.getAddProduct);

// /admin/add-product => POST
router.post(
  "/add-product",
  isAuth,
  [
    body("title", "Your title should be naximum 40 characters!").trim().isString().isLength({ min: 3 }),

    // body("imageUrl").isURL().withMessage("Please enter a valid image url!"),

    body("price", "Price shouldn't be empty!").isFloat(),

    body("description").trim().isLength({ min: 5, max: 400 }),
  ],
  adminController.postAddProduct
);

// /admin/products => GET
router.get("/products", isAuth, adminController.getProducts);

// /admin/edit-product => GET
router.get("/edit-product/:productId", isAuth, adminController.getEditProduct);

// /admin/edit-product => POST
router.post(
  "/edit-product",
  isAuth,
  [
    body("title", "Your title should be min 3 characters!").trim().isString().isLength({ min: 3 }),

    // body("imageUrl").isURL().withMessage("Please enter a valid image url!"),

    body("price", "Price shouldn't be empty!").isFloat(),

    body("description").trim().isLength({ min: 5, max: 400 }),
  ],
  adminController.postEditProduct
);

// /admin/product/:productId => DELETE
router.delete("/product/:productId", isAuth, adminController.deleteProduct);

module.exports = router;
