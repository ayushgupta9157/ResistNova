const express = require("express");

const {
  createStaff,
  getStaff,
  getStaffById,
  updateStaff,
  deleteStaff
} = require("../controllers/staffController");

const router = express.Router();


// ==========================================
// GET ALL STAFF
// ==========================================

router.get(
  "/",
  getStaff
);


// ==========================================
// CREATE STAFF
// ==========================================

router.post(
  "/",
  createStaff
);


// ==========================================
// GET STAFF BY ID
// IMPORTANT: Keep this after "/"
// ==========================================

router.get(
  "/:staffId",
  getStaffById
);


// ==========================================
// UPDATE STAFF
// ==========================================

router.put(
  "/:staffId",
  updateStaff
);


// ==========================================
// DEACTIVATE STAFF
// ==========================================

router.delete(
  "/:staffId",
  deleteStaff
);


module.exports = router;