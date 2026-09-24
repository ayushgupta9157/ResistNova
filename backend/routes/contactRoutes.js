const express = require("express");

const {
  detectContacts,
  getContacts,
  getPatientContacts,
  getContactById,
} = require("../controllers/contactController");

const router = express.Router();


// Search contacts by query
// GET /api/contacts?patientId=P001
router.get("/", getContacts);


// Search contacts by patient ID
// GET /api/contacts/patient/P001
router.get(
  "/patient/:patientId",
  getPatientContacts
);


// Calculate contacts
// POST /api/contacts/detect
router.post(
  "/detect",
  detectContacts
);


// Kept for route compatibility
router.get(
  "/:id",
  getContactById
);


module.exports = router;