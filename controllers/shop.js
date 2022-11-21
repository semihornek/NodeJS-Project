const fs = require("fs");
const createReadStream = require("fs").createReadStream;
const path = require("path");

const PDFDocument = require("pdfkit");
const stripe = require("stripe")(process.env.STRIPE_KEY);

const Product = require("../models/product");
const Order = require("../models/order");

const ITEMS_PER_PAGE = 2;

exports.getIndex = async (req, res, next) => {
  const page = +req.query.page || 1;
  try {
    // Get products with pagination
    const totalProducts = await Product.find().countDocuments();

    const prods = await Product.find()
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);

    res.render("shop/index", {
      pageTitle: "Shop",
      path: "/",
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

exports.getProducts = async (req, res, next) => {
  const page = +req.query.page || 1;
  try {
    // Get products with pagination
    const totalProducts = await Product.find().countDocuments();

    const prods = await Product.find()
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);

    res.render("shop/product-list", {
      pageTitle: "All Products",
      path: "/products",
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

exports.getProduct = async (req, res, next) => {
  const { productId } = req.params;
  try {
    // Find a single product with Product model
    const product = await Product.findById(productId);
    res.render("shop/product-detail", {
      pageTitle: product.title,
      path: "/products",
      product,
    });
  } catch (error) {
    error = new Error(error);
    error.httpStatusCode = 500;
    next(error);
  }
};

exports.getCart = async (req, res, next) => {
  try {
    const products = (await req.user.populate("cart.items.productId", "title")).cart.items;
    res.render("shop/cart", { pageTitle: "Your Cart", path: "/cart", products });
  } catch (error) {
    error = new Error(error);
    error.httpStatusCode = 500;
    next(error);
  }
};

exports.postCart = async (req, res, next) => {
  const { productId } = req.body;
  try {
    const product = await Product.findById(productId);
    await req.user.addToCart(product);
    res.redirect("/cart");
  } catch (error) {
    error = new Error(error);
    error.httpStatusCode = 500;
    next(error);
  }
};

exports.postCartDeleteProduct = async (req, res, next) => {
  const { productId } = req.body;
  try {
    await req.user.removeFromCart(productId);
    res.redirect("/cart");
  } catch (error) {
    error = new Error(error);
    error.httpStatusCode = 500;
    next(error);
  }
};

exports.getCheckout = async (req, res, next) => {
  try {
    const products = (await req.user.populate("cart.items.productId", "title price description")).cart.items;
    let totalSum = 0;
    products.forEach((product) => {
      totalSum += product.productId.price * product.quantity;
    });

    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: products.map((product) => {
        return {
          name: product.productId.title,
          description: product.productId.description,
          amount: product.productId.price * 100,
          currency: "usd",
          quantity: product.quantity,
        };
      }),
      customer_email: req.user.email,
      success_url: `${req.protocol}://${req.get("host")}/checkout/success`,
      cancel_url: `${req.protocol}://${req.get("host")}/checkout/cancel`,
    });

    res.render("shop/checkout", {
      pageTitle: "Checkout",
      path: "/checkout",
      products,
      totalSum,
      sessionId: stripeSession.id,
    });
  } catch (error) {
    error = new Error(error);
    error.httpStatusCode = 500;
    next(error);
  }
};

exports.getCheckoutSuccess = async (req, res, next) => {
  try {
    let products = (await req.user.populate("cart.items.productId", "title price")).cart.items;
    products = products.map((product) => ({ ...product.productId._doc, quantity: product.quantity }));
    // const products = await req.user.getCart();
    const order = new Order({
      items: products,
      user: {
        _id: req.user._id,
        email: req.user.email,
      },
    });
    await order.save();
    await req.user.clearCart();
    res.redirect("/orders");
  } catch (error) {
    error = new Error(error);
    error.httpStatusCode = 500;
    next(error);
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ "user._id": req.user._id });
    res.render("shop/orders", { pageTitle: "Your Orders", path: "/orders", orders });
  } catch (error) {
    error = new Error(error);
    error.httpStatusCode = 500;
    next(error);
  }
};

exports.postOrder = async (req, res, next) => {
  try {
    let products = (await req.user.populate("cart.items.productId", "title price")).cart.items;
    products = products.map((product) => ({ ...product.productId._doc, quantity: product.quantity }));
    // const products = await req.user.getCart();
    const order = new Order({
      items: products,
      user: {
        _id: req.user._id,
        email: req.user.email,
      },
    });
    await order.save();
    await req.user.clearCart();
    res.redirect("/orders");
  } catch (error) {
    error = new Error(error);
    error.httpStatusCode = 500;
    next(error);
  }
};

exports.getInvoice = async (req, res, next) => {
  const orderId = req.params.orderId;
  const invoiceName = `invoice-${orderId}.pdf`;
  const invoicePath = path.join("data", "invoices", invoiceName);

  try {
    const order = await Order.findById(orderId);
    if (!order) return next(new Error("Order doesn't exist!"));
    if (order.user._id.toString() !== req.user._id.toString())
      return next(new Error("This user is unathorized to view this document"));

    const pdfDoc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=${invoiceName}`);

    pdfDoc.pipe(fs.createWriteStream(invoicePath)); // server
    pdfDoc.pipe(res); // client

    pdfDoc.fontSize(24).text(`Invoice
-------------------`);

    let totalPrice = 0;
    order.items.forEach((prod) => {
      totalPrice += prod.price * prod.quantity;
      pdfDoc.fontSize(14).text(`${prod.title} - ${prod.quantity} x $${prod.price}`);
    });
    pdfDoc.text("---");
    pdfDoc.fontSize(20).text(`Total Price: ${totalPrice}`);
    pdfDoc.end();

    // const data = await fs.readFile(invoicePath);
    // res.setHeader("Content-Type", "application/pdf");
    // res.setHeader("Content-Disposition", `inline; filename=${invoiceName}`);
    // res.send(data);

    // const file = createReadStream(invoicePath);
    // file.pipe(res);
  } catch (error) {
    next(error);
  }
};
