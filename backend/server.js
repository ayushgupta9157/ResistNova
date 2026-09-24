const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");


// ============================================================
// ROUTES
// ============================================================

const patientRoutes = require("./routes/patientRoutes");
const staffRoutes = require("./routes/staffRoutes");
const locationRoutes = require("./routes/locationRoutes");
const movementRoutes = require("./routes/movementRoutes");
const contactRoutes = require("./routes/contactRoutes");
const graphRoutes = require("./routes/graphRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");


// ============================================================
// APP
// ============================================================

const app = express();


// ============================================================
// DATABASE
// ============================================================

connectDB();


// ============================================================
// MIDDLEWARE
// ============================================================

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);


// ============================================================
// API ROUTES
// ============================================================

app.use(
  "/api/patients",
  patientRoutes
);

app.use(
  "/api/staff",
  staffRoutes
);

app.use(
  "/api/locations",
  locationRoutes
);

app.use(
  "/api/movements",
  movementRoutes
);

app.use(
  "/api/contacts",
  contactRoutes
);

app.use(
  "/api/graph",
  graphRoutes
);

app.use(
  "/api/dashboard",
  dashboardRoutes
);


// ============================================================
// HEALTH CHECK
// ============================================================

app.get(
  "/api/health",
  (req, res) => {
    res.json({
      success: true,
      message:
        "ResistNova API is healthy",
    });
  }
);


// ============================================================
// ROOT
// ============================================================

app.get(
  "/",
  (req, res) => {
    res.json({
      success: true,
      message:
        "ResistNova Backend is running",
    });
  }
);


// ============================================================
// 404
// ============================================================

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,
      message:
        "API route not found",
    });
  }
);


// ============================================================
// ERROR HANDLER
// ============================================================

app.use(
  (err, req, res, next) => {
    console.error(
      "Server Error:",
      err
    );

    res.status(500).json({
      success: false,
      message:
        err.message ||
        "Internal server error",
    });
  }
);


// ============================================================
// SERVER
// ============================================================

const PORT =
  process.env.PORT || 5000;

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `ResistNova server running on port ${PORT}`
    );

    console.log(
      `Local: http://localhost:${PORT}`
    );

    console.log(
      `Network: http://172.23.250.200:${PORT}`
    );
  }
);