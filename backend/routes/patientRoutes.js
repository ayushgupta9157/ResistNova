const express = require("express");

const {
  createPatient,
  getPatients,
  getPatientById,
  getPatientByQr
} = require("../controllers/patientController");

const router = express.Router();


// Get all patients
router.get("/", getPatients);


// Patient QR lookup
router.get("/qr/:qrToken", getPatientByQr);


// Get patient by Patient ID
router.get("/:patientId", getPatientById);


// Register patient
router.post("/", createPatient);


module.exports = router;