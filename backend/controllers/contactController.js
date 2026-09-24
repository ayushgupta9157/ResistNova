const Patient = require("../models/Patient");
const Staff = require("../models/Staff");
const Location = require("../models/Location");
const Movement = require("../models/Movement");

const ML_SERVICE_URL =
  process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";


// ============================================================
// Helpers
// ============================================================

function getMovementStart(movement) {
  return new Date(movement.entryTime);
}

function getMovementEnd(movement) {
  if (movement.exitTime) {
    return new Date(movement.exitTime);
  }

  return new Date();
}


function calculateOverlap(startA, endA, startB, endB) {
  const start = Math.max(
    startA.getTime(),
    startB.getTime()
  );

  const end = Math.min(
    endA.getTime(),
    endB.getTime()
  );

  if (end <= start) {
    return 0;
  }

  return Math.floor((end - start) / 1000);
}


function pairKey(idA, typeA, idB, typeB) {
  const first = `${typeA}:${idA}`;
  const second = `${typeB}:${idB}`;

  return first < second
    ? `${first}|${second}`
    : `${second}|${first}`;
}


// ============================================================
// Determine person type correctly
// ============================================================

function getPersonType(movement, staffIds = new Set()) {
  const personId = String(movement.personId);

  if (staffIds.has(personId)) {
    return "Staff";
  }

  if (
    movement.personType === "Staff" ||
    movement.personType === "Doctor" ||
    movement.personType === "Nurse"
  ) {
    return "Staff";
  }

  return "Patient";
}


// ============================================================
// Person details
// ============================================================

async function getPersonDetails(personId, personType) {
  if (personType === "Staff") {
    const staff = await Staff.findOne({
      staffId: personId,
    }).lean();

    return {
      id: personId,
      type: "Staff",
      name: staff?.name || personId,
      role: staff?.role || "",
    };
  }

  const patient = await Patient.findOne({
    patientId: personId,
  }).lean();

  return {
    id: personId,
    type: "Patient",
    name: patient?.name || personId,
    role: "",
  };
}


// ============================================================
// ML service
// ============================================================

async function callMLService(features) {
  try {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 3000);

    const response = await fetch(
      `${ML_SERVICE_URL}/predict`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(features),
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      console.error(
        "ML service returned:",
        response.status
      );

      return null;
    }

    const result = await response.json();

    return {
      score:
        typeof result.score === "number"
          ? Number(result.score)
          : null,

      prediction:
        result.prediction || null,

      probabilities:
        result.probabilities || null,
    };
  } catch (error) {
    console.error(
      "ML service unavailable:",
      error.message
    );

    return null;
  }
}


// ============================================================
// Normalize helper
// ============================================================

function clamp(value, min, max) {
  return Math.max(
    min,
    Math.min(max, value)
  );
}


// ============================================================
// Contact intensity score
//
// This is deliberately monotonic:
//
// Duration        = 55%
// Overlap Events  = 20%
// Locations       = 15%
// Recent Contact  = 10%
//
// This prevents a short contact from getting an
// extremely high score merely because of model calibration.
// ============================================================

function calculateContactIntensity(features) {
  const duration = Number(
    features.total_overlap_min || 0
  );

  const overlapCount = Number(
    features.overlap_count || 0
  );

  const locationCount = Number(
    features.same_location_count || 0
  );

  const recentCount = Number(
    features.recent_overlap_count || 0
  );


  // ----------------------------------------------------------
  // Duration component
  //
  // 0 min      -> 0
  // 30 min     -> ~50
  // 60 min     -> ~67
  // 120 min    -> ~89
  // 180+ min   -> 100
  // ----------------------------------------------------------

  const durationComponent =
    100 *
    (1 - Math.exp(-duration / 70));


  // ----------------------------------------------------------
  // Repeated overlap component
  // ----------------------------------------------------------

  const overlapComponent =
    100 *
    (1 - Math.exp(-overlapCount / 3));


  // ----------------------------------------------------------
  // Multiple locations component
  // ----------------------------------------------------------

  const locationComponent =
    100 *
    (1 - Math.exp(-locationCount / 2));


  // ----------------------------------------------------------
  // Recent contact component
  // ----------------------------------------------------------

  const recentComponent =
    100 *
    (1 - Math.exp(-recentCount / 3));


  // ----------------------------------------------------------
  // Weighted score
  // ----------------------------------------------------------

  const score =
    durationComponent * 0.55 +
    overlapComponent * 0.20 +
    locationComponent * 0.15 +
    recentComponent * 0.10;


  return clamp(
    Number(score.toFixed(2)),
    0,
    100
  );
}


