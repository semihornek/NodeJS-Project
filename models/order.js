const { Schema, model } = require("mongoose");

const orderSchema = new Schema({
  items: {
    type: Array,
    required: true,
  },
  user: { _id: { type: Schema.Types.ObjectId, required: true, ref: "User" }, email: { type: String, required: true } },
});

module.exports = model("Order", orderSchema);
