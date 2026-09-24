const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    personAId: {
      type: String,
      required: true,
      index: true
    },

    personAType: {
      type: String,
      required: true
    },

    personBId: {
      type: String,
      required: true,
      index: true
    },

    personBType: {
      type: String,
      required: true
    },

    locationId: {
      type: String,
      required: true,
      index: true
    },

    firstContactTime: {
      type: Date,
      required: true
    },

    lastContactTime: {
      type: Date,
      required: true
    },

    overlapSeconds: {
      type: Number,
      required: true,
      min: 0
    },

    overlapMinutes: {
      type: Number,
      required: true,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Contact", contactSchema);