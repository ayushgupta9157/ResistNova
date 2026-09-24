const Movement = require("../models/Movement");


// ============================================================
// CALCULATE TIME OVERLAP
// ============================================================

const calculateOverlap = (movementA, movementB) => {
  const startA = new Date(movementA.entryTime);

  const endA = movementA.exitTime
    ? new Date(movementA.exitTime)
    : new Date();

  const startB = new Date(movementB.entryTime);

  const endB = movementB.exitTime
    ? new Date(movementB.exitTime)
    : new Date();

  const overlapStart =
    startA > startB ? startA : startB;

  const overlapEnd =
    endA < endB ? endA : endB;

  const overlapMs =
    overlapEnd.getTime() -
    overlapStart.getTime();

  if (overlapMs <= 0) {
    return null;
  }

  return {
    overlapStart,
    overlapEnd,
    duration: Math.floor(
      overlapMs / 1000
    )
  };
};


// ============================================================
// GET CONTACT GRAPH
// ============================================================

const getGraph = async (req, res) => {
  try {

    const { personId } = req.query;

    // --------------------------------------------------------
    // GET ALL COMPLETED/ACTIVE ENTRIES
    // --------------------------------------------------------

    const movements =
      await Movement.find({
        action: "ENTRY"
      }).sort({
        entryTime: 1
      });

    // --------------------------------------------------------
    // EMPTY DATABASE
    // --------------------------------------------------------

    if (movements.length === 0) {
      return res.json({
        success: true,
        graph: {}
      });
    }

    // --------------------------------------------------------
    // GRAPH OBJECT
    // --------------------------------------------------------

    const graph = {};

    // --------------------------------------------------------
    // COMPARE EVERY MOVEMENT PAIR
    // --------------------------------------------------------

    for (
      let i = 0;
      i < movements.length;
      i++
    ) {

      const movementA =
        movements[i];

      for (
        let j = i + 1;
        j < movements.length;
        j++
      ) {

        const movementB =
          movements[j];

        // ----------------------------------------------------
        // SAME PERSON — IGNORE
        // ----------------------------------------------------

        if (
          movementA.personId ===
          movementB.personId
        ) {
          continue;
        }

        // ----------------------------------------------------
        // SAME LOCATION REQUIRED
        // ----------------------------------------------------

        if (
          movementA.locationId !==
          movementB.locationId
        ) {
          continue;
        }

        // ----------------------------------------------------
        // CALCULATE OVERLAP
        // ----------------------------------------------------

        const overlap =
          calculateOverlap(
            movementA,
            movementB
          );

        if (!overlap) {
          continue;
        }

        // ----------------------------------------------------
        // PERSON A → PERSON B
        // ----------------------------------------------------

        if (!graph[movementA.personId]) {
          graph[movementA.personId] = [];
        }

        // ----------------------------------------------------
        // PERSON B → PERSON A
        // ----------------------------------------------------

        if (!graph[movementB.personId]) {
          graph[movementB.personId] = [];
        }

        // ----------------------------------------------------
        // ADD EDGE A → B
        // ----------------------------------------------------

        graph[movementA.personId].push({
          personId:
            movementB.personId,

          personType:
            movementB.personType,

          staffRole:
            movementB.personType,

          locationId:
            movementA.locationId,

          type:
            "CONTACT",

          duration:
            overlap.duration,

          overlapStart:
            overlap.overlapStart,

          overlapEnd:
            overlap.overlapEnd
        });

        // ----------------------------------------------------
        // ADD EDGE B → A
        // ----------------------------------------------------

        graph[movementB.personId].push({
          personId:
            movementA.personId,

          personType:
            movementA.personType,

          staffRole:
            movementA.personType,

          locationId:
            movementB.locationId,

          type:
            "CONTACT",

          duration:
            overlap.duration,

          overlapStart:
            overlap.overlapStart,

          overlapEnd:
            overlap.overlapEnd
        });
      }
    }

    // --------------------------------------------------------
    // REMOVE DUPLICATE CONTACTS
    // AND COMBINE DURATION FOR SAME PERSON/LOCATION
    // --------------------------------------------------------

    Object.keys(graph).forEach(
      (id) => {

        const grouped = {};

        graph[id].forEach(
          (edge) => {

            const key =
              `${edge.personId}_${edge.locationId}`;

            if (!grouped[key]) {

              grouped[key] = {
                ...edge
              };

            } else {

              grouped[key].duration +=
                Number(
                  edge.duration || 0
                );

              if (
                edge.overlapStart <
                grouped[key].overlapStart
              ) {
                grouped[key].overlapStart =
                  edge.overlapStart;
              }

              if (
                edge.overlapEnd >
                grouped[key].overlapEnd
              ) {
                grouped[key].overlapEnd =
                  edge.overlapEnd;
              }
            }
          }
        );

        // ----------------------------------------------------
        // SORT HIGHEST EXPOSURE FIRST
        // ----------------------------------------------------

        graph[id] =
          Object.values(grouped).sort(
            (a, b) =>
              Number(b.duration || 0) -
              Number(a.duration || 0)
          );
      }
    );

    // --------------------------------------------------------
    // IF SPECIFIC PERSON REQUESTED
    // --------------------------------------------------------

    if (personId) {

      const requestedGraph = {};

      requestedGraph[personId] =
        graph[personId] || [];

      return res.json({
        success: true,
        personId,
        graph: requestedGraph
      });
    }

    // --------------------------------------------------------
    // COMPLETE GRAPH
    // --------------------------------------------------------

    res.json({
      success: true,
      count:
        Object.keys(graph).length,
      graph
    });

  } catch (error) {

    console.error(
      "Graph generation error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to generate contact graph"
    });
  }
};


module.exports = {
  getGraph
};