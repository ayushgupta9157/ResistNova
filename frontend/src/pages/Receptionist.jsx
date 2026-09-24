import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useNavigate } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  `http://${window.location.hostname}:5000/api`;

const PUBLIC_APP_URL =
  import.meta.env.VITE_PUBLIC_APP_URL ||
  `${window.location.protocol}//${window.location.hostname}:5173`;

function Receptionist() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "Male",
    phone: "",
    address: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [registeredPatient, setRegisteredPatient] =
    useState(null);

  // ==========================================
  // FORM CHANGE
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ==========================================
  // CLEAR FORM
  // ==========================================

  const clearForm = () => {
    setForm({
      name: "",
      age: "",
      gender: "Male",
      phone: "",
      address: "",
    });

    setError("");
    setSuccess("");
    setRegisteredPatient(null);
  };

  // ==========================================
  // REGISTER PATIENT
  // ==========================================

  const registerPatient = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setRegisteredPatient(null);

    const name = form.name.trim();
    const age = Number(form.age);
    const phone = form.phone.trim();
    const address = form.address.trim();

    // ------------------------------------------
    // VALIDATION
    // ------------------------------------------

    if (!name) {
      setError("Please enter patient name.");
      return;
    }

    if (!form.age) {
      setError("Please enter patient age.");
      return;
    }

    if (
      !Number.isInteger(age) ||
      age < 0 ||
      age > 120
    ) {
      setError(
        "Please enter a valid age between 0 and 120."
      );
      return;
    }

    if (!form.gender) {
      setError("Please select gender.");
      return;
    }

    if (phone && !/^[0-9+\-\s()]{7,20}$/.test(phone)) {
      setError("Please enter a valid phone number.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${API_BASE}/patients`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            age,
            gender: form.gender,
            phone,
            address,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to register patient."
        );
      }

      const patient =
        data.patient ||
        data.data ||
        data.result;

      if (!patient) {
        throw new Error(
          "Patient registered, but patient details were not returned by the server."
        );
      }

      setRegisteredPatient(patient);

      setSuccess(
        "Patient registered successfully."
      );

      setForm({
        name: "",
        age: "",
        gender: "Male",
        phone: "",
        address: "",
      });
    } catch (err) {
      console.error(
        "Patient registration error:",
        err
      );

      setError(
        err.message ||
          "Unable to connect to the backend."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // QR URL
  // ==========================================

  const getPatientQRUrl = () => {
    if (!registeredPatient?.qrToken) {
      return "";
    }

    return `${PUBLIC_APP_URL}/patient-scan/${registeredPatient.qrToken}`;
  };

  // ==========================================
  // COPY QR URL
  // ==========================================

  const copyQRUrl = async () => {
    const url = getPatientQRUrl();

    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);

      setSuccess(
        "Patient QR link copied successfully."
      );
    } catch {
      setError(
        "Unable to copy the QR link."
      );
    }
  };

  // ==========================================
  // PRINT PATIENT QR
  // ==========================================

  const printPatientQR = () => {
    const canvas =
      document.getElementById(
        "patient-qr-code"
      );

    if (!canvas) {
      setError(
        "QR code is not available for printing."
      );
      return;
    }

    const imageUrl =
      canvas.toDataURL("image/png");

    const patientId =
      registeredPatient?.patientId ||
      "Patient";

    const patientName =
      registeredPatient?.name ||
      "Patient";

    const printWindow =
      window.open(
        "",
        "_blank",
        "width=700,height=800"
      );

    if (!printWindow) {
      setError(
        "Please allow pop-ups to print the QR code."
      );
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ResistNova Patient QR</title>

          <style>
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 40px;
              font-family:
                Arial,
                Helvetica,
                sans-serif;
              background: #ffffff;
              color: #172033;
              text-align: center;
            }

            .card {
              max-width: 500px;
              margin: 0 auto;
              border: 1px solid #dfe5ee;
              border-radius: 20px;
              padding: 35px;
            }

            .brand {
              color: #2563eb;
              font-size: 26px;
              font-weight: 800;
              margin-bottom: 5px;
            }

            .subtitle {
              color: #64748b;
              margin-bottom: 25px;
            }

            .patient-id {
              font-size: 22px;
              font-weight: 800;
              margin: 15px 0 5px;
            }

            .patient-name {
              color: #475569;
              font-size: 16px;
              margin-bottom: 25px;
            }

            img {
              width: 280px;
              height: 280px;
            }

            .instruction {
              margin-top: 25px;
              color: #475569;
              font-size: 14px;
              line-height: 1.6;
            }

            .privacy {
              margin-top: 20px;
              padding: 12px;
              background: #f8fafc;
              border-radius: 10px;
              color: #64748b;
              font-size: 12px;
            }

            @media print {
              body {
                padding: 15px;
              }
            }
          </style>
        </head>

        <body>
          <div class="card">
            <div class="brand">
              ResistNova
            </div>

            <div class="subtitle">
              Hospital Surveillance
            </div>

            <div class="patient-id">
              Patient ID: ${patientId}
            </div>

            <div class="patient-name">
              ${patientName}
            </div>

            <img src="${imageUrl}" />

            <div class="instruction">
              Scan this QR code to open the
              patient movement page.
            </div>

            <div class="privacy">
              This QR code contains a unique
              reference token and does not display
              medical status.
            </div>
          </div>

          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div
      style={{
        maxWidth: "1250px",
        margin: "0 auto",
        padding: "30px",
      }}
    >
      {/* ======================================
          HEADER
      ====================================== */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "20px",
          marginBottom: "28px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                background:
                  "linear-gradient(135deg,#2563eb,#4f46e5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontSize: "23px",
                boxShadow:
                  "0 8px 20px rgba(37,99,235,0.22)",
              }}
            >
              👤
            </div>

            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "30px",
                  fontWeight: "800",
                  color: "#172033",
                }}
              >
                Patient Reception
              </h1>

              <p
                style={{
                  margin: "5px 0 0",
                  color: "#64748b",
                  fontSize: "14px",
                }}
              >
                Register a patient and generate
                a secure Patient ID & QR code
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            navigate("/patients")
          }
          style={{
            border: "1px solid #dbe3ee",
            background: "#ffffff",
            color: "#334155",
            borderRadius: "10px",
            padding: "11px 16px",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          View Patients →
        </button>
      </div>

      {/* ======================================
          PRIVACY NOTICE
      ====================================== */}

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          background: "#eff6ff",
          border: "1px solid #bfdbfe",
          borderRadius: "14px",
          padding: "16px 18px",
          marginBottom: "24px",
          color: "#1e40af",
        }}
      >
        <div
          style={{
            fontSize: "20px",
          }}
        >
          🔒
        </div>

        <div>
          <strong
            style={{
              display: "block",
              marginBottom: "4px",
            }}
          >
            Patient privacy protected
          </strong>

          <span
            style={{
              fontSize: "13px",
              lineHeight: "1.5",
            }}
          >
            Reception only records basic
            registration information. No
            MDRO positive/negative status,
            diagnosis, risk score or exposure
            information is displayed here.
          </span>
        </div>
      </div>

      {/* ======================================
          MAIN GRID
      ====================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            registeredPatient
              ? "1fr 420px"
              : "1fr",
          gap: "22px",
          alignItems: "start",
        }}
      >
        {/* ====================================
            REGISTRATION FORM
        ==================================== */}

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "18px",
            padding: "25px",
            boxShadow:
              "0 6px 22px rgba(15,23,42,0.05)",
          }}
        >
          <div
            style={{
              marginBottom: "22px",
            }}
          >
            <h2
              style={{
                margin: 0,
                color: "#172033",
                fontSize: "20px",
              }}
            >
              Register New Patient
            </h2>

            <p
              style={{
                margin: "6px 0 0",
                color: "#94a3b8",
                fontSize: "13px",
              }}
            >
              Enter the patient's basic
              registration details.
            </p>
          </div>

          {/* SUCCESS */}

          {success && (
            <div
              style={{
                marginBottom: "18px",
                padding: "13px 15px",
                background: "#ecfdf5",
                border:
                  "1px solid #bbf7d0",
                color: "#047857",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: "600",
              }}
            >
              ✓ {success}
            </div>
          )}

          {/* ERROR */}

          {error && (
            <div
              style={{
                marginBottom: "18px",
                padding: "13px 15px",
                background: "#fef2f2",
                border:
                  "1px solid #fecaca",
                color: "#b91c1c",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: "600",
              }}
            >
              ⚠ {error}
            </div>
          )}

          <form
            onSubmit={registerPatient}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1.4fr 0.6fr",
                gap: "17px",
              }}
            >
              {/* NAME */}

              <div>
                <label
                  style={labelStyle}
                  htmlFor="patient-name"
                >
                  Patient Name
                  <span style={requiredStyle}>
                    *
                  </span>
                </label>

                <input
                  id="patient-name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  style={inputStyle}
                  autoComplete="off"
                />
              </div>

              {/* AGE */}

              <div>
                <label
                  style={labelStyle}
                  htmlFor="patient-age"
                >
                  Age
                  <span style={requiredStyle}>
                    *
                  </span>
                </label>

                <input
                  id="patient-age"
                  name="age"
                  type="number"
                  min="0"
                  max="120"
                  value={form.age}
                  onChange={handleChange}
                  placeholder="Age"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* GENDER */}

            <div
              style={{
                marginTop: "17px",
              }}
            >
              <label
                style={labelStyle}
                htmlFor="patient-gender"
              >
                Gender
                <span style={requiredStyle}>
                  *
                </span>
              </label>

              <select
                id="patient-gender"
                name="gender"
                value={form.gender}
                onChange={handleChange}
                style={inputStyle}
              >
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

            {/* PHONE */}

            <div
              style={{
                marginTop: "17px",
              }}
            >
              <label
                style={labelStyle}
                htmlFor="patient-phone"
              >
                Phone Number
              </label>

              <input
                id="patient-phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                style={inputStyle}
                autoComplete="tel"
              />
            </div>

            {/* ADDRESS */}

            <div
              style={{
                marginTop: "17px",
              }}
            >
              <label
                style={labelStyle}
                htmlFor="patient-address"
              >
                Address
              </label>

              <textarea
                id="patient-address"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Enter patient address"
                rows="4"
                style={{
                  ...inputStyle,
                  resize: "vertical",
                  minHeight: "100px",
                }}
              />
            </div>

            {/* BUTTONS */}

            <div
              style={{
                display: "flex",
                gap: "12px",
                marginTop: "23px",
              }}
            >
              <button
                type="submit"
                disabled={saving}
                style={{
                  flex: 1,
                  border: "none",
                  borderRadius: "11px",
                  padding: "13px 18px",
                  background:
                    saving
                      ? "#93c5fd"
                      : "linear-gradient(135deg,#2563eb,#4f46e5)",
                  color: "#ffffff",
                  fontWeight: "800",
                  fontSize: "14px",
                  cursor: saving
                    ? "not-allowed"
                    : "pointer",
                  boxShadow:
                    "0 7px 18px rgba(37,99,235,0.20)",
                }}
              >
                {saving
                  ? "Registering..."
                  : "✓ Register Patient"}
              </button>

              <button
                type="button"
                onClick={clearForm}
                disabled={saving}
                style={{
                  border:
                    "1px solid #dbe3ee",
                  borderRadius: "11px",
                  padding:
                    "13px 18px",
                  background:
                    "#ffffff",
                  color:
                    "#475569",
                  fontWeight:
                    "700",
                  cursor:
                    saving
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                Clear
              </button>
            </div>
          </form>
        </section>

        {/* ====================================
            GENERATED QR CARD
        ==================================== */}

        {registeredPatient && (
          <section
            style={{
              background: "#ffffff",
              border:
                "1px solid #e5e7eb",
              borderRadius: "18px",
              padding: "24px",
              boxShadow:
                "0 6px 22px rgba(15,23,42,0.06)",
              position: "sticky",
              top: "20px",
            }}
          >
            <div
              style={{
                textAlign: "center",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent:
                    "center",
                  width: "50px",
                  height: "50px",
                  borderRadius:
                    "50%",
                  background:
                    "#dcfce7",
                  fontSize:
                    "23px",
                  marginBottom:
                    "10px",
                }}
              >
                ✓
              </div>

              <h2
                style={{
                  margin:
                    "0 0 5px",
                  color:
                    "#172033",
                  fontSize:
                    "20px",
                }}
              >
                Patient Registered
              </h2>

              <p
                style={{
                  margin:
                    0,
                  color:
                    "#64748b",
                  fontSize:
                    "13px",
                }}
              >
                Unique Patient ID and QR
                generated successfully
              </p>
            </div>

            {/* PATIENT ID */}

            <div
              style={{
                marginTop:
                  "20px",
                padding:
                  "14px",
                background:
                  "#f8fafc",
                border:
                  "1px solid #e2e8f0",
                borderRadius:
                  "12px",
                textAlign:
                  "center",
              }}
            >
              <div
                style={{
                  color:
                    "#64748b",
                  fontSize:
                    "11px",
                  fontWeight:
                    "700",
                  textTransform:
                    "uppercase",
                  letterSpacing:
                    "0.7px",
                }}
              >
                Patient ID
              </div>

              <div
                style={{
                  marginTop:
                    "5px",
                  color:
                    "#2563eb",
                  fontSize:
                    "24px",
                  fontWeight:
                    "900",
                  letterSpacing:
                    "1px",
                }}
              >
                {registeredPatient.patientId}
              </div>

              <div
                style={{
                  marginTop:
                    "5px",
                  color:
                    "#475569",
                  fontSize:
                    "13px",
                }}
              >
                {registeredPatient.name}
              </div>
            </div>

            {/* QR */}

            <div
              style={{
                marginTop:
                  "20px",
                background:
                  "#f8fafc",
                border:
                  "1px solid #e2e8f0",
                borderRadius:
                  "14px",
                padding:
                  "18px",
                display:
                  "flex",
                justifyContent:
                  "center",
                alignItems:
                  "center",
              }}
            >
              <div
                style={{
                  background:
                    "#ffffff",
                  padding:
                    "12px",
                  borderRadius:
                    "10px",
                }}
              >
                <QRCodeCanvas
                  id="patient-qr-code"
                  value={
                    getPatientQRUrl()
                  }
                  size={220}
                  level="H"
                  includeMargin
                />
              </div>
            </div>

            <div
              style={{
                textAlign:
                  "center",
                marginTop:
                  "12px",
                color:
                  "#64748b",
                fontSize:
                  "12px",
              }}
            >
              Scan to open patient movement page
            </div>

            {/* URL */}

            <div
              style={{
                marginTop:
                  "16px",
              }}
            >
              <div
                style={{
                  color:
                    "#64748b",
                  fontSize:
                    "11px",
                  fontWeight:
                    "700",
                  marginBottom:
                    "6px",
                  textTransform:
                    "uppercase",
                }}
              >
                Patient QR URL
              </div>

              <div
                style={{
                  padding:
                    "10px 12px",
                  border:
                    "1px solid #e2e8f0",
                  borderRadius:
                    "9px",
                  background:
                    "#f8fafc",
                  color:
                    "#475569",
                  fontSize:
                    "10px",
                  lineHeight:
                    "1.5",
                  wordBreak:
                    "break-all",
                }}
              >
                {getPatientQRUrl()}
              </div>
            </div>

            {/* ACTIONS */}

            <div
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap:
                  "10px",
                marginTop:
                  "15px",
              }}
            >
              <button
                type="button"
                onClick={copyQRUrl}
                style={{
                  border:
                    "1px solid #dbe3ee",
                  background:
                    "#ffffff",
                  color:
                    "#334155",
                  padding:
                    "11px",
                  borderRadius:
                    "9px",
                  fontWeight:
                    "700",
                  cursor:
                    "pointer",
                }}
              >
                Copy Link
              </button>

              <button
                type="button"
                onClick={
                  printPatientQR
                }
                style={{
                  border:
                    "none",
                  background:
                    "#2563eb",
                  color:
                    "#ffffff",
                  padding:
                    "11px",
                  borderRadius:
                    "9px",
                  fontWeight:
                    "700",
                  cursor:
                    "pointer",
                }}
              >
                Print QR
              </button>
            </div>

            {/* NEW PATIENT */}

            <button
              type="button"
              onClick={clearForm}
              style={{
                width:
                  "100%",
                marginTop:
                  "10px",
                border:
                  "1px solid #bfdbfe",
                background:
                  "#eff6ff",
                color:
                  "#1d4ed8",
                padding:
                  "11px",
                borderRadius:
                  "9px",
                fontWeight:
                  "700",
                cursor:
                  "pointer",
              }}
            >
              + Register Another Patient
            </button>
          </section>
        )}
      </div>

      {/* ======================================
          WORKFLOW INFO
      ====================================== */}

      <section
        style={{
          marginTop: "22px",
          background: "#ffffff",
          border:
            "1px solid #e5e7eb",
          borderRadius: "16px",
          padding: "22px",
        }}
      >
        <h3
          style={{
            margin:
              "0 0 17px",
            color:
              "#172033",
            fontSize:
              "17px",
          }}
        >
          Registration Workflow
        </h3>

        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "repeat(3, 1fr)",
            gap:
              "14px",
          }}
        >
          {[
            {
              number: "01",
              title:
                "Register Patient",
              text:
                "Enter basic patient registration details.",
              icon: "📝",
            },
            {
              number: "02",
              title:
                "Patient ID + QR",
              text:
                "System generates a unique patient reference and QR token.",
              icon: "🪪",
            },
            {
              number: "03",
              title:
                "Use QR",
              text:
                "The QR can be scanned later to open the patient movement page.",
              icon: "📱",
            },
          ].map(
            (step) => (
              <div
                key={
                  step.number
                }
                style={{
                  display:
                    "flex",
                  gap:
                    "12px",
                  padding:
                    "15px",
                  background:
                    "#f8fafc",
                  border:
                    "1px solid #edf2f7",
                  borderRadius:
                    "12px",
                }}
              >
                <div
                  style={{
                    width:
                      "38px",
                    height:
                      "38px",
                    flexShrink:
                      0,
                    borderRadius:
                      "10px",
                    background:
                      "#eff6ff",
                    display:
                      "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    fontSize:
                      "18px",
                  }}
                >
                  {step.icon}
                </div>

                <div>
                  <div
                    style={{
                      color:
                        "#2563eb",
                      fontSize:
                        "10px",
                      fontWeight:
                        "800",
                    }}
                  >
                    STEP{" "}
                    {step.number}
                  </div>

                  <div
                    style={{
                      marginTop:
                        "3px",
                      color:
                        "#172033",
                      fontWeight:
                        "800",
                      fontSize:
                        "13px",
                    }}
                  >
                    {
                      step.title
                    }
                  </div>

                  <div
                    style={{
                      marginTop:
                        "4px",
                      color:
                        "#64748b",
                      fontSize:
                        "11px",
                      lineHeight:
                        "1.5",
                    }}
                  >
                    {
                      step.text
                    }
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </section>
    </div>
  );
}

// ==========================================
// STYLES
// ==========================================

const labelStyle = {
  display: "block",
  marginBottom: "7px",
  color: "#334155",
  fontSize: "12px",
  fontWeight: "700",
};

const requiredStyle = {
  color: "#dc2626",
  marginLeft: "3px",
};

const inputStyle = {
  width: "100%",
  padding: "12px 13px",
  border: "1px solid #dbe3ee",
  borderRadius: "10px",
  background: "#ffffff",
  color: "#172033",
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box",
};

export default Receptionist;