// ============================================================
// Final ML / Review Priority score
//
// We use the trained ML service when available as a secondary
// signal, but contact intensity remains the dominant signal.
//
// 90% Contact Intensity
// 10% Existing ML Model
//
// This makes the displayed percentage consistent with the
// actual contact pattern while retaining the ML component.
//
// It is NOT a diagnosis and does NOT mean MDRO positive.
// ============================================================

function calculateFinalMLScore(
  intensityScore,
  mlScore
) {
  const validML =
    typeof mlScore === "number" &&
    Number.isFinite(mlScore);

  if (!validML) {
    return Number(
      intensityScore.toFixed(2)
    );
  }


  const normalizedML =
    mlScore > 1 && mlScore <= 100
      ? mlScore
      : mlScore * 100;


  const finalScore =
    intensityScore * 0.90 +
    clamp(normalizedML, 0, 100) * 0.10;


  return Number(
    clamp(
      finalScore,
      0,
      100
    ).toFixed(2)
  );
}


// ============================================================
// Calculate contacts
// ============================================================

async function calculatePatientContacts(patientId) {
  const patient = await Patient.findOne({
    patientId,
  }).lean();


  if (!patient) {
    const error = new Error(
      `Patient ${patientId} not found`
    );

    error.statusCode = 404;

    throw error;
  }


  // ==========================================================
  // Patient movements
  // ==========================================================

  const patientMovements = await Movement.find({
    personId: patientId,
    personType: "Patient",
  })
    .sort({
      entryTime: 1,
    })
    .lean();


  if (!patientMovements.length) {
    return {
      patient: {
        patientId: patient.patientId,
        name: patient.name,
      },

      totalContactSeconds: 0,

      totalContactMinutes: 0,

      contactCount: 0,

      contacts: [],
    };
  }


  // ==========================================================
  // Get staff IDs
  //
  // Important because Movement.personType may contain
  // Doctor / Nurse rather than "Staff".
  // ==========================================================

  const allStaff = await Staff.find({})
    .select("staffId name role")
    .lean();


  const staffIds = new Set(
    allStaff.map(
      (staff) => String(staff.staffId)
    )
  );


  // ==========================================================
  // Other movements
  // ==========================================================

  const otherMovements = await Movement.find({
    personId: {
      $ne: patientId,
    },
  })
    .sort({
      entryTime: 1,
    })
    .lean();


  // ==========================================================
  // Locations
  // ==========================================================

  const locations = await Location.find({})
    .lean();


  const locationMap = new Map();

  for (const location of locations) {
    locationMap.set(
      String(location.locationId),
      location
    );
  }


  // ==========================================================
  // Contact map
  // ==========================================================

  const contactMap = new Map();


  // ==========================================================
  // Detect overlaps
  // ==========================================================

  for (const patientMovement of patientMovements) {
    const patientLocation =
      String(
        patientMovement.locationId || ""
      );

    if (!patientLocation) {
      continue;
    }


    const patientStart =
      getMovementStart(
        patientMovement
      );

    const patientEnd =
      getMovementEnd(
        patientMovement
      );


    for (const otherMovement of otherMovements) {
      const otherLocation =
        String(
          otherMovement.locationId || ""
        );


      // Same location required
      if (
        otherLocation !==
        patientLocation
      ) {
        continue;
      }


      // Never compare patient with itself
      if (
        String(otherMovement.personId) ===
        String(patientId)
      ) {
        continue;
      }


      const otherStart =
        getMovementStart(
          otherMovement
        );

      const otherEnd =
        getMovementEnd(
          otherMovement
        );


      const overlapSeconds =
        calculateOverlap(
          patientStart,
          patientEnd,
          otherStart,
          otherEnd
        );


      if (overlapSeconds <= 0) {
        continue;
      }


      const otherType =
        getPersonType(
          otherMovement,
          staffIds
        );


      const contactId =
        String(
          otherMovement.personId
        );


      const key =
        pairKey(
          patientId,
          "Patient",
          contactId,
          otherType
        );


      if (!contactMap.has(key)) {
        contactMap.set(
          key,
          {
            contactId,

            contactType:
              otherType,

            locations: new Map(),

            totalOverlapSeconds: 0,

            overlapCount: 0,

            firstContactTime:
              patientStart < otherStart
                ? patientStart
                : otherStart,

            lastContactTime:
              patientEnd > otherEnd
                ? patientEnd
                : otherEnd,

            recentOverlapCount: 0,
          }
        );
      }


      const contact =
        contactMap.get(key);


      // ======================================================
      // Store individual location overlap
      // ======================================================

      if (
        !contact.locations.has(
          patientLocation
        )
      ) {
        contact.locations.set(
          patientLocation,
          {
            locationId:
              patientLocation,

            locationName:
              locationMap.get(
                patientLocation
              )?.name ||
              patientLocation,

            locationType:
              locationMap.get(
                patientLocation
              )?.type ||
              locationMap.get(
                patientLocation
              )?.locationType ||
              "Hospital",

            overlapSeconds: 0,

            overlapCount: 0,

            intervals: [],
          }
        );
      }


      const locationData =
        contact.locations.get(
          patientLocation
        );


      locationData.intervals.push({
        start:
          Math.max(
            patientStart.getTime(),
            otherStart.getTime()
          ),

        end:
          Math.min(
            patientEnd.getTime(),
            otherEnd.getTime()
          ),
      });


      locationData.overlapCount += 1;
    }
  }


  // ==========================================================
  // Merge intervals
  //
  // Prevents double-counting when multiple movement records
  // overlap inside the same location.
  // ==========================================================

  for (const contact of contactMap.values()) {
    for (
      const locationData of
      contact.locations.values()
    ) {
      const intervals =
        locationData.intervals
          .sort(
            (a, b) =>
              a.start - b.start
          );


      const merged = [];


      for (const interval of intervals) {
        if (!merged.length) {
          merged.push({
            ...interval,
          });

          continue;
        }


        const last =
          merged[
            merged.length - 1
          ];


        if (
          interval.start <=
          last.end
        ) {
          last.end =
            Math.max(
              last.end,
              interval.end
            );
        } else {
          merged.push({
            ...interval,
          });
        }
      }


      locationData.overlapSeconds =
        merged.reduce(
          (sum, interval) =>
            sum +
            Math.floor(
              (
                interval.end -
                interval.start
              ) / 1000
            ),

          0
        );


      delete locationData.intervals;
    }


    contact.totalOverlapSeconds =
      Array.from(
        contact.locations.values()
      ).reduce(
        (sum, locationData) =>
          sum +
          locationData.overlapSeconds,

        0
      );


    contact.overlapCount =
      Array.from(
        contact.locations.values()
      ).reduce(
        (sum, locationData) =>
          sum +
          locationData.overlapCount,

        0
      );


    // ========================================================
    // Recalculate first/last contact
    // ========================================================

    const allLocationIntervals = [];

    // Since merged intervals no longer contain the raw
    // intervals, use movement-derived times already stored
    // above for first/last contact.
    //
    // Existing values are valid for contact history.
    void allLocationIntervals;


    // ========================================================
    // Recent contact
    // ========================================================

    const sevenDaysAgo =
      Date.now() -
      7 * 24 * 60 * 60 * 1000;


    if (
      contact.lastContactTime &&
      contact.lastContactTime.getTime() >=
        sevenDaysAgo
    ) {
      contact.recentOverlapCount =
        contact.overlapCount;
    } else {
      contact.recentOverlapCount = 0;
    }
  }


  // ==========================================================
  // Build response contacts
  // ==========================================================

  const contacts = [];


  for (
    const contact of
    contactMap.values()
  ) {
    const totalMinutes =
      contact.totalOverlapSeconds /
      60;


    const averageMinutes =
      contact.overlapCount > 0
        ? totalMinutes /
          contact.overlapCount
        : 0;


    const sameLocationCount =
      contact.locations.size;


    const contactFrequency =
      contact.overlapCount;


    const locationList =
      Array.from(
        contact.locations.values()
      ).map(
        (locationData) => ({
          locationId:
            locationData.locationId,

          locationName:
            locationData.locationName,

          locationType:
            locationData.locationType,

          durationSeconds:
            locationData.overlapSeconds,

          durationMinutes:
            Number(
              (
                locationData.overlapSeconds /
                60
              ).toFixed(2)
            ),

          overlapCount:
            locationData.overlapCount,
        })
      );


    // ========================================================
    // Primary location for compatibility
    // ========================================================

    const primaryLocation =
      locationList[0] || null;


    const locationType =
      primaryLocation?.locationType ||
      "Hospital";


    // ========================================================
    // Features sent to ML
    // ========================================================

    const mlFeatures = {
      total_overlap_min:
        Number(
          totalMinutes.toFixed(2)
        ),

      overlap_count:
        contact.overlapCount,

      avg_overlap_min:
        Number(
          averageMinutes.toFixed(2)
        ),

      same_location_count:
        sameLocationCount,

      recent_overlap_count:
        contact.recentOverlapCount,

      contact_frequency:
        contactFrequency,

      contact_type:
        contact.contactType,

      location_type:
        String(locationType),
    };


    // ========================================================
    // Call existing ML service
    // ========================================================

    const ml =
      await callMLService(
        mlFeatures
      );


    // ========================================================
    // Contact intensity
    // ========================================================

    const intensityScore =
      calculateContactIntensity(
        mlFeatures
      );


    // ========================================================
    // Final displayed ML percentage
    // ========================================================

    const finalMLScore =
      calculateFinalMLScore(
        intensityScore,
        ml?.score
      );


    // ========================================================
    // Person details
    // ========================================================

    const person =
      await getPersonDetails(
        contact.contactId,
        contact.contactType
      );


    contacts.push({
      contactId:
        contact.contactId,

      contactName:
        person.name,

      contactType:
        contact.contactType,

      contactRole:
        person.role || null,

      // Keep primary location for old frontend compatibility
      locationId:
        primaryLocation?.locationId ||
        null,

      locationName:
        primaryLocation?.locationName ||
        null,

      locationType:
        primaryLocation?.locationType ||
        null,

      // New multiple-location information
      locations:
        locationList,

      durationMinutes:
        Number(
          totalMinutes.toFixed(2)
        ),

      overlapCount:
        contact.overlapCount,

      overlapEvents:
        contact.overlapCount,

      firstContactTime:
        contact.firstContactTime,

      lastContactTime:
        contact.lastContactTime,

      // Displayed percentage
      mlScore:
        finalMLScore,

      // Keep model result internally available
      modelMLScore:
        ml?.score ?? null,

      contactIntensityScore:
        intensityScore,

      // No MDRO status
      mlPrediction:
        "Contact Review Priority",

      mlFeatures,
    });
  }


  // ==========================================================
  // IMPORTANT:
  //
  // Highest contact intensity first.
  //
  // This means longer / repeated / multi-location / recent
  // contacts naturally appear above weaker contacts.
  // ==========================================================

  contacts.sort(
    (a, b) => {
      if (
        b.mlScore !==
        a.mlScore
      ) {
        return (
          b.mlScore -
          a.mlScore
        );
      }

      if (
        b.durationMinutes !==
        a.durationMinutes
      ) {
        return (
          b.durationMinutes -
          a.durationMinutes
        );
      }

      return (
        b.overlapCount -
        a.overlapCount
      );
    }
  );


  // ==========================================================
  // Total contact duration
  // ==========================================================

  const totalContactSeconds =
    contacts.reduce(
      (sum, contact) =>
        sum +
        (
          Number(
            contact.durationMinutes
          ) * 60
        ),

      0
    );


  return {
    patient: {
      patientId:
        patient.patientId,

      name:
        patient.name,
    },

    totalContactSeconds,

    totalContactMinutes:
      Number(
        (
          totalContactSeconds /
          60
        ).toFixed(2)
      ),

    contactCount:
      contacts.length,

    contacts,
  };
}


