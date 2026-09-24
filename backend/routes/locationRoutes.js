const express = require("express");

const {
  createLocation,
  getLocations,
  getLocationByQr
} = require("../controllers/locationController");

const router = express.Router();


// Get all locations
router.get("/", getLocations);


// Get location using QR
router.get("/qr/:qrToken", getLocationByQr);


// Create location
router.post("/", createLocation);


module.exports = router;