const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = require("./config/db");

const Patient = require("./models/Patient");
const Staff = require("./models/Staff");
const Location = require("./models/Location");
const Movement = require("./models/Movement");

const now = new Date();

function timeAt(hours, minutes) {
  const date = new Date(now);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

async function seedContactTestData() {
  try {
    await connectDB();

    console.log("\n========================================");
    console.log("  ResistNova Contact Test Data Seeder");
    console.log("========================================\n");

    // -----------------------------------------
    // 1. CLEAR OLD TEST DATA
    // -----------------------------------------

    console.log("Removing old test data...");

    await Patient.deleteMany({
      patientId: {
        $in: ["P001", "P002", "P003", "P004"],
      },
    });

    await Staff.deleteMany({
      staffId: {
        $in: ["S001", "S002"],
      },
    });

    await Location.deleteMany({
      locationId: {
        $in: ["LOC001", "LOC002", "LOC003", "LOC004"],
      },
    });

    await Movement.deleteMany({
      personId: {
        $in: ["P001", "P002", "P003", "P004", "S001", "S002"],
      },
    });

    // -----------------------------------------
    // 2. LOCATIONS
    // -----------------------------------------

    const locations = [
      {
        locationId: "LOC001",
        name: "ICU",
        type: "ICU",
        qrToken: "TEST-LOC001",
      },
      {
        locationId: "LOC002",
        name: "Ward A",
        type: "WARD",
        qrToken: "TEST-LOC002",
      },
      {
        locationId: "LOC003",
        name: "Ward B",
        type: "WARD",
        qrToken: "TEST-LOC003",
      },
      {
        locationId: "LOC004",
        name: "Emergency",
        type: "EMERGENCY",
        qrToken: "TEST-LOC004",
      },
    ];

    await Location.insertMany(locations);

    console.log("✓ 4 locations created");

    // -----------------------------------------
    // 3. PATIENTS
    // -----------------------------------------

    const patients = [
      {
        patientId: "P001",
        qrToken: "TEST-P001",
        name: "Rahul Sharma",
        age: 45,
        gender: "Male",
        phone: "9000000001",
        address: "Kanpur",
      },
      {
        patientId: "P002",
        qrToken: "TEST-P002",
        name: "Amit Verma",
        age: 38,
        gender: "Male",
        phone: "9000000002",
        address: "Lucknow",
      },
      {
        patientId: "P003",
        qrToken: "TEST-P003",
        name: "Priya Singh",
        age: 32,
        gender: "Female",
        phone: "9000000003",
        address: "Varanasi",
      },
      {
        patientId: "P004",
        qrToken: "TEST-P004",
        name: "Neha Gupta",
        age: 51,
        gender: "Female",
        phone: "9000000004",
        address: "Prayagraj",
      },
    ];

    await Patient.insertMany(patients);

    console.log("✓ 4 patients created");

    // -----------------------------------------
    // 4. STAFF
    // -----------------------------------------

    const staff = [
      {
        staffId: "S001",
        name: "Dr. Arjun Mehta",
        role: "Doctor",
        department: "ICU",
        mobile: "9100000001",
      },
      {
        staffId: "S002",
        name: "Nurse Anjali",
        role: "Nurse",
        department: "ICU",
        mobile: "9100000002",
      },
    ];

    await Staff.insertMany(staff);

    console.log("✓ 2 staff members created");

    // -----------------------------------------
    // 5. MOVEMENTS
    // -----------------------------------------

    const movements = [];

    function addMovement(
      personId,
      personType,
      locationId,
      entryHour,
      entryMinute,
      exitHour,
      exitMinute
    ) {
      movements.push({
        personId,
        personType,
        locationId,
        action: "ENTRY",
        entryTime: timeAt(entryHour, entryMinute),
        exitTime: timeAt(exitHour, exitMinute),
        loggedBy: "TEST-SEED",
      });
    }

    // =========================================
    // SCENARIO 1
    // =========================================

    // P001: ICU 10:00 - 12:00
    addMovement(
      "P001",
      "Patient",
      "LOC001",
      10,
      0,
      12,
      0
    );

    // P002: ICU 10:30 - 11:30
    addMovement(
      "P002",
      "Patient",
      "LOC001",
      10,
      30,
      11,
      30
    );

    // S001: ICU 11:00 - 11:45
    addMovement(
      "S001",
      "Doctor",
      "LOC001",
      11,
      0,
      11,
      45
    );

    // P003: Ward A 10:30 - 11:30
    // Should NOT contact P001
    addMovement(
      "P003",
      "Patient",
      "LOC002",
      10,
      30,
      11,
      30
    );

    // =========================================
    // SCENARIO 2
    // Multiple rooms
    // =========================================

    // P001: ICU 13:00 - 14:00
    addMovement(
      "P001",
      "Patient",
      "LOC001",
      13,
      0,
      14,
      0
    );

    // P002: ICU 13:20 - 13:40
    addMovement(
      "P002",
      "Patient",
      "LOC001",
      13,
      20,
      13,
      40
    );

    // P001: Ward A 15:00 - 16:00
    addMovement(
      "P001",
      "Patient",
      "LOC002",
      15,
      0,
      16,
      0
    );

    // P002: Ward A 15:30 - 16:30
    addMovement(
      "P002",
      "Patient",
      "LOC002",
      15,
      30,
      16,
      30
    );

    // =========================================
    // SCENARIO 3
    // Multiple people in same room
    // =========================================

    // P001: Ward B 17:00 - 18:00
    addMovement(
      "P001",
      "Patient",
      "LOC003",
      17,
      0,
      18,
      0
    );

    // P002: Ward B 17:10 - 17:40
    addMovement(
      "P002",
      "Patient",
      "LOC003",
      17,
      10,
      17,
      40
    );

    // P003: Ward B 17:20 - 17:50
    addMovement(
      "P003",
      "Patient",
      "LOC003",
      17,
      20,
      17,
      50
    );

    // S001: Ward B 17:15 - 17:45
    addMovement(
      "S001",
      "Doctor",
      "LOC003",
      17,
      15,
      17,
      45
    );

    // S002: Ward B 17:30 - 18:00
    addMovement(
      "S002",
      "Nurse",
      "LOC003",
      17,
      30,
      18,
      0
    );

    // =========================================
    // SCENARIO 4
    // No-overlap test
    // =========================================

    // P004 enters Emergency at a completely
    // different time. Should not contact P001.
    addMovement(
      "P004",
      "Patient",
      "LOC004",
      19,
      0,
      20,
      0
    );

    // -----------------------------------------
    // INSERT MOVEMENTS
    // -----------------------------------------

    await Movement.insertMany(movements);

    console.log(`✓ ${movements.length} movement records created`);

    // -----------------------------------------
    // SUMMARY
    // -----------------------------------------

    console.log("\n========================================");
    console.log("       TEST DATA READY");
    console.log("========================================\n");

    console.log("Patients:");
    console.log("  P001 → Rahul Sharma");
    console.log("  P002 → Amit Verma");
    console.log("  P003 → Priya Singh");
    console.log("  P004 → Neha Gupta");

    console.log("\nStaff:");
    console.log("  S001 → Dr. Arjun Mehta");
    console.log("  S002 → Nurse Anjali");

    console.log("\nLocations:");
    console.log("  LOC001 → ICU");
    console.log("  LOC002 → Ward A");
    console.log("  LOC003 → Ward B");
    console.log("  LOC004 → Emergency");

    console.log("\n----------------------------------------");
    console.log("CONTACT TEST");
    console.log("----------------------------------------");

    console.log("\nSearch Patient ID: P001");

    console.log("\nExpected contacts include:");
    console.log("  P002 → Patient");
    console.log("  P003 → Patient");
    console.log("  S001 → Staff");
    console.log("  S002 → Staff");

    console.log("\nP001 ↔ P002:");
    console.log("  ICU     → 60 min + 20 min");
    console.log("  Ward A  → 30 min");
    console.log("  Ward B  → 30 min");

    console.log("\nP001 ↔ S001:");
    console.log("  ICU     → 45 min");
    console.log("  Ward B  → 30 min");

    console.log("\nP001 ↔ P004:");
    console.log("  No contact");

    console.log("\n========================================");
    console.log("  Seeder completed successfully!");
    console.log("========================================\n");

    // -----------------------------------------
    // CLOSE CONNECTION
    // -----------------------------------------

    await mongoose.connection.close();

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Seeder Error:");
    console.error(error);

    try {
      await mongoose.connection.close();
    } catch (closeError) {
      // Ignore close error
    }

    process.exit(1);
  }
}

seedContactTestData();

