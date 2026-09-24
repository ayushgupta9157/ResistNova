import { useEffect, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

const API = "http://localhost:5000/api";

function QRScannerBox() {
  // ==========================================
  // MODE
  // ==========================================
  const [mode, setMode] = useState("patient");

  // ==========================================
  // PATIENT
  // ==========================================
  const [patientQrToken, setPatientQrToken] = useState("");
  const [patient, setPatient] = useState(null);

  // ==========================================
  // ROOM / LOCATION
  // ==========================================
  const [roomQrToken, setRoomQrToken] = useState("");
  const [location, setLocation] = useState(null);

  // ==========================================
  // STAFF
  // ==========================================
  const [staffId, setStaffId] = useState("");
  const [staff, setStaff] = useState(null);

  // ==========================================
  // LOCATIONS
  // ==========================================
  const [locations, setLocations] = useState([]);

  // ==========================================
  // MOVEMENT
  // ==========================================
  const [selectedLocation, setSelectedLocation] = useState("");
  const [action, setAction] = useState("");

  // ==========================================
  // CAMERA
  // ==========================================
  const [cameraRunning, setCameraRunning] = useState(false);
  const [cameraError, setCameraError] = useState("");

  // ==========================================
  // UI
  // ==========================================
  const [loading, setLoading] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // QR SCANNER INSTANCE
  // ==========================================
  const [qrScanner, setQrScanner] = useState(null);

  // ==========================================
  // LOAD LOCATIONS
  // ==========================================
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const response = await fetch(`${API}/locations`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to load locations"
          );
        }

        setLocations(data.locations || []);
      } catch (error) {
        console.error("Location loading error:", error);
        setError(error.message);
      }
    };

    loadLocations();
  }, []);

  // ==========================================
  // CLEAN CAMERA ON UNMOUNT
  // ==========================================
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // ==========================================
  // CLEAR MESSAGES
  // ==========================================
  const clearMessages = () => {
    setError("");
    setSuccess("");
    setCameraError("");
  };

  // ==========================================
  // STOP CAMERA
  // ==========================================
  const stopCamera = async () => {
    try {
      if (qrScanner) {
        const state = qrScanner.getState();

        if (state === 2) {
          await qrScanner.stop();
        }

        await qrScanner.clear();
      }
    } catch (error) {
      console.log("Camera stop:", error.message);
    }

    setQrScanner(null);
    setCameraRunning(false);
  };

  // ==========================================
  // HANDLE PATIENT QR RESULT
  // ==========================================
  const handlePatientQR = async (token) => {
    clearMessages();

    try {
      setLoading(true);

      const response = await fetch(
        `${API}/patients/qr/${encodeURIComponent(token)}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Invalid patient QR code"
        );
      }

      setPatient(data.patient);
      setPatientQrToken(token);
      setSelectedLocation("");
      setAction("");

      await stopCamera();

      setSuccess(
        `Patient QR detected successfully`
      );
    } catch (error) {
      console.error("Patient QR error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // HANDLE ROOM QR RESULT
  // ==========================================
  const handleRoomQR = async (token) => {
    clearMessages();

    try {
      setLoading(true);

      const response = await fetch(
        `${API}/locations/qr/${encodeURIComponent(token)}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Invalid room QR code"
        );
      }

      setLocation(data.location);
      setRoomQrToken(token);

      // Automatically select scanned location
      setSelectedLocation(data.location.locationId);

      setStaff(null);
      setAction("");

      await stopCamera();

      setSuccess(
        `${data.location.name} QR detected successfully`
      );
    } catch (error) {
      console.error("Room QR error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // START CAMERA
  // ==========================================
  const startCamera = async () => {
    clearMessages();

    try {
      setCameraError("");

      // If already running, do nothing
      if (cameraRunning) {
        return;
      }

      const scanner = new Html5Qrcode(
        "qr-reader"
      );

      setQrScanner(scanner);

      setCameraRunning(true);

      await scanner.start(
        {
          facingMode: "environment"
        },
        {
          fps: 10,
          qrbox: {
            width: 250,
            height: 250
          },
          aspectRatio: 1
        },
        async (decodedText) => {
          console.log(
            "QR detected:",
            decodedText
          );

          if (mode === "staff") {
            await handleRoomQR(decodedText);
          } else {
            await handlePatientQR(decodedText);
          }
        },
        (errorMessage) => {
          // Scanner continuously reports "QR not found"
          // Ignore these normal scanning messages.
        }
      );
    } catch (error) {
      console.error(
        "Camera start error:",
        error
      );

      setCameraRunning(false);
      setQrScanner(null);

      setCameraError(
        "Camera start nahi ho saka. Camera permission allow karo aur HTTPS/localhost use karo."
      );
    }
  };

  // ==========================================
  // SWITCH MODE
  // ==========================================
  const switchMode = async (newMode) => {
    await stopCamera();

    setMode(newMode);

    setPatientQrToken("");
    setPatient(null);

    setRoomQrToken("");
    setLocation(null);

    setStaffId("");
    setStaff(null);

    setSelectedLocation("");
    setAction("");

    clearMessages();
  };

  // ==========================================
  // MANUAL PATIENT TOKEN
  // ==========================================
  const scanPatientQR = async () => {
    clearMessages();

    if (!patientQrToken.trim()) {
      setError(
        "Please scan patient QR or enter QR token"
      );
      return;
    }

    await handlePatientQR(
      patientQrToken.trim()
    );
  };

  // ==========================================
  // MANUAL ROOM TOKEN
  // ==========================================
  const scanRoomQR = async () => {
    clearMessages();

    if (!roomQrToken.trim()) {
      setError(
        "Please scan room QR or enter QR token"
      );
      return;
    }

    await handleRoomQR(
      roomQrToken.trim()
    );
  };

  // ==========================================
  // FIND STAFF
  // ==========================================
  const findStaff = async () => {
    clearMessages();
    setStaff(null);

    if (!location) {
      setError(
        "Please scan the room QR first"
      );
      return;
    }

    if (!staffId.trim()) {
      setError(
        "Please enter Staff ID"
      );
      return;
    }

    try {
      setStaffLoading(true);

      const response = await fetch(
        `${API}/staff/${encodeURIComponent(
          staffId.trim()
        )}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Staff member not found"
        );
      }

      setStaff(data.staff);

      setSuccess(
        `${data.staff.staffId} verified successfully`
      );
    } catch (error) {
      console.error(
        "Staff lookup error:",
        error
      );

      setError(error.message);
    } finally {
      setStaffLoading(false);
    }
  };

  // ==========================================
  // RECORD PATIENT MOVEMENT
  // ==========================================
  const recordPatientMovement = async () => {
    clearMessages();

    if (!patient) {
      setError(
        "Please scan patient QR first"
      );
      return;
    }

    if (!selectedLocation) {
      setError(
        "Please select Ward / Room"
      );
      return;
    }

    if (!action) {
      setError(
        "Please select ENTRY or EXIT"
      );
      return;
    }

    try {
      setLoading(true);

      // ======================================
      // PATIENT ENTRY
      // ======================================
      if (action === "ENTRY") {
        const response = await fetch(
          `${API}/movements`,
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json"
            },

            body: JSON.stringify({
              personId:
                patient.patientId,

              personType: "Patient",

              locationId:
                selectedLocation,

              action: "ENTRY",

              loggedBy: "SYSTEM"
            })
          }
        );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Patient entry failed"
          );
        }

        setSuccess(
          `Patient ${patient.patientId} ENTRY recorded successfully`
        );

        return;
      }

      // ======================================
      // PATIENT EXIT
      // ======================================
      if (action === "EXIT") {
        const response = await fetch(
          `${API}/movements/exit`,
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json"
            },

            body: JSON.stringify({
              personId:
                patient.patientId,

              locationId:
                selectedLocation
            })
          }
        );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Patient exit failed"
          );
        }

        setSuccess(
          `Patient ${patient.patientId} EXIT recorded successfully`
        );
      }
    } catch (error) {
      console.error(
        "Patient movement error:",
        error
      );

      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // RECORD STAFF MOVEMENT
  // ==========================================
  const recordStaffMovement = async () => {
    clearMessages();

    if (!location) {
      setError(
        "Please scan room QR first"
      );
      return;
    }

    if (!staff) {
      setError(
        "Please verify Staff ID first"
      );
      return;
    }

    if (!action) {
      setError(
        "Please select ENTRY or EXIT"
      );
      return;
    }

    try {
      setLoading(true);

      // ======================================
      // STAFF ENTRY
      // ======================================
      if (action === "ENTRY") {
        const response = await fetch(
          `${API}/movements`,
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json"
            },

            body: JSON.stringify({
              personId:
                staff.staffId,

              personType:
                staff.role,

              locationId:
                location.locationId,

              action: "ENTRY",

              loggedBy: "SYSTEM"
            })
          }
        );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Staff entry failed"
          );
        }

        setSuccess(
          `${staff.role} ${staff.staffId} ENTRY recorded in ${location.name}`
        );

        return;
      }

      // ======================================
      // STAFF EXIT
      // ======================================
      if (action === "EXIT") {
        const response = await fetch(
          `${API}/movements/exit`,
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json"
            },

            body: JSON.stringify({
              personId:
                staff.staffId,

              locationId:
                location.locationId
            })
          }
        );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Staff exit failed"
          );
        }

        setSuccess(
          `${staff.role} ${staff.staffId} EXIT recorded from ${location.name}`
        );
      }
    } catch (error) {
      console.error(
        "Staff movement error:",
        error
      );

      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div>

      {/* ======================================
          MODE SELECTOR
      ====================================== */}

      <section className="panel">

        <h2>
          QR Scanner
        </h2>

        <p>
          Scan Patient QR or Room QR using
          your camera.
        </p>

        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "20px",
            flexWrap: "wrap"
          }}
        >

          <button
            type="button"
            className={
              mode === "patient"
                ? "primary-btn"
                : "secondary-btn"
            }
            onClick={() =>
              switchMode("patient")
            }
          >
            🧑 Patient QR
          </button>

          <button
            type="button"
            className={
              mode === "staff"
                ? "primary-btn"
                : "secondary-btn"
            }
            onClick={() =>
              switchMode("staff")
            }
          >
            👨‍⚕️ Staff / Room QR
          </button>

        </div>

      </section>


      {/* ======================================
          ERROR
      ====================================== */}

      {error && (
        <section
          className="panel"
          style={{
            marginTop: "20px"
          }}
        >
          <div className="scan-error">
            {error}
          </div>
        </section>
      )}


      {/* ======================================
          SUCCESS
      ====================================== */}

      {success && (
        <section
          className="panel"
          style={{
            marginTop: "20px"
          }}
        >
          <div className="scan-success">
            {success}
          </div>
        </section>
      )}


      {/* ======================================
          CAMERA
      ====================================== */}

      <section
        className="panel"
        style={{
          marginTop: "20px"
        }}
      >

        <h2>
          📷 Camera QR Scanner
        </h2>

        <p>
          {mode === "staff"
            ? "ICU / Ward ka QR camera ke saamne rakho."
            : "Patient receipt ka QR camera ke saamne rakho."}
        </p>

        <div
          id="qr-reader"
          style={{
            width: "100%",
            maxWidth: "500px",
            margin: "20px auto",
            borderRadius: "12px",
            overflow: "hidden"
          }}
        />

        {!cameraRunning ? (
          <button
            type="button"
            className="primary-btn"
            onClick={startCamera}
          >
            📷 Start Camera
          </button>
        ) : (
          <button
            type="button"
            className="secondary-btn"
            onClick={stopCamera}
          >
            ⏹ Stop Camera
          </button>
        )}

        {cameraError && (
          <div
            style={{
              marginTop: "15px",
              padding: "12px",
              borderRadius: "8px",
              background: "#fff3cd",
              color: "#664d03"
            }}
          >
            {cameraError}
          </div>
        )}

      </section>


      {/* ======================================
          STAFF MODE
      ====================================== */}

      {mode === "staff" && (
        <section
          className="panel"
          style={{
            marginTop: "20px"
          }}
        >

          <h2>
            Staff Room Movement
          </h2>

          <p>
            Pehle Room QR scan karo, phir
            Staff ID verify karo.
          </p>


          {/* ==================================
              MANUAL ROOM TOKEN FALLBACK
          ================================== */}

          <div
            className="form-group"
            style={{
              marginTop: "20px"
            }}
          >

            <label>
              Room QR Token
            </label>

            <input
              type="text"
              value={roomQrToken}
              onChange={(e) => {
                setRoomQrToken(
                  e.target.value
                );

                setLocation(null);
                setStaff(null);
                setAction("");
              }}
              placeholder="Camera ke bina token enter kar sakte ho"
              autoComplete="off"
            />

          </div>

          <button
            type="button"
            className="secondary-btn"
            onClick={scanRoomQR}
            disabled={loading}
          >
            🔎 Verify Room Token
          </button>


          {/* ==================================
              ROOM DETECTED
          ================================== */}

          {location && (
            <div
              style={{
                marginTop: "25px"
              }}
            >

              <h3>
                ✅ Room Detected
              </h3>

              <div
                className="panel"
                style={{
                  marginTop: "15px"
                }}
              >

                <p>
                  <strong>
                    Room:
                  </strong>{" "}
                  {location.name}
                </p>

                <p>
                  <strong>
                    Location ID:
                  </strong>{" "}
                  {location.locationId}
                </p>

                <p>
                  <strong>
                    Type:
                  </strong>{" "}
                  {location.type}
                </p>

              </div>


              {/* ==============================
                  STAFF ID
              ============================== */}

              <div
                className="form-group"
                style={{
                  marginTop: "20px"
                }}
              >

                <label>
                  Staff ID
                </label>

                <input
                  type="text"
                  value={staffId}
                  onChange={(e) => {
                    setStaffId(
                      e.target.value
                    );

                    setStaff(null);
                    setAction("");
                    clearMessages();
                  }}
                  placeholder="Example: N001 or D005"
                  autoComplete="off"
                />

              </div>


              <button
                type="button"
                className="secondary-btn"
                onClick={findStaff}
                disabled={
                  staffLoading
                }
              >
                {staffLoading
                  ? "Verifying..."
                  : "Verify Staff ID"}
              </button>


              {/* ==============================
                  STAFF VERIFIED
              ============================== */}

              {staff && (
                <div
                  className="panel"
                  style={{
                    marginTop: "20px"
                  }}
                >

                  <h3>
                    ✅ Staff Verified
                  </h3>

                  <p>
                    <strong>
                      Staff ID:
                    </strong>{" "}
                    {staff.staffId}
                  </p>

                  <p>
                    <strong>
                      Name:
                    </strong>{" "}
                    {staff.name}
                  </p>

                  <p>
                    <strong>
                      Role:
                    </strong>{" "}
                    {staff.role}
                  </p>

                  {staff.department && (
                    <p>
                      <strong>
                        Department:
                      </strong>{" "}
                      {staff.department}
                    </p>
                  )}

                </div>
              )}


              {/* ==============================
                  ACTION
              ============================== */}

              {staff && (
                <div
                  style={{
                    marginTop: "25px"
                  }}
                >

                  <h3>
                    Movement Action
                  </h3>

                  <p>
                    Select what you want to
                    record.
                  </p>

                  <div
                    style={{
                      display: "flex",
                      gap: "15px",
                      marginTop: "15px",
                      flexWrap: "wrap"
                    }}
                  >

                    <button
                      type="button"
                      onClick={() =>
                        setAction("ENTRY")
                      }
                      style={{
                        padding:
                          "14px 30px",
                        borderRadius:
                          "10px",
                        border:
                          action === "ENTRY"
                            ? "3px solid green"
                            : "1px solid #ccc",
                        background:
                          action === "ENTRY"
                            ? "#d1fae5"
                            : "white",
                        cursor:
                          "pointer",
                        fontWeight:
                          "bold",
                        fontSize:
                          "16px"
                      }}
                    >
                      🟢 ENTRY
                    </button>


                    <button
                      type="button"
                      onClick={() =>
                        setAction("EXIT")
                      }
                      style={{
                        padding:
                          "14px 30px",
                        borderRadius:
                          "10px",
                        border:
                          action === "EXIT"
                            ? "3px solid red"
                            : "1px solid #ccc",
                        background:
                          action === "EXIT"
                            ? "#fee2e2"
                            : "white",
                        cursor:
                          "pointer",
                        fontWeight:
                          "bold",
                        fontSize:
                          "16px"
                      }}
                    >
                      🔴 EXIT
                    </button>

                  </div>


                  <p
                    style={{
                      marginTop: "15px",
                      color: "#666"
                    }}
                  >
                    ⏱️ Time automatically
                    server record karega.
                  </p>


                  <button
                    type="button"
                    className="primary-btn"
                    onClick={
                      recordStaffMovement
                    }
                    disabled={
                      loading ||
                      !action
                    }
                    style={{
                      marginTop: "10px"
                    }}
                  >
                    {loading
                      ? "Recording..."
                      : `Confirm Staff ${
                          action || "Movement"
                        }`}
                  </button>

                </div>
              )}

            </div>
          )}

        </section>
      )}


      {/* ======================================
          PATIENT MODE
      ====================================== */}

      {mode === "patient" && (
        <section
          className="panel"
          style={{
            marginTop: "20px"
          }}
        >

          <h2>
            Patient Movement
          </h2>

          <p>
            Patient receipt QR scan karo,
            phir ward/room aur ENTRY/EXIT
            select karo.
          </p>


          {/* ==================================
              MANUAL PATIENT TOKEN
          ================================== */}

          <div
            className="form-group"
            style={{
              marginTop: "20px"
            }}
          >

            <label>
              Patient QR Token
            </label>

            <input
              type="text"
              value={patientQrToken}
              onChange={(e) => {
                setPatientQrToken(
                  e.target.value
                );

                setPatient(null);
                setAction("");
              }}
              placeholder="Camera ke bina token enter kar sakte ho"
              autoComplete="off"
            />

          </div>

          <button
            type="button"
            className="secondary-btn"
            onClick={scanPatientQR}
            disabled={loading}
          >
            🔎 Verify Patient Token
          </button>


          {/* ==================================
              PATIENT FOUND
          ================================== */}

          {patient && (
            <div
              style={{
                marginTop: "25px"
              }}
            >

              <h3>
                ✅ Patient Found
              </h3>

              <div
                className="panel"
                style={{
                  marginTop: "15px"
                }}
              >

                <p>
                  <strong>
                    Patient ID:
                  </strong>{" "}
                  {patient.patientId}
                </p>

                <p>
                  <strong>
                    Name:
                  </strong>{" "}
                  {patient.name}
                </p>

                <p>
                  <strong>
                    Age:
                  </strong>{" "}
                  {patient.age}
                </p>

                <p>
                  <strong>
                    Gender:
                  </strong>{" "}
                  {patient.gender}
                </p>

              </div>


              {/* ==============================
                  LOCATION
              ============================== */}

              <div
                className="form-group"
                style={{
                  marginTop: "20px"
                }}
              >

                <label>
                  Ward / Room
                </label>

                <select
                  value={
                    selectedLocation
                  }
                  onChange={(e) => {
                    setSelectedLocation(
                      e.target.value
                    );

                    setAction("");
                  }}
                >

                  <option value="">
                    Select Ward / Room
                  </option>

                  {locations.map(
                    (item) => (
                      <option
                        key={
                          item.locationId
                        }
                        value={
                          item.locationId
                        }
                      >
                        {item.name} (
                        {item.locationId})
                      </option>
                    )
                  )}

                </select>

              </div>


              {/* ==============================
                  ACTION
              ============================== */}

              <div
                style={{
                  marginTop: "25px"
                }}
              >

                <h3>
                  Movement Action
                </h3>

                <div
                  style={{
                    display: "flex",
                    gap: "15px",
                    marginTop: "15px",
                    flexWrap: "wrap"
                  }}
                >

                  <button
                    type="button"
                    onClick={() =>
                      setAction("ENTRY")
                    }
                    style={{
                      padding:
                        "14px 30px",
                      borderRadius:
                        "10px",
                      border:
                        action === "ENTRY"
                          ? "3px solid green"
                          : "1px solid #ccc",
                      background:
                        action === "ENTRY"
                          ? "#d1fae5"
                          : "white",
                      cursor:
                        "pointer",
                      fontWeight:
                        "bold",
                      fontSize:
                        "16px"
                    }}
                  >
                    🟢 ENTRY
                  </button>


                  <button
                    type="button"
                    onClick={() =>
                      setAction("EXIT")
                    }
                    style={{
                      padding:
                        "14px 30px",
                      borderRadius:
                        "10px",
                      border:
                        action === "EXIT"
                          ? "3px solid red"
                          : "1px solid #ccc",
                      background:
                        action === "EXIT"
                          ? "#fee2e2"
                          : "white",
                      cursor:
                        "pointer",
                      fontWeight:
                        "bold",
                      fontSize:
                        "16px"
                    }}
                  >
                    🔴 EXIT
                  </button>

                </div>


                <p
                  style={{
                    marginTop: "15px",
                    color: "#666"
                  }}
                >
                  ⏱️ Time automatically
                  server record karega.
                </p>


                <button
                  type="button"
                  className="primary-btn"
                  onClick={
                    recordPatientMovement
                  }
                  disabled={
                    loading ||
                    !selectedLocation ||
                    !action
                  }
                  style={{
                    marginTop: "10px"
                  }}
                >
                  {loading
                    ? "Recording..."
                    : `Confirm Patient ${
                        action || "Movement"
                      }`}
                </button>

              </div>

            </div>
          )}

        </section>
      )}

    </div>
  );
}

export default QRScannerBox;