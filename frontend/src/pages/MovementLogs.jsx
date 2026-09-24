import { useEffect, useMemo, useState } from "react";

function MovementLogs() {
  const [movements, setMovements] = useState([]);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_URL =
    import.meta.env.VITE_API_URL ||
    `http://${window.location.hostname}:5000/api`;

  const loadMovements = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/movements`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load movement logs"
        );
      }

      setMovements(data.movements || []);
    } catch (error) {
      console.error("Movement loading error:", error);
      setError(
        error.message || "Failed to load movement logs"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMovements();
  }, []);

  const filteredMovements = useMemo(() => {
    return movements.filter((movement) => {
      const personId = String(
        movement.personId || ""
      ).toLowerCase();

      const locationId = String(
        movement.locationId || ""
      ).toLowerCase();

      const personType = String(
        movement.personType || ""
      );

      const searchText = search
        .trim()
        .toLowerCase();

      const matchesSearch =
        !searchText ||
        personId.includes(searchText) ||
        locationId.includes(searchText);

      const matchesLocation =
        locationFilter === "ALL" ||
        movement.locationId === locationFilter;

      const matchesType =
        typeFilter === "ALL" ||
        personType === typeFilter;

      return (
        matchesSearch &&
        matchesLocation &&
        matchesType
      );
    });
  }, [
    movements,
    search,
    locationFilter,
    typeFilter,
  ]);

  const formatDate = (date) => {
    if (!date) return "—";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "—";
    }

    return parsed.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateDuration = (movement) => {
    if (!movement.entryTime) {
      return "—";
    }

    const start = new Date(movement.entryTime);

    const end = movement.exitTime
      ? new Date(movement.exitTime)
      : new Date();

    const seconds = Math.max(
      0,
      Math.floor((end - start) / 1000)
    );

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor(
      (seconds % 3600) / 60
    );

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    if (minutes > 0) {
      return `${minutes}m`;
    }

    return `${seconds}s`;
  };

  const getLocationName = (locationId) => {
    const locations = {
      LOC001: "ICU",
      LOC002: "Ward A",
      LOC003: "Ward B",
      LOC004: "Emergency",
    };

    return locations[locationId] || locationId || "Unknown";
  };

  const getLocationIcon = (locationId) => {
    const icons = {
      LOC001: "🏥",
      LOC002: "🛏️",
      LOC003: "🛏️",
      LOC004: "🚑",
    };

    return icons[locationId] || "📍";
  };

  const getTypeClass = (type) => {
    if (type === "Patient") {
      return "movement-type patient";
    }

    if (type === "Nurse") {
      return "movement-type nurse";
    }

    if (type === "Doctor") {
      return "movement-type doctor";
    }

    return "movement-type";
  };

  const getActionClass = (action) => {
    return action === "ENTRY"
      ? "movement-action entry"
      : "movement-action exit";
  };

  const stats = useMemo(() => {
    const patients = movements.filter(
      (item) => item.personType === "Patient"
    ).length;

    const staff = movements.filter(
      (item) =>
        item.personType === "Doctor" ||
        item.personType === "Nurse"
    ).length;

    const active = movements.filter(
      (item) =>
        item.entryTime && !item.exitTime
    ).length;

    const entries = movements.filter(
      (item) => item.action === "ENTRY"
    ).length;

    const exits = movements.filter(
      (item) => item.action === "EXIT"
    ).length;

    return {
      total: movements.length,
      patients,
      staff,
      active,
      entries,
      exits,
    };
  }, [movements]);

  return (
    <div className="movement-page">

      {/* ================= HEADER ================= */}

      <div className="movement-header">
        <div>
          <div className="movement-breadcrumb">
            Surveillance
            <span>›</span>
            Movement Logs
          </div>

          <h1>Movement Logs</h1>

          <p>
            Monitor patient and staff movement
            records across hospital locations.
          </p>
        </div>

        <button
          type="button"
          className="movement-refresh-btn"
          onClick={loadMovements}
          disabled={loading}
        >
          <span className={loading ? "spin" : ""}>
            ↻
          </span>

          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* ================= ERROR ================= */}

      {error && (
        <div className="movement-error">
          <div className="movement-error-icon">
            !
          </div>

          <div>
            <strong>
              Unable to load movement logs
            </strong>

            <p>{error}</p>
          </div>

          <button onClick={loadMovements}>
            Try Again
          </button>
        </div>
      )}

      {/* ================= STATISTICS ================= */}

      <div className="movement-stats">

        <div className="movement-stat-card">
          <div className="stat-icon blue">
            📋
          </div>

          <div>
            <span>Total Movements</span>
            <strong>{stats.total}</strong>
            <small>All recorded activity</small>
          </div>
        </div>

        <div className="movement-stat-card">
          <div className="stat-icon purple">
            🧑
          </div>

          <div>
            <span>Patient Activity</span>
            <strong>{stats.patients}</strong>
            <small>Patient movement records</small>
          </div>
        </div>

        <div className="movement-stat-card">
          <div className="stat-icon green">
            👨‍⚕️
          </div>

          <div>
            <span>Staff Activity</span>
            <strong>{stats.staff}</strong>
            <small>Doctor & nurse records</small>
          </div>
        </div>

        <div className="movement-stat-card">
          <div className="stat-icon orange">
            🟢
          </div>

          <div>
            <span>Active Movements</span>
            <strong>{stats.active}</strong>
            <small>Currently inside locations</small>
          </div>
        </div>

      </div>

      {/* ================= FILTER PANEL ================= */}

      <section className="movement-filter-panel">

        <div className="filter-heading">
          <div className="filter-heading-icon">
            ⚙
          </div>

          <div>
            <h3>Movement Activity</h3>
            <p>
              Search and filter recorded movements
            </p>
          </div>
        </div>

        <div className="movement-filters">

          <div className="movement-filter">
            <label>Search</label>

            <div className="input-with-icon">
              <span>⌕</span>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Person ID or Location ID"
              />

              {search && (
                <button
                  type="button"
                  className="clear-search"
                  onClick={() => setSearch("")}
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="movement-filter">
            <label>Location</label>

            <select
              value={locationFilter}
              onChange={(e) =>
                setLocationFilter(e.target.value)
              }
            >
              <option value="ALL">
                All Locations
              </option>

              <option value="LOC001">
                ICU
              </option>

              <option value="LOC002">
                Ward A
              </option>

              <option value="LOC003">
                Ward B
              </option>

              <option value="LOC004">
                Emergency
              </option>
            </select>
          </div>

          <div className="movement-filter">
            <label>Person Type</label>

            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value)
              }
            >
              <option value="ALL">
                All Types
              </option>

              <option value="Patient">
                Patient
              </option>

              <option value="Nurse">
                Nurse
              </option>

              <option value="Doctor">
                Doctor
              </option>
            </select>
          </div>

          <button
            type="button"
            className="reset-filter-btn"
            onClick={() => {
              setSearch("");
              setLocationFilter("ALL");
              setTypeFilter("ALL");
            }}
          >
            ↺ Reset
          </button>

        </div>
      </section>

      {/* ================= TABLE PANEL ================= */}

      <section className="movement-table-panel">

        <div className="movement-table-header">

          <div>
            <h3>Movement Records</h3>

            <p>
              Showing{" "}
              <strong>
                {filteredMovements.length}
              </strong>{" "}
              of{" "}
              <strong>{movements.length}</strong>{" "}
              records
            </p>
          </div>

          <div className="movement-summary">

            <span className="summary-entry">
              <i />
              {stats.entries} Entries
            </span>

            <span className="summary-exit">
              <i />
              {stats.exits} Exits
            </span>

          </div>

        </div>

        {loading ? (
          <div className="movement-loading">

            <div className="loading-spinner" />

            <h3>Loading movement records</h3>

            <p>
              Fetching the latest activity from
              the hospital system...
            </p>

          </div>
        ) : filteredMovements.length === 0 ? (
          <div className="movement-empty">

            <div className="empty-icon">
              📋
            </div>

            <h3>No movement records found</h3>

            <p>
              No records match the current search
              or filter settings.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setLocationFilter("ALL");
                setTypeFilter("ALL");
              }}
            >
              Clear Filters
            </button>

          </div>
        ) : (
          <div className="movement-table-wrapper">

            <table className="movement-table">

              <thead>
                <tr>
                  <th>Person</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Activity</th>
                  <th>Entry Time</th>
                  <th>Exit Time</th>
                  <th>Duration</th>
                  <th>Logged By</th>
                </tr>
              </thead>

              <tbody>
                {filteredMovements.map(
                  (movement) => (
                    <tr
                      key={
                        movement._id ||
                        `${movement.personId}-${movement.entryTime}`
                      }
                    >

                      {/* PERSON */}

                      <td>
                        <div className="person-cell">

                          <div className="person-avatar">
                            {movement.personType ===
                            "Patient"
                              ? "P"
                              : "S"}
                          </div>

                          <div>
                            <strong>
                              {movement.personId}
                            </strong>

                            <span>
                              Movement ID
                            </span>
                          </div>

                        </div>
                      </td>

                      {/* TYPE */}

                      <td>
                        <span
                          className={getTypeClass(
                            movement.personType
                          )}
                        >
                          <span className="type-dot" />
                          {movement.personType}
                        </span>
                      </td>

                      {/* LOCATION */}

                      <td>
                        <div className="location-cell">

                          <span className="location-icon">
                            {getLocationIcon(
                              movement.locationId
                            )}
                          </span>

                          <div>
                            <strong>
                              {getLocationName(
                                movement.locationId
                              )}
                            </strong>

                            <span>
                              {movement.locationId}
                            </span>
                          </div>

                        </div>
                      </td>

                      {/* ACTION */}

                      <td>
                        <span
                          className={getActionClass(
                            movement.action
                          )}
                        >
                          <span>
                            {movement.action ===
                            "ENTRY"
                              ? "↓"
                              : "↑"}
                          </span>

                          {movement.action}
                        </span>
                      </td>

                      {/* ENTRY */}

                      <td>
                        <div className="time-cell">
                          <strong>
                            {movement.entryTime
                              ? new Date(
                                  movement.entryTime
                                ).toLocaleTimeString(
                                  "en-IN",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )
                              : "—"}
                          </strong>

                          <span>
                            {movement.entryTime
                              ? new Date(
                                  movement.entryTime
                                ).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )
                              : ""}
                          </span>
                        </div>
                      </td>

                      {/* EXIT */}

                      <td>
                        <div className="time-cell">
                          <strong>
                            {movement.exitTime
                              ? new Date(
                                  movement.exitTime
                                ).toLocaleTimeString(
                                  "en-IN",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )
                              : "—"}
                          </strong>

                          <span>
                            {movement.exitTime
                              ? new Date(
                                  movement.exitTime
                                ).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )
                              : movement.entryTime
                              ? "Currently active"
                              : ""}
                          </span>
                        </div>
                      </td>

                      {/* DURATION */}

                      <td>
                        <span
                          className={
                            movement.exitTime
                              ? "duration-badge"
                              : "duration-badge active"
                          }
                        >
                          ⏱{" "}
                          {calculateDuration(
                            movement
                          )}
                        </span>
                      </td>

                      {/* LOGGED BY */}

                      <td>
                        <span className="logged-by">
                          {movement.loggedBy ||
                            "SYSTEM"}
                        </span>
                      </td>

                    </tr>
                  )
                )}
              </tbody>

            </table>

          </div>
        )}

      </section>

      {/* ================= PRIVACY NOTE ================= */}

      <div className="movement-privacy-note">

        <span className="privacy-icon">
          🔒
        </span>

        <div>
          <strong>Movement data privacy</strong>

          <p>
            These logs represent recorded
            movement activity only. They do not
            indicate MDRO status or diagnosis.
          </p>
        </div>

      </div>

      {/* ================= PAGE CSS ================= */}

      <style>{`

        .movement-page {
          padding-bottom: 40px;
          animation: movementFadeIn 0.35s ease;
        }

        @keyframes movementFadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* HEADER */

        .movement-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 26px;
        }

        .movement-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #94a3b8;
          margin-bottom: 8px;
          font-weight: 600;
        }

        .movement-breadcrumb span {
          color: #cbd5e1;
        }

        .movement-header h1 {
          margin: 0;
          font-size: 30px;
          line-height: 1.15;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.6px;
        }

        .movement-header p {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 14px;
        }

        .movement-refresh-btn {
          border: 1px solid #dbe4ef;
          background: #ffffff;
          color: #1e3a8a;
          padding: 11px 17px;
          border-radius: 11px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: 0.2s ease;
          box-shadow: 0 3px 12px rgba(15, 23, 42, 0.05);
        }

        .movement-refresh-btn:hover {
          transform: translateY(-1px);
          border-color: #bfdbfe;
          box-shadow: 0 7px 18px rgba(15, 23, 42, 0.08);
        }

        .movement-refresh-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .spin {
          display: inline-block;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* ERROR */

        .movement-error {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 15px 17px;
          margin-bottom: 22px;
          background: #fff7f7;
          border: 1px solid #fecaca;
          border-radius: 14px;
        }

        .movement-error-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fee2e2;
          color: #b91c1c;
          font-weight: 800;
        }

        .movement-error strong {
          color: #991b1b;
          font-size: 14px;
        }

        .movement-error p {
          margin: 3px 0 0;
          color: #b91c1c;
          font-size: 12px;
        }

        .movement-error button {
          margin-left: auto;
          border: 0;
          background: #b91c1c;
          color: white;
          padding: 9px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 700;
        }

        /* STATS */

        .movement-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 22px;
        }

        .movement-stat-card {
          background: #ffffff;
          border: 1px solid #e5eaf1;
          border-radius: 16px;
          padding: 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          min-height: 105px;
          box-shadow: 0 5px 18px rgba(15, 23, 42, 0.045);
          transition: 0.2s ease;
        }

        .movement-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          flex-shrink: 0;
          border-radius: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 21px;
        }

        .stat-icon.blue {
          background: #eff6ff;
        }

        .stat-icon.purple {
          background: #f5f3ff;
        }

        .stat-icon.green {
          background: #ecfdf5;
        }

        .stat-icon.orange {
          background: #fff7ed;
        }

        .movement-stat-card span {
          display: block;
          color: #64748b;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 3px;
        }

        .movement-stat-card strong {
          display: block;
          color: #0f172a;
          font-size: 25px;
          line-height: 1.1;
        }

        .movement-stat-card small {
          display: block;
          color: #94a3b8;
          font-size: 10px;
          margin-top: 4px;
        }

        /* FILTER PANEL */

        .movement-filter-panel {
          background: #ffffff;
          border: 1px solid #e5eaf1;
          border-radius: 17px;
          padding: 20px;
          margin-bottom: 22px;
          box-shadow: 0 5px 18px rgba(15, 23, 42, 0.04);
        }

        .filter-heading {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
        }

        .filter-heading-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #eff6ff;
          color: #2563eb;
        }

        .filter-heading h3 {
          margin: 0;
          font-size: 15px;
          color: #0f172a;
        }

        .filter-heading p {
          margin: 3px 0 0;
          color: #94a3b8;
          font-size: 11px;
        }

        .movement-filters {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr auto;
          gap: 13px;
          align-items: end;
        }

        .movement-filter label {
          display: block;
          color: #475569;
          font-size: 11px;
          font-weight: 700;
          margin-bottom: 7px;
        }

        .movement-filter input,
        .movement-filter select {
          width: 100%;
          height: 43px;
          box-sizing: border-box;
          border: 1px solid #dbe3ed;
          border-radius: 10px;
          background: #f8fafc;
          color: #1e293b;
          padding: 0 12px;
          font-size: 13px;
          outline: none;
          transition: 0.2s ease;
        }

        .movement-filter input:focus,
        .movement-filter select:focus {
          background: #ffffff;
          border-color: #60a5fa;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .input-with-icon {
          position: relative;
        }

        .input-with-icon > span {
          position: absolute;
          left: 13px;
          top: 11px;
          font-size: 18px;
          color: #94a3b8;
        }

        .input-with-icon input {
          padding-left: 37px;
          padding-right: 35px;
        }

        .clear-search {
          position: absolute;
          right: 8px;
          top: 8px;
          width: 27px;
          height: 27px;
          border: 0;
          border-radius: 7px;
          background: #e2e8f0;
          color: #64748b;
          cursor: pointer;
          font-size: 17px;
        }

        .reset-filter-btn {
          height: 43px;
          padding: 0 15px;
          border: 1px solid #dbe3ed;
          background: #ffffff;
          color: #475569;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
        }

        .reset-filter-btn:hover {
          background: #f8fafc;
        }

        /* TABLE */

        .movement-table-panel {
          background: #ffffff;
          border: 1px solid #e5eaf1;
          border-radius: 17px;
          overflow: hidden;
          box-shadow: 0 5px 18px rgba(15, 23, 42, 0.04);
        }

        .movement-table-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 20px 22px;
          border-bottom: 1px solid #edf1f5;
        }

        .movement-table-header h3 {
          margin: 0;
          color: #0f172a;
          font-size: 16px;
        }

        .movement-table-header p {
          margin: 5px 0 0;
          color: #94a3b8;
          font-size: 11px;
        }

        .movement-table-header p strong {
          color: #475569;
        }

        .movement-summary {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .movement-summary span {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #64748b;
          font-size: 11px;
          font-weight: 700;
        }

        .movement-summary i {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          display: inline-block;
        }

        .summary-entry i {
          background: #22c55e;
        }

        .summary-exit i {
          background: #f97316;
        }

        .movement-table-wrapper {
          overflow-x: auto;
          max-height: 570px;
          overflow-y: auto;
        }

        .movement-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          min-width: 1050px;
        }

        .movement-table thead {
          position: sticky;
          top: 0;
          z-index: 2;
        }

        .movement-table th {
          text-align: left;
          padding: 13px 16px;
          background: #f8fafc;
          color: #64748b;
          border-bottom: 1px solid #e2e8f0;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 800;
          white-space: nowrap;
        }

        .movement-table td {
          padding: 14px 16px;
          border-bottom: 1px solid #f1f5f9;
          color: #475569;
          font-size: 12px;
          vertical-align: middle;
          background: #ffffff;
        }

        .movement-table tbody tr {
          transition: 0.15s ease;
        }

        .movement-table tbody tr:hover td {
          background: #f8fbff;
        }

        .movement-table tbody tr:last-child td {
          border-bottom: 0;
        }

        /* PERSON */

        .person-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .person-avatar {
          width: 35px;
          height: 35px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #eff6ff;
          color: #2563eb;
          font-weight: 800;
          font-size: 12px;
        }

        .person-cell strong {
          display: block;
          color: #0f172a;
          font-size: 12px;
        }

        .person-cell span {
          display: block;
          color: #94a3b8;
          font-size: 9px;
          margin-top: 2px;
        }

        /* TYPE */

        .movement-type {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 9px;
          border-radius: 8px;
          background: #f1f5f9;
          color: #475569;
          font-size: 10px;
          font-weight: 800;
        }

        .movement-type.patient {
          background: #f5f3ff;
          color: #6d28d9;
        }

        .movement-type.nurse {
          background: #ecfdf5;
          color: #047857;
        }

        .movement-type.doctor {
          background: #eff6ff;
          color: #1d4ed8;
        }

        .type-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: currentColor;
        }

        /* LOCATION */

        .location-cell {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .location-icon {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: #f8fafc;
        }

        .location-cell strong {
          display: block;
          color: #334155;
          font-size: 11px;
        }

        .location-cell span:last-child {
          display: block;
          color: #94a3b8;
          font-size: 9px;
          margin-top: 2px;
        }

        /* ACTION */

        .movement-action {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 9px;
          border-radius: 8px;
          font-size: 10px;
          font-weight: 800;
        }

        .movement-action.entry {
          background: #ecfdf5;
          color: #15803d;
        }

        .movement-action.exit {
          background: #fff7ed;
          color: #c2410c;
        }

        /* TIME */

        .time-cell strong {
          display: block;
          color: #334155;
          font-size: 11px;
        }

        .time-cell span {
          display: block;
          color: #94a3b8;
          font-size: 9px;
          margin-top: 3px;
          white-space: nowrap;
        }

        /* DURATION */

        .duration-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 9px;
          border-radius: 8px;
          background: #f1f5f9;
          color: #475569;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
        }

        .duration-badge.active {
          background: #ecfdf5;
          color: #15803d;
        }

        /* LOGGED BY */

        .logged-by {
          display: inline-block;
          padding: 5px 8px;
          background: #f8fafc;
          border-radius: 7px;
          color: #64748b;
          font-size: 9px;
          font-weight: 700;
        }

        /* LOADING */

        .movement-loading {
          min-height: 320px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .loading-spinner {
          width: 34px;
          height: 34px;
          border: 3px solid #e2e8f0;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 15px;
        }

        .movement-loading h3 {
          margin: 0;
          color: #334155;
          font-size: 14px;
        }

        .movement-loading p {
          margin: 6px 0 0;
          color: #94a3b8;
          font-size: 11px;
        }

        /* EMPTY */

        .movement-empty {
          min-height: 320px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 30px;
        }

        .empty-icon {
          width: 64px;
          height: 64px;
          border-radius: 18px;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 27px;
          margin-bottom: 15px;
        }

        .movement-empty h3 {
          margin: 0;
          color: #334155;
          font-size: 15px;
        }

        .movement-empty p {
          color: #94a3b8;
          font-size: 11px;
          margin: 7px 0 15px;
        }

        .movement-empty button {
          border: 0;
          background: #2563eb;
          color: #ffffff;
          padding: 9px 15px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 700;
        }

        /* PRIVACY */

        .movement-privacy-note {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          margin-top: 17px;
          padding: 13px 15px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          border-radius: 12px;
        }

        .privacy-icon {
          font-size: 16px;
        }

        .movement-privacy-note strong {
          display: block;
          color: #475569;
          font-size: 11px;
        }

        .movement-privacy-note p {
          margin: 3px 0 0;
          color: #94a3b8;
          font-size: 10px;
          line-height: 1.5;
        }

        /* RESPONSIVE */

        @media (max-width: 1100px) {

          .movement-stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .movement-filters {
            grid-template-columns: 1fr 1fr;
          }

          .reset-filter-btn {
            width: 100%;
          }

        }

        @media (max-width: 700px) {

          .movement-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .movement-header h1 {
            font-size: 25px;
          }

          .movement-refresh-btn {
            width: 100%;
            justify-content: center;
          }

          .movement-stats {
            grid-template-columns: 1fr;
          }

          .movement-filters {
            grid-template-columns: 1fr;
          }

          .movement-table-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .movement-summary {
            width: 100%;
            justify-content: space-between;
          }

          .movement-filter-panel,
          .movement-table-header {
            padding: 16px;
          }

        }

      `}</style>
    </div>
  );
}

export default MovementLogs;