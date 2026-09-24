const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    locationId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    name: {
      type: String,
      required: true
    },

    type: {
      type: String,
      required: true
    },

    qrToken: {
      type: String,
      required: true,
      unique: true
    },

    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "Location",
  locationSchema
);