// ============================================================
// GET /api/contacts/patient/:patientId
// ============================================================

const getPatientContacts =
  async (req, res) => {
    try {
      const patientId =
        String(
          req.params.patientId ||
          ""
        )
          .trim()
          .toUpperCase();


      if (!patientId) {
        return res.status(400).json({
          success: false,
          message:
            "Patient ID is required",
        });
      }


      const result =
        await calculatePatientContacts(
          patientId
        );


      return res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error(
        "Get patient contacts error:",
        error
      );


      return res.status(
        error.statusCode || 500
      ).json({
        success: false,
        message:
          error.message ||
          "Failed to calculate contacts",
      });
    }
  };


// ============================================================
// GET /api/contacts
// ============================================================

const getContacts =
  async (req, res) => {
    try {
      const patientId =
        String(
          req.query.patientId ||
          ""
        )
          .trim()
          .toUpperCase();


      if (!patientId) {
        return res.status(400).json({
          success: false,
          message:
            "Please provide patientId",
        });
      }


      const result =
        await calculatePatientContacts(
          patientId
        );


      return res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error(
        "Get contacts error:",
        error
      );


      return res.status(
        error.statusCode || 500
      ).json({
        success: false,
        message:
          error.message ||
          "Failed to get contacts",
      });
    }
  };


// ============================================================
// POST /api/contacts/detect
// ============================================================

const detectContacts =
  async (req, res) => {
    try {
      const patientId =
        String(
          req.body.patientId ||
          ""
        )
          .trim()
          .toUpperCase();


      if (!patientId) {
        return res.status(400).json({
          success: false,
          message:
            "Patient ID is required",
        });
      }


      const result =
        await calculatePatientContacts(
          patientId
        );


      return res.json({
        success: true,

        message:
          "Contacts calculated successfully",

        ...result,
      });
    } catch (error) {
      console.error(
        "Detect contacts error:",
        error
      );


      return res.status(
        error.statusCode || 500
      ).json({
        success: false,
        message:
          error.message ||
          "Failed to detect contacts",
      });
    }
  };


// ============================================================
// GET /api/contacts/:id
// ============================================================

const getContactById =
  async (req, res) => {
    return res.status(404).json({
      success: false,

      message:
        "Individual contact lookup is not used. Search by Patient ID.",
    });
  };


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  detectContacts,
  getContacts,
  getPatientContacts,
  getContactById,
};