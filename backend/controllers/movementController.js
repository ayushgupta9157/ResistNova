const Movement = require("../models/Movement");
const Patient = require("../models/Patient");
const Staff = require("../models/Staff");
const Location = require("../models/Location");


// ==========================================
// CREATE MOVEMENT / ENTRY
// POST /api/movements
// ==========================================
const createMovement = async (req, res) => {
  try {
    const {
      personId,
      personType,
      locationId,
      action,
      relatedPersonId,
      loggedBy
    } = req.body;


    // ========================================
    // BASIC VALIDATION
    // ========================================

    if (
      !personId ||
      !personType ||
      !locationId ||
      !action
    ) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing"
      });
    }


    // ========================================
    // VALID ACTION
    // ========================================

    if (!["ENTRY", "EXIT"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be ENTRY or EXIT"
      });
    }


    // ========================================
    // PATIENT VALIDATION
    // ========================================

    if (personType === "Patient") {

      const patient = await Patient.findOne({
        patientId: personId
      });

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient not found"
        });
      }
    }


    // ========================================
    // STAFF VALIDATION
    //
    // Staff ID se actual staff database
    // record find hoga.
    //
    // Isse Nurse / Doctor manually guess
    // karne ki zarurat nahi.
    // ========================================

    let staffRecord = null;

    if (
      personType === "Nurse" ||
      personType === "Doctor" ||
      personType === "Staff"
    ) {

      staffRecord = await Staff.findOne({
        staffId: personId,
        active: true
      });

      if (!staffRecord) {
        return res.status(404).json({
          success: false,
          message: "Active staff member not found"
        });
      }
    }


    // ========================================
    // LOCATION VALIDATION
    // ========================================

    const location = await Location.findOne({
      locationId,
      active: true
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found or inactive"
      });
    }


    // ========================================
    // EXIT REQUEST
    //
    // EXIT ko /exit endpoint se handle karna
    // preferred hai.
    // ========================================

    if (action === "EXIT") {

      return res.status(400).json({
        success: false,
        message:
          "For EXIT movement use POST /api/movements/exit"
      });
    }


    // ========================================
    // PREVENT DUPLICATE ACTIVE ENTRY
    // ========================================

    const existingEntry = await Movement.findOne({
      personId,
      locationId,
      action: "ENTRY",
      exitTime: null
    });

    if (existingEntry) {

      return res.status(409).json({
        success: false,
        message:
          "Active entry already exists for this person in this location",
        movement: existingEntry
      });
    }


    // ========================================
    // CREATE ENTRY
    // ========================================

    const movement = await Movement.create({

      personId,

      /*
       * IMPORTANT
       *
       * Patient:
       *     Patient
       *
       * Staff:
       *     actual database role if available
       *
       * This preserves Nurse / Doctor information
       * for exposure analysis.
       */

      personType:
        personType === "Staff"
          ? staffRecord?.role || "Staff"
          : personType,

      locationId,

      action: "ENTRY",

      relatedPersonId:
        relatedPersonId || null,

      loggedBy:
        loggedBy || null
    });


    // ========================================
    // RESPONSE
    // ========================================

    res.status(201).json({

      success: true,

      message:
        "Movement entry recorded successfully",

      movement

    });

  } catch (error) {

    console.error(
      "Create movement error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to create movement"
    });
  }
};



// ==========================================
// EXIT MOVEMENT
// POST /api/movements/exit
// ==========================================
const exitMovement = async (req, res) => {

  try {

    const {
      personId,
      locationId
    } = req.body;


    // ========================================
    // VALIDATION
    // ========================================

    if (!personId || !locationId) {

      return res.status(400).json({

        success: false,

        message:
          "Person ID and location ID are required"

      });
    }


    // ========================================
    // FIND ACTIVE ENTRY
    // ========================================

    const movement = await Movement.findOne({

      personId,

      locationId,

      action: "ENTRY",

      exitTime: null

    }).sort({
      entryTime: -1
    });


    if (!movement) {

      return res.status(404).json({

        success: false,

        message:
          "Active entry not found for this person in this location"

      });
    }


    // ========================================
    // RECORD EXIT
    // ========================================

    movement.exitTime = new Date();

    await movement.save();


    // ========================================
    // CALCULATE DURATION
    // ========================================

    const durationSeconds =
      Math.max(
        0,
        Math.floor(
          (
            movement.exitTime -
            movement.entryTime
          ) / 1000
        )
      );


    const durationMinutes =
      Math.floor(
        durationSeconds / 60
      );


    // ========================================
    // RESPONSE
    // ========================================

    res.json({

      success: true,

      message:
        "Exit recorded successfully",

      movement,

      durationSeconds,

      durationMinutes

    });

  } catch (error) {

    console.error(
      "Exit movement error:",
      error
    );

    res.status(500).json({

      success: false,

      message:
        error.message ||
        "Failed to record exit"

    });
  }
};



// ==========================================
// GET ALL MOVEMENTS
// GET /api/movements
// ==========================================
const getMovements = async (req, res) => {

  try {

    const movements = await Movement.find()
      .sort({
        entryTime: -1
      });


    res.json({

      success: true,

      count: movements.length,

      movements

    });

  } catch (error) {

    console.error(
      "Get movements error:",
      error
    );

    res.status(500).json({

      success: false,

      message:
        error.message ||
        "Failed to fetch movements"

    });
  }
};



// ==========================================
// GET ACTIVE MOVEMENTS
// GET /api/movements/active
// ==========================================
const getActiveMovements = async (req, res) => {

  try {

    const movements = await Movement.find({

      action: "ENTRY",

      exitTime: null

    }).sort({

      entryTime: -1

    });


    res.json({

      success: true,

      count: movements.length,

      movements

    });

  } catch (error) {

    console.error(
      "Get active movements error:",
      error
    );

    res.status(500).json({

      success: false,

      message:
        error.message ||
        "Failed to fetch active movements"

    });
  }
};



// ==========================================
// EXPORT
// ==========================================

module.exports = {

  createMovement,

  exitMovement,

  getMovements,

  getActiveMovements

};