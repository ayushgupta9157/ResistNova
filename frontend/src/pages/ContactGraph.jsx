import { useMemo, useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  `http://${window.location.hostname}:5000/api`;

const GRAPH_WIDTH = 1200;
const GRAPH_HEIGHT = 680;

const CENTER_X = GRAPH_WIDTH / 2;
const CENTER_Y = GRAPH_HEIGHT / 2;

function formatDuration(minutes) {
  const value = Number(minutes || 0);

  if (value < 1) {
    return `${Math.round(value * 60)} sec`;
  }

  const hours = Math.floor(value / 60);
  const mins = Math.round(value % 60);

  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${mins}m`;
}

function formatDate(date) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getInitials(name, id) {
  const text = String(name || id || "P")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (text.length >= 2) {
    return `${text[0][0]}${text[1][0]}`.toUpperCase();
  }

  return String(name || id || "P")
    .substring(0, 2)
    .toUpperCase();
}

function getNodeColor(type, center = false) {
  if (center) return "#2563eb";
  if (type === "Staff") return "#059669";
  return "#7c3aed";
}

function getNodeLightColor(type, center = false) {
  if (center) return "#eaf1ff";
  if (type === "Staff") return "#e8f8f2";
  return "#f2eafe";
}

function Stat({ value, label }) {
  return (
    <div className="cg-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div className="cg-legend-item">
      <span
        className="cg-legend-dot"
        style={{ background: color }}
      />
      {label}
    </div>
  );
}

function DetailCard({ label, value }) {
  return (
    <div className="cg-detail-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ContactGraph() {
  const [patientId, setPatientId] = useState("");
  const [searchedPatient, setSearchedPatient] = useState(null);
  const [contacts, setContacts] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedContact, setSelectedContact] = useState(null);

  const [zoom, setZoom] = useState(1);

  // ==========================================================
  // SEARCH PATIENT
  // ==========================================================

  const searchPatient = async (event) => {
    event?.preventDefault();

    const cleanId = String(patientId || "")
      .trim()
      .toUpperCase();

    if (!cleanId) {
      setError("Please enter a Patient ID.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSelectedContact(null);

      const response = await fetch(
        `${API_URL}/contacts/patient/${encodeURIComponent(
          cleanId
        )}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load patient contacts."
        );
      }

      const contactList = Array.isArray(data.contacts)
        ? data.contacts
        : [];

      setSearchedPatient(data.patient);
      setContacts(contactList);
      setZoom(1);
    } catch (err) {
      console.error("Contact graph error:", err);

      setSearchedPatient(null);
      setContacts([]);
      setSelectedContact(null);

      setError(
        err.message ||
          "Failed to load contact graph."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // CLEAR
  // ==========================================================

  const clearGraph = () => {
    setPatientId("");
    setSearchedPatient(null);
    setContacts([]);
    setSelectedContact(null);
    setError("");
    setZoom(1);
  };

  // ==========================================================
  // SORT CONTACTS
  //
  // Stronger contacts first for visual placement.
  // ==========================================================

  const sortedContacts = useMemo(() => {
    return [...contacts].sort((a, b) => {
      const durationDifference =
        Number(b.durationMinutes || 0) -
        Number(a.durationMinutes || 0);

      if (durationDifference !== 0) {
        return durationDifference;
      }

      return (
        Number(b.overlapCount || 0) -
        Number(a.overlapCount || 0)
      );
    });
  }, [contacts]);

  // ==========================================================
  // GRAPH NODES
  //
  // Center = selected patient
  // Outer ring = contacts
  // ==========================================================

  const graphNodes = useMemo(() => {
    if (!searchedPatient) {
      return [];
    }

    const nodes = [
      {
        id: searchedPatient.patientId,
        personId: searchedPatient.patientId,
        name:
          searchedPatient.name ||
          searchedPatient.patientId,
        type: "Patient",
        center: true,
        x: CENTER_X,
        y: CENTER_Y,
        radius: 58,
      },
    ];

    const count = sortedContacts.length;

    if (count === 0) {
      return nodes;
    }

    /*
      Keep enough space between nodes.

      1-4 contacts:
        radius 230

      5-8:
        radius 260

      9+:
        radius 300
    */

    const ringRadius =
      count <= 4
        ? 235
        : count <= 8
        ? 270
        : 310;

    const startAngle = -Math.PI / 2;

    sortedContacts.forEach((contact, index) => {
      const angle =
        startAngle +
        (index / count) * Math.PI * 2;

      const x =
        CENTER_X +
        Math.cos(angle) * ringRadius;

      const y =
        CENTER_Y +
        Math.sin(angle) * ringRadius;

      nodes.push({
        id: `${contact.contactType}:${contact.contactId}`,
        personId: contact.contactId,
        name:
          contact.contactName ||
          contact.contactId,
        type:
          contact.contactType === "Staff"
            ? "Staff"
            : "Patient",
        role:
          contact.contactRole || "",
        center: false,
        x,
        y,
        radius: 44,
        contact,
      });
    });

    return nodes;
  }, [searchedPatient, sortedContacts]);

  // ==========================================================
  // EDGES
  // ==========================================================

  const graphEdges = useMemo(() => {
    if (!searchedPatient) {
      return [];
    }

    const centerNode = graphNodes.find(
      (node) => node.center
    );

    if (!centerNode) {
      return [];
    }

    return sortedContacts
      .map((contact) => {
        const target = graphNodes.find(
          (node) =>
            node.personId ===
              contact.contactId &&
            !node.center
        );

        if (!target) {
          return null;
        }

        return {
          source: centerNode,
          target,
          durationMinutes:
            Number(
              contact.durationMinutes || 0
            ),
          overlapCount:
            Number(
              contact.overlapCount || 0
            ),
        };
      })
      .filter(Boolean);
  }, [
    searchedPatient,
    graphNodes,
    sortedContacts,
  ]);

  // ==========================================================
  // STATS
  // ==========================================================

  const graphStats = useMemo(() => {
    const patients = sortedContacts.filter(
      (contact) =>
        contact.contactType !== "Staff"
    ).length;

    const staff = sortedContacts.filter(
      (contact) =>
        contact.contactType === "Staff"
    ).length;

    return {
      contacts: sortedContacts.length,
      patients,
      staff,
      connections: sortedContacts.length,
    };
  }, [sortedContacts]);

  // ==========================================================
  // ZOOM
  // ==========================================================

  const zoomIn = () => {
    setZoom((current) =>
      Math.min(
        1.35,
        Number((current + 0.1).toFixed(2))
      )
    );
  };

  const zoomOut = () => {
    setZoom((current) =>
      Math.max(
        0.75,
        Number((current - 0.1).toFixed(2))
      )
    );
  };

  const resetZoom = () => {
    setZoom(1);
    setSelectedContact(null);
  };

  // ==========================================================
  // NODE CLICK
  // ==========================================================

  const handleNodeClick = (node) => {
    if (!node.center && node.contact) {
      setSelectedContact(node.contact);
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="contact-graph-page">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="cg-page-header">
        <div>
          <div className="cg-eyebrow">
            CONTACT NETWORK
          </div>

          <h1>Contact Graph</h1>

          <p>
            Search a Patient ID to visualize
            their complete contact network.
          </p>
        </div>
      </div>

      {/* =====================================================
          SEARCH CARD
      ===================================================== */}

      <section className="cg-search-card">
        <form
          onSubmit={searchPatient}
          className="cg-search-form"
        >
          <div className="cg-search-field">
            <label htmlFor="contact-patient-id">
              Patient ID
            </label>

            <input
              id="contact-patient-id"
              value={patientId}
              onChange={(e) =>
                setPatientId(
                  e.target.value.toUpperCase()
                )
              }
              placeholder="e.g. P001"
              autoComplete="off"
            />
          </div>

          <button
            type="submit"
            className="cg-search-btn"
            disabled={loading}
          >
            {loading
              ? "Loading..."
              : "View Contact Graph"}
          </button>

          {(searchedPatient ||
            contacts.length > 0) && (
            <button
              type="button"
              className="cg-clear-btn"
              onClick={clearGraph}
            >
              Clear
            </button>
          )}
        </form>

        {error && (
          <div className="cg-error">
            {error}
          </div>
        )}
      </section>

      {/* =====================================================
          EMPTY STATE
      ===================================================== */}

      {!searchedPatient &&
        !loading && (
          <div className="cg-empty-state">
            <div className="cg-empty-icon">
              🕸️
            </div>

            <h2>
              Search a Patient to Explore
            </h2>

            <p>
              Enter a Patient ID above to see
              patients and staff who had
              overlapping movements with that
              patient.
            </p>

            <div className="cg-empty-rules">
              <div>
                <span>✓</span>
                Same location
              </div>

              <div>
                <span>✓</span>
                Overlapping time
              </div>

              <div>
                <span>✓</span>
                Patient & staff contacts
              </div>
            </div>
          </div>
        )}

      {/* =====================================================
          PATIENT SUMMARY
      ===================================================== */}

      {searchedPatient && (
        <>
          <section className="cg-patient-summary">

            <div className="cg-patient-left">

              <div className="cg-patient-avatar">
                {getInitials(
                  searchedPatient.name,
                  searchedPatient.patientId
                )}
              </div>

              <div>
                <span className="cg-focus-label">
                  SELECTED PATIENT
                </span>

                <h2>
                  {searchedPatient.name}
                </h2>

                <span className="cg-patient-id">
                  {searchedPatient.patientId}
                </span>
              </div>
            </div>

            <div className="cg-stat-group">

              <Stat
                value={graphStats.contacts}
                label="Contacts"
              />

              <Stat
                value={graphStats.patients}
                label="Patients"
              />

              <Stat
                value={graphStats.staff}
                label="Staff"
              />

              <Stat
                value={graphStats.connections}
                label="Connections"
              />

            </div>
          </section>

          {/* =================================================
              GRAPH CARD
          ================================================== */}

          <section className="cg-main-card">

            <div className="cg-toolbar">

              <div>
                <h3>
                  Contact Network
                </h3>

                <span>
                  {graphStats.connections} detected
                  connection
                  {graphStats.connections === 1
                    ? ""
                    : "s"}
                </span>
              </div>

              <div className="cg-toolbar-right">

                <div className="cg-legend">

                  <Legend
                    color="#2563eb"
                    label="Selected Patient"
                  />

                  <Legend
                    color="#7c3aed"
                    label="Patient"
                  />

                  <Legend
                    color="#059669"
                    label="Staff"
                  />

                </div>

                <button
                  type="button"
                  className="cg-fit-btn"
                  onClick={resetZoom}
                >
                  Fit Graph
                </button>

              </div>
            </div>

            {/* =================================================
                GRAPH CANVAS
            ================================================== */}

            <div className="cg-canvas">

              {sortedContacts.length === 0 ? (
                <div className="cg-no-contact">
                  <div className="cg-no-contact-icon">
                    🔍
                  </div>

                  <h3>
                    No overlapping contacts found
                  </h3>

                  <p>
                    No other patient or staff
                    movement overlaps were found
                    for this Patient ID.
                  </p>
                </div>
              ) : (
                <>

                  {/* Zoom controls */}

                  <div className="cg-zoom-controls">

                    <button
                      type="button"
                      onClick={zoomIn}
                      title="Zoom in"
                    >
                      +
                    </button>

                    <button
                      type="button"
                      onClick={zoomOut}
                      title="Zoom out"
                    >
                      −
                    </button>

                  </div>

                  <div
                    className="cg-svg-wrapper"
                    style={{
                      transform:
                        `scale(${zoom})`,
                    }}
                  >

                    <svg
                      viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`}
                      className="cg-svg"
                      preserveAspectRatio="xMidYMid meet"
                    >

                      {/* =================================================
                          SUBTLE RING
                      ================================================== */}

                      <circle
                        cx={CENTER_X}
                        cy={CENTER_Y}
                        r="235"
                        fill="none"
                        stroke="#e7edf5"
                        strokeWidth="2"
                        strokeDasharray="6 9"
                      />

                      <circle
                        cx={CENTER_X}
                        cy={CENTER_Y}
                        r="135"
                        fill="#f8fafc"
                        stroke="#eef2f7"
                        strokeWidth="1"
                      />

                      {/* =================================================
                          EDGES
                      ================================================== */}

                      {graphEdges.map(
                        (edge, index) => {

                          const x1 =
                            edge.source.x;

                          const y1 =
                            edge.source.y;

                          const x2 =
                            edge.target.x;

                          const y2 =
                            edge.target.y;

                          const dx =
                            x2 - x1;

                          const dy =
                            y2 - y1;

                          const length =
                            Math.sqrt(
                              dx * dx +
                                dy * dy
                            ) || 1;

                          const normalX =
                            -dy / length;

                          const normalY =
                            dx / length;

                          const midX =
                            (x1 + x2) / 2;

                          const midY =
                            (y1 + y2) / 2;

                          const labelX =
                            midX +
                            normalX * 18;

                          const labelY =
                            midY +
                            normalY * 18;

                          const width =
                            edge.durationMinutes >=
                            60
                              ? 5
                              : edge.durationMinutes >=
                                30
                              ? 4
                              : edge.durationMinutes >=
                                10
                              ? 3
                              : 2;

                          return (
                            <g
                              key={`edge-${index}`}
                            >

                              {/* Main connection */}

                              <line
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                stroke="#cbd5e1"
                                strokeWidth={
                                  width
                                }
                                strokeLinecap="round"
                              />

                              {/* Highlight */}

                              <line
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                stroke="#e7edf5"
                                strokeWidth="1"
                              />

                              {/* Duration label */}

                              <rect
                                x={
                                  labelX - 48
                                }
                                y={
                                  labelY - 18
                                }
                                width="96"
                                height="36"
                                rx="10"
                                fill="#ffffff"
                                stroke="#e1e7ef"
                                strokeWidth="1"
                              />

                              <text
                                x={labelX}
                                y={
                                  labelY - 2
                                }
                                textAnchor="middle"
                                fontSize="12"
                                fontWeight="800"
                                fill="#344054"
                              >
                                {formatDuration(
                                  edge.durationMinutes
                                )}
                              </text>

                              <text
                                x={labelX}
                                y={
                                  labelY + 11
                                }
                                textAnchor="middle"
                                fontSize="9"
                                fontWeight="600"
                                fill="#98a2b3"
                              >
                                {edge.overlapCount} overlap
                                {edge.overlapCount ===
                                1
                                  ? ""
                                  : "s"}
                              </text>

                            </g>
                          );
                        }
                      )}

                      {/* =================================================
                          CENTER PATIENT
                      ================================================== */}

                      {graphNodes
                        .filter(
                          (node) =>
                            node.center
                        )
                        .map((node) => {

                          const color =
                            getNodeColor(
                              node.type,
                              true
                            );

                          return (
                            <g
                              key={node.id}
                            >

                              {/* Outer glow */}

                              <circle
                                cx={node.x}
                                cy={node.y}
                                r="78"
                                fill="#eaf1ff"
                                opacity="0.7"
                              />

                              {/* Outer ring */}

                              <circle
                                cx={node.x}
                                cy={node.y}
                                r="68"
                                fill="#ffffff"
                                stroke="#d8e5ff"
                                strokeWidth="2"
                              />

                              {/* Main circle */}

                              <circle
                                cx={node.x}
                                cy={node.y}
                                r="58"
                                fill={color}
                              />

                              {/* Initial */}

                              <text
                                x={node.x}
                                y={node.y + 9}
                                textAnchor="middle"
                                fontSize="28"
                                fontWeight="800"
                                fill="#ffffff"
                              >
                                {getInitials(
                                  node.name,
                                  node.personId
                                )}
                              </text>

                              {/* Name */}

                              <text
                                x={node.x}
                                y={
                                  node.y +
                                  91
                                }
                                textAnchor="middle"
                                fontSize="17"
                                fontWeight="800"
                                fill="#101828"
                              >
                                {node.name}
                              </text>

                              {/* ID */}

                              <text
                                x={node.x}
                                y={
                                  node.y +
                                  111
                                }
                                textAnchor="middle"
                                fontSize="13"
                                fontWeight="600"
                                fill="#667085"
                              >
                                {node.personId}
                              </text>

                              {/* Selected badge */}

                              <rect
                                x={
                                  node.x -
                                  61
                                }
                                y={
                                  node.y -
                                  105
                                }
                                width="122"
                                height="27"
                                rx="13.5"
                                fill="#2563eb"
                              />

                              <text
                                x={node.x}
                                y={
                                  node.y -
                                  87
                                }
                                textAnchor="middle"
                                fontSize="10"
                                fontWeight="800"
                                fill="#ffffff"
                              >
                                SELECTED PATIENT
                              </text>

                            </g>
                          );
                        })}

                      {/* =================================================
                          CONTACT NODES
                      ================================================== */}

                      {graphNodes
                        .filter(
                          (node) =>
                            !node.center
                        )
                        .map((node) => {

                          const color =
                            getNodeColor(
                              node.type
                            );

                          const light =
                            getNodeLightColor(
                              node.type
                            );

                          return (
                            <g
                              key={node.id}
                              onClick={() =>
                                handleNodeClick(
                                  node
                                )
                              }
                              style={{
                                cursor:
                                  "pointer",
                              }}
                            >

                              {/* Glow */}

                              <circle
                                cx={node.x}
                                cy={node.y}
                                r="59"
                                fill={
                                  light
                                }
                                opacity="0.75"
                              />

                              {/* White border */}

                              <circle
                                cx={node.x}
                                cy={node.y}
                                r="50"
                                fill="#ffffff"
                                stroke="#ffffff"
                                strokeWidth="4"
                              />

                              {/* Main node */}

                              <circle
                                cx={node.x}
                                cy={node.y}
                                r="44"
                                fill={color}
                              />

                              {/* Initials */}

                              <text
                                x={node.x}
                                y={
                                  node.y +
                                  7
                                }
                                textAnchor="middle"
                                fontSize="19"
                                fontWeight="800"
                                fill="#ffffff"
                              >
                                {getInitials(
                                  node.name,
                                  node.personId
                                )}
                              </text>

                              {/* Name background */}

                              <rect
                                x={
                                  node.x -
                                  82
                                }
                                y={
                                  node.y +
                                  59
                                }
                                width="164"
                                height="27"
                                rx="8"
                                fill="#ffffff"
                                stroke="#e4e7ec"
                              />

                              <text
                                x={node.x}
                                y={
                                  node.y +
                                  77
                                }
                                textAnchor="middle"
                                fontSize="12"
                                fontWeight="800"
                                fill="#101828"
                              >
                                {String(
                                  node.name
                                ).length > 22
                                  ? `${String(
                                      node.name
                                    ).substring(
                                      0,
                                      20
                                    )}…`
                                  : node.name}
                              </text>

                              {/* ID */}

                              <text
                                x={node.x}
                                y={
                                  node.y +
                                  103
                                }
                                textAnchor="middle"
                                fontSize="11"
                                fontWeight="700"
                                fill="#667085"
                              >
                                {node.personId}
                              </text>

                              {/* Role */}

                              {node.role && (
                                <text
                                  x={node.x}
                                  y={
                                    node.y +
                                    120
                                  }
                                  textAnchor="middle"
                                  fontSize="10"
                                  fontWeight="600"
                                  fill="#98a2b3"
                                >
                                  {node.role}
                                </text>
                              )}

                            </g>
                          );
                        })}

                    </svg>
                  </div>

                  {/* Graph helper */}

                  <div className="cg-graph-help">
                    <span>
                      Dragging is not required
                    </span>

                    <span>
                      Click a node for details
                    </span>

                    <span>
                      Use + / − to zoom
                    </span>
                  </div>

                </>
              )}

            </div>

            {/* =================================================
                GRAPH FOOTER
            ================================================== */}

            <div className="cg-footer">
              <span>
                <b>Connection:</b> same location +
                overlapping movement time
              </span>

              <span>
                <b>Node:</b> tracked patient or staff
              </span>
            </div>

          </section>

          {/* =================================================
              CONTACT DETAILS
          ================================================== */}

          {selectedContact && (
            <section className="cg-details-card">

              <div className="cg-details-header">

                <div>
                  <span className="cg-focus-label">
                    CONTACT DETAILS
                  </span>

                  <h3>
                    {selectedContact.contactName}
                  </h3>

                  <p>
                    {selectedContact.contactId}
                    {" · "}
                    {selectedContact.contactType}

                    {selectedContact.contactRole
                      ? ` · ${selectedContact.contactRole}`
                      : ""}
                  </p>
                </div>

                <button
                  type="button"
                  className="cg-close-btn"
                  onClick={() =>
                    setSelectedContact(null)
                  }
                >
                  ×
                </button>

              </div>

              <div className="cg-details-grid">

                <DetailCard
                  label="Total Contact"
                  value={formatDuration(
                    selectedContact.durationMinutes
                  )}
                />

                <DetailCard
                  label="Overlap Events"
                  value={
                    selectedContact.overlapCount ||
                    0
                  }
                />

                <DetailCard
                  label="Locations"
                  value={
                    selectedContact.locations
                      ?.length || 1
                  }
                />

                <DetailCard
                  label="Last Contact"
                  value={formatDate(
                    selectedContact.lastContactTime
                  )}
                />

                {typeof selectedContact.mlScore ===
                  "number" && (
                  <DetailCard
                    label="ML Review Score"
                    value={`${selectedContact.mlScore}%`}
                  />
                )}

              </div>

              {/* Shared locations */}

              {selectedContact.locations?.length >
                0 && (
                <div className="cg-locations">

                  <div className="cg-location-title">
                    Shared Locations
                  </div>

                  <div className="cg-location-list">

                    {selectedContact.locations.map(
                      (location, index) => (
                        <div
                          className="cg-location-tag"
                          key={
                            `${
                              location.locationId ||
                              location.locationName
                            }-${index}`
                          }
                        >
                          <strong>
                            {location.locationName ||
                              location.locationId ||
                              "Hospital"}
                          </strong>

                          <span>
                            {formatDuration(
                              location.durationMinutes
                            )}
                          </span>
                        </div>
                      )
                    )}

                  </div>
                </div>
              )}

            </section>
          )}

          {/* =================================================
              PRIVACY NOTE
          ================================================== */}

          <div className="cg-privacy-note">
            <strong>Note:</strong>{" "}
            The graph represents detected movement
            overlaps only. It does not indicate
            MDRO positive/negative status, diagnosis,
            or infection confirmation.
          </div>

        </>
      )}

      {/* =====================================================
          PAGE STYLES
      ===================================================== */}

      <style>{`
        .contact-graph-page {
          width: 100%;
          max-width: 1500px;
          margin: 0 auto;
          padding-bottom: 40px;
        }

        .cg-page-header {
          margin-bottom: 22px;
        }

        .cg-eyebrow {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #667085;
          margin-bottom: 6px;
        }

        .cg-page-header h1 {
          margin: 0;
          font-size: 31px;
          line-height: 1.2;
          color: #101828;
          font-weight: 800;
        }

        .cg-page-header p {
          margin: 7px 0 0;
          color: #667085;
          font-size: 15px;
        }

        .cg-search-card {
          background: #ffffff;
          border: 1px solid #e4e7ec;
          border-radius: 18px;
          padding: 22px;
          margin-bottom: 24px;
          box-shadow:
            0 4px 18px rgba(16, 24, 40, 0.04);
        }

        .cg-search-form {
          display: flex;
          align-items: flex-end;
          gap: 14px;
          flex-wrap: wrap;
        }

        .cg-search-field {
          flex: 1 1 450px;
        }

        .cg-search-field label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 700;
          color: #344054;
        }

        .cg-search-field input {
          width: 100%;
          height: 54px;
          box-sizing: border-box;
          border: 1px solid #cfd8e3;
          border-radius: 12px;
          padding: 0 16px;
          font-size: 16px;
          font-weight: 600;
          color: #101828;
          background: #ffffff;
          outline: none;
          transition: 0.2s ease;
        }

        .cg-search-field input:focus {
          border-color: #2864e8;
          box-shadow:
            0 0 0 4px rgba(40, 100, 232, 0.10);
        }

        .cg-search-btn,
        .cg-clear-btn,
        .cg-fit-btn {
          height: 54px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .cg-search-btn {
          padding: 0 26px;
          border: none;
          background: #2864e8;
          color: #ffffff;
          box-shadow:
            0 6px 16px rgba(40, 100, 232, 0.18);
        }

        .cg-search-btn:hover {
          transform: translateY(-1px);
          background: #1f56d0;
        }

        .cg-search-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          transform: none;
        }

        .cg-clear-btn {
          padding: 0 24px;
          border: 1px solid #d0d5dd;
          background: #ffffff;
          color: #344054;
        }

        .cg-clear-btn:hover,
        .cg-fit-btn:hover {
          background: #f8fafc;
        }

        .cg-error {
          margin-top: 14px;
          padding: 12px 14px;
          border-radius: 10px;
          background: #fff1f2;
          color: #be123c;
          font-size: 14px;
          font-weight: 600;
        }

        .cg-empty-state {
          min-height: 440px;
          border:
            1px solid #e4e7ec;
          border-radius: 18px;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 30px;
          box-sizing: border-box;
        }

        .cg-empty-icon {
          width: 76px;
          height: 76px;
          border-radius: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f2f5fa;
          font-size: 36px;
          margin-bottom: 17px;
        }

        .cg-empty-state h2 {
          margin: 0;
          color: #101828;
          font-size: 21px;
        }

        .cg-empty-state p {
          max-width: 570px;
          margin: 9px 0 18px;
          color: #667085;
          line-height: 1.6;
          font-size: 14px;
        }

        .cg-empty-rules {
          display: flex;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .cg-empty-rules div {
          padding: 9px 13px;
          border-radius: 9px;
          background: #f8fafc;
          color: #475467;
          font-size: 12px;
          font-weight: 700;
        }

        .cg-empty-rules span {
          color: #16a34a;
          margin-right: 5px;
        }

        .cg-patient-summary {
          background: #ffffff;
          border: 1px solid #e4e7ec;
          border-radius: 18px;
          padding: 20px 28px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
          box-shadow:
            0 4px 18px rgba(16, 24, 40, 0.04);
        }

        .cg-patient-left {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1 1 300px;
        }

        .cg-patient-avatar {
          width: 62px;
          height: 62px;
          border-radius: 16px;
          background: #2864e8;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 800;
          flex-shrink: 0;
        }

        .cg-focus-label {
          display: block;
          color: #667085;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
        }

        .cg-patient-left h2 {
          margin: 4px 0 2px;
          font-size: 22px;
          color: #101828;
        }

        .cg-patient-id {
          color: #667085;
          font-size: 14px;
          font-weight: 600;
        }

        .cg-stat-group {
          display: flex;
          align-items: stretch;
          flex-wrap: wrap;
        }

        .cg-stat {
          min-width: 105px;
          padding: 0 20px;
          border-left: 1px solid #eaecf0;
          text-align: center;
        }

        .cg-stat strong {
          display: block;
          color: #101828;
          font-size: 25px;
          line-height: 1.1;
        }

        .cg-stat span {
          display: block;
          margin-top: 5px;
          color: #667085;
          font-size: 12px;
          font-weight: 700;
        }

        .cg-main-card {
          background: #ffffff;
          border: 1px solid #e4e7ec;
          border-radius: 18px;
          overflow: hidden;
          box-shadow:
            0 4px 18px rgba(16, 24, 40, 0.04);
        }

        .cg-toolbar {
          min-height: 78px;
          padding: 18px 25px;
          box-sizing: border-box;
          border-bottom: 1px solid #eaecf0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }

        .cg-toolbar h3 {
          margin: 0;
          font-size: 20px;
          color: #101828;
        }

        .cg-toolbar span {
          display: block;
          margin-top: 4px;
          color: #667085;
          font-size: 13px;
        }

        .cg-toolbar-right {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .cg-legend {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .cg-legend-item {
          display: flex !important;
          align-items: center;
          gap: 6px;
          margin: 0 !important;
          color: #475467 !important;
          font-size: 12px !important;
          font-weight: 700;
        }

        .cg-legend-dot {
          width: 11px;
          height: 11px;
          border-radius: 50%;
          display: inline-block;
        }

        .cg-fit-btn {
          height: 40px;
          padding: 0 17px;
          border: 1px solid #d0d5dd;
          background: #ffffff;
          color: #344054;
        }

        .cg-canvas {
          position: relative;
          height: 680px;
          overflow: hidden;
          background:
            radial-gradient(
              circle at center,
              #ffffff 0%,
              #f8fafc 66%,
              #f3f6fa 100%
            );
        }

        .cg-svg-wrapper {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          transform-origin: center center;
          transition: transform 0.25s ease;
        }

        .cg-svg {
          width: 100%;
          height: 100%;
          display: block;
        }

        .cg-zoom-controls {
          position: absolute;
          top: 18px;
          right: 18px;
          z-index: 5;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid #d0d5dd;
          border-radius: 10px;
          background: #ffffff;
          box-shadow:
            0 5px 15px rgba(16, 24, 40, 0.08);
        }

        .cg-zoom-controls button {
          width: 42px;
          height: 40px;
          border: none;
          background: #ffffff;
          color: #344054;
          font-size: 21px;
          cursor: pointer;
        }

        .cg-zoom-controls button:first-child {
          border-bottom: 1px solid #eaecf0;
        }

        .cg-zoom-controls button:hover {
          background: #f8fafc;
        }

        .cg-graph-help {
          position: absolute;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: center;
          max-width: calc(100% - 30px);
        }

        .cg-graph-help span {
          padding: 7px 11px;
          border-radius: 8px;
          background: rgba(255,255,255,0.92);
          border: 1px solid #e4e7ec;
          color: #667085;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
        }

        .cg-no-contact {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #667085;
        }

        .cg-no-contact-icon {
          font-size: 42px;
          margin-bottom: 12px;
        }

        .cg-no-contact h3 {
          margin: 0;
          color: #344054;
          font-size: 18px;
        }

        .cg-no-contact p {
          margin: 7px 0 0;
          font-size: 14px;
        }

        .cg-footer {
          padding: 13px 20px;
          border-top: 1px solid #eaecf0;
          background: #fafbfc;
          display: flex;
          justify-content: space-between;
          gap: 15px;
          flex-wrap: wrap;
          color: #667085;
          font-size: 12px;
        }

        .cg-footer b {
          color: #475467;
        }

        .cg-details-card {
          margin-top: 20px;
          background: #ffffff;
          border: 1px solid #e4e7ec;
          border-radius: 18px;
          padding: 22px;
          box-shadow:
            0 4px 18px rgba(16, 24, 40, 0.04);
        }

        .cg-details-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 15px;
        }

        .cg-details-header h3 {
          margin: 5px 0 3px;
          color: #101828;
          font-size: 21px;
        }

        .cg-details-header p {
          margin: 0;
          color: #667085;
          font-size: 13px;
        }

        .cg-close-btn {
          width: 34px;
          height: 34px;
          border: none;
          border-radius: 8px;
          background: #f2f4f7;
          color: #667085;
          font-size: 22px;
          cursor: pointer;
        }

        .cg-details-grid {
          margin-top: 18px;
          display: grid;
          grid-template-columns:
            repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
        }

        .cg-detail-card {
          padding: 13px;
          border: 1px solid #e4e7ec;
          border-radius: 10px;
          background: #fafbfc;
        }

        .cg-detail-card span {
          display: block;
          color: #98a2b3;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .cg-detail-card strong {
          display: block;
          margin-top: 6px;
          color: #101828;
          font-size: 15px;
        }

        .cg-locations {
          margin-top: 20px;
        }

        .cg-location-title {
          margin-bottom: 9px;
          color: #344054;
          font-size: 13px;
          font-weight: 800;
        }

        .cg-location-list {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .cg-location-tag {
          padding: 9px 12px;
          border: 1px solid #e4e7ec;
          border-radius: 9px;
          background: #ffffff;
          color: #475467;
          font-size: 12px;
        }

        .cg-location-tag strong {
          color: #344054;
        }

        .cg-location-tag span {
          margin-left: 6px;
          color: #667085;
        }

        .cg-privacy-note {
          margin-top: 15px;
          padding: 13px 16px;
          border-radius: 10px;
          background: #f8fafc;
          color: #667085;
          font-size: 12px;
          line-height: 1.6;
        }

        .cg-privacy-note strong {
          color: #344054;
        }

        @media (max-width: 900px) {
          .cg-canvas {
            height: 560px;
          }

          .cg-stat {
            min-width: 90px;
            padding: 10px 13px;
          }

          .cg-toolbar-right {
            width: 100%;
            justify-content: space-between;
          }
        }

        @media (max-width: 600px) {
          .cg-page-header h1 {
            font-size: 26px;
          }

          .cg-search-btn,
          .cg-clear-btn {
            width: 100%;
          }

          .cg-canvas {
            height: 500px;
          }

          .cg-toolbar {
            align-items: flex-start;
          }

          .cg-toolbar-right {
            align-items: flex-start;
            flex-direction: column;
          }

          .cg-stat-group {
            width: 100%;
          }

          .cg-stat {
            flex: 1;
            min-width: 70px;
          }

          .cg-footer {
            flex-direction: column;
          }

          .cg-graph-help {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

export default ContactGraph;