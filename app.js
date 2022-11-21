const path = require("path");
const { createWriteStream, readFileSync } = require("fs");
// const { createServer } = require("https");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const multer = require("multer");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");
const errorRoutes = require("./routes/error");
const User = require("./models/user");

const MONGODB_URI = process.env.MONGODB_URI;

const app = express();

// const privateKey = readFileSync("server.key");
// const certificate = readFileSync("server.cert");

// set view engine as ejs
app.set("view engine", "ejs");
app.set("views", "views");

// Helmet helps to secure our Express apps by setting various HTTP headers.
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "'unsafe-inline'", "js.stripe.com"],
      "style-src": ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      "frame-src": ["'self'", "js.stripe.com"],
      "font-src": ["'self'", "fonts.googleapis.com", "fonts.gstatic.com"],
      "script-src-attr": ["'unsafe-inline'"],
    },
  })
);
// compress all responses
app.use(compression());
// it will log all request in the Apache combined format to access.log file
const accessLogStream = createWriteStream(path.join(__dirname, "access.log"), { flags: "a" }); // append at the end of file
app.use(morgan("combined", { stream: accessLogStream }));

// use body parser to parse the incoming data
app.use(bodyParser.urlencoded({ extended: false }));

/*** Multer Setup ***/

// use multer to parse the incoming files -- in our case it is a single image file
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "images"),
  filename: (req, file, cb) =>
    cb(null, new Date().toISOString().replace(/\-/g, "").replace(/\:/g, "") + "-" + file.originalname),
});

const fileFilter = (req, file, cb) => {
  const fileTypes = ["image/png", "image/jgp", "image/jpeg"];
  if (fileTypes.includes(file.mimetype)) cb(null, true);
  else cb(null, false);
};

app.use(multer({ storage, fileFilter }).single("image"));

// show express to where to look at static files
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));
// session middleware
app.use(
  session({
    secret: "baskanlar",
    resave: false,
    saveUninitialized: false,
    store: new MongoDBStore({ uri: MONGODB_URI, collection: "sessions" }),
  })
);
// csrf protection middleware - should be implemented after session middleware because csrf will use the session
app.use(csrf());
// flash - should be implemented after session middleware because flash will use the session
app.use(flash());

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use(async (req, res, next) => {
  if (!req.session.user) return next();
  try {
    const user = await User.findById(req.session.user?._id);
    if (user) req.user = user;
    next();
  } catch (error) {
    throw new Error(error);
  }
});

/**
 * Route Handling
 */
app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);
app.use(errorRoutes);
app.use((error, req, res, next) => {
  console.log(error);
  res.status(500).render("error/500", { pageTitle: "Error" });
});

(async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    // Create HTTPS Server with SSL protection
    // createServer({ key: privateKey, cert: certificate }, app).listen(process.env.PORT || 3000);
    // We will let our hosting provider manage SSL
    app.listen(process.env.PORT || 3000);
    console.log("Server started listening on port 3000!");
  } catch (error) {
    console.log(error);
  }
})();
