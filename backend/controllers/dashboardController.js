const Patient = require("../models/Patient");
const Staff = require("../models/Staff");
const Location = require("../models/Location");
const Movement = require("../models/Movement");
const Contact = require("../models/Contact");

// ==========================================
// GET DASHBOARD STATS
// ==========================================

const getDashboardStats = async (req, res) => {
  try {
    // ------------------------------------------
    // BASIC COUNTS
    // ------------------------------------------

    const [
      totalPatients,
      totalStaff,
      totalLocations,
      totalMovements,
      totalContacts,
    ] = await Promise.all([
      Patient.countDocuments(),
      Staff.countDocuments(),
      Location.countDocuments(),
      Movement.countDocuments(),
      Contact.countDocuments(),
    ]);

    // ------------------------------------------
    // ACTIVE MOVEMENTS
    // ENTRY without EXIT
    // ------------------------------------------

    const activeMovements = await Movement.countDocuments({
      action: "ENTRY",
      $or: [
        { exitTime: null },
        { exitTime: { $exists: false } },
      ],
    });

    // ------------------------------------------
    // PATIENT MOVEMENTS
    // ------------------------------------------

    const patientMovements = await Movement.countDocuments({
      personType: "PATIENT",
    });

    // ------------------------------------------
    // STAFF MOVEMENTS
    // ------------------------------------------

    const staffMovements = await Movement.countDocuments({
      personType: "STAFF",
    });

    // ------------------------------------------
    // RECENT MOVEMENTS
    // ------------------------------------------

    const recentMovements = await Movement.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // ------------------------------------------
    // RESPONSE
    // ------------------------------------------

    res.json({
      success: true,

      stats: {
        totalPatients,
        totalStaff,
        totalLocations,
        totalMovements,
        totalContacts,
        activeMovements,
        patientMovements,
        staffMovements,
      },

      recentMovements,
    });
  } catch (error) {
    console.error("Dashboard error:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to load dashboard statistics",
    });
  }
};

module.exports = {
  getDashboardStats,
};