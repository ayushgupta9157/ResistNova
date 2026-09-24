const express = require("express");

const {
  getGraph
} = require("../controllers/graphController");

const router = express.Router();

router.get("/", getGraph);

module.exports = router;