const Patient = require("../models/Patient");
const crypto = require("crypto");

// Generate unique Patient ID
const generatePatientId = async () => {
  const lastPatient = await Patient.findOne()
    .sort({ createdAt: -1 })
    .select("patientId");

  let nextNumber = 1;

  if (lastPatient && lastPatient.patientId) {
    const number = parseInt(lastPatient.patientId.replace("P", ""), 10);

    if (!isNaN(number)) {
      nextNumber = number + 1;
    }
  }

  return `P${String(nextNumber).padStart(3, "0")}`;
};

// Generate QR token
const generateQrToken = () => {
  return crypto.randomBytes(16).toString("hex");
};


// ==============================
// REGISTER PATIENT
// ==============================
const createPatient = async (req, res) => {
  try {
    const {
      name,
      age,
      gender,
      phone,
      address
    } = req.body;

    if (!name || age === undefined || !gender) {
      return res.status(400).json({
        success: false,
        message: "Name, age and gender are required"
      });
    }

    const patientId = await generatePatientId();
    const qrToken = generateQrToken();

    const patient = await Patient.create({
      patientId,
      qrToken,
      name: name.trim(),
      age,
      gender,
      phone: phone || "",
      address: address || ""
    });

    res.status(201).json({
      success: true,
      message: "Patient registered successfully",

      // Only operational information
      patient: {
        patientId: patient.patientId,
        qrToken: patient.qrToken,
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        phone: patient.phone,
        address: patient.address,
        createdAt: patient.createdAt
      }
    });

  } catch (error) {
    console.error("Create patient error:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// ==============================
// GET ALL PATIENTS
// ==============================
const getPatients = async (req, res) => {
  try {
    const patients = await Patient.find()
      .select(
        "patientId name age gender phone address qrToken createdAt"
      )
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: patients.length,
      patients
    });

  } catch (error) {
    console.error("Get patients error:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// ==============================
// GET PATIENT BY ID
// ==============================
const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findOne({
      patientId: req.params.patientId
    }).select(
      "patientId name age gender phone address qrToken createdAt"
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }

    res.json({
      success: true,
      patient
    });

  } catch (error) {
    console.error("Get patient error:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// ==============================
// GET PATIENT BY QR TOKEN
// ==============================
const getPatientByQr = async (req, res) => {
  try {
    const patient = await Patient.findOne({
      qrToken: req.params.qrToken
    }).select(
      "patientId name age gender"
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Invalid patient QR code"
      });
    }

    // IMPORTANT:
    // No MDRO status
    // No organism
    // No risk score
    // No exposure information

    res.json({
      success: true,
      patient
    });

  } catch (error) {
    console.error("QR patient lookup error:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


module.exports = {
  createPatient,
  getPatients,
  getPatientById,
  getPatientByQr
};