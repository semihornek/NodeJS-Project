const { randomBytes } = require("crypto");
const bcrypt = require("bcryptjs");
const nodeMailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");
const { validationResult } = require("express-validator");

const User = require("../models/user");

const transporter = nodeMailer.createTransport(
  sendgridTransport({
    auth: { api_key: process.env.SENDGRID_API_KEY },
  })
);

exports.getLogin = (req, res, next) => {
  console.log(req.session);
  // Get an array of flash messages by passing the key to req.flash()
  let errorMessage = req.flash("error");
  errorMessage = errorMessage.length > 0 ? errorMessage[0] : null;
  res.render("auth/login", {
    pageTitle: "Login",
    path: "/login",
    errorMessage,
    oldInput: { email: "", password: "" },
    validationErrors: [],
  });
};

exports.postLogin = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // Validation Results Check
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).render("auth/login", {
        pageTitle: "Login",
        path: "/login",
        errorMessage: errors.array()[0].msg,
        oldInput: { email, password },
        validationErrors: errors.array(),
      });
    }

    req.session.isLoggedIn = true;
    return req.session.save((err) => {
      err && console.log(err);
      res.redirect("/");
    });
  } catch (error) {
    console.log(error);
    res.redirect("/login");
  }
};

exports.getSignup = (req, res, next) => {
  let errorMessage = req.flash("error");
  errorMessage = errorMessage.length > 0 ? errorMessage[0] : null;
  res.render("auth/signup", {
    pageTitle: "Sign Up",
    path: "/signup",
    errorMessage,
    oldInput: { email: "", password: "", confirmPassword: "" },
    validationErrors: [],
  });
};

exports.postSignup = async (req, res, next) => {
  const { email, password } = req.body;

  // Validation Results Check
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/signup", {
      pageTitle: "Sign Up",
      path: "/signup",
      errorMessage: errors.array()[0].msg,
      oldInput: { email, password, confirmPassword: req.body.confirmPassword },
      validationErrors: errors.array(),
    });
  }

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      email,
      password: hashedPassword,
      cart: { items: [] },
    });
    await user.save();
    res.redirect("/login");

    await transporter.sendMail({
      from: "semih9569@gmail.com",
      to: email,
      subject: "Singup succeeded",
      html: "<h1>You successfully signed up!</h1>",
    });
  } catch (error) {
    error = new Error(error);
    error.httpStatusCode = 500;
    next(error);
  }
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((error) => {
    console.log(error);
    res.redirect("/");
  });
};

exports.getReset = (req, res, next) => {
  // Get an array of flash messages by passing the key to req.flash()
  let errorMessage = req.flash("error");
  errorMessage = errorMessage.length > 0 ? errorMessage[0] : null;
  res.render("auth/reset", { pageTitle: "Reset Password", path: "/reset", errorMessage });
};

exports.postReset = (req, res, next) => {
  const { email } = req.body;
  // generate cryptographically strong pseudorandom data
  randomBytes(256, async (error, buffer) => {
    if (error) {
      console.log(error);
      res.redirect("/reset");
    }
    try {
      const user = await User.findOne({ email });
      if (!user) {
        req.flash("error", "No account with that email found.");
        return res.redirect("/reset");
      }
      // update the user with the token and expiration date for the token
      const token = buffer.toString("hex");
      user.resetToken = token;
      user.resetTokenExpiration = Date.now() + 1000 * 60 * 60; // 1 hour expiration date
      await user.save();

      res.redirect("/");
      transporter.sendMail({
        from: "semih9569@gmail.com",
        to: email,
        subject: "Password Reset",
        html: `
        <p>You requested a password reset</p>
        <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password.</p>
      `,
      });
    } catch (error) {
      error = new Error(error);
      error.httpStatusCode = 500;
      next(error);
    }
  });
};

exports.getNewPassword = async (req, res, next) => {
  const { token } = req.params;
  try {
    const user = await User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } });
    if (user) {
      // Get an array of flash messages by passing the key to req.flash()
      let errorMessage = req.flash("error");
      errorMessage = errorMessage.length > 0 ? errorMessage[0] : null;
      res.render("auth/new-password", {
        pageTitle: "New Password",
        path: "/new-password",
        errorMessage,
        userId: user._id.toString(),
        passwordToken: token,
      });
    }
  } catch (error) {
    error = new Error(error);
    error.httpStatusCode = 500;
    next(error);
  }
};

exports.postNewPassword = async (req, res, next) => {
  const { password, userId, passwordToken } = req.body;
  try {
    const user = await User.findOne({
      resetToken: passwordToken,
      resetTokenExpiration: { $gt: Date.now() },
      _id: userId,
    });
    if (user) {
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 12);
      // update the user
      (user.password = hashedPassword), (user.resetToken = undefined), (user.resetTokenExpiration = undefined);
      await user.save();
      res.redirect("/login");
    } else {
      res.redirect("/reset");
    }
  } catch (error) {
    error = new Error(error);
    error.httpStatusCode = 500;
    next(error);
  }
};
