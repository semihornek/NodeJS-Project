const { Schema, model } = require("mongoose");

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  resetToken: String,
  resetTokenExpiration: Date,
  cart: {
    items: [{ productId: { type: Schema.Types.ObjectId, ref: "Product", required: true }, quantity: { type: Number, required: true } }],
  },
});

userSchema.methods.addToCart = async function (product) {
  if (!this.cart.items) this.cart = { items: [] }; // If there are no cart items array then add it

  const cartProductIndex = this.cart.items.findIndex((cartItem) => cartItem.productId?.toString() === product._id.toString());

  if (cartProductIndex >= 0) this.cart.items[cartProductIndex].quantity += 1;
  else this.cart.items.push({ productId: product._id, quantity: 1 });

  try {
    await this.save();
  } catch (error) {
    console.log(error);
  }
};

userSchema.methods.getCart = async function () {
  if (!this.cart.items) return [];

  const productIds = this.cart.items.map((cartItem) => cartItem.productId);
  try {
    const products = await model("Product").find({ _id: { $in: productIds } });
    // this.cleanCart(db);

    return products.map((product) => ({
      ...product._doc,
      quantity: this.cart.items.find((cartItem) => product._id.toString() === cartItem.productId.toString()).quantity,
    }));
  } catch (error) {
    console.log(error);
  }
};

userSchema.methods.removeFromCart = async function (productId) {
  this.cart.items = this.cart.items.filter((item) => item.productId.toString() !== productId.toString());
  try {
    await this.save();
  } catch (error) {
    console.log(error);
  }
};

userSchema.methods.clearCart = async function () {
  this.cart = { items: [] };
  try {
    await this.save();
  } catch (error) {
    console.log(error);
  }
};

module.exports = model("User", userSchema);
