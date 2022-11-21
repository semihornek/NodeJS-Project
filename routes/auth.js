const router = require("express").Router();
const { check, body } = require("express-validator");
const bcrypt = require("bcryptjs");

const User = require("../models/user");
const authController = require("../controllers/auth");

// /login => GET
router.get("/login", authController.getLogin);

// /login => POST
let user = null;
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email")
      .custom(async (value, { req }) => {
        user = await User.findOne({ email: value });
        if (!user) return Promise.reject("There is no such user with this email address.");
      })
      .normalizeEmail(),

    body("password", "Please enter a valid password with only numbers and text and at least 5 characters")
      .trim()
      .isLength({ min: 5 })
      .isAlphanumeric()
      .custom(async (value, { req }) => {
        const isPasswordTrue = await bcrypt.compare(value, user.password);
        if (!isPasswordTrue) return Promise.reject(`Invalid password for ${req.body.email}`);

        req.session.user = user;
      }),
  ],
  authController.postLogin
);

// /signup => GET
router.get("/signup", authController.getSignup);

// /signup => POST
router.post(
  "/signup",
  [
    check("email")
      .isEmail()
      .withMessage("Please enter a valid email.")
      .custom(async (value, { req }) => {
        const user = await User.findOne({ email: value });
        if (user) return Promise.reject("E-mail exists already. Please pick a different one.");
      })
      .normalizeEmail(),

    body("password", "Please enter a valid password with only numbers and text and at least 5 characters")
      .trim()
      .isLength({ min: 5 })
      .isAlphanumeric(),

    body("confirmPassword")
      .trim()
      .custom((value, { req }) => {
        if (value !== req.body.password) throw new Error("Passwords have to match.");
        return true;
      }),
  ],
  authController.postSignup
);

// /logout => POST
router.post("/logout", authController.postLogout);

// /reset => GET
router.get("/reset", authController.getReset);

// /reset => POST
router.post("/reset", authController.postReset);

// /reset/:token => GET
router.get("/reset/:token", authController.getNewPassword);

// /reset/:token => POST
router.post("/new-password", authController.postNewPassword);

module.exports = router;
