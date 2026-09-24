import { useEffect, useMemo, useState } from "react";

function Staff() {
  const API_BASE =
    import.meta.env.VITE_API_URL ||
    `http://${window.location.hostname}:5000/api`;

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const [form, setForm] = useState({
    name: "",
    role: "Doctor",
    department: "ICU",
    mobile: "",
  });

  /* =========================
     GET STAFF
  ========================= */

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE}/staff`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load staff"
        );
      }

      setStaff(data.staff || data.data || []);
    } catch (err) {
      console.error("Staff error:", err);

      setError(
        err.message || "Unable to connect to backend"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  /* =========================
     FORM CHANGE
  ========================= */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* =========================
     ADD STAFF
  ========================= */

  const addStaff = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Staff name is required");
      return;
    }

    if (!form.role) {
      setError("Staff role is required");
      return;
    }

    if (!form.department.trim()) {
      setError("Department is required");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`${API_BASE}/staff`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          role: form.role,
          department: form.department.trim(),
          mobile: form.mobile.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to register staff"
        );
      }

      setForm({
        name: "",
        role: "Doctor",
        department: "ICU",
        mobile: "",
      });

      setShowForm(false);
      setSuccess("Staff member registered successfully.");

      await fetchStaff();
    } catch (err) {
      console.error("Create staff error:", err);

      setError(
        err.message || "Unable to register staff"
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================
     FILTER
  ========================= */

  const filteredStaff = useMemo(() => {
    const query = search.trim().toLowerCase();

    return staff.filter((member) => {
      const matchesSearch =
        !query ||
        String(member.staffId || "")
          .toLowerCase()
          .includes(query) ||
        String(member.name || "")
          .toLowerCase()
          .includes(query) ||
        String(member.department || "")
          .toLowerCase()
          .includes(query);

      const matchesRole =
        roleFilter === "ALL" ||
        member.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [staff, search, roleFilter]);

  /* =========================
     STATS
  ========================= */

  const stats = useMemo(() => {
    const doctors = staff.filter(
      (member) => member.role === "Doctor"
    ).length;

    const nurses = staff.filter(
      (member) => member.role === "Nurse"
    ).length;

    const departments = new Set(
      staff
        .map((member) => member.department)
        .filter(Boolean)
    ).size;

    return {
      total: staff.length,
      doctors,
      nurses,
      departments,
    };
  }, [staff]);

  /* =========================
     ROLE STYLE
  ========================= */

  const getRoleIcon = (role) => {
    if (role === "Doctor") return "🩺";
    if (role === "Nurse") return "💉";
    return "👤";
  };

  const getRoleClass = (role) => {
    if (role === "Doctor") return "role-badge doctor";
    if (role === "Nurse") return "role-badge nurse";

    return "role-badge";
  };

  /* =========================
     TOGGLE FORM
  ========================= */

  const toggleForm = () => {
    setShowForm((previous) => !previous);
    setError("");
    setSuccess("");
  };

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="staff-page">

      {/* =================================
          HEADER
      ================================= */}

      <div className="staff-header">

        <div>
          <div className="staff-breadcrumb">
            Hospital Management
            <span>›</span>
            Staff
          </div>

          <h1>Hospital Staff</h1>

          <p>
            Manage doctors and nurses registered
            in the hospital surveillance system.
          </p>
        </div>

        <div className="header-actions">

          <button
            type="button"
            className="staff-refresh-btn"
            onClick={fetchStaff}
            disabled={loading}
          >
            <span className={loading ? "spin" : ""}>
              ↻
            </span>

            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            className="staff-add-btn"
            onClick={toggleForm}
          >
            <span>
              {showForm ? "×" : "+"}
            </span>

            {showForm ? "Close Form" : "Add Staff"}
          </button>

        </div>
      </div>

      {/* =================================
          ALERTS
      ================================= */}

      {success && (
        <div className="staff-alert success-alert">
          <div className="alert-icon">✓</div>

          <div>
            <strong>Registration Successful</strong>
            <p>{success}</p>
          </div>

          <button
            type="button"
            onClick={() => setSuccess("")}
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="staff-alert error-alert">
          <div className="alert-icon">!</div>

          <div>
            <strong>Something went wrong</strong>
            <p>{error}</p>
          </div>

          <button
            type="button"
            onClick={() => setError("")}
          >
            ×
          </button>
        </div>
      )}

      {/* =================================
          STATISTICS
      ================================= */}

      <div className="staff-stats">

        <div className="staff-stat-card">

          <div className="stat-icon blue">
            👥
          </div>

          <div>
            <span>Total Staff</span>
            <strong>{stats.total}</strong>
            <small>Registered members</small>
          </div>

        </div>

        <div className="staff-stat-card">

          <div className="stat-icon purple">
            🩺
          </div>

          <div>
            <span>Doctors</span>
            <strong>{stats.doctors}</strong>
            <small>Medical doctors</small>
          </div>

        </div>

        <div className="staff-stat-card">

          <div className="stat-icon green">
            💉
          </div>

          <div>
            <span>Nurses</span>
            <strong>{stats.nurses}</strong>
            <small>Nursing staff</small>
          </div>

        </div>

        <div className="staff-stat-card">

          <div className="stat-icon orange">
            🏥
          </div>

          <div>
            <span>Departments</span>
            <strong>{stats.departments}</strong>
            <small>Active departments</small>
          </div>

        </div>

      </div>

      {/* =================================
          REGISTER FORM
      ================================= */}

      {showForm && (
        <section className="staff-form-card">

          <div className="form-card-header">

            <div className="form-title-icon">
              👨‍⚕️
            </div>

            <div>
              <h2>Register New Staff</h2>

              <p>
                Add a doctor or nurse to the hospital
                system.
              </p>
            </div>

          </div>

          <form
            className="staff-form"
            onSubmit={addStaff}
          >

            <div className="staff-field">

              <label htmlFor="staff-name">
                Staff Name
                <span>*</span>
              </label>

              <div className="field-wrapper">
                <span>👤</span>

                <input
                  id="staff-name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  autoComplete="off"
                />
              </div>

            </div>

            <div className="staff-field">

              <label htmlFor="staff-role">
                Role
                <span>*</span>
              </label>

              <div className="field-wrapper">
                <span>🩺</span>

                <select
                  id="staff-role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                >
                  <option value="Doctor">
                    Doctor
                  </option>

                  <option value="Nurse">
                    Nurse
                  </option>
                </select>
              </div>

            </div>

            <div className="staff-field">

              <label htmlFor="staff-department">
                Department
                <span>*</span>
              </label>

              <div className="field-wrapper">
                <span>🏥</span>

                <input
                  id="staff-department"
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  placeholder="Example: ICU"
                />
              </div>

            </div>

            <div className="staff-field">

              <label htmlFor="staff-mobile">
                Mobile
              </label>

              <div className="field-wrapper">
                <span>📱</span>

                <input
                  id="staff-mobile"
                  type="tel"
                  name="mobile"
                  value={form.mobile}
                  onChange={handleChange}
                  placeholder="Enter mobile number"
                  autoComplete="off"
                />
              </div>

            </div>

            <div className="form-submit-area">

              <button
                type="button"
                className="cancel-form-btn"
                onClick={toggleForm}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="register-btn"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="small-spinner" />
                    Registering...
                  </>
                ) : (
                  <>
                    ✓ Register Staff
                  </>
                )}
              </button>

            </div>

          </form>

        </section>
      )}

      {/* =================================
          STAFF RECORDS
      ================================= */}

      <section className="staff-record-card">

        <div className="records-header">

          <div className="records-title">

            <div className="records-icon">
              👥
            </div>

            <div>
              <h2>Staff Directory</h2>

              <p>
                {filteredStaff.length} of{" "}
                {staff.length} staff members
              </p>
            </div>

          </div>

          <div className="records-controls">

            <div className="staff-search">

              <span>⌕</span>

              <input
                type="text"
                placeholder="Search staff..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                >
                  ×
                </button>
              )}

            </div>

            <select
              className="role-filter"
              value={roleFilter}
              onChange={(e) =>
                setRoleFilter(e.target.value)
              }
            >
              <option value="ALL">
                All Roles
              </option>

              <option value="Doctor">
                Doctors
              </option>

              <option value="Nurse">
                Nurses
              </option>
            </select>

          </div>

        </div>

        {/* =================================
            LOADING
        ================================= */}

        {loading ? (
          <div className="staff-loading">

            <div className="loading-spinner" />

            <h3>Loading staff directory</h3>

            <p>
              Fetching staff records from the
              hospital system...
            </p>

          </div>

        ) : filteredStaff.length === 0 ? (

          /* =================================
              EMPTY
          ================================= */

          <div className="staff-empty">

            <div className="empty-icon">
              👨‍⚕️
            </div>

            <h3>
              {staff.length === 0
                ? "No staff registered"
                : "No matching staff found"}
            </h3>

            <p>
              {staff.length === 0
                ? "Register a doctor or nurse to get started."
                : "Try changing your search or role filter."}
            </p>

            {staff.length === 0 ? (
              <button
                type="button"
                onClick={() => setShowForm(true)}
              >
                + Add First Staff Member
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setRoleFilter("ALL");
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

          <div className="staff-table-wrapper">

            <table className="staff-table">

              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Staff ID</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Mobile</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>

                {filteredStaff.map((member) => (

                  <tr
                    key={
                      member._id ||
                      member.staffId
                    }
                  >

                    <td>

                      <div className="staff-member">

                        <div
                          className={
                            member.role === "Doctor"
                              ? "member-avatar doctor-avatar"
                              : "member-avatar nurse-avatar"
                          }
                        >
                          {getRoleIcon(member.role)}
                        </div>

                        <div>
                          <strong>
                            {member.name || "—"}
                          </strong>

                          <span>
                            Hospital Staff
                          </span>
                        </div>

                      </div>

                    </td>

                    <td>

                      <span className="staff-id">
                        {member.staffId || "—"}
                      </span>

                    </td>

                    <td>

                      <span
                        className={getRoleClass(
                          member.role
                        )}
                      >
                        <span>
                          {getRoleIcon(member.role)}
                        </span>

                        {member.role || "—"}
                      </span>

                    </td>

                    <td>

                      <div className="department-cell">

                        <span className="department-icon">
                          🏥
                        </span>

                        <span>
                          {member.department || "—"}
                        </span>

                      </div>

                    </td>

                    <td>

                      <div className="mobile-cell">

                        <span>📱</span>

                        {member.mobile || "Not provided"}

                      </div>

                    </td>

                    <td>

                      <span className="active-status">
                        <span />
                        Registered
                      </span>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </section>

      {/* =================================
          PRIVACY NOTE
      ================================= */}

      <div className="staff-privacy">

        <div className="privacy-icon">
          🔒
        </div>

        <div>

          <strong>
            Staff data & movement tracking
          </strong>

          <p>
            Staff records are used for hospital
            movement logging and contact detection.
            This page does not display MDRO
            positive/negative status or diagnosis.
          </p>

        </div>

      </div>

      {/* =================================
          PAGE CSS
      ================================= */}

      <style>{`

        .staff-page {
          padding-bottom: 40px;
          animation: staffPageIn 0.35s ease;
        }

        @keyframes staffPageIn {
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

        .staff-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 25px;
        }

        .staff-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #94a3b8;
          font-size: 11px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .staff-breadcrumb span {
          color: #cbd5e1;
        }

        .staff-header h1 {
          margin: 0;
          color: #0f172a;
          font-size: 30px;
          line-height: 1.15;
          font-weight: 800;
          letter-spacing: -0.7px;
        }

        .staff-header p {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 13px;
        }

        .header-actions {
          display: flex;
          gap: 10px;
        }

        .staff-refresh-btn,
        .staff-add-btn {
          height: 42px;
          padding: 0 15px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 750;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          transition: 0.2s ease;
        }

        .staff-refresh-btn {
          border: 1px solid #dbe3ed;
          background: #fff;
          color: #475569;
        }

        .staff-refresh-btn:hover {
          background: #f8fafc;
          transform: translateY(-1px);
        }

        .staff-add-btn {
          border: 0;
          background: #2563eb;
          color: #fff;
          box-shadow: 0 5px 14px rgba(37, 99, 235, 0.2);
        }

        .staff-add-btn:hover {
          background: #1d4ed8;
          transform: translateY(-1px);
        }

        .staff-add-btn span {
          font-size: 18px;
          line-height: 1;
        }

        .staff-refresh-btn:disabled {
          opacity: 0.6;
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

        /* =========================
           ALERTS
        ========================= */

        .staff-alert {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 15px;
          border-radius: 12px;
          margin-bottom: 18px;
          border: 1px solid;
        }

        .success-alert {
          background: #f0fdf4;
          border-color: #bbf7d0;
        }

        .error-alert {
          background: #fef2f2;
          border-color: #fecaca;
        }

        .staff-alert .alert-icon {
          width: 34px;
          height: 34px;
          flex-shrink: 0;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
        }

        .success-alert .alert-icon {
          background: #dcfce7;
          color: #15803d;
        }

        .error-alert .alert-icon {
          background: #fee2e2;
          color: #b91c1c;
        }

        .staff-alert strong {
          display: block;
          font-size: 12px;
          color: #334155;
        }

        .staff-alert p {
          margin: 2px 0 0;
          font-size: 10px;
          color: #64748b;
        }

        .staff-alert > button {
          margin-left: auto;
          border: 0;
          background: transparent;
          color: #94a3b8;
          font-size: 20px;
          cursor: pointer;
        }

        /* =========================
           STATS
        ========================= */

        .staff-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 21px;
        }

        .staff-stat-card {
          min-height: 102px;
          box-sizing: border-box;
          padding: 17px;
          background: #fff;
          border: 1px solid #e5eaf1;
          border-radius: 15px;
          display: flex;
          align-items: center;
          gap: 13px;
          box-shadow: 0 5px 18px rgba(15, 23, 42, 0.04);
          transition: 0.2s ease;
        }

        .staff-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08);
        }

        .stat-icon {
          width: 47px;
          height: 47px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
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

        .staff-stat-card span {
          display: block;
          color: #64748b;
          font-size: 11px;
          font-weight: 650;
        }

        .staff-stat-card strong {
          display: block;
          color: #0f172a;
          font-size: 24px;
          line-height: 1.15;
          margin-top: 2px;
        }

        .staff-stat-card small {
          display: block;
          color: #94a3b8;
          font-size: 9px;
          margin-top: 3px;
        }

        /* =========================
           FORM
        ========================= */

        .staff-form-card {
          background: #fff;
          border: 1px solid #dbe4ef;
          border-radius: 17px;
          padding: 21px;
          margin-bottom: 21px;
          box-shadow: 0 8px 25px rgba(15, 23, 42, 0.06);
          animation: formIn 0.25s ease;
        }

        @keyframes formIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .form-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-bottom: 17px;
          border-bottom: 1px solid #eef2f7;
          margin-bottom: 19px;
        }

        .form-title-icon {
          width: 42px;
          height: 42px;
          border-radius: 11px;
          background: #eff6ff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 19px;
        }

        .form-card-header h2 {
          margin: 0;
          color: #0f172a;
          font-size: 16px;
        }

        .form-card-header p {
          margin: 4px 0 0;
          color: #94a3b8;
          font-size: 10px;
        }

        .staff-form {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
        }

        .staff-field label {
          display: block;
          margin-bottom: 7px;
          color: #475569;
          font-size: 11px;
          font-weight: 750;
        }

        .staff-field label span {
          color: #ef4444;
          margin-left: 3px;
        }

        .field-wrapper {
          position: relative;
        }

        .field-wrapper > span {
          position: absolute;
          left: 12px;
          top: 12px;
          font-size: 14px;
          z-index: 1;
        }

        .field-wrapper input,
        .field-wrapper select {
          width: 100%;
          height: 43px;
          box-sizing: border-box;
          border: 1px solid #dbe3ed;
          border-radius: 10px;
          background: #f8fafc;
          padding: 0 11px 0 36px;
          color: #1e293b;
          font-size: 12px;
          outline: none;
          transition: 0.2s ease;
        }

        .field-wrapper input:focus,
        .field-wrapper select:focus {
          background: #fff;
          border-color: #60a5fa;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-submit-area {
          grid-column: 1 / -1;
          display: flex;
          justify-content: flex-end;
          gap: 9px;
          padding-top: 5px;
        }

        .cancel-form-btn,
        .register-btn {
          height: 40px;
          padding: 0 15px;
          border-radius: 9px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 750;
        }

        .cancel-form-btn {
          border: 1px solid #dbe3ed;
          background: #fff;
          color: #64748b;
        }

        .register-btn {
          border: 0;
          background: #2563eb;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .register-btn:hover {
          background: #1d4ed8;
        }

        .register-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .small-spinner {
          width: 13px;
          height: 13px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        /* =========================
           RECORDS
        ========================= */

        .staff-record-card {
          background: #fff;
          border: 1px solid #e5eaf1;
          border-radius: 17px;
          overflow: hidden;
          box-shadow: 0 5px 18px rgba(15, 23, 42, 0.04);
        }

        .records-header {
          min-height: 76px;
          padding: 15px 20px;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          border-bottom: 1px solid #edf1f5;
        }

        .records-title {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .records-icon {
          width: 39px;
          height: 39px;
          border-radius: 10px;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .records-title h2 {
          margin: 0;
          color: #0f172a;
          font-size: 15px;
        }

        .records-title p {
          margin: 3px 0 0;
          color: #94a3b8;
          font-size: 10px;
        }

        .records-controls {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .staff-search {
          position: relative;
        }

        .staff-search > span {
          position: absolute;
          left: 11px;
          top: 10px;
          color: #94a3b8;
          font-size: 17px;
        }

        .staff-search input {
          width: 205px;
          height: 38px;
          box-sizing: border-box;
          border: 1px solid #dbe3ed;
          border-radius: 9px;
          background: #f8fafc;
          padding: 0 33px 0 33px;
          outline: none;
          color: #334155;
          font-size: 11px;
        }

        .staff-search input:focus {
          background: #fff;
          border-color: #60a5fa;
        }

        .staff-search button {
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

        .role-filter {
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

        .staff-table-wrapper {
          overflow-x: auto;
          max-height: 570px;
          overflow-y: auto;
        }

        .staff-table {
          width: 100%;
          min-width: 900px;
          border-collapse: separate;
          border-spacing: 0;
        }

        .staff-table thead {
          position: sticky;
          top: 0;
          z-index: 2;
        }

        .staff-table th {
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

        .staff-table td {
          padding: 14px 17px;
          border-bottom: 1px solid #f1f5f9;
          color: #475569;
          font-size: 11px;
          background: #fff;
          vertical-align: middle;
        }

        .staff-table tbody tr {
          transition: 0.15s ease;
        }

        .staff-table tbody tr:hover td {
          background: #f8fbff;
        }

        .staff-table tbody tr:last-child td {
          border-bottom: 0;
        }

        /* MEMBER */

        .staff-member {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .member-avatar {
          width: 37px;
          height: 37px;
          flex-shrink: 0;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
        }

        .doctor-avatar {
          background: #eff6ff;
        }

        .nurse-avatar {
          background: #ecfdf5;
        }

        .staff-member strong {
          display: block;
          color: #1e293b;
          font-size: 11px;
          font-weight: 800;
        }

        .staff-member span {
          display: block;
          color: #94a3b8;
          font-size: 9px;
          margin-top: 2px;
        }

        /* ID */

        .staff-id {
          display: inline-block;
          padding: 6px 8px;
          border-radius: 7px;
          background: #f8fafc;
          color: #475569;
          font-size: 10px;
          font-weight: 800;
          font-family: monospace;
        }

        /* ROLE */

        .role-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 9px;
          border-radius: 8px;
          background: #f1f5f9;
          color: #475569;
          font-size: 9px;
          font-weight: 800;
        }

        .role-badge.doctor {
          background: #eff6ff;
          color: #1d4ed8;
        }

        .role-badge.nurse {
          background: #ecfdf5;
          color: #047857;
        }

        /* DEPARTMENT */

        .department-cell {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #475569;
          font-weight: 650;
        }

        .department-icon {
          width: 27px;
          height: 27px;
          border-radius: 7px;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* MOBILE */

        .mobile-cell {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #64748b;
          white-space: nowrap;
        }

        /* STATUS */

        .active-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 9px;
          border-radius: 8px;
          background: #ecfdf5;
          color: #15803d;
          font-size: 9px;
          font-weight: 800;
        }

        .active-status span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 0 3px rgba(34,197,94,0.12);
        }

        /* =========================
           LOADING
        ========================= */

        .staff-loading {
          min-height: 300px;
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
          margin-bottom: 13px;
        }

        .staff-loading h3 {
          margin: 0;
          color: #334155;
          font-size: 14px;
        }

        .staff-loading p {
          margin: 5px 0 0;
          color: #94a3b8;
          font-size: 10px;
        }

        /* =========================
           EMPTY
        ========================= */

        .staff-empty {
          min-height: 300px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 30px;
        }

        .empty-icon {
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

        .staff-empty h3 {
          margin: 0;
          color: #334155;
          font-size: 14px;
        }

        .staff-empty p {
          margin: 6px 0 15px;
          color: #94a3b8;
          font-size: 10px;
        }

        .staff-empty button {
          border: 0;
          background: #2563eb;
          color: #fff;
          padding: 9px 14px;
          border-radius: 8px;
          font-size: 10px;
          font-weight: 750;
          cursor: pointer;
        }

        /* =========================
           PRIVACY
        ========================= */

        .staff-privacy {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-top: 16px;
          padding: 13px 15px;
          border-radius: 11px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
        }

        .privacy-icon {
          font-size: 15px;
        }

        .staff-privacy strong {
          display: block;
          color: #475569;
          font-size: 10px;
        }

        .staff-privacy p {
          margin: 3px 0 0;
          color: #94a3b8;
          font-size: 9px;
          line-height: 1.5;
        }

        /* =========================
           RESPONSIVE
        ========================= */

        @media (max-width: 1100px) {

          .staff-stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .staff-form {
            grid-template-columns: repeat(2, 1fr);
          }

        }

        @media (max-width: 750px) {

          .staff-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .header-actions {
            width: 100%;
          }

          .staff-refresh-btn,
          .staff-add-btn {
            flex: 1;
          }

          .staff-stats {
            grid-template-columns: 1fr;
          }

          .staff-form {
            grid-template-columns: 1fr;
          }

          .records-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .records-controls {
            width: 100%;
            flex-direction: column;
            align-items: stretch;
          }

          .staff-search input {
            width: 100%;
          }

          .role-filter {
            width: 100%;
          }

        }

      `}</style>
    </div>
  );
}

export default Staff;