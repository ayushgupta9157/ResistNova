import React, { useEffect, useMemo, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  `http://${window.location.hostname}:5000/api`;

const PUBLIC_APP_URL =
  import.meta.env.VITE_PUBLIC_APP_URL ||
  `${window.location.protocol}//${window.location.hostname}:5173`;

function LocationQR() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const [copiedId, setCopiedId] = useState("");
  const [copiedLocationId, setCopiedLocationId] = useState("");

  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE}/locations`);

      if (!response.ok) {
        throw new Error(
          `Server returned ${response.status} while loading rooms`
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to load locations");
      }

      setLocations(data.locations || data.data || []);
    } catch (err) {
      console.error("Location fetch error:", err);

      setError(
        err.message ||
          "Unable to connect to ResistNova backend. Make sure backend is running on port 5000."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const getRoomScanUrl = (location) => {
    return `${PUBLIC_APP_URL}/room-scan/${encodeURIComponent(
      location.qrToken
    )}`;
  };

  const roomTypes = useMemo(() => {
    const types = locations
      .map((location) => location.type)
      .filter(Boolean);

    return ["ALL", ...new Set(types)];
  }, [locations]);

  const filteredLocations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return locations.filter((location) => {
      const name = String(location.name || "").toLowerCase();
      const id = String(location.locationId || "").toLowerCase();
      const type = String(location.type || "").toLowerCase();

      const matchesSearch =
        !query ||
        name.includes(query) ||
        id.includes(query) ||
        type.includes(query);

      const isActive = location.active !== false;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && isActive) ||
        (statusFilter === "INACTIVE" && !isActive);

      const matchesType =
        typeFilter === "ALL" || location.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [locations, search, statusFilter, typeFilter]);

  const totalRooms = locations.length;

  const activeRooms = locations.filter(
    (location) => location.active !== false
  ).length;

  const inactiveRooms = totalRooms - activeRooms;

  const copyText = async (text, type, id) => {
    try {
      await navigator.clipboard.writeText(text);

      if (type === "url") {
        setCopiedId(id);
        setTimeout(() => setCopiedId(""), 1800);
      } else {
        setCopiedLocationId(id);
        setTimeout(() => setCopiedLocationId(""), 1800);
      }
    } catch (err) {
      console.error("Clipboard error:", err);

      try {
        const textarea = document.createElement("textarea");

        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";

        document.body.appendChild(textarea);

        textarea.focus();
        textarea.select();

        document.execCommand("copy");

        document.body.removeChild(textarea);

        if (type === "url") {
          setCopiedId(id);
          setTimeout(() => setCopiedId(""), 1800);
        } else {
          setCopiedLocationId(id);
          setTimeout(() => setCopiedLocationId(""), 1800);
        }
      } catch (fallbackError) {
        console.error("Clipboard fallback error:", fallbackError);
        alert("Unable to copy. Please copy manually.");
      }
    }
  };

  const printQR = (location) => {
    const canvas = document.querySelector(
      `[data-location="${location.locationId}"]`
    );

    if (!canvas) {
      alert("QR code is not ready yet. Please try again.");
      return;
    }

    const qrImage = canvas.toDataURL("image/png");
    const scanUrl = getRoomScanUrl(location);

    const printWindow = window.open(
      "",
      "_blank",
      "width=850,height=1000"
    );

    if (!printWindow) {
      alert("Please allow pop-ups to print the QR code.");
      return;
    }

    const roomName = String(location.name || "Room").replace(
      /[<>&"]/g,
      ""
    );

    const locationId = String(location.locationId || "").replace(
      /[<>&"]/g,
      ""
    );

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${roomName} - ResistNova Room QR</title>

        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 40px;
            background: #ffffff;
            color: #0f172a;
            font-family: Arial, Helvetica, sans-serif;
            text-align: center;
          }

          .sheet {
            max-width: 680px;
            margin: 0 auto;
            padding: 40px;
            border: 2px solid #e2e8f0;
            border-radius: 24px;
          }

          .brand {
            font-size: 30px;
            font-weight: 900;
            margin-bottom: 10px;
          }

          .brand span {
            color: #2563eb;
          }

          .tag {
            display: inline-block;
            padding: 7px 12px;
            border-radius: 999px;
            background: #eff6ff;
            color: #2563eb;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 1px;
          }

          h1 {
            margin: 22px 0 7px;
            font-size: 34px;
          }

          .location-id {
            color: #64748b;
            font-size: 15px;
          }

          .qr {
            display: inline-flex;
            margin: 30px 0;
            padding: 18px;
            border: 2px solid #e2e8f0;
            border-radius: 18px;
          }

          .qr img {
            width: 330px;
            height: 330px;
            display: block;
          }

          .instruction {
            font-size: 18px;
            font-weight: 800;
            margin-bottom: 22px;
          }

          .privacy {
            padding: 16px;
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 14px;
            color: #166534;
            font-size: 14px;
            line-height: 1.6;
          }

          .url {
            margin-top: 18px;
            padding: 12px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            color: #475569;
            font-size: 11px;
            line-height: 1.5;
            word-break: break-all;
          }

          .footer {
            margin-top: 22px;
            color: #94a3b8;
            font-size: 12px;
          }

          .print-button {
            margin-top: 24px;
            padding: 12px 24px;
            border: none;
            border-radius: 10px;
            background: #0f172a;
            color: white;
            font-size: 14px;
            font-weight: 800;
            cursor: pointer;
          }

          @media print {
            body {
              padding: 0;
            }

            .sheet {
              border: none;
              max-width: none;
            }

            .print-button {
              display: none;
            }
          }
        </style>
      </head>

      <body>
        <div class="sheet">

          <div class="brand">
            Resist<span>Nova</span>
          </div>

          <div class="tag">
            HOSPITAL ROOM ACCESS
          </div>

          <h1>${roomName}</h1>

          <div class="location-id">
            Location ID: <strong>${locationId}</strong>
          </div>

          <div class="qr">
            <img
              src="${qrImage}"
              alt="Room QR Code"
            />
          </div>

          <div class="instruction">
            📷 Scan to open Room Check-In
          </div>

          <div class="privacy">
            🔒 <strong>Privacy Protected</strong>
            <br />
            This QR contains only a unique room reference.
            No patient information or MDRO status is included.
          </div>

          <div class="url">
            ${scanUrl}
          </div>

          <div class="footer">
            ResistNova · Hospital Infection Control System
          </div>

          <button
            class="print-button"
            onclick="window.print()"
          >
            Print QR Code
          </button>

        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
  };

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingBox}>
          <div style={styles.loadingIcon}>🏥</div>

          <div style={styles.spinner}></div>

          <h2 style={styles.loadingTitle}>
            Loading Room QR Codes
          </h2>

          <p style={styles.loadingText}>
            Connecting to ResistNova server...
          </p>
        </div>
      </div>
    );
  }

  /* =========================
     ERROR
  ========================= */

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.errorBox}>
          <div style={styles.errorIcon}>⚠️</div>

          <h2 style={styles.errorTitle}>
            Unable to Load Rooms
          </h2>

          <p style={styles.errorText}>{error}</p>

          <div style={styles.apiBox}>
            <div style={styles.apiLabel}>
              API Endpoint
            </div>

            <div style={styles.apiUrl}>
              {API_BASE}/locations
            </div>
          </div>

          <button
            type="button"
            style={styles.retryButton}
            onClick={fetchLocations}
          >
            ↻ Try Again
          </button>
        </div>
      </div>
    );
  }

  /* =========================
     MAIN
  ========================= */

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* HEADER */}

        <section style={styles.header}>
          <div>
            <div style={styles.eyebrow}>
              LOCATION MANAGEMENT
            </div>

            <h1 style={styles.title}>
              Room QR Codes
            </h1>

            <p style={styles.subtitle}>
              Manage secure room QR codes used for staff
              movement ENTRY and EXIT.
            </p>
          </div>

          <button
            type="button"
            style={styles.refreshButton}
            onClick={fetchLocations}
          >
            <span style={styles.refreshIcon}>↻</span>
            Refresh
          </button>
        </section>

        {/* WORKFLOW */}

        <section style={styles.workflow}>
          <div style={styles.workflowIcon}>
            📱
          </div>

          <div style={styles.workflowContent}>
            <div style={styles.workflowTitle}>
              Room Check-In Workflow
            </div>

            <div style={styles.workflowSteps}>
              <span>01 Scan Room QR</span>
              <b>→</b>
              <span>02 Staff ID</span>
              <b>→</b>
              <span>03 Verify</span>
              <b>→</b>
              <span>04 ENTRY / EXIT</span>
            </div>
          </div>
        </section>

        {/* PRIVACY */}

        <section style={styles.privacy}>
          <div style={styles.privacyIcon}>
            🔒
          </div>

          <div>
            <strong style={styles.privacyTitle}>
              Privacy Protected
            </strong>

            <p style={styles.privacyText}>
              Room QR codes contain only a unique location
              token. They do not contain patient information,
              diagnosis, or MDRO positive/negative status.
            </p>
          </div>
        </section>

        {/* STATS */}

        <section style={styles.stats}>
          <StatCard
            icon="🏥"
            label="TOTAL ROOMS"
            value={totalRooms}
            description="Registered locations"
          />

          <StatCard
            icon="✓"
            label="ACTIVE ROOMS"
            value={activeRooms}
            description="Available for scanning"
          />

          <StatCard
            icon="○"
            label="INACTIVE ROOMS"
            value={inactiveRooms}
            description="Currently disabled"
          />
        </section>

        {/* SEARCH + FILTER */}

        <section style={styles.toolbar}>
          <div style={styles.searchBox}>
            <span style={styles.searchIcon}>
              🔍
            </span>

            <input
              type="text"
              placeholder="Search room name, ID or type..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              style={styles.searchInput}
            />

            {search && (
              <button
                type="button"
                style={styles.clearButton}
                onClick={() => setSearch("")}
              >
                ×
              </button>
            )}
          </div>

          <div style={styles.filters}>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
              style={styles.select}
            >
              <option value="ALL">
                All Status
              </option>

              <option value="ACTIVE">
                Active
              </option>

              <option value="INACTIVE">
                Inactive
              </option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value)
              }
              style={styles.select}
            >
              {roomTypes.map((type) => (
                <option
                  key={type}
                  value={type}
                >
                  {type === "ALL"
                    ? "All Types"
                    : type}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* RESULT COUNT */}

        <div style={styles.resultCount}>
          Showing{" "}
          <strong>
            {filteredLocations.length}
          </strong>{" "}
          of{" "}
          <strong>
            {locations.length}
          </strong>{" "}
          rooms
        </div>

        {/* EMPTY */}

        {filteredLocations.length === 0 ? (
          <div style={styles.emptyBox}>
            <div style={styles.emptyIcon}>
              🏥
            </div>

            <h2 style={styles.emptyTitle}>
              No Rooms Found
            </h2>

            <p style={styles.emptyText}>
              {locations.length === 0
                ? "No room locations are available in the system."
                : "Try changing your search or filters."}
            </p>

            {(search ||
              statusFilter !== "ALL" ||
              typeFilter !== "ALL") && (
              <button
                type="button"
                style={styles.clearFiltersButton}
                onClick={() => {
                  setSearch("");
                  setStatusFilter("ALL");
                  setTypeFilter("ALL");
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div style={styles.grid}>
            {filteredLocations.map((location) => {
              const scanUrl =
                getRoomScanUrl(location);

              const isActive =
                location.active !== false;

              return (
                <article
                  key={location.locationId}
                  style={{
                    ...styles.card,
                    ...(isActive
                      ? {}
                      : styles.inactiveCard),
                  }}
                >
                  {/* CARD HEADER */}

                  <div style={styles.cardHeader}>
                    <div style={styles.roomInfo}>
                      <div style={styles.roomType}>
                        {location.type || "ROOM"}
                      </div>

                      <h2 style={styles.roomName}>
                        {location.name ||
                          "Unnamed Room"}
                      </h2>

                      <div style={styles.idRow}>
                        <span>
                          ID:{" "}
                          {location.locationId}
                        </span>

                        <button
                          type="button"
                          style={
                            styles.idCopyButton
                          }
                          onClick={() =>
                            copyText(
                              location.locationId,
                              "id",
                              location.locationId
                            )
                          }
                          title="Copy Location ID"
                        >
                          {copiedLocationId ===
                          location.locationId
                            ? "✓"
                            : "⧉"}
                        </button>
                      </div>
                    </div>

                    <span
                      style={
                        isActive
                          ? styles.activeBadge
                          : styles.inactiveBadge
                      }
                    >
                      <span
                        style={
                          styles.statusDot
                        }
                      ></span>

                      {isActive
                        ? "ACTIVE"
                        : "INACTIVE"}
                    </span>
                  </div>

                  {/* QR */}

                  <div style={styles.qrSection}>
                    <div style={styles.qrFrame}>
                      <QRCodeCanvas
                        data-location={
                          location.locationId
                        }
                        value={scanUrl}
                        size={230}
                        bgColor="#ffffff"
                        fgColor="#111827"
                        level="H"
                        includeMargin={true}
                      />
                    </div>

                    <div style={styles.scanHint}>
                      <span>📷</span>

                      Scan with mobile camera
                    </div>
                  </div>

                  {/* URL */}

                  <div style={styles.urlSection}>
                    <div style={styles.urlHeader}>
                      <span>
                        ROOM SCAN URL
                      </span>

                      <span style={styles.secureText}>
                        🔒 Secure
                      </span>
                    </div>

                    <div style={styles.urlBox}>
                      {scanUrl}
                    </div>
                  </div>

                  {/* BUTTONS */}

                  <div style={styles.actions}>
                    <button
                      type="button"
                      style={styles.copyButton}
                      onClick={() =>
                        copyText(
                          scanUrl,
                          "url",
                          location.locationId
                        )
                      }
                      disabled={!isActive}
                    >
                      {copiedId ===
                      location.locationId
                        ? "✓ Copied"
                        : "📋 Copy URL"}
                    </button>

                    <button
                      type="button"
                      style={styles.printButton}
                      onClick={() =>
                        printQR(location)
                      }
                      disabled={!isActive}
                    >
                      🖨️ Print QR
                    </button>
                  </div>

                  {!isActive && (
                    <div
                      style={
                        styles.inactiveMessage
                      }
                    >
                      This room is inactive and
                      should not be used for new
                      movement scans.
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {/* FOOTER */}

        <section style={styles.footerNote}>
          <div style={styles.footerIcon}>
            🛡️
          </div>

          <div>
            <strong style={styles.footerTitle}>
              ResistNova Movement Tracking
            </strong>

            <p style={styles.footerText}>
              QR scanning records room movement
              with automatic server-side timestamps.
              The QR itself does not expose sensitive
              patient information.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}

/* =========================================
   STAT CARD
========================================= */

function StatCard({
  icon,
  label,
  value,
  description,
}) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statIcon}>
        {icon}
      </div>

      <div>
        <div style={styles.statLabel}>
          {label}
        </div>

        <div style={styles.statValue}>
          {value}
        </div>

        <div style={styles.statDescription}>
          {description}
        </div>
      </div>
    </div>
  );
}

/* =========================================
   STYLES
========================================= */

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
    padding: "30px",
    boxSizing: "border-box",
  },

  container: {
    maxWidth: "1450px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "22px",
  },

  eyebrow: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: "999px",
    background: "#eff6ff",
    color: "#2563eb",
    fontSize: "10px",
    fontWeight: "900",
    letterSpacing: "1.3px",
    marginBottom: "9px",
  },

  title: {
    margin: 0,
    color: "#0f172a",
    fontSize: "34px",
    fontWeight: "900",
    letterSpacing: "-1px",
  },

  subtitle: {
    margin: "8px 0 0",
    color: "#64748b",
    fontSize: "14px",
    lineHeight: 1.6,
  },

  refreshButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    border: 0,
    background: "#2563eb",
    color: "#ffffff",
    padding: "11px 17px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "800",
    boxShadow:
      "0 6px 16px rgba(37,99,235,0.2)",
  },

  refreshIcon: {
    fontSize: "18px",
  },

  workflow: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "17px 20px",
    background: "#ffffff",
    border: "1px solid #dbeafe",
    borderRadius: "15px",
    marginBottom: "12px",
    boxShadow:
      "0 4px 15px rgba(15,23,42,0.04)",
  },

  workflowIcon: {
    width: "45px",
    height: "45px",
    borderRadius: "12px",
    background: "#eff6ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    flexShrink: 0,
  },

  workflowContent: {
    minWidth: 0,
  },

  workflowTitle: {
    color: "#1e3a8a",
    fontSize: "13px",
    fontWeight: "900",
    marginBottom: "6px",
  },

  workflowSteps: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "9px",
    color: "#475569",
    fontSize: "11px",
    fontWeight: "800",
  },

  privacy: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "15px 18px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "14px",
    marginBottom: "23px",
    color: "#166534",
  },

  privacyIcon: {
    fontSize: "21px",
  },

  privacyTitle: {
    display: "block",
    fontSize: "13px",
    marginBottom: "3px",
  },

  privacyText: {
    margin: 0,
    fontSize: "12px",
    lineHeight: 1.55,
  },

  stats: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "15px",
    marginBottom: "22px",
  },

  statCard: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "18px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "15px",
    boxShadow:
      "0 4px 15px rgba(15,23,42,0.045)",
  },

  statIcon: {
    width: "46px",
    height: "46px",
    borderRadius: "12px",
    background: "#eff6ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#2563eb",
    fontSize: "21px",
    flexShrink: 0,
  },

  statLabel: {
    color: "#94a3b8",
    fontSize: "9px",
    fontWeight: "900",
    letterSpacing: "1px",
  },

  statValue: {
    marginTop: "3px",
    color: "#0f172a",
    fontSize: "27px",
    fontWeight: "900",
  },

  statDescription: {
    marginTop: "3px",
    color: "#64748b",
    fontSize: "11px",
  },

  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    padding: "13px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    marginBottom: "10px",
  },

  searchBox: {
    flex: "1 1 350px",
    position: "relative",
    minWidth: "250px",
  },

  searchIcon: {
    position: "absolute",
    left: "13px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "14px",
  },

  searchInput: {
    width: "100%",
    height: "42px",
    boxSizing: "border-box",
    border: "1px solid #e2e8f0",
    borderRadius: "9px",
    background: "#f8fafc",
    padding: "0 38px",
    outline: "none",
    fontSize: "12px",
    color: "#0f172a",
  },

  clearButton: {
    position: "absolute",
    right: "8px",
    top: "50%",
    transform: "translateY(-50%)",
    border: 0,
    background: "transparent",
    color: "#64748b",
    fontSize: "20px",
    cursor: "pointer",
  },

  filters: {
    display: "flex",
    gap: "9px",
    flexWrap: "wrap",
  },

  select: {
    minWidth: "125px",
    height: "42px",
    padding: "0 11px",
    border: "1px solid #e2e8f0",
    borderRadius: "9px",
    background: "#f8fafc",
    color: "#334155",
    fontSize: "12px",
    fontWeight: "700",
    outline: "none",
    cursor: "pointer",
  },

  resultCount: {
    marginBottom: "14px",
    color: "#64748b",
    fontSize: "11px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(350px, 1fr))",
    gap: "20px",
  },

  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "19px",
    padding: "20px",
    boxShadow:
      "0 8px 25px rgba(15,23,42,0.055)",
    boxSizing: "border-box",
  },

  inactiveCard: {
    opacity: 0.72,
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "16px",
  },

  roomInfo: {
    minWidth: 0,
  },

  roomType: {
    color: "#2563eb",
    fontSize: "9px",
    fontWeight: "900",
    letterSpacing: "1.2px",
    marginBottom: "5px",
  },

  roomName: {
    margin: 0,
    color: "#0f172a",
    fontSize: "22px",
    fontWeight: "900",
    lineHeight: 1.15,
    overflowWrap: "anywhere",
  },

  idRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "7px",
    color: "#64748b",
    fontSize: "11px",
    fontWeight: "700",
  },

  idCopyButton: {
    width: "25px",
    height: "25px",
    border: 0,
    borderRadius: "6px",
    background: "#f1f5f9",
    color: "#475569",
    cursor: "pointer",
    fontSize: "12px",
  },

  activeBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding: "6px 9px",
    borderRadius: "999px",
    background: "#ecfdf5",
    color: "#047857",
    fontSize: "9px",
    fontWeight: "900",
    whiteSpace: "nowrap",
  },

  inactiveBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding: "6px 9px",
    borderRadius: "999px",
    background: "#fef2f2",
    color: "#b91c1c",
    fontSize: "9px",
    fontWeight: "900",
    whiteSpace: "nowrap",
  },

  statusDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "currentColor",
  },

  qrSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "18px 10px 15px",
    background:
      "linear-gradient(145deg, #f8fafc, #ffffff)",
    border: "1px solid #eef2f7",
    borderRadius: "15px",
  },

  qrFrame: {
    display: "inline-flex",
    padding: "10px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "13px",
    boxShadow:
      "0 5px 15px rgba(15,23,42,0.05)",
  },

  scanHint: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "10px",
    color: "#475569",
    fontSize: "11px",
    fontWeight: "800",
  },

  urlSection: {
    marginTop: "14px",
  },

  urlHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "6px",
    color: "#64748b",
    fontSize: "9px",
    fontWeight: "900",
    letterSpacing: ".8px",
  },

  secureText: {
    color: "#047857",
    letterSpacing: 0,
  },

  urlBox: {
    padding: "10px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "9px",
    color: "#475569",
    fontSize: "10px",
    lineHeight: 1.5,
    wordBreak: "break-all",
  },

  actions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "9px",
    marginTop: "12px",
  },

  copyButton: {
    border: "1px solid #bfdbfe",
    background: "#eff6ff",
    color: "#1d4ed8",
    padding: "11px",
    borderRadius: "9px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "800",
  },

  printButton: {
    border: 0,
    background: "#0f172a",
    color: "#ffffff",
    padding: "11px",
    borderRadius: "9px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "800",
  },

  inactiveMessage: {
    marginTop: "10px",
    padding: "9px 10px",
    borderRadius: "8px",
    background: "#fef2f2",
    color: "#991b1b",
    fontSize: "10px",
    lineHeight: 1.5,
  },

  footerNote: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    marginTop: "24px",
    padding: "15px 17px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "13px",
    color: "#64748b",
  },

  footerIcon: {
    fontSize: "18px",
  },

  footerTitle: {
    display: "block",
    color: "#334155",
    fontSize: "12px",
  },

  footerText: {
    margin: "3px 0 0",
    fontSize: "11px",
    lineHeight: 1.5,
  },

  loadingBox: {
    maxWidth: "430px",
    margin: "100px auto",
    padding: "45px 30px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    textAlign: "center",
    boxShadow:
      "0 10px 30px rgba(15,23,42,0.06)",
  },

  loadingIcon: {
    fontSize: "40px",
    marginBottom: "15px",
  },

  spinner: {
    width: "30px",
    height: "30px",
    margin: "0 auto 18px",
    border: "3px solid #dbeafe",
    borderTop: "3px solid #2563eb",
    borderRadius: "50%",
  },

  loadingTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "20px",
  },

  loadingText: {
    color: "#64748b",
    fontSize: "13px",
  },

  errorBox: {
    maxWidth: "560px",
    margin: "80px auto",
    padding: "40px 30px",
    background: "#ffffff",
    border: "1px solid #fecaca",
    borderRadius: "20px",
    textAlign: "center",
    boxShadow:
      "0 10px 30px rgba(15,23,42,0.06)",
  },

  errorIcon: {
    fontSize: "42px",
  },

  errorTitle: {
    margin: "10px 0",
    color: "#991b1b",
  },

  errorText: {
    color: "#64748b",
    fontSize: "13px",
    lineHeight: 1.6,
  },

  apiBox: {
    marginTop: "17px",
    padding: "11px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "9px",
    textAlign: "left",
  },

  apiLabel: {
    color: "#94a3b8",
    fontSize: "9px",
    fontWeight: "900",
    marginBottom: "4px",
  },

  apiUrl: {
    color: "#475569",
    fontSize: "11px",
    wordBreak: "break-all",
  },

  retryButton: {
    marginTop: "18px",
    border: 0,
    background: "#2563eb",
    color: "#ffffff",
    padding: "11px 22px",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: "800",
  },

  emptyBox: {
    padding: "65px 25px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    textAlign: "center",
  },

  emptyIcon: {
    fontSize: "48px",
  },

  emptyTitle: {
    margin: "12px 0 5px",
    color: "#0f172a",
  },

  emptyText: {
    color: "#64748b",
    fontSize: "13px",
  },

  clearFiltersButton: {
    marginTop: "10px",
    border: 0,
    background: "#2563eb",
    color: "#ffffff",
    padding: "10px 18px",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: "800",
  },
};

export default LocationQR;