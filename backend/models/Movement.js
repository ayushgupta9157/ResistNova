const mongoose = require("mongoose");

const movementSchema = new mongoose.Schema(
  {
    personId: {
      type: String,
      required: true
    },

    personType: {
      type: String,
      enum: ["Patient", "Nurse", "Doctor"],
      required: true
    },

    locationId: {
      type: String,
      required: true
    },

    action: {
      type: String,
      enum: ["ENTRY", "EXIT", "INTERACTION"],
      required: true
    },

    relatedPersonId: {
      type: String,
      default: null
    },

    entryTime: {
      type: Date,
      default: Date.now
    },

    exitTime: {
      type: Date,
      default: null
    },

    loggedBy: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Movement", movementSchema);