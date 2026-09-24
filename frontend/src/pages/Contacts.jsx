import { useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  `http://${window.location.hostname}:5000/api`;

// ============================================================
// Helpers
// ============================================================

function formatDuration(minutes) {
  const totalSeconds = Math.round(
    Number(minutes || 0) * 60
  );

  const hours = Math.floor(
    totalSeconds / 3600
  );

  const mins = Math.floor(
    (totalSeconds % 3600) / 60
  );

  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }

  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }

  return `${secs}s`;
}

function formatDate(date) {
  if (!date) {
    return "—";
  }

  const parsedDate = new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return "—";
  }

  return parsedDate.toLocaleString(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
}

// ============================================================
// Main Component
// ============================================================

function Contacts() {
  const [patientId, setPatientId] =
    useState("");

  const [result, setResult] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  // ==========================================================
  // Search Contacts
  // ==========================================================

  const searchContacts = async (event) => {
    event.preventDefault();

    const id = patientId
      .trim()
      .toUpperCase();

    if (!id) {
      setError(
        "Please enter a Patient ID."
      );

      setResult(null);

      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response =
        await fetch(
          `${API_URL}/contacts/patient/${encodeURIComponent(
            id
          )}`
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to calculate contacts."
        );
      }

      setResult(data);
    } catch (err) {
      console.error(
        "Contacts search error:",
        err
      );

      setError(
        err.message ||
          "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // Clear
  // ==========================================================

  const clearSearch = () => {
    setPatientId("");
    setResult(null);
    setError("");
  };

  // ==========================================================
  // SORT CONTACTS BY ML SCORE
  // Highest percentage first
  // ==========================================================

  const sortedContacts =
    result?.contacts
      ? [...result.contacts].sort(
          (a, b) => {
            const scoreA =
              Number(a.mlScore);

            const scoreB =
              Number(b.mlScore);

            return (
              (Number.isFinite(
                scoreB
              )
                ? scoreB
                : 0) -
              (Number.isFinite(
                scoreA
              )
                ? scoreA
                : 0)
            );
          }
        )
      : [];

  // ==========================================================
  // Render
  // ==========================================================

  return (
    <div
      style={{
        minHeight: "100%",
        padding: "32px",
        background:
          "linear-gradient(135deg, #f8fafc 0%, #eef4ff 100%)",
        boxSizing: "border-box",
      }}
    >
      {/* ====================================================
          HEADER
      ===================================================== */}

      <div
        style={{
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background:
                "linear-gradient(135deg, #2563eb, #4f46e5)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "23px",
              boxShadow:
                "0 8px 20px rgba(37,99,235,0.20)",
              flexShrink: 0,
            }}
          >
            🔗
          </div>

          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "28px",
                fontWeight: 800,
                color: "#0f172a",
              }}
            >
              Contact Detection
            </h1>

            <p
              style={{
                margin:
                  "5px 0 0",
                color: "#64748b",
                fontSize: "14px",
              }}
            >
              Search a patient to view
              overlapping patient and
              staff contacts.
            </p>
          </div>
        </div>
      </div>

      {/* ====================================================
          SEARCH CARD
      ===================================================== */}

      <div
        style={{
          background: "#ffffff",
          borderRadius: "18px",
          padding: "22px",
          border:
            "1px solid #e2e8f0",
          boxShadow:
            "0 8px 30px rgba(15,23,42,0.06)",
          marginBottom: "22px",
        }}
      >
        <form
          onSubmit={
            searchContacts
          }
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "flex-end",
            flexWrap: "wrap",
          }}
        >
          {/* Patient ID */}

          <div
            style={{
              flex:
                "1 1 320px",
            }}
          >
            <label
              htmlFor="patient-id"
              style={{
                display: "block",
                marginBottom:
                  "8px",
                fontSize: "13px",
                fontWeight: 700,
                color: "#334155",
              }}
            >
              Patient ID
            </label>

            <input
              id="patient-id"
              type="text"
              value={patientId}
              onChange={(event) =>
                setPatientId(
                  event.target.value.toUpperCase()
                )
              }
              placeholder="Enter Patient ID e.g. P001"
              autoComplete="off"
              style={{
                width: "100%",
                height: "46px",
                boxSizing:
                  "border-box",
                padding:
                  "0 14px",
                border:
                  "1px solid #cbd5e1",
                borderRadius:
                  "10px",
                outline: "none",
                fontSize:
                  "14px",
                fontWeight:
                  600,
                color:
                  "#0f172a",
                background:
                  "#f8fafc",
              }}
            />
          </div>

          {/* Search */}

          <button
            type="submit"
            disabled={loading}
            style={{
              height: "46px",
              padding:
                "0 24px",
              border: "none",
              borderRadius:
                "10px",
              background:
                loading
                  ? "#94a3b8"
                  : "#2563eb",
              color:
                "#ffffff",
              fontWeight:
                700,
              fontSize:
                "14px",
              cursor:
                loading
                  ? "not-allowed"
                  : "pointer",
              boxShadow:
                loading
                  ? "none"
                  : "0 5px 14px rgba(37,99,235,0.18)",
            }}
          >
            {loading
              ? "Calculating..."
              : "Search Contacts"}
          </button>

          {/* Clear */}

          {(result || error) && (
            <button
              type="button"
              onClick={
                clearSearch
              }
              style={{
                height: "46px",
                padding:
                  "0 20px",
                border:
                  "1px solid #cbd5e1",
                borderRadius:
                  "10px",
                background:
                  "#ffffff",
                color:
                  "#475569",
                fontWeight:
                  600,
                fontSize:
                  "14px",
                cursor:
                  "pointer",
              }}
            >
              Clear
            </button>
          )}
        </form>

        {/* Error */}

        {error && (
          <div
            style={{
              marginTop: "14px",
              padding:
                "12px 14px",
              borderRadius:
                "10px",
              background:
                "#fef2f2",
              border:
                "1px solid #fecaca",
              color:
                "#b91c1c",
              fontSize:
                "14px",
              fontWeight:
                600,
            }}
          >
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* ====================================================
          RESULTS
      ===================================================== */}

      {result && (
        <>
          {/* ==================================================
              SUMMARY CARDS
          =================================================== */}

          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(190px, 1fr))",
              gap: "14px",
              marginBottom:
                "20px",
            }}
          >
            <SummaryCard
              title="Patient"
              value={
                result.patient
                  ?.patientId ||
                "—"
              }
              subtitle={
                result.patient
                  ?.name ||
                "Patient"
              }
            />

            <SummaryCard
              title="Total Contacts"
              value={
                result.contactCount ??
                result.contacts
                  ?.length ??
                0
              }
              subtitle="Detected overlapping persons"
            />

            <SummaryCard
              title="Total Contact Time"
              value={formatDuration(
                result.totalContactMinutes ||
                  0
              )}
              subtitle="Combined overlap duration"
            />
          </div>

          {/* ==================================================
              CONTACT TABLE
          =================================================== */}

          <div
            style={{
              background:
                "#ffffff",
              borderRadius:
                "18px",
              border:
                "1px solid #e2e8f0",
              boxShadow:
                "0 8px 30px rgba(15,23,42,0.06)",
              overflow:
                "hidden",
            }}
          >
            {/* Table Header */}

            <div
              style={{
                padding:
                  "20px 22px",
                borderBottom:
                  "1px solid #e2e8f0",
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                gap: "12px",
                flexWrap:
                  "wrap",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize:
                      "18px",
                    fontWeight:
                      800,
                    color:
                      "#0f172a",
                  }}
                >
                  Contact Results
                </h2>

                <p
                  style={{
                    margin:
                      "4px 0 0",
                    color:
                      "#64748b",
                    fontSize:
                      "13px",
                  }}
                >
                  Contacts are shown
                  with the highest ML
                  percentage first.
                </p>
              </div>

              {sortedContacts.length >
                0 && (
                <div
                  style={{
                    padding:
                      "7px 12px",
                    borderRadius:
                      "999px",
                    background:
                      "#eff6ff",
                    color:
                      "#1d4ed8",
                    fontSize:
                      "12px",
                    fontWeight:
                      700,
                  }}
                >
                  {
                    sortedContacts.length
                  }{" "}
                  contacts
                </div>
              )}
            </div>

            {/* =================================================
                CONTACTS
            ================================================== */}

            {sortedContacts.length >
            0 ? (
              <div
                style={{
                  overflowX:
                    "auto",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    minWidth:
                      "850px",
                    borderCollapse:
                      "collapse",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background:
                          "#f8fafc",
                      }}
                    >
                      <Th>
                        Contact
                      </Th>

                      <Th>
                        Type
                      </Th>

                      <Th>
                        Location
                      </Th>

                      <Th>
                        Duration
                      </Th>

                      <Th>
                        Overlap Events
                      </Th>

                      <Th>
                        ML Prediction
                      </Th>

                      <Th>
                        Last Contact
                      </Th>
                    </tr>
                  </thead>

                  <tbody>
                    {sortedContacts.map(
                      (
                        contact,
                        index
                      ) => (
                        <tr
                          key={`${contact.contactId}-${index}`}
                          style={{
                            borderTop:
                              "1px solid #e2e8f0",
                            background:
                              "#ffffff",
                          }}
                        >
                          {/* Contact */}

                          <Td>
                            <div
                              style={{
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                gap: "9px",
                              }}
                            >
                              <div
                                style={{
                                  width:
                                    "38px",
                                  height:
                                    "38px",
                                  borderRadius:
                                    "10px",
                                  background:
                                    contact.contactType ===
                                    "Staff"
                                      ? "#ecfdf5"
                                      : "#eff6ff",
                                  display:
                                    "flex",
                                  alignItems:
                                    "center",
                                  justifyContent:
                                    "center",
                                  flexShrink:
                                    0,
                                }}
                              >
                                {contact.contactType ===
                                "Staff"
                                  ? "👨‍⚕️"
                                  : "🧑"}
                              </div>

                              <div>
                                <div
                                  style={{
                                    fontWeight:
                                      800,
                                    color:
                                      "#0f172a",
                                    fontSize:
                                      "13px",
                                  }}
                                >
                                  {
                                    contact.contactId
                                  }
                                </div>

                                <div
                                  style={{
                                    fontSize:
                                      "12px",
                                    color:
                                      "#64748b",
                                    marginTop:
                                      "3px",
                                  }}
                                >
                                  {
                                    contact.contactName ||
                                    "—"
                                  }
                                </div>
                              </div>
                            </div>
                          </Td>

                          {/* Type */}

                          <Td>
                            <TypeBadge
                              type={
                                contact.contactType
                              }
                            />
                          </Td>

                          {/* Location */}

                          <Td>
                            <div
                              style={{
                                fontWeight:
                                  700,
                                color:
                                  "#334155",
                              }}
                            >
                              {
                                contact.locationName ||
                                "—"
                              }
                            </div>

                            <div
                              style={{
                                marginTop:
                                  "3px",
                                fontSize:
                                  "11px",
                                color:
                                  "#94a3b8",
                              }}
                            >
                              {
                                contact.locationId ||
                                "—"
                              }
                            </div>
                          </Td>

                          {/* Duration */}

                          <Td>
                            <span
                              style={{
                                display:
                                  "inline-block",
                                padding:
                                  "6px 10px",
                                borderRadius:
                                  "8px",
                                background:
                                  "#f1f5f9",
                                color:
                                  "#334155",
                                fontWeight:
                                  800,
                                fontSize:
                                  "13px",
                              }}
                            >
                              {formatDuration(
                                contact.durationMinutes ||
                                  0
                              )}
                            </span>
                          </Td>

                          {/* Overlap Events */}

                          <Td>
                            <span
                              style={{
                                color:
                                  "#475569",
                                fontWeight:
                                  700,
                              }}
                            >
                              {
                                contact.overlapCount ??
                                0
                              }
                            </span>
                          </Td>

                          {/* ML */}

                          <Td>
                            <MLBadge
                              score={
                                contact.mlScore
                              }
                            />
                          </Td>

                          {/* Last Contact */}

                          <Td>
                            <span
                              style={{
                                fontSize:
                                  "12px",
                                color:
                                  "#64748b",
                                whiteSpace:
                                  "nowrap",
                              }}
                            >
                              {formatDate(
                                contact.lastContactTime
                              )}
                            </span>
                          </Td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              /* =================================================
                 NO CONTACTS
              ================================================== */

              <div
                style={{
                  padding:
                    "55px 20px",
                  textAlign:
                    "center",
                }}
              >
                <div
                  style={{
                    fontSize:
                      "42px",
                    marginBottom:
                      "10px",
                  }}
                >
                  🔍
                </div>

                <h3
                  style={{
                    margin:
                      "0 0 6px",
                    color:
                      "#0f172a",
                    fontSize:
                      "18px",
                  }}
                >
                  No overlapping contacts
                  found
                </h3>

                <p
                  style={{
                    margin: 0,
                    color:
                      "#64748b",
                    fontSize:
                      "14px",
                  }}
                >
                  No patient or staff
                  movement overlap was
                  detected for this patient.
                </p>
              </div>
            )}
          </div>

          {/* ==================================================
              INFORMATION NOTE
          =================================================== */}

          <div
            style={{
              marginTop:
                "16px",
              padding:
                "14px 16px",
              borderRadius:
                "12px",
              background:
                "#f8fafc",
              border:
                "1px solid #e2e8f0",
              color:
                "#64748b",
              fontSize:
                "12px",
              lineHeight:
                1.6,
            }}
          >
            <strong
              style={{
                color:
                  "#475569",
              }}
            >
              Contact calculation:
            </strong>{" "}
            Contacts are identified from
            overlapping movement times in
            the same location. The ML
            percentage represents
            infection-control review
            priority only. It does not
            indicate MDRO positive/negative
            status and does not provide a
            diagnosis.
          </div>
        </>
      )}

      {/* ====================================================
          INITIAL STATE
      ===================================================== */}

      {!result &&
        !error &&
        !loading && (
          <div
            style={{
              background:
                "#ffffff",
              borderRadius:
                "18px",
              padding:
                "55px 25px",
              textAlign:
                "center",
              border:
                "1px solid #e2e8f0",
              boxShadow:
                "0 8px 30px rgba(15,23,42,0.04)",
            }}
          >
            <div
              style={{
                fontSize:
                  "45px",
                marginBottom:
                  "12px",
              }}
            >
              🔗
            </div>

            <h3
              style={{
                margin:
                  "0 0 7px",
                color:
                  "#0f172a",
                fontSize:
                  "18px",
              }}
            >
              Search a Patient
            </h3>

            <p
              style={{
                margin: 0,
                color:
                  "#64748b",
                fontSize:
                  "14px",
              }}
            >
              Enter a Patient ID above
              to see everyone who
              overlapped with that patient.
            </p>
          </div>
        )}
    </div>
  );
}

