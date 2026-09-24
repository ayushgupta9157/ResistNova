const express = require("express");

const {
  createMovement,
  exitMovement,
  getMovements,
  getActiveMovements
} = require("../controllers/movementController");

const router = express.Router();


// ==========================================
// GET ALL MOVEMENTS
// ==========================================

router.get(
  "/",
  getMovements
);


// ==========================================
// GET ACTIVE MOVEMENTS
// ==========================================

router.get(
  "/active",
  getActiveMovements
);


// ==========================================
// CREATE ENTRY
// ==========================================

router.post(
  "/",
  createMovement
);


// ==========================================
// RECORD EXIT
// ==========================================

router.post(
  "/exit",
  exitMovement
);


module.exports = router;