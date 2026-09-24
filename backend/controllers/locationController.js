const Location = require("../models/Location");
const crypto = require("crypto");

// ==========================================
// Generate QR Token
// ==========================================
const generateQrToken = () => {
  return crypto.randomBytes(16).toString("hex");
};


// ==========================================
// CREATE LOCATION
// POST /api/locations
// ==========================================
const createLocation = async (req, res) => {
  try {
    const {
      locationId,
      name,
      type
    } = req.body;

    if (!locationId || !name || !type) {
      return res.status(400).json({
        success: false,
        message: "Location ID, name and type are required"
      });
    }

    const existing = await Location.findOne({
      locationId
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Location already exists"
      });
    }

    const location = await Location.create({
      locationId,
      name,
      type,
      qrToken: generateQrToken(),
      active: true
    });

    res.status(201).json({
      success: true,
      message: "Location created successfully",
      location
    });

  } catch (error) {
    console.error("Create location error:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// ==========================================
// GET ALL LOCATIONS
// GET /api/locations
// ==========================================
const getLocations = async (req, res) => {
  try {
    const locations = await Location.find()
      .sort({ locationId: 1 });

    res.json({
      success: true,
      count: locations.length,
      locations
    });

  } catch (error) {
    console.error("Get locations error:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// ==========================================
// GET LOCATION BY QR
// GET /api/locations/qr/:qrToken
// ==========================================
const getLocationByQr = async (req, res) => {
  try {
    const location = await Location.findOne({
      qrToken: req.params.qrToken,
      active: true
    }).select(
      "locationId name type qrToken active"
    );

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Invalid or inactive room QR code"
      });
    }

    res.json({
      success: true,
      location
    });

  } catch (error) {
    console.error("Location QR error:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


module.exports = {
  createLocation,
  getLocations,
  getLocationByQr
};