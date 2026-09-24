const Staff = require("../models/Staff");


// ==========================================
// CREATE STAFF
// POST /api/staff
// ==========================================
const createStaff = async (req, res) => {
  try {
    const {
      staffId,
      name,
      role,
      department,
      phone
    } = req.body;

    if (!staffId || !name || !role) {
      return res.status(400).json({
        success: false,
        message: "Staff ID, name and role are required"
      });
    }

    if (!["Nurse", "Doctor"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be Nurse or Doctor"
      });
    }

    const existingStaff = await Staff.findOne({
      staffId: staffId.trim()
    });

    if (existingStaff) {
      return res.status(409).json({
        success: false,
        message: "Staff ID already exists"
      });
    }

    const staff = await Staff.create({
      staffId: staffId.trim(),
      name: name.trim(),
      role,
      department: department || "",
      phone: phone || "",
      active: true
    });

    res.status(201).json({
      success: true,
      message: "Staff created successfully",
      staff
    });

  } catch (error) {
    console.error("Create staff error:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to create staff"
    });
  }
};


// ==========================================
// GET ALL STAFF
// GET /api/staff
// ==========================================
const getStaff = async (req, res) => {
  try {
    const staff = await Staff.find()
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: staff.length,
      staff
    });

  } catch (error) {
    console.error("Get staff error:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch staff"
    });
  }
};


// ==========================================
// GET STAFF BY ID
// GET /api/staff/:staffId
// ==========================================
const getStaffById = async (req, res) => {
  try {
    const staff = await Staff.findOne({
      staffId: req.params.staffId,
      active: true
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Active staff member not found"
      });
    }

    res.json({
      success: true,

      staff: {
        staffId: staff.staffId,
        name: staff.name,
        role: staff.role,
        department: staff.department || "",
        phone: staff.phone || "",
        active: staff.active
      }
    });

  } catch (error) {
    console.error("Get staff by ID error:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch staff"
    });
  }
};


// ==========================================
// UPDATE STAFF
// PUT /api/staff/:staffId
// ==========================================
const updateStaff = async (req, res) => {
  try {
    const {
      name,
      role,
      department,
      phone,
      active
    } = req.body;

    const staff = await Staff.findOne({
      staffId: req.params.staffId
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found"
      });
    }

    if (name !== undefined) {
      staff.name = name.trim();
    }

    if (role !== undefined) {
      if (!["Nurse", "Doctor"].includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Role must be Nurse or Doctor"
        });
      }

      staff.role = role;
    }

    if (department !== undefined) {
      staff.department = department;
    }

    if (phone !== undefined) {
      staff.phone = phone;
    }

    if (active !== undefined) {
      staff.active = active;
    }

    await staff.save();

    res.json({
      success: true,
      message: "Staff updated successfully",
      staff
    });

  } catch (error) {
    console.error("Update staff error:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to update staff"
    });
  }
};


// ==========================================
// DELETE / DEACTIVATE STAFF
// DELETE /api/staff/:staffId
// ==========================================
const deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findOne({
      staffId: req.params.staffId
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found"
      });
    }

    staff.active = false;

    await staff.save();

    res.json({
      success: true,
      message: "Staff deactivated successfully"
    });

  } catch (error) {
    console.error("Delete staff error:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to deactivate staff"
    });
  }
};


module.exports = {
  createStaff,
  getStaff,
  getStaffById,
  updateStaff,
  deleteStaff
};