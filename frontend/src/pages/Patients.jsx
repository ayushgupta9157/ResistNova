import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

function Patients() {
  const navigate = useNavigate();

  const API_BASE =
    import.meta.env.VITE_API_URL ||
    `http://${window.location.hostname}:5000/api`;

  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =========================
     LOAD PATIENTS
  ========================= */

  const loadPatients = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/patients`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load patients"
        );
      }

      setPatients(data.patients || []);
    } catch (error) {
      console.error(
        "Patient loading error:",
        error
      );

      setError(
        error.message ||
          "Failed to load patients"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  /* =========================
     FILTER PATIENTS
  ========================= */

  const filteredPatients = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return patients.filter((patient) => {
      const patientId = String(
        patient.patientId || ""
      ).toLowerCase();

      const name = String(
        patient.name || ""
      ).toLowerCase();

      const gender = String(
        patient.gender || ""
      ).toLowerCase();

      const matchesSearch =
        !query ||
        patientId.includes(query) ||
        name.includes(query) ||
        gender.includes(query);

      const matchesGender =
        genderFilter === "ALL" ||
        patient.gender === genderFilter;

      return (
        matchesSearch &&
        matchesGender
      );
    });
  }, [
    patients,
    search,
    genderFilter,
  ]);

  /* =========================
     STATISTICS
  ========================= */

  const stats = useMemo(() => {
    const male = patients.filter(
      (patient) =>
        patient.gender === "Male"
    ).length;

    const female = patients.filter(
      (patient) =>
        patient.gender === "Female"
    ).length;

    const other = patients.filter(
      (patient) =>
        patient.gender === "Other"
    ).length;

    return {
      total: patients.length,
      male,
      female,
      other,
    };
  }, [patients]);

  /* =========================
     OPEN PATIENT
  ========================= */

  const openPatient = (patientId) => {
    navigate(
      `/contacts?patientId=${encodeURIComponent(
        patientId
      )}`
    );
  };

  /* =========================
     DATE FORMAT
  ========================= */

  const formatDate = (date) => {
    if (!date) return "—";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "—";
    }

    return parsed.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  /* =========================
     GENDER ICON
  ========================= */

  const getGenderIcon = (gender) => {
    if (gender === "Male") return "♂";
    if (gender === "Female") return "♀";

    return "⚪";
  };

  const getGenderClass = (gender) => {
    if (gender === "Male") {
      return "gender-badge male";
    }

    if (gender === "Female") {
      return "gender-badge female";
    }

    return "gender-badge other";
  };

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="patients-page">

      {/* =================================
          HEADER
      ================================= */}

      <div className="patients-header">

        <div>
          <div className="patients-breadcrumb">
            Hospital Management
            <span>›</span>
            Patients
          </div>

          <h1>Patients</h1>

          <p>
            Manage registered patients and
            review their recorded movement
            activity.
          </p>
        </div>

        <button
          type="button"
          className="patients-refresh-btn"
          onClick={loadPatients}
          disabled={loading}
        >
          <span
            className={
              loading ? "patients-spin" : ""
            }
          >
            ↻
          </span>

          {loading
            ? "Refreshing..."
            : "Refresh"}
        </button>

      </div>

      {/* =================================
          ERROR
      ================================= */}

      {error && (
        <div className="patients-alert">

          <div className="patients-alert-icon">
            !
          </div>

          <div>
            <strong>
              Unable to load patients
            </strong>

            <p>{error}</p>
          </div>

          <button
            type="button"
            onClick={loadPatients}
          >
            Try Again
          </button>

        </div>
      )}

      {/* =================================
          STATISTICS
      ================================= */}

      <div className="patients-stats">

        <div className="patient-stat-card">

          <div className="patient-stat-icon blue">
            👥
          </div>

          <div>
            <span>Total Patients</span>

            <strong>
              {stats.total}
            </strong>

            <small>
              Registered patients
            </small>
          </div>

        </div>

        <div className="patient-stat-card">

          <div className="patient-stat-icon blue-soft">
            ♂
          </div>

          <div>
            <span>Male</span>

            <strong>
              {stats.male}
            </strong>

            <small>
              Registered male patients
            </small>
          </div>

        </div>

        <div className="patient-stat-card">

          <div className="patient-stat-icon pink">
            ♀
          </div>

          <div>
            <span>Female</span>

            <strong>
              {stats.female}
            </strong>

            <small>
              Registered female patients
            </small>
          </div>

        </div>

        <div className="patient-stat-card">

          <div className="patient-stat-icon orange">
            ⚪
          </div>

          <div>
            <span>Other</span>

            <strong>
              {stats.other}
            </strong>

            <small>
              Other gender records
            </small>
          </div>

        </div>

      </div>

      {/* =================================
          PATIENT DIRECTORY
      ================================= */}

      <section className="patients-card">

        <div className="patients-card-header">

          <div className="patients-title">

            <div className="patients-title-icon">
              🧑
            </div>

            <div>
              <h2>
                Patient Directory
              </h2>

              <p>
                {filteredPatients.length} of{" "}
                {patients.length} patients
              </p>
            </div>

          </div>

          <div className="patients-controls">

            {/* SEARCH */}

            <div className="patients-search">

              <span>⌕</span>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search patient..."
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                >
                  ×
                </button>
              )}

            </div>

            {/* GENDER */}

            <select
              className="gender-filter"
              value={genderFilter}
              onChange={(e) =>
                setGenderFilter(
                  e.target.value
                )
              }
            >
              <option value="ALL">
                All Gender
              </option>

              <option value="Male">
                Male
              </option>

              <option value="Female">
                Female
              </option>

              <option value="Other">
                Other
              </option>
            </select>

          </div>

        </div>

        {/* =================================
            LOADING
        ================================= */}

        {loading ? (
          <div className="patients-loading">

            <div className="patients-loader" />

            <h3>
              Loading patient directory
            </h3>

            <p>
              Fetching patient records from
              the hospital system...
            </p>

          </div>

        ) : filteredPatients.length === 0 ? (

          /* =================================
             EMPTY
          ================================= */

          <div className="patients-empty">

            <div className="patients-empty-icon">
              🧑
            </div>

            <h3>
              {patients.length === 0
                ? "No patients registered"
                : "No matching patients"}
            </h3>

            <p>
              {patients.length === 0
                ? "Patient registrations will appear here."
                : "Try changing your search or filter."}
            </p>

            {patients.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setGenderFilter("ALL");
                }}
              >
                Clear Filters
              </button>
            )}

          </div>

        ) : (

          /* =================================
             TABLE
          ================================= */

          <div className="patients-table-wrapper">

            <table className="patients-table">

              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Patient ID</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Registered</th>
                  <th>Movement</th>
                </tr>
              </thead>

              <tbody>

                {filteredPatients.map(
                  (patient) => (

                    <tr
                      key={
                        patient._id ||
                        patient.patientId
                      }
                    >

                      {/* PATIENT */}

                      <td>

                        <div className="patient-member">

                          <div className="patient-avatar">
                            P
                          </div>

                          <div>
                            <strong>
                              {patient.name ||
                                "—"}
                            </strong>

                            <span>
                              Registered Patient
                            </span>
                          </div>

                        </div>

                      </td>

                      {/* PATIENT ID */}

                      <td>

                        <span className="patient-id">
                          {patient.patientId ||
                            "—"}
                        </span>

                      </td>

                      {/* AGE */}

                      <td>

                        <div className="age-cell">

                          <span className="age-icon">
                            🎂
                          </span>

                          <strong>
                            {patient.age ??
                              "—"}
                          </strong>

                          {patient.age !==
                            undefined &&
                            patient.age !==
                              null && (
                              <small>
                                years
                              </small>
                            )}

                        </div>

                      </td>

                      {/* GENDER */}

                      <td>

                        <span
                          className={getGenderClass(
                            patient.gender
                          )}
                        >
                          <span>
                            {getGenderIcon(
                              patient.gender
                            )}
                          </span>

                          {patient.gender ||
                            "—"}
                        </span>

                      </td>

                      {/* REGISTERED */}

                      <td>

                        <div className="registered-cell">

                          <span className="calendar-icon">
                            📅
                          </span>

                          <span>
                            {formatDate(
                              patient.createdAt
                            )}
                          </span>

                        </div>

                      </td>

                      {/* ACTION */}

                      <td>

                        <button
                          type="button"
                          className="patient-view-btn"
                          onClick={() =>
                            openPatient(
                              patient.patientId
                            )
                          }
                        >
                          <span>
                            View Contacts
                          </span>

                          <span>
                            →
                          </span>
                        </button>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>

      {/* =================================
          PRIVACY NOTE
      ================================= */}

      <div className="patients-privacy">

        <div className="privacy-lock">
          🔒
        </div>

        <div>
          <strong>
            Patient information privacy
          </strong>

          <p>
            This directory contains basic
            registration information only.
            It does not display MDRO
            positive/negative status,
            diagnosis or infection status.
          </p>
        </div>

      </div>

      {/* =================================
          CSS
      ================================= */}

      <style>{`

        .patients-page {
          padding-bottom: 40px;
          animation: patientsFadeIn 0.35s ease;
        }

        @keyframes patientsFadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* =========================
           HEADER
        ========================= */

        .patients-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 25px;
        }

        .patients-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #94a3b8;
          font-size: 11px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .patients-breadcrumb span {
          color: #cbd5e1;
        }

        .patients-header h1 {
          margin: 0;
          color: #0f172a;
          font-size: 30px;
          line-height: 1.15;
          font-weight: 800;
          letter-spacing: -0.7px;
        }

        .patients-header p {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 13px;
        }

        .patients-refresh-btn {
          height: 42px;
          padding: 0 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          border-radius: 10px;
          border: 1px solid #dbe3ed;
          background: #ffffff;
          color: #475569;
          font-size: 12px;
          font-weight: 750;
          cursor: pointer;
          transition: 0.2s ease;
          box-shadow: 0 3px 12px rgba(15, 23, 42, 0.04);
        }

        .patients-refresh-btn:hover {
          background: #f8fafc;
          transform: translateY(-1px);
        }

        .patients-refresh-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .patients-spin {
          display: inline-block;
          animation: patientSpin 0.8s linear infinite;
        }

        @keyframes patientSpin {
          to {
            transform: rotate(360deg);
          }
        }

        /* =========================
           ERROR
        ========================= */

        .patients-alert {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 19px;
          padding: 13px 15px;
          border-radius: 12px;
          border: 1px solid #fecaca;
          background: #fff7f7;
        }

        .patients-alert-icon {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fee2e2;
          color: #b91c1c;
          font-weight: 800;
        }

        .patients-alert strong {
          display: block;
          color: #991b1b;
          font-size: 12px;
        }

        .patients-alert p {
          margin: 3px 0 0;
          color: #b91c1c;
          font-size: 10px;
        }

        .patients-alert button {
          margin-left: auto;
          height: 32px;
          padding: 0 11px;
          border: 0;
          border-radius: 8px;
          background: #b91c1c;
          color: white;
          cursor: pointer;
          font-size: 10px;
          font-weight: 750;
        }

        /* =========================
           STATS
        ========================= */

        .patients-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 21px;
        }

        .patient-stat-card {
          min-height: 102px;
          padding: 17px;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          gap: 13px;
          background: #ffffff;
          border: 1px solid #e5eaf1;
          border-radius: 15px;
          box-shadow: 0 5px 18px rgba(15, 23, 42, 0.04);
          transition: 0.2s ease;
        }

        .patient-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08);
        }

        .patient-stat-icon {
          width: 47px;
          height: 47px;
          flex-shrink: 0;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .patient-stat-icon.blue {
          background: #eff6ff;
        }

        .patient-stat-icon.blue-soft {
          background: #f0f9ff;
          color: #0369a1;
        }

        .patient-stat-icon.pink {
          background: #fdf2f8;
          color: #be185d;
        }

        .patient-stat-icon.orange {
          background: #fff7ed;
          color: #c2410c;
        }

        .patient-stat-card span {
          display: block;
          color: #64748b;
          font-size: 11px;
          font-weight: 650;
        }

        .patient-stat-card strong {
          display: block;
          color: #0f172a;
          font-size: 24px;
          line-height: 1.15;
          margin-top: 2px;
        }

        .patient-stat-card small {
          display: block;
          color: #94a3b8;
          font-size: 9px;
          margin-top: 3px;
        }

        /* =========================
           MAIN CARD
        ========================= */

        .patients-card {
          background: #ffffff;
          border: 1px solid #e5eaf1;
          border-radius: 17px;
          overflow: hidden;
          box-shadow: 0 5px 18px rgba(15, 23, 42, 0.04);
        }

        .patients-card-header {
          min-height: 76px;
          padding: 15px 20px;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          border-bottom: 1px solid #edf1f5;
        }

        .patients-title {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .patients-title-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: #eff6ff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        .patients-title h2 {
          margin: 0;
          color: #0f172a;
          font-size: 15px;
        }

        .patients-title p {
          margin: 3px 0 0;
          color: #94a3b8;
          font-size: 10px;
        }

        /* =========================
           CONTROLS
        ========================= */

        .patients-controls {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .patients-search {
          position: relative;
        }

        .patients-search > span {
          position: absolute;
          left: 11px;
          top: 9px;
          color: #94a3b8;
          font-size: 18px;
        }

        .patients-search input {
          width: 210px;
          height: 38px;
          box-sizing: border-box;
          border: 1px solid #dbe3ed;
          border-radius: 9px;
          background: #f8fafc;
          padding: 0 34px;
          color: #334155;
          font-size: 11px;
          outline: none;
        }

        .patients-search input:focus {
          background: #ffffff;
          border-color: #60a5fa;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.08);
        }

        .patients-search button {
          position: absolute;
          right: 7px;
          top: 6px;
          width: 26px;
          height: 26px;
          border: 0;
          border-radius: 6px;
          background: #e2e8f0;
          color: #64748b;
          cursor: pointer;
          font-size: 16px;
        }

        .gender-filter {
          height: 38px;
          border: 1px solid #dbe3ed;
          border-radius: 9px;
          background: #f8fafc;
          padding: 0 10px;
          color: #475569;
          font-size: 11px;
          outline: none;
        }

        /* =========================
           TABLE
        ========================= */

        .patients-table-wrapper {
          overflow-x: auto;
          max-height: 570px;
          overflow-y: auto;
        }

        .patients-table {
          width: 100%;
          min-width: 950px;
          border-collapse: separate;
          border-spacing: 0;
        }

        .patients-table thead {
          position: sticky;
          top: 0;
          z-index: 2;
        }

        .patients-table th {
          padding: 12px 17px;
          text-align: left;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          color: #64748b;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }

        .patients-table td {
          padding: 14px 17px;
          border-bottom: 1px solid #f1f5f9;
          background: #ffffff;
          color: #475569;
          font-size: 11px;
          vertical-align: middle;
        }

        .patients-table tbody tr {
          transition: 0.15s ease;
        }

        .patients-table tbody tr:hover td {
          background: #f8fbff;
        }

        .patients-table tbody tr:last-child td {
          border-bottom: 0;
        }

        /* =========================
           PATIENT MEMBER
        ========================= */

        .patient-member {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .patient-avatar {
          width: 37px;
          height: 37px;
          border-radius: 10px;
          background: #eff6ff;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 850;
          font-size: 13px;
        }

        .patient-member strong {
          display: block;
          color: #1e293b;
          font-size: 11px;
          font-weight: 800;
        }

        .patient-member span {
          display: block;
          margin-top: 2px;
          color: #94a3b8;
          font-size: 9px;
        }

        /* =========================
           ID
        ========================= */

        .patient-id {
          display: inline-block;
          padding: 6px 8px;
          border-radius: 7px;
          background: #f8fafc;
          color: #475569;
          font-family: monospace;
          font-size: 10px;
          font-weight: 800;
        }

        /* =========================
           AGE
        ========================= */

        .age-cell {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .age-icon {
          width: 27px;
          height: 27px;
          border-radius: 7px;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
        }

        .age-cell strong {
          color: #334155;
          font-size: 11px;
        }

        .age-cell small {
          color: #94a3b8;
          font-size: 9px;
        }

        /* =========================
           GENDER
        ========================= */

        .gender-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 9px;
          border-radius: 8px;
          font-size: 9px;
          font-weight: 800;
        }

        .gender-badge.male {
          background: #eff6ff;
          color: #1d4ed8;
        }

        .gender-badge.female {
          background: #fdf2f8;
          color: #be185d;
        }

        .gender-badge.other {
          background: #f1f5f9;
          color: #475569;
        }

        /* =========================
           REGISTERED
        ========================= */

        .registered-cell {
          display: flex;
          align-items: center;
          gap: 7px;
          white-space: nowrap;
          color: #64748b;
        }

        .calendar-icon {
          width: 27px;
          height: 27px;
          border-radius: 7px;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
        }

        /* =========================
           VIEW BUTTON
        ========================= */

        .patient-view-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          height: 34px;
          padding: 0 11px;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          background: #eff6ff;
          color: #1d4ed8;
          cursor: pointer;
          font-size: 10px;
          font-weight: 800;
          transition: 0.2s ease;
        }

        .patient-view-btn:hover {
          background: #dbeafe;
          border-color: #93c5fd;
          transform: translateY(-1px);
        }

        .patient-view-btn span:last-child {
          font-size: 14px;
        }

        /* =========================
           LOADING
        ========================= */

        .patients-loading {
          min-height: 310px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .patients-loader {
          width: 34px;
          height: 34px;
          border: 3px solid #e2e8f0;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: patientSpin 0.8s linear infinite;
          margin-bottom: 14px;
        }

        .patients-loading h3 {
          margin: 0;
          color: #334155;
          font-size: 14px;
        }

        .patients-loading p {
          margin: 5px 0 0;
          color: #94a3b8;
          font-size: 10px;
        }

        /* =========================
           EMPTY
        ========================= */

        .patients-empty {
          min-height: 310px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 30px;
        }

        .patients-empty-icon {
          width: 62px;
          height: 62px;
          border-radius: 17px;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          margin-bottom: 14px;
        }

        .patients-empty h3 {
          margin: 0;
          color: #334155;
          font-size: 14px;
        }

        .patients-empty p {
          margin: 6px 0 15px;
          color: #94a3b8;
          font-size: 10px;
        }

        .patients-empty button {
          border: 0;
          background: #2563eb;
          color: #ffffff;
          padding: 9px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 10px;
          font-weight: 750;
        }

        /* =========================
           PRIVACY
        ========================= */

        .patients-privacy {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-top: 16px;
          padding: 13px 15px;
          border-radius: 11px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
        }

        .privacy-lock {
          font-size: 15px;
        }

        .patients-privacy strong {
          display: block;
          color: #475569;
          font-size: 10px;
        }

        .patients-privacy p {
          margin: 3px 0 0;
          color: #94a3b8;
          font-size: 9px;
          line-height: 1.5;
        }

        /* =========================
           RESPONSIVE
        ========================= */

        @media (max-width: 1100px) {

          .patients-stats {
            grid-template-columns: repeat(2, 1fr);
          }

        }

        @media (max-width: 750px) {

          .patients-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .patients-refresh-btn {
            width: 100%;
            justify-content: center;
          }

          .patients-stats {
            grid-template-columns: 1fr;
          }

          .patients-card-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .patients-controls {
            width: 100%;
            flex-direction: column;
            align-items: stretch;
          }

          .patients-search input {
            width: 100%;
          }

          .gender-filter {
            width: 100%;
          }

        }

      `}</style>
    </div>
  );
}

export default Patients;