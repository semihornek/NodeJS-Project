const router = require("express").Router();
const shopController = require("../controllers/shop");
const isAuth = require("../middleware/is-auth");

// / => GET
router.get("/", shopController.getIndex);

// /products => GET
router.get("/products", shopController.getProducts);

// /products/:productId => GET
router.get("/products/:productId", shopController.getProduct);

// /cart => GET
router.get("/cart", isAuth, shopController.getCart);

// /cart => POST
router.post("/cart", isAuth, shopController.postCart);

// /cart-delete-item => POST
router.post("/cart-delete-item", isAuth, shopController.postCartDeleteProduct);

// /checkout => GET
router.get("/checkout", isAuth, shopController.getCheckout);

// /checkout/success => GET
router.get("/checkout/success", shopController.getCheckoutSuccess);

// /checkout/cancel => GET
router.get("/checkout/cancel", shopController.getCheckout);

// /orders => GET
router.get("/orders", isAuth, shopController.getOrders);

// // /create-order => POST
// router.post("/create-order", isAuth, shopController.postOrder);

// /orders/:orderId => GET
router.get("/orders/:orderId", isAuth, shopController.getInvoice);

module.exports = router;