// ============================================================
// Summary Card
// ============================================================

function SummaryCard({
  title,
  value,
  subtitle,
}) {
  return (
    <div
      style={{
        background:
          "#ffffff",
        borderRadius:
          "16px",
        padding:
          "18px",
        border:
          "1px solid #e2e8f0",
        boxShadow:
          "0 5px 20px rgba(15,23,42,0.04)",
      }}
    >
      <div
        style={{
          fontSize:
            "12px",
          color:
            "#64748b",
          fontWeight:
            700,
          textTransform:
            "uppercase",
          letterSpacing:
            "0.04em",
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop:
            "7px",
          fontSize:
            "24px",
          fontWeight:
            850,
          color:
            "#0f172a",
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop:
            "3px",
          fontSize:
            "12px",
          color:
            "#94a3b8",
        }}
      >
        {subtitle}
      </div>
    </div>
  );
}

// ============================================================
// Table Header
// ============================================================

function Th({ children }) {
  return (
    <th
      style={{
        padding:
          "13px 14px",
        textAlign:
          "left",
        fontSize:
          "11px",
        color:
          "#64748b",
        textTransform:
          "uppercase",
        letterSpacing:
          "0.04em",
        whiteSpace:
          "nowrap",
        fontWeight:
          800,
      }}
    >
      {children}
    </th>
  );
}

