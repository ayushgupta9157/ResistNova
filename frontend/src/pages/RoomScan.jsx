import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function RoomScan() {
  const { qrValue } = useParams();

  const API_BASE =
    import.meta.env.VITE_API_URL ||
    `http://${window.location.hostname}:5000/api`;

  const [location, setLocation] = useState(null);
  const [staffId, setStaffId] = useState("");
  const [staff, setStaff] = useState(null);

  const [loadingRoom, setLoadingRoom] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [recording, setRecording] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* ==========================================
     LOAD ROOM FROM QR
  ========================================== */

  useEffect(() => {
    const loadRoom = async () => {
      try {
        setLoadingRoom(true);
        setError("");

        if (!qrValue) {
          throw new Error("Invalid room QR code");
        }

        const response = await fetch(
          `${API_BASE}/locations/qr/${encodeURIComponent(
            qrValue
          )}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Invalid or inactive room QR"
          );
        }

        setLocation(data.location);
      } catch (err) {
        console.error("Room QR error:", err);
        setError(
          err.message || "Unable to load room"
        );
      } finally {
        setLoadingRoom(false);
      }
    };

    loadRoom();
  }, [qrValue]);

  /* ==========================================
     VERIFY STAFF
  ========================================== */

  const verifyStaff = async () => {
    setError("");
    setSuccess("");
    setStaff(null);

    const id = staffId.trim();

    if (!id) {
      setError("Please enter Staff ID");
      return;
    }

    try {
      setVerifying(true);

      const response = await fetch(
        `${API_BASE}/staff/${encodeURIComponent(id)}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Staff ID not found"
        );
      }

      setStaff(data.staff);
    } catch (err) {
      console.error(
        "Staff verification error:",
        err
      );

      setError(
        err.message || "Staff verification failed"
      );
    } finally {
      setVerifying(false);
    }
  };

  /* ==========================================
     RECORD MOVEMENT
  ========================================== */

  const recordMovement = async (action) => {
    setError("");
    setSuccess("");

    if (!location) {
      setError(
        "Room information is not available"
      );
      return;
    }

    if (!staff) {
      setError(
        "Please verify Staff ID first"
      );
      return;
    }

    try {
      setRecording(true);

      let response;

      if (action === "ENTRY") {
        response = await fetch(
          `${API_BASE}/movements`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              personId: staff.staffId,
              personType: staff.role,
              locationId: location.locationId,
              action: "ENTRY",
              loggedBy: "QR_SCAN",
            }),
          }
        );
      }

      if (action === "EXIT") {
        response = await fetch(
          `${API_BASE}/movements/exit`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              personId: staff.staffId,
              locationId: location.locationId,
            }),
          }
        );
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            `Staff ${action.toLowerCase()} failed`
        );
      }

      setSuccess(
        `${action === "ENTRY" ? "Entry" : "Exit"} recorded successfully`
      );

    } catch (err) {
      console.error("Movement error:", err);

      setError(
        err.message ||
          "Unable to record movement"
      );
    } finally {
      setRecording(false);
    }
  };

  /* ==========================================
     LOADING SCREEN
  ========================================== */

  if (loadingRoom) {
    return (
      <div className="roomscan-page">

        <div className="roomscan-card loading-card">

          <div className="brand-mark">
            R
          </div>

          <h1>ResistNova</h1>

          <div className="loading-spinner" />

          <h3>
            Loading room information
          </h3>

          <p>
            Verifying the scanned room QR...
          </p>

        </div>

        <RoomScanStyles />

      </div>
    );
  }

  /* ==========================================
     INVALID ROOM
  ========================================== */

  if (!location) {
    return (
      <div className="roomscan-page">

        <div className="roomscan-card">

          <div className="brand-section">

            <div className="brand-mark">
              R
            </div>

            <div>
              <h1>ResistNova</h1>
              <p>
                Hospital Movement System
              </p>
            </div>

          </div>

          <div className="invalid-room">

            <div className="invalid-icon">
              !
            </div>

            <h2>Invalid Room QR</h2>

            <p>
              {error ||
                "This QR code is invalid or the room is inactive."}
            </p>

          </div>

          <div className="secure-footer">
            🔒 Secure hospital access
          </div>

        </div>

        <RoomScanStyles />

      </div>
    );
  }

  /* ==========================================
     MAIN PAGE
  ========================================== */

  return (
    <div className="roomscan-page">

      <div className="roomscan-card">

        {/* ==================================
            HEADER
        ================================== */}

        <div className="roomscan-header">

          <div className="brand-section">

            <div className="brand-mark">
              R
            </div>

            <div>
              <h1>ResistNova</h1>

              <p>
                Staff Movement System
              </p>
            </div>

          </div>

          <div className="secure-pill">
            <span />
            Secure
          </div>

        </div>

        {/* ==================================
            ROOM INFORMATION
        ================================== */}

        <div className="room-hero">

          <div className="room-visual">
            <div className="room-building">
              🏥
            </div>

            <div className="scan-ring" />
          </div>

          <div className="room-content">

            <span className="room-overline">
              SCANNED LOCATION
            </span>

            <h2>
              {location.name}
            </h2>

            <div className="room-id">
              <span>●</span>

              Location ID:
              <strong>
                {location.locationId}
              </strong>
            </div>

          </div>

        </div>

        {/* ==================================
            STEP INDICATOR
        ================================== */}

        <div className="steps">

          <div className="step active">
            <span>1</span>
            <div>
              <strong>Room</strong>
              <small>Verified</small>
            </div>
          </div>

          <div className="step-line" />

          <div
            className={
              staff
                ? "step active"
                : "step"
            }
          >
            <span>2</span>
            <div>
              <strong>Staff</strong>
              <small>
                {staff
                  ? "Verified"
                  : "Verify ID"}
              </small>
            </div>
          </div>

          <div className="step-line" />

          <div
            className={
              staff
                ? "step active"
                : "step"
            }
          >
            <span>3</span>
            <div>
              <strong>Movement</strong>
              <small>Record</small>
            </div>
          </div>

        </div>

        {/* ==================================
            ERROR
        ================================== */}

        {error && (
          <div className="room-alert error">

            <div className="alert-symbol">
              !
            </div>

            <div>
              <strong>
                Action could not be completed
              </strong>

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

        {/* ==================================
            SUCCESS
        ================================== */}

        {success && (
          <div className="room-alert success">

            <div className="alert-symbol">
              ✓
            </div>

            <div>
              <strong>
                Movement Recorded
              </strong>

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

        {/* ==================================
            STAFF VERIFICATION
        ================================== */}

        <div className="staff-section">

          <div className="section-heading">

            <div className="section-number">
              01
            </div>

            <div>
              <h3>
                Verify Staff Identity
              </h3>

              <p>
                Enter the Staff ID before
                recording movement.
              </p>
            </div>

          </div>

          <label htmlFor="staff-id">
            Staff ID
          </label>

          <div className="staff-input-row">

            <div className="staff-input">

              <span>👤</span>

              <input
                id="staff-id"
                type="text"
                value={staffId}
                onChange={(e) => {
                  setStaffId(
                    e.target.value.toUpperCase()
                  );

                  setStaff(null);
                  setError("");
                  setSuccess("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    verifyStaff();
                  }
                }}
                placeholder="e.g. S001"
                autoComplete="off"
              />

            </div>

            <button
              type="button"
              className="verify-button"
              onClick={verifyStaff}
              disabled={verifying}
            >
              {verifying ? (
                <>
                  <span className="button-spinner" />
                  Checking
                </>
              ) : (
                <>
                  Verify
                  <span>→</span>
                </>
              )}
            </button>

          </div>

          <div className="input-hint">
            Staff ID is verified against the
            hospital staff registry.
          </div>

        </div>

        {/* ==================================
            VERIFIED STAFF
        ================================== */}

        {staff && (
          <div className="verified-staff">

            <div className="verified-top">

              <div className="verified-icon">
                {staff.role === "Doctor"
                  ? "🩺"
                  : "💉"}
              </div>

              <div className="verified-info">

                <div className="verified-label">
                  ✓ ID VERIFIED
                </div>

                <h3>
                  {staff.name}
                </h3>

                <p>
                  {staff.role}
                  {staff.department
                    ? ` • ${staff.department}`
                    : ""}
                </p>

              </div>

              <div className="verified-check">
                ✓
              </div>

            </div>

            <div className="verified-details">

              <div>
                <span>STAFF ID</span>
                <strong>
                  {staff.staffId}
                </strong>
              </div>

              <div>
                <span>ROLE</span>
                <strong>
                  {staff.role}
                </strong>
              </div>

              {staff.mobile && (
                <div>
                  <span>MOBILE</span>
                  <strong>
                    {staff.mobile}
                  </strong>
                </div>
              )}

            </div>

          </div>
        )}

        {/* ==================================
            MOVEMENT
        ================================== */}

        {staff && (
          <div className="movement-section">

            <div className="section-heading">

              <div className="section-number">
                02
              </div>

              <div>
                <h3>
                  Record Movement
                </h3>

                <p>
                  Select the current movement
                  action for this room.
                </p>
              </div>

            </div>

            <div className="movement-buttons">

              <button
                type="button"
                className="movement-button entry"
                onClick={() =>
                  recordMovement("ENTRY")
                }
                disabled={recording}
              >

                <div className="movement-icon">
                  ↓
                </div>

                <div className="movement-button-text">
                  <strong>ENTRY</strong>
                  <span>
                    Staff entering room
                  </span>
                </div>

                <div className="movement-arrow">
                  →
                </div>

              </button>

              <button
                type="button"
                className="movement-button exit"
                onClick={() =>
                  recordMovement("EXIT")
                }
                disabled={recording}
              >

                <div className="movement-icon">
                  ↑
                </div>

                <div className="movement-button-text">
                  <strong>EXIT</strong>
                  <span>
                    Staff leaving room
                  </span>
                </div>

                <div className="movement-arrow">
                  →
                </div>

              </button>

            </div>

            <div className="automatic-time">

              <span className="clock-icon">
                ⏱
              </span>

              <div>
                <strong>
                  Automatic Time Recording
                </strong>

                <p>
                  ResistNova records the exact
                  server time automatically.
                </p>
              </div>

            </div>

          </div>
        )}

        {/* ==================================
            FOOTER
        ================================== */}

        <div className="roomscan-footer">

          <div>
            🔒
          </div>

          <span>
            Secure Staff Movement Recording
          </span>

          <span className="footer-dot">
            •
          </span>

          <span>
            ResistNova
          </span>

        </div>

      </div>

      <RoomScanStyles />

    </div>
  );
}

/* =====================================================
   STYLES
===================================================== */

function RoomScanStyles() {
  return (
    <style>{`

      * {
        box-sizing: border-box;
      }

      .roomscan-page {
        min-height: 100vh;
        width: 100%;
        padding: 25px 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        background:
          radial-gradient(
            circle at top left,
            #dbeafe 0,
            transparent 35%
          ),
          radial-gradient(
            circle at bottom right,
            #e0f2fe 0,
            transparent 35%
          ),
          #f5f9ff;
        font-family:
          Inter,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          Arial,
          sans-serif;
        color: #0f172a;
      }

      .roomscan-card {
        width: 100%;
        max-width: 520px;
        background: rgba(255,255,255,0.96);
        border: 1px solid #e2e8f0;
        border-radius: 24px;
        padding: 25px;
        box-shadow:
          0 25px 70px rgba(15,23,42,0.11),
          0 4px 12px rgba(15,23,42,0.04);
      }

      /* =========================
         HEADER
      ========================= */

      .roomscan-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 15px;
        margin-bottom: 22px;
      }

      .brand-section {
        display: flex;
        align-items: center;
        gap: 11px;
      }

      .brand-mark {
        width: 42px;
        height: 42px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(
          135deg,
          #2563eb,
          #1d4ed8
        );
        color: #fff;
        font-size: 19px;
        font-weight: 900;
        box-shadow:
          0 7px 18px rgba(37,99,235,0.22);
      }

      .brand-section h1 {
        margin: 0;
        color: #0f172a;
        font-size: 17px;
        font-weight: 850;
        letter-spacing: -0.3px;
      }

      .brand-section p {
        margin: 2px 0 0;
        color: #94a3b8;
        font-size: 9px;
        font-weight: 600;
      }

      .secure-pill {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 9px;
        border-radius: 20px;
        background: #ecfdf5;
        color: #15803d;
        font-size: 9px;
        font-weight: 800;
      }

      .secure-pill span {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #22c55e;
        box-shadow:
          0 0 0 3px rgba(34,197,94,0.12);
      }

      /* =========================
         ROOM HERO
      ========================= */

      .room-hero {
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        gap: 17px;
        padding: 20px;
        border-radius: 18px;
        background:
          linear-gradient(
            135deg,
            #eff6ff,
            #f8fbff
          );
        border: 1px solid #dbeafe;
        margin-bottom: 20px;
      }

      .room-hero::after {
        content: "";
        position: absolute;
        width: 150px;
        height: 150px;
        right: -65px;
        top: -75px;
        border-radius: 50%;
        border: 25px solid rgba(59,130,246,0.05);
      }

      .room-visual {
        position: relative;
        width: 66px;
        height: 66px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .room-building {
        position: relative;
        z-index: 2;
        width: 57px;
        height: 57px;
        border-radius: 16px;
        background: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 27px;
        box-shadow:
          0 8px 20px rgba(37,99,235,0.10);
      }

      .scan-ring {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        border: 1px solid rgba(37,99,235,0.22);
      }

      .room-overline {
        display: block;
        color: #64748b;
        font-size: 8px;
        font-weight: 850;
        letter-spacing: 1.1px;
        margin-bottom: 4px;
      }

      .room-content h2 {
        position: relative;
        z-index: 1;
        margin: 0;
        color: #0f3d68;
        font-size: 23px;
        font-weight: 850;
        letter-spacing: -0.5px;
      }

      .room-id {
        margin-top: 5px;
        display: flex;
        align-items: center;
        gap: 5px;
        color: #64748b;
        font-size: 10px;
      }

      .room-id > span {
        color: #22c55e;
        font-size: 8px;
      }

      .room-id strong {
        color: #475569;
        font-family: monospace;
      }

      /* =========================
         STEPS
      ========================= */

      .steps {
        display: flex;
        align-items: center;
        margin-bottom: 22px;
      }

      .step {
        display: flex;
        align-items: center;
        gap: 7px;
        opacity: 0.45;
      }

      .step.active {
        opacity: 1;
      }

      .step > span {
        width: 25px;
        height: 25px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #e2e8f0;
        color: #64748b;
        font-size: 9px;
        font-weight: 850;
      }

      .step.active > span {
        background: #2563eb;
        color: #fff;
        box-shadow:
          0 4px 10px rgba(37,99,235,0.18);
      }

      .step strong {
        display: block;
        color: #475569;
        font-size: 9px;
      }

      .step small {
        display: block;
        color: #94a3b8;
        font-size: 8px;
        margin-top: 1px;
      }

      .step-line {
        flex: 1;
        height: 1px;
        margin: 0 8px;
        background: #e2e8f0;
      }

      /* =========================
         ALERTS
      ========================= */

      .room-alert {
        position: relative;
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 12px;
        border-radius: 12px;
        margin-bottom: 18px;
      }

      .room-alert.error {
        background: #fff7f7;
        border: 1px solid #fecaca;
        color: #991b1b;
      }

      .room-alert.success {
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        color: #166534;
      }

      .alert-symbol {
        width: 29px;
        height: 29px;
        flex-shrink: 0;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 900;
      }

      .error .alert-symbol {
        background: #fee2e2;
      }

      .success .alert-symbol {
        background: #dcfce7;
      }

      .room-alert strong {
        display: block;
        font-size: 10px;
      }

      .room-alert p {
        margin: 3px 20px 0 0;
        font-size: 9px;
        line-height: 1.4;
        opacity: 0.85;
      }

      .room-alert button {
        position: absolute;
        right: 9px;
        top: 8px;
        border: 0;
        background: transparent;
        color: inherit;
        opacity: 0.55;
        font-size: 18px;
        cursor: pointer;
      }

      /* =========================
         SECTION HEADING
      ========================= */

      .section-heading {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 15px;
      }

      .section-number {
        width: 31px;
        height: 31px;
        border-radius: 9px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #eff6ff;
        color: #2563eb;
        font-size: 9px;
        font-weight: 900;
      }

      .section-heading h3 {
        margin: 0;
        color: #1e293b;
        font-size: 13px;
        font-weight: 800;
      }

      .section-heading p {
        margin: 3px 0 0;
        color: #94a3b8;
        font-size: 9px;
      }

      /* =========================
         STAFF SECTION
      ========================= */

      .staff-section {
        padding-bottom: 20px;
        border-bottom: 1px solid #eef2f7;
      }

      .staff-section > label {
        display: block;
        color: #475569;
        font-size: 10px;
        font-weight: 800;
        margin-bottom: 7px;
      }

      .staff-input-row {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 8px;
      }

      .staff-input {
        position: relative;
      }

      .staff-input > span {
        position: absolute;
        left: 12px;
        top: 11px;
        font-size: 14px;
      }

      .staff-input input {
        width: 100%;
        height: 43px;
        border: 1px solid #dbe3ed;
        border-radius: 10px;
        background: #f8fafc;
        padding: 0 12px 0 35px;
        outline: none;
        color: #1e293b;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        transition: 0.2s ease;
      }

      .staff-input input:focus {
        background: #fff;
        border-color: #60a5fa;
        box-shadow:
          0 0 0 3px rgba(59,130,246,0.09);
      }

      .verify-button {
        height: 43px;
        min-width: 105px;
        padding: 0 14px;
        border: 0;
        border-radius: 10px;
        background: #0f172a;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        cursor: pointer;
        font-size: 10px;
        font-weight: 800;
        transition: 0.2s ease;
      }

      .verify-button:hover {
        background: #1e293b;
        transform: translateY(-1px);
      }

      .verify-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .verify-button span {
        font-size: 15px;
      }

      .input-hint {
        margin-top: 6px;
        color: #94a3b8;
        font-size: 8px;
      }

      /* =========================
         VERIFIED STAFF
      ========================= */

      .verified-staff {
        margin-top: 17px;
        padding: 15px;
        border: 1px solid #bbf7d0;
        border-radius: 15px;
        background:
          linear-gradient(
            135deg,
            #f0fdf4,
            #f8fffa
          );
        animation: verifiedIn 0.25s ease;
      }

      @keyframes verifiedIn {
        from {
          opacity: 0;
          transform: translateY(5px);
        }

        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .verified-top {
        display: flex;
        align-items: center;
        gap: 11px;
      }

      .verified-icon {
        width: 43px;
        height: 43px;
        border-radius: 12px;
        background: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
      }

      .verified-info {
        flex: 1;
        min-width: 0;
      }

      .verified-label {
        color: #15803d;
        font-size: 7px;
        font-weight: 900;
        letter-spacing: 0.7px;
        margin-bottom: 2px;
      }

      .verified-info h3 {
        margin: 0;
        color: #14532d;
        font-size: 14px;
        font-weight: 850;
      }

      .verified-info p {
        margin: 2px 0 0;
        color: #64748b;
        font-size: 9px;
      }

      .verified-check {
        width: 27px;
        height: 27px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #22c55e;
        color: #fff;
        font-size: 12px;
        font-weight: 900;
      }

      .verified-details {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin-top: 13px;
        padding-top: 12px;
        border-top: 1px solid #dcfce7;
      }

      .verified-details span {
        display: block;
        color: #94a3b8;
        font-size: 7px;
        font-weight: 800;
        letter-spacing: 0.5px;
      }

      .verified-details strong {
        display: block;
        color: #475569;
        font-size: 9px;
        margin-top: 3px;
      }

      /* =========================
         MOVEMENT
      ========================= */

      .movement-section {
        padding-top: 20px;
      }

      .movement-buttons {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      .movement-button {
        position: relative;
        min-height: 82px;
        border: 1px solid;
        border-radius: 14px;
        padding: 12px;
        display: flex;
        align-items: center;
        gap: 10px;
        text-align: left;
        cursor: pointer;
        transition:
          transform 0.2s ease,
          box-shadow 0.2s ease;
      }

      .movement-button:hover:not(:disabled) {
        transform: translateY(-2px);
      }

      .movement-button:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .movement-button.entry {
        background: #f0fdf4;
        border-color: #bbf7d0;
        color: #166534;
      }

      .movement-button.exit {
        background: #fff7ed;
        border-color: #fed7aa;
        color: #c2410c;
      }

      .movement-button.entry:hover:not(:disabled) {
        box-shadow:
          0 9px 22px rgba(22,101,52,0.09);
      }

      .movement-button.exit:hover:not(:disabled) {
        box-shadow:
          0 9px 22px rgba(194,65,12,0.09);
      }

      .movement-icon {
        width: 39px;
        height: 39px;
        flex-shrink: 0;
        border-radius: 11px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #fff;
        font-size: 21px;
        font-weight: 900;
      }

      .movement-button-text {
        min-width: 0;
        flex: 1;
      }

      .movement-button-text strong {
        display: block;
        font-size: 12px;
        font-weight: 900;
      }

      .movement-button-text span {
        display: block;
        margin-top: 3px;
        color: #64748b;
        font-size: 8px;
        line-height: 1.3;
      }

      .movement-arrow {
        font-size: 16px;
        opacity: 0.45;
      }

      .automatic-time {
        display: flex;
        align-items: center;
        gap: 9px;
        margin-top: 11px;
        padding: 10px 11px;
        border-radius: 10px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
      }

      .clock-icon {
        font-size: 15px;
      }

      .automatic-time strong {
        display: block;
        color: #475569;
        font-size: 8px;
      }

      .automatic-time p {
        margin: 2px 0 0;
        color: #94a3b8;
        font-size: 8px;
      }

      /* =========================
         FOOTER
      ========================= */

      .roomscan-footer {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
        gap: 5px;
        padding-top: 17px;
        margin-top: 20px;
        border-top: 1px solid #eef2f7;
        color: #94a3b8;
        font-size: 8px;
      }

      .footer-dot {
        color: #cbd5e1;
      }

      /* =========================
         LOADING
      ========================= */

      .loading-card {
        text-align: center;
        padding: 45px 25px;
      }

      .loading-card .brand-mark {
        margin: 0 auto 12px;
      }

      .loading-card h1 {
        margin: 0;
        font-size: 18px;
      }

      .loading-spinner {
        width: 34px;
        height: 34px;
        margin: 28px auto 13px;
        border: 3px solid #dbeafe;
        border-top-color: #2563eb;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .loading-card h3 {
        margin: 0;
        font-size: 13px;
        color: #334155;
      }

      .loading-card p {
        margin: 5px 0 0;
        font-size: 9px;
        color: #94a3b8;
      }

      /* =========================
         INVALID
      ========================= */

      .invalid-room {
        padding: 35px 10px 25px;
        text-align: center;
      }

      .invalid-icon {
        width: 58px;
        height: 58px;
        margin: 0 auto 15px;
        border-radius: 17px;
        background: #fee2e2;
        color: #dc2626;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        font-weight: 900;
      }

      .invalid-room h2 {
        margin: 0;
        color: #991b1b;
        font-size: 18px;
      }

      .invalid-room p {
        max-width: 320px;
        margin: 7px auto 0;
        color: #64748b;
        font-size: 10px;
        line-height: 1.5;
      }

      .secure-footer {
        padding-top: 15px;
        border-top: 1px solid #eef2f7;
        text-align: center;
        color: #94a3b8;
        font-size: 8px;
      }

      .button-spinner {
        width: 12px;
        height: 12px;
        border: 2px solid rgba(255,255,255,0.35);
        border-top-color: #fff;
        border-radius: 50%;
        animation: spin 0.7s linear infinite;
      }

      /* =========================
         MOBILE
      ========================= */

      @media (max-width: 520px) {

        .roomscan-page {
          padding: 0;
          align-items: stretch;
          background: #f8fbff;
        }

        .roomscan-card {
          min-height: 100vh;
          max-width: none;
          border: 0;
          border-radius: 0;
          padding: 20px 17px;
          box-shadow: none;
        }

        .roomscan-header {
          margin-bottom: 18px;
        }

        .room-hero {
          padding: 17px;
        }

        .room-content h2 {
          font-size: 21px;
        }

        .steps {
          margin-bottom: 19px;
        }

        .step div {
          display: none;
        }

        .step-line {
          margin: 0 7px;
        }

        .staff-input-row {
          grid-template-columns: 1fr;
        }

        .verify-button {
          width: 100%;
        }

        .movement-buttons {
          grid-template-columns: 1fr;
        }

        .movement-button {
          min-height: 72px;
        }

        .verified-details {
          grid-template-columns: 1fr 1fr;
        }

      }

      @media (max-width: 360px) {

        .roomscan-card {
          padding: 17px 13px;
        }

        .secure-pill {
          display: none;
        }

        .room-hero {
          gap: 11px;
        }

        .room-visual {
          width: 54px;
          height: 54px;
        }

        .room-building {
          width: 48px;
          height: 48px;
          font-size: 22px;
        }

        .room-content h2 {
          font-size: 18px;
        }

      }

    `}</style>
  );
}

export default RoomScan;