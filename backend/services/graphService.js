const Contact = require("../models/Contact");
const Interaction = require("../models/Interaction");


// ==========================================
// BUILD GRAPH
// ==========================================

const buildGraph = async () => {
  const contacts =
    await Contact.find();

  const interactions =
    await Interaction.find();

  const graph = {};


  // ==========================================
  // ADD NODE
  // ==========================================

  const addNode = (id) => {
    if (!id) return;

    if (!graph[id]) {
      graph[id] = [];
    }
  };


  // ==========================================
  // ADD EDGE
  // ==========================================

  const addEdge = (
    personA,
    personB,
    data
  ) => {

    if (!personA || !personB) {
      return;
    }

    addNode(personA);
    addNode(personB);


    const edgeA = {
      personId: personB,
      ...data
    };

    const edgeB = {
      personId: personA,
      ...data
    };


    // Avoid exact duplicate edge
    const existsA =
      graph[personA].some(
        (edge) =>
          edge.personId === personB &&
          edge.type === data.type &&
          edge.locationId ===
            data.locationId &&
          (
            edge.startTime ||
            edge.scannedAt
          ) ===
          (
            data.startTime ||
            data.scannedAt
          )
      );


    const existsB =
      graph[personB].some(
        (edge) =>
          edge.personId === personA &&
          edge.type === data.type &&
          edge.locationId ===
            data.locationId &&
          (
            edge.startTime ||
            edge.scannedAt
          ) ===
          (
            data.startTime ||
            data.scannedAt
          )
      );


    if (!existsA) {
      graph[personA].push(
        edgeA
      );
    }


    if (!existsB) {
      graph[personB].push(
        edgeB
      );
    }
  };


  // ==========================================
  // CONTACT EDGES
  // ==========================================

  for (
    const contact of contacts
  ) {

    addEdge(
      contact.person1Id,
      contact.person2Id,
      {
        type: "CONTACT",

        locationId:
          contact.locationId,

        duration:
          contact.duration,

        startTime:
          contact.startTime,

        endTime:
          contact.endTime
      }
    );
  }


  // ==========================================
  // INTERACTION EDGES
  // ==========================================

  for (
    const interaction
    of interactions
  ) {

    addEdge(
      interaction.patientId,
      interaction.staffId,
      {
        type: "INTERACTION",

        staffRole:
          interaction.staffRole,

        locationId:
          interaction.locationId,

        scannedAt:
          interaction.scannedAt
      }
    );
  }


  return graph;
};


// ==========================================
// BFS
// ==========================================

const bfs = (
  graph,
  startId
) => {

  if (
    !graph ||
    !graph[startId]
  ) {
    return [];
  }


  const visited =
    new Set();

  const queue =
    [startId];

  const result =
    [];


  visited.add(
    startId
  );


  while (
    queue.length > 0
  ) {

    const current =
      queue.shift();


    result.push(
      current
    );


    const edges =
      graph[current] || [];


    for (
      const edge
      of edges
    ) {

      if (
        !visited.has(
          edge.personId
        )
      ) {

        visited.add(
          edge.personId
        );

        queue.push(
          edge.personId
        );
      }
    }
  }


  return result;
};


// ==========================================
// EXPORT
// ==========================================

module.exports = {
  buildGraph,
  bfs
};