// ============================================================
// Table Cell
// ============================================================

function Td({ children }) {
  return (
    <td
      style={{
        padding:
          "15px 14px",
        verticalAlign:
          "middle",
      }}
    >
      {children}
    </td>
  );
}

// ============================================================
// Type Badge
// ============================================================

function TypeBadge({ type }) {
  const isStaff =
    type === "Staff";

  return (
    <span
      style={{
        display:
          "inline-block",
        padding:
          "5px 9px",
        borderRadius:
          "999px",
        background:
          isStaff
            ? "#ecfdf5"
            : "#eff6ff",
        color:
          isStaff
            ? "#047857"
            : "#1d4ed8",
        fontSize:
          "11px",
        fontWeight:
          800,
      }}
    >
      {type || "Unknown"}
    </span>
  );
}

// ============================================================
// ML Badge
// ONLY PERCENTAGE
// ============================================================

function MLBadge({ score }) {
  const numericScore =
    Number(score);

  return (
    <span
      style={{
        display:
          "inline-block",
        minWidth:
          "64px",
        textAlign:
          "center",
        padding:
          "7px 10px",
        borderRadius:
          "9px",
        background:
          "#eff6ff",
        color:
          "#1d4ed8",
        border:
          "1px solid #dbeafe",
        fontSize:
          "13px",
        fontWeight:
          800,
        whiteSpace:
          "nowrap",
      }}
    >
      {Number.isFinite(
        numericScore
      )
        ? `${numericScore}%`
        : "—"}
    </span>
  );
}

export default Contacts;