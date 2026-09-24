import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  `http://${window.location.hostname}:5000/api`;

function PatientScan() {
  const { qrValue } = useParams();

  const [patient, setPatient] = useState(null);
  const [locations, setLocations] = useState([]);

  const [selectedLocation, setSelectedLocation] = useState("");

  const [action, setAction] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadPatientAndLocations();
  }, [qrValue]);

  const loadPatientAndLocations = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      if (!qrValue) {
        throw new Error("Invalid patient QR code.");
      }

      const [patientResponse, locationResponse] = await Promise.all([
        fetch(`${API_BASE}/patients/qr/${encodeURIComponent(qrValue)}`),
        fetch(`${API_BASE}/locations`),
      ]);

      const patientData = await patientResponse.json();
      const locationData = await locationResponse.json();

      if (!patientResponse.ok || !patientData.success) {
        throw new Error(
          patientData.message || "Patient QR could not be verified."
        );
      }

      if (!locationResponse.ok || !locationData.success) {
        throw new Error(
          locationData.message || "Unable to load hospital rooms."
        );
      }

      setPatient(patientData.patient);

      setLocations(
        locationData.locations ||
          locationData.data ||
          []
      );
    } catch (err) {
      console.error("Patient scan error:", err);
      setError(err.message || "Unable to process patient QR.");
    } finally {
      setLoading(false);
    }
  };

  const recordMovement = async () => {
    if (!patient) {
      setError("Patient information is not available.");
      return;
    }

    if (!selectedLocation) {
      setError("Please select a ward / room.");
      return;
    }

    if (!action) {
      setError("Please select ENTRY or EXIT.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setMessage("");

      let response;

      if (action === "ENTRY") {
        response = await fetch(`${API_BASE}/movements`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            personId: patient.patientId,
            personType: "Patient",
            locationId: selectedLocation,
            action: "ENTRY",
            loggedBy: "PATIENT_QR_SCAN",
          }),
        });
      } else {
        response = await fetch(`${API_BASE}/movements/exit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            personId: patient.patientId,
            personType: "Patient",
            locationId: selectedLocation,
            action: "EXIT",
            loggedBy: "PATIENT_QR_SCAN",
          }),
        });
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || `Unable to record ${action}.`
        );
      }

      setMessage(
        action === "ENTRY"
          ? `Patient ENTRY recorded successfully in ${getLocationName(
              selectedLocation
            )}.`
          : `Patient EXIT recorded successfully from ${getLocationName(
              selectedLocation
            )}.`
      );

      setAction("");
    } catch (err) {
      console.error("Movement error:", err);
      setError(err.message || "Unable to record movement.");
    } finally {
      setSubmitting(false);
    }
  };

  const getLocationName = (locationId) => {
    const location = locations.find(
      (item) => item.locationId === locationId
    );

    return location?.name || locationId;
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingCard}>
          <div style={styles.loadingIcon}>📷</div>

          <h2>Verifying Patient QR...</h2>

          <p>
            Please wait while the patient reference is verified.
          </p>
        </div>
      </div>
    );
  }

  if (error && !patient) {
    return (
      <div style={styles.page}>
        <div style={styles.errorCard}>
          <div style={styles.errorIcon}>⚠️</div>

          <h2>QR Verification Failed</h2>

          <p>{error}</p>

          <button
            style={styles.retryButton}
            onClick={loadPatientAndLocations}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* HEADER */}
        <div style={styles.header}>
          <div style={styles.logoCircle}>RN</div>

          <div>
            <h1 style={styles.title}>ResistNova</h1>

            <p style={styles.subtitle}>
              Patient Movement Registration
            </p>
          </div>
        </div>

        {/* PRIVACY NOTICE */}
        <div style={styles.privacyBox}>
          <span style={styles.privacyIcon}>🔒</span>

          <div>
            <strong>Privacy Protected</strong>

            <p style={styles.privacyText}>
              This QR identifies the patient record only.
              No MDRO positive/negative status is displayed here.
            </p>
          </div>
        </div>

        {/* PATIENT DETAILS */}
        {patient && (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>
                Patient Details
              </h2>

              <span style={styles.verifiedBadge}>
                ✓ Verified
              </span>
            </div>

            <div style={styles.patientGrid}>

              <div style={styles.detailItem}>
                <span style={styles.label}>
                  Patient ID
                </span>

                <strong style={styles.value}>
                  {patient.patientId}
                </strong>
              </div>

              <div style={styles.detailItem}>
                <span style={styles.label}>
                  Name
                </span>

                <strong style={styles.value}>
                  {patient.name}
                </strong>
              </div>

              <div style={styles.detailItem}>
                <span style={styles.label}>
                  Age
                </span>

                <strong style={styles.value}>
                  {patient.age}
                </strong>
              </div>

              <div style={styles.detailItem}>
                <span style={styles.label}>
                  Gender
                </span>

                <strong style={styles.value}>
                  {patient.gender}
                </strong>
              </div>

              {patient.phone && (
                <div style={styles.detailItem}>
                  <span style={styles.label}>
                    Phone
                  </span>

                  <strong style={styles.value}>
                    {patient.phone}
                  </strong>
                </div>
              )}

              {patient.address && (
                <div style={styles.detailItem}>
                  <span style={styles.label}>
                    Address
                  </span>

                  <strong style={styles.value}>
                    {patient.address}
                  </strong>
                </div>
              )}
            </div>
          </div>
        )}

        {/* LOCATION */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>
            Select Ward / Room
          </h2>

          <p style={styles.helperText}>
            Select the location where the patient is entering
            or exiting.
          </p>

          <div style={styles.locationGrid}>
            {locations.map((location) => {
              const selected =
                selectedLocation === location.locationId;

              return (
                <button
                  key={location.locationId}
                  type="button"
                  onClick={() =>
                    setSelectedLocation(location.locationId)
                  }
                  style={{
                    ...styles.locationButton,
                    ...(selected
                      ? styles.locationButtonSelected
                      : {}),
                  }}
                >
                  <span style={styles.locationIcon}>
                    🏥
                  </span>

                  <span>
                    <strong>
                      {location.name}
                    </strong>

                    <small>
                      {location.locationId}
                    </small>
                  </span>
                </button>
              );
            })}
          </div>

          {locations.length === 0 && (
            <div style={styles.emptyBox}>
              No active hospital locations found.
            </div>
          )}
        </div>

        {/* ACTION */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>
            Record Movement
          </h2>

          <p style={styles.helperText}>
            Choose what is happening with the patient at the
            selected location.
          </p>

          <div style={styles.actionGrid}>

            <button
              type="button"
              onClick={() => {
                setAction("ENTRY");
                setError("");
              }}
              style={{
                ...styles.actionButton,
                ...styles.entryButton,
                ...(action === "ENTRY"
                  ? styles.actionSelected
                  : {}),
              }}
            >
              <span style={styles.actionIcon}>
                ➡️
              </span>

              <span>
                <strong>ENTRY</strong>

                <small>
                  Patient enters room
                </small>
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAction("EXIT");
                setError("");
              }}
              style={{
                ...styles.actionButton,
                ...styles.exitButton,
                ...(action === "EXIT"
                  ? styles.actionSelected
                  : {}),
              }}
            >
              <span style={styles.actionIcon}>
                ⬅️
              </span>

              <span>
                <strong>EXIT</strong>

                <small>
                  Patient leaves room
                </small>
              </span>
            </button>

          </div>

          {/* ERROR */}
          {error && patient && (
            <div style={styles.errorMessage}>
              ⚠️ {error}
            </div>
          )}

          {/* SUCCESS */}
          {message && (
            <div style={styles.successMessage}>
              ✓ {message}
            </div>
          )}

          {/* SUBMIT */}
          <button
            type="button"
            disabled={
              submitting ||
              !selectedLocation ||
              !action
            }
            onClick={recordMovement}
            style={{
              ...styles.submitButton,
              ...(submitting ||
              !selectedLocation ||
              !action
                ? styles.submitDisabled
                : {}),
            }}
          >
            {submitting
              ? "Recording..."
              : `Record ${action || "Movement"}`}
          </button>

          <p style={styles.timestampNote}>
            🕒 Movement time is recorded automatically by the
            server.
          </p>
        </div>

        {/* FOOTER */}
        <div style={styles.footer}>
          ResistNova • Hospital Infection Surveillance System
        </div>

      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f4f7fb",
    padding: "30px 20px",
    boxSizing: "border-box",
    fontFamily:
      "Inter, Arial, Helvetica, sans-serif",
  },

  container: {
    maxWidth: "850px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginBottom: "25px",
  },

  logoCircle: {
    width: "55px",
    height: "55px",
    borderRadius: "14px",
    background: "#2563eb",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: "18px",
  },

  title: {
    margin: 0,
    fontSize: "28px",
    color: "#111827",
  },

  subtitle: {
    margin: "4px 0 0",
    color: "#64748b",
    fontSize: "14px",
  },

  privacyBox: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "20px",
    color: "#166534",
  },

  privacyIcon: {
    fontSize: "22px",
  },

  privacyText: {
    margin: "5px 0 0",
    fontSize: "13px",
    lineHeight: "1.5",
  },

  card: {
    background: "#fff",
    borderRadius: "14px",
    padding: "24px",
    marginBottom: "20px",
    border: "1px solid #e5e7eb",
    boxShadow:
      "0 4px 15px rgba(15, 23, 42, 0.05)",
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    marginBottom: "20px",
  },

  cardTitle: {
    margin: "0 0 15px",
    fontSize: "20px",
    color: "#111827",
  },

  verifiedBadge: {
    background: "#dcfce7",
    color: "#166534",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
  },

  patientGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "15px",
  },

  detailItem: {
    background: "#f8fafc",
    borderRadius: "9px",
    padding: "13px",
    border: "1px solid #e2e8f0",
  },

  label: {
    display: "block",
    color: "#64748b",
    fontSize: "12px",
    marginBottom: "5px",
  },

  value: {
    display: "block",
    color: "#111827",
    fontSize: "15px",
  },

  helperText: {
    color: "#64748b",
    fontSize: "14px",
    marginTop: "-5px",
    marginBottom: "18px",
  },

  locationGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "12px",
  },

  locationButton: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "15px",
    background: "#fff",
    border: "2px solid #e2e8f0",
    borderRadius: "10px",
    cursor: "pointer",
    textAlign: "left",
    color: "#111827",
  },

  locationButtonSelected: {
    border: "2px solid #2563eb",
    background: "#eff6ff",
  },

  locationIcon: {
    fontSize: "24px",
  },

  actionGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "15px",
    marginBottom: "20px",
  },

  actionButton: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "18px",
    borderRadius: "11px",
    cursor: "pointer",
    textAlign: "left",
    background: "#fff",
  },

  entryButton: {
    border: "2px solid #bbf7d0",
  },

  exitButton: {
    border: "2px solid #fecaca",
  },

  actionSelected: {
    boxShadow:
      "0 0 0 3px rgba(37, 99, 235, 0.12)",
    transform: "translateY(-1px)",
  },

  actionIcon: {
    fontSize: "25px",
  },

  loadingCard: {
    maxWidth: "500px",
    margin: "100px auto",
    background: "#fff",
    padding: "40px",
    borderRadius: "14px",
    textAlign: "center",
    boxShadow:
      "0 4px 20px rgba(0,0,0,0.08)",
  },

  loadingIcon: {
    fontSize: "45px",
    marginBottom: "10px",
  },

  errorCard: {
    maxWidth: "500px",
    margin: "100px auto",
    background: "#fff",
    padding: "40px",
    borderRadius: "14px",
    textAlign: "center",
    boxShadow:
      "0 4px 20px rgba(0,0,0,0.08)",
  },

  errorIcon: {
    fontSize: "45px",
  },

  retryButton: {
    marginTop: "15px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "11px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },

  errorMessage: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "15px",
    fontSize: "14px",
  },

  successMessage: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#166534",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "15px",
    fontSize: "14px",
  },

  submitButton: {
    width: "100%",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "14px",
    borderRadius: "9px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "700",
  },

  submitDisabled: {
    background: "#94a3b8",
    cursor: "not-allowed",
  },

  timestampNote: {
    textAlign: "center",
    color: "#64748b",
    fontSize: "12px",
    marginTop: "12px",
    marginBottom: 0,
  },

  emptyBox: {
    padding: "15px",
    background: "#f8fafc",
    borderRadius: "8px",
    color: "#64748b",
    textAlign: "center",
  },

  footer: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "12px",
    padding: "10px",
  },
};

export default PatientScan;