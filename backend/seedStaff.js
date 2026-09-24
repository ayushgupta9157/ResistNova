const mongoose = require("mongoose");
require("dotenv").config();

const Staff = require("./models/Staff");

const MONGO_URI = process.env.MONGO_URI;

const staffData = [
  // ==========================================
  // DOCTORS
  // ==========================================
  {
    staffId: "D001",
    name: "Dr. Rajesh Sharma",
    role: "Doctor",
    department: "General Medicine",
    mobile: "9000000001",
    active: true
  },
  {
    staffId: "D002",
    name: "Dr. Priya Verma",
    role: "Doctor",
    department: "ICU",
    mobile: "9000000002",
    active: true
  },
  {
    staffId: "D003",
    name: "Dr. Amit Singh",
    role: "Doctor",
    department: "Emergency",
    mobile: "9000000003",
    active: true
  },
  {
    staffId: "D004",
    name: "Dr. Neha Gupta",
    role: "Doctor",
    department: "Infectious Disease",
    mobile: "9000000004",
    active: true
  },
  {
    staffId: "D005",
    name: "Dr. Vikram Yadav",
    role: "Doctor",
    department: "Critical Care",
    mobile: "9000000005",
    active: true
  },

  // ==========================================
  // NURSES
  // ==========================================
  {
    staffId: "N001",
    name: "Anita Kumari",
    role: "Nurse",
    department: "ICU",
    mobile: "9000000011",
    active: true
  },
  {
    staffId: "N002",
    name: "Sunita Devi",
    role: "Nurse",
    department: "ICU",
    mobile: "9000000012",
    active: true
  },
  {
    staffId: "N003",
    name: "Pooja Sharma",
    role: "Nurse",
    department: "Ward A",
    mobile: "9000000013",
    active: true
  },
  {
    staffId: "N004",
    name: "Riya Singh",
    role: "Nurse",
    department: "Ward A",
    mobile: "9000000014",
    active: true
  },
  {
    staffId: "N005",
    name: "Kavita Verma",
    role: "Nurse",
    department: "Ward B",
    mobile: "9000000015",
    active: true
  },
  {
    staffId: "N006",
    name: "Meena Yadav",
    role: "Nurse",
    department: "Ward B",
    mobile: "9000000016",
    active: true
  },
  {
    staffId: "N007",
    name: "Nisha Gupta",
    role: "Nurse",
    department: "Emergency",
    mobile: "9000000017",
    active: true
  },
  {
    staffId: "N008",
    name: "Rekha Sharma",
    role: "Nurse",
    department: "Emergency",
    mobile: "9000000018",
    active: true
  },
  {
    staffId: "N009",
    name: "Shalini Kumari",
    role: "Nurse",
    department: "Critical Care",
    mobile: "9000000019",
    active: true
  },
  {
    staffId: "N010",
    name: "Asha Singh",
    role: "Nurse",
    department: "General Medicine",
    mobile: "9000000020",
    active: true
  }
];

async function seedStaff() {
  try {
    if (!MONGO_URI) {
      throw new Error(
        "MONGO_URI is not defined in backend/.env"
      );
    }

    console.log("Connecting to MongoDB...");

    await mongoose.connect(MONGO_URI);

    console.log("MongoDB connected.");

    // ==========================================
    // DELETE OLD STAFF DATA
    // ==========================================

    const deleteResult = await Staff.deleteMany({});

    console.log(
      `Deleted old staff records: ${deleteResult.deletedCount}`
    );

    // ==========================================
    // INSERT NEW STAFF DATA
    // ==========================================

    const insertedStaff = await Staff.insertMany(
      staffData
    );

    console.log(
      `Inserted new staff records: ${insertedStaff.length}`
    );

    console.log("");
    console.log("==========================================");
    console.log("STAFF SEEDING COMPLETED");
    console.log("==========================================");
    console.log("");

    console.log("Doctors:");
    console.log("D001 - Dr. Rajesh Sharma");
    console.log("D002 - Dr. Priya Verma");
    console.log("D003 - Dr. Amit Singh");
    console.log("D004 - Dr. Neha Gupta");
    console.log("D005 - Dr. Vikram Yadav");

    console.log("");

    console.log("Nurses:");
    console.log("N001 - Anita Kumari");
    console.log("N002 - Sunita Devi");
    console.log("N003 - Pooja Sharma");
    console.log("N004 - Riya Singh");
    console.log("N005 - Kavita Verma");
    console.log("N006 - Meena Yadav");
    console.log("N007 - Nisha Gupta");
    console.log("N008 - Rekha Sharma");
    console.log("N009 - Shalini Kumari");
    console.log("N010 - Asha Singh");

    console.log("");
    console.log("Total Staff: 15");
    console.log("Doctors: 5");
    console.log("Nurses: 10");
    console.log("");

    await mongoose.connection.close();

    console.log("MongoDB connection closed.");
    process.exit(0);

  } catch (error) {
    console.error("");
    console.error("STAFF SEEDING FAILED");
    console.error(error.message);

    try {
      await mongoose.connection.close();
    } catch (closeError) {
      // Ignore close error
    }

    process.exit(1);
  }
}

seedStaff();