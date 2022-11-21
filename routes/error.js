const router = require("express").Router();

const errorController = require("../controllers/error");

// /500 => GET
router.get("/500", errorController.get500);

// /{false address} => GET
router.get("/*", errorController.get404);

module.exports = router;
