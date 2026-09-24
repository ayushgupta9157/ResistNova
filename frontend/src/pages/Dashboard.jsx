import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  `http://${window.location.hostname}:5000/api`;

const ML_BASE =
  import.meta.env.VITE_ML_URL ||
  `http://${window.location.hostname}:8000`;

function Dashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    patients: 0,
    staff: 0,
    activeMovements: 0,
    totalMovements: 0,
  });

  const [movements, setMovements] = useState([]);

  const [systemStatus, setSystemStatus] = useState({
    backend: "Checking",
    database: "Checking",
    ml: "Checking",
    frontend: "Online",
  });

  // ==========================================
  // LOAD DASHBOARD
  // ==========================================

  useEffect(() => {
    loadDashboard();
    checkSystemStatus();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const [
        dashboardResponse,
        patientsResponse,
        staffResponse,
        movementsResponse,
      ] = await Promise.allSettled([
        fetch(`${API_BASE}/dashboard`),
        fetch(`${API_BASE}/patients`),
        fetch(`${API_BASE}/staff`),
        fetch(`${API_BASE}/movements`),
      ]);

      let dashboardData = {};
      let patients = [];
      let staff = [];
      let movementData = [];

      // ------------------------------------------
      // DASHBOARD API
      // ------------------------------------------

      if (
        dashboardResponse.status === "fulfilled" &&
        dashboardResponse.value.ok
      ) {
        try {
          dashboardData =
            await dashboardResponse.value.json();
        } catch {
          dashboardData = {};
        }
      }

      // ------------------------------------------
      // PATIENTS
      // ------------------------------------------

      if (
        patientsResponse.status === "fulfilled" &&
        patientsResponse.value.ok
      ) {
        try {
          const data =
            await patientsResponse.value.json();

          patients = data.patients || data.data || [];
        } catch {
          patients = [];
        }
      }

      // ------------------------------------------
      // STAFF
      // ------------------------------------------

      if (
        staffResponse.status === "fulfilled" &&
        staffResponse.value.ok
      ) {
        try {
          const data =
            await staffResponse.value.json();

          staff = data.staff || data.data || [];
        } catch {
          staff = [];
        }
      }

      // ------------------------------------------
      // MOVEMENTS
      // ------------------------------------------

      if (
        movementsResponse.status === "fulfilled" &&
        movementsResponse.value.ok
      ) {
        try {
          const data =
            await movementsResponse.value.json();

          movementData =
            data.movements || data.data || [];
        } catch {
          movementData = [];
        }
      }

      const dashboardStats =
        dashboardData.stats ||
        dashboardData.data ||
        dashboardData ||
        {};

      const activeMovements =
        movementData.filter(
          (movement) =>
            movement.action === "ENTRY" &&
            !movement.exitTime
        ).length;

      setStats({
        patients: Number(
          dashboardStats.totalPatients ??
            patients.length
        ),

        staff: Number(
          dashboardStats.totalStaff ??
            staff.length
        ),

        activeMovements: Number(
          dashboardStats.activeMovements ??
            activeMovements
        ),

        totalMovements: Number(
          dashboardStats.totalMovements ??
            movementData.length
        ),
      });

      setMovements(movementData);
    } catch (error) {
      console.error(
        "Dashboard loading error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // SYSTEM STATUS
  // ==========================================

  const checkSystemStatus = async () => {
    let backend = "Offline";
    let database = "Offline";
    let ml = "Offline";

    try {
      const response = await fetch(
        `${API_BASE}/health`
      );

      if (response.ok) {
        backend = "Online";
        database = "Online";
      }
    } catch (error) {
      console.error(
        "Backend health error:",
        error
      );
    }

    try {
      const response = await fetch(
        `${ML_BASE}/health`
      );

      if (response.ok) {
        ml = "Online";
      }
    } catch (error) {
      console.warn(
        "ML service unavailable:",
        error
      );
    }

    setSystemStatus({
      backend,
      database,
      ml,
      frontend: "Online",
    });
  };

  // ==========================================
  // RECENT MOVEMENTS
  // ==========================================

  const recentMovements = useMemo(() => {
    return [...movements]
      .sort((a, b) => {
        const timeA = new Date(
          a.entryTime ||
            a.createdAt ||
            0
        ).getTime();

        const timeB = new Date(
          b.entryTime ||
            b.createdAt ||
            0
        ).getTime();

        return timeB - timeA;
      })
      .slice(0, 5);
  }, [movements]);

  // ==========================================
  // MOVEMENT CHART
  // ==========================================

  const chartData = useMemo(() => {
    const days = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();

      date.setHours(0, 0, 0, 0);
      date.setDate(
        date.getDate() - i
      );

      days.push({
        date,
        label: date.toLocaleDateString(
          "en-IN",
          {
            day: "2-digit",
            month: "short",
          }
        ),
        entries: 0,
        exits: 0,
      });
    }

    movements.forEach((movement) => {
      const value =
        movement.entryTime ||
        movement.createdAt;

      if (!value) return;

      const movementDate =
        new Date(value);

      if (
        Number.isNaN(
          movementDate.getTime()
        )
      ) {
        return;
      }

      days.forEach((day) => {
        const sameDay =
          movementDate.getFullYear() ===
            day.date.getFullYear() &&
          movementDate.getMonth() ===
            day.date.getMonth() &&
          movementDate.getDate() ===
            day.date.getDate();

        if (!sameDay) return;

        if (
          movement.action === "ENTRY"
        ) {
          day.entries += 1;
        }

        if (
          movement.action === "EXIT"
        ) {
          day.exits += 1;
        }
      });
    });

    return days;
  }, [movements]);

  const maxChartValue = Math.max(
    1,
    ...chartData.flatMap((item) => [
      item.entries,
      item.exits,
    ])
  );

  const getPoint = (
    value,
    index
  ) => {
    const width = 640;
    const height = 210;

    const x =
      chartData.length <= 1
        ? width / 2
        : (index /
            (chartData.length - 1)) *
          width;

    const y =
      height -
      (value / maxChartValue) *
        165 -
      15;

    return `${x},${y}`;
  };

  const entryPoints = chartData
    .map((item, index) =>
      getPoint(
        item.entries,
        index
      )
    )
    .join(" ");

  const exitPoints = chartData
    .map((item, index) =>
      getPoint(
        item.exits,
        index
      )
    )
    .join(" ");

  // ==========================================
  // HELPERS
  // ==========================================

  const getPersonId = (movement) =>
    movement.personId ||
    movement.patientId ||
    movement.staffId ||
    "Unknown";

  const getPersonType = (movement) =>
    movement.personType ||
    "Person";

  const getLocation = (movement) =>
    movement.location?.name ||
    movement.locationName ||
    movement.locationId ||
    "Hospital";

  const formatTime = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "—";
    }

    return date.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const quickActions = [
    {
      title: "Patient Reception",
      description:
        "Register a patient and generate a unique ID and QR code.",
      icon: "👤",
      color: "#2563eb",
      path: "/reception",
    },
    {
      title: "Add Staff",
      description:
        "Register doctors and nurses in the hospital system.",
      icon: "👨‍⚕️",
      color: "#059669",
      path: "/staff",
    },
    {
      title: "Room QR Codes",
      description:
        "View and print QR codes for hospital rooms and wards.",
      icon: "🏥",
      color: "#7c3aed",
      path: "/location-qr",
    },
    {
      title: "Movement Logs",
      description:
        "Review patient and staff ENTRY / EXIT records.",
      icon: "📋",
      color: "#d97706",
      path: "/movements",
    },
  ];

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div
      style={{
        padding: "30px",
        maxWidth: "1500px",
        margin: "0 auto",
      }}
    >
      {/* ======================================
          HEADER
      ====================================== */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px",
          marginBottom: "28px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              color: "#172033",
              fontSize: "32px",
              fontWeight: "800",
            }}
          >
            Welcome back, Admin
          </h1>

          <p
            style={{
              margin:
                "7px 0 0",
              color: "#64748b",
              fontSize: "15px",
            }}
          >
            Monitor. Prevent. Protect.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "9px",
            background: "#ecfdf5",
            color: "#047857",
            padding:
              "10px 16px",
            borderRadius: "10px",
            fontWeight: "700",
            fontSize: "14px",
          }}
        >
          <span
            style={{
              width: "9px",
              height: "9px",
              borderRadius: "50%",
              background:
                "#10b981",
              display: "inline-block",
            }}
          />

          System Operational
        </div>
      </div>

      {/* ======================================
          KPI CARDS
      ====================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
          gap: "18px",
          marginBottom: "30px",
        }}
      >
        {[
          {
            title: "Total Patients",
            value: stats.patients,
            description:
              "Registered patients",
            icon: "👥",
            bg: "#eff6ff",
          },
          {
            title: "Total Staff",
            value: stats.staff,
            description:
              "Doctors & nurses",
            icon: "👨‍⚕️",
            bg: "#ecfdf5",
          },
          {
            title: "Active Movements",
            value:
              stats.activeMovements,
            description:
              "Currently inside",
            icon: "🚶",
            bg: "#fffbeb",
          },
          {
            title: "Total Movements",
            value:
              stats.totalMovements,
            description:
              "Movement records",
            icon: "📋",
            bg: "#f5f3ff",
          },
        ].map((card) => (
          <div
            key={card.title}
            style={{
              background: "#ffffff",
              border:
                "1px solid #e5e7eb",
              borderRadius: "16px",
              padding: "21px",
              boxShadow:
                "0 5px 18px rgba(15,23,42,0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "flex-start",
              }}
            >
              <div>
                <div
                  style={{
                    color: "#64748b",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  {card.title}
                </div>

                <div
                  style={{
                    marginTop: "8px",
                    color: "#111827",
                    fontSize: "31px",
                    fontWeight: "800",
                  }}
                >
                  {loading
                    ? "—"
                    : card.value}
                </div>
              </div>

              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "14px",
                  background:
                    card.bg,
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  fontSize: "27px",
                }}
              >
                {card.icon}
              </div>
            </div>

            <div
              style={{
                marginTop: "13px",
                color: "#94a3b8",
                fontSize: "12px",
              }}
            >
              {card.description}
            </div>
          </div>
        ))}
      </div>

      {/* ======================================
          QUICK ACTIONS
      ====================================== */}

      <section
        style={{
          background: "#ffffff",
          border:
            "1px solid #e5e7eb",
          borderRadius: "16px",
          padding: "25px",
          marginBottom: "24px",
          boxShadow:
            "0 5px 18px rgba(15,23,42,0.04)",
        }}
      >
        <div
          style={{
            marginBottom: "20px",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "24px",
              color: "#172033",
            }}
          >
            Quick Actions
          </h2>

          <p
            style={{
              margin:
                "6px 0 0",
              color: "#718096",
              fontSize: "14px",
            }}
          >
            Common hospital surveillance tasks
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4, minmax(0, 1fr))",
            gap: "16px",
          }}
        >
          {quickActions.map(
            (action) => (
              <button
                key={action.title}
                type="button"
                onClick={() =>
                  navigate(
                    action.path
                  )
                }
                style={{
                  textAlign: "left",
                  border:
                    "1px solid #e2e8f0",
                  borderRadius: "14px",
                  padding: "20px",
                  background:
                    "#f8fafc",
                  cursor: "pointer",
                  transition:
                    "all 0.2s ease",
                }}
                onMouseEnter={(
                  e
                ) => {
                  e.currentTarget.style.transform =
                    "translateY(-3px)";
                  e.currentTarget.style.boxShadow =
                    "0 10px 25px rgba(15,23,42,0.09)";
                }}
                onMouseLeave={(
                  e
                ) => {
                  e.currentTarget.style.transform =
                    "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "none";
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius:
                      "12px",
                    background:
                      "#ffffff",
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    fontSize: "25px",
                    marginBottom:
                      "14px",
                  }}
                >
                  {action.icon}
                </div>

                <div
                  style={{
                    color:
                      action.color,
                    fontWeight:
                      "800",
                    fontSize:
                      "17px",
                    marginBottom:
                      "7px",
                  }}
                >
                  {action.title}
                </div>

                <div
                  style={{
                    color:
                      "#64748b",
                    fontSize:
                      "13px",
                    lineHeight:
                      "1.55",
                  }}
                >
                  {
                    action.description
                  }
                </div>

                <div
                  style={{
                    marginTop:
                      "15px",
                    color:
                      action.color,
                    fontWeight:
                      "700",
                    fontSize:
                      "13px",
                  }}
                >
                  Open →
                </div>
              </button>
            )
          )}
        </div>
      </section>

      {/* ======================================
          LOWER DASHBOARD
      ====================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "1.25fr 0.9fr 0.9fr",
          gap: "20px",
        }}
      >
        {/* MOVEMENT OVERVIEW */}

        <section
          style={{
            background:
              "#ffffff",
            border:
              "1px solid #e5e7eb",
            borderRadius:
              "16px",
            padding: "22px",
            boxShadow:
              "0 5px 18px rgba(15,23,42,0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              marginBottom:
                "18px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize:
                    "19px",
                  color:
                    "#172033",
                }}
              >
                Movement Overview
              </h2>

              <p
                style={{
                  margin:
                    "5px 0 0",
                  color:
                    "#718096",
                  fontSize:
                    "12px",
                }}
              >
                ENTRY and EXIT records — Last 7 days
              </p>
            </div>

            <span
              style={{
                background:
                  "#eff6ff",
                color:
                  "#2563eb",
                padding:
                  "7px 10px",
                borderRadius:
                  "8px",
                fontSize:
                  "12px",
                fontWeight:
                  "700",
              }}
            >
              7 Days
            </span>
          </div>

          <div
            style={{
              width: "100%",
              overflow:
                "hidden",
            }}
          >
            <svg
              viewBox="0 0 700 260"
              width="100%"
              height="260"
              preserveAspectRatio="none"
            >
              {/* GRID */}

              {[0, 1, 2, 3, 4].map(
                (line) => {
                  const y =
                    30 +
                    line * 45;

                  return (
                    <line
                      key={line}
                      x1="35"
                      y1={y}
                      x2="680"
                      y2={y}
                      stroke="#e2e8f0"
                      strokeWidth="1"
                    />
                  );
                }
              )}

              {/* ENTRY LINE */}

              <polyline
                points={entryPoints}
                fill="none"
                stroke="#2563eb"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* EXIT LINE */}

              <polyline
                points={exitPoints}
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* ENTRY DOTS */}

              {chartData.map(
                (item, index) => {
                  const [
                    x,
                    y,
                  ] = getPoint(
                    item.entries,
                    index
                  ).split(",");

                  return (
                    <circle
                      key={`entry-${index}`}
                      cx={x}
                      cy={y}
                      r="5"
                      fill="#2563eb"
                    />
                  );
                }
              )}

              {/* EXIT DOTS */}

              {chartData.map(
                (item, index) => {
                  const [
                    x,
                    y,
                  ] = getPoint(
                    item.exits,
                    index
                  ).split(",");

                  return (
                    <circle
                      key={`exit-${index}`}
                      cx={x}
                      cy={y}
                      r="5"
                      fill="#8b5cf6"
                    />
                  );
                }
              )}
            </svg>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(7, 1fr)",
                color:
                  "#94a3b8",
                fontSize:
                  "11px",
                marginTop:
                  "-12px",
              }}
            >
              {chartData.map(
                (item) => (
                  <span
                    key={
                      item.label
                    }
                    style={{
                      textAlign:
                        "center",
                    }}
                  >
                    {item.label}
                  </span>
                )
              )}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "20px",
              marginTop:
                "18px",
              fontSize:
                "12px",
              color:
                "#64748b",
            }}
          >
            <span>
              <b
                style={{
                  color:
                    "#2563eb",
                }}
              >
                ●
              </b>{" "}
              Entries
            </span>

            <span>
              <b
                style={{
                  color:
                    "#8b5cf6",
                }}
              >
                ●
              </b>{" "}
              Exits
            </span>
          </div>
        </section>

        {/* RECENT MOVEMENTS */}

        <section
          style={{
            background:
              "#ffffff",
            border:
              "1px solid #e5e7eb",
            borderRadius:
              "16px",
            padding: "22px",
            boxShadow:
              "0 5px 18px rgba(15,23,42,0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              marginBottom:
                "17px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize:
                    "19px",
                  color:
                    "#172033",
                }}
              >
                Recent Movements
              </h2>

              <p
                style={{
                  margin:
                    "5px 0 0",
                  color:
                    "#718096",
                  fontSize:
                    "12px",
                }}
              >
                Latest ENTRY / EXIT records
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/movements"
                )
              }
              style={{
                border: "none",
                background:
                  "transparent",
                color:
                  "#2563eb",
                fontWeight:
                  "700",
                cursor:
                  "pointer",
                fontSize:
                  "12px",
              }}
            >
              View All →
            </button>
          </div>

          {recentMovements.length ===
          0 ? (
            <div
              style={{
                padding:
                  "35px 10px",
                textAlign:
                  "center",
                color:
                  "#94a3b8",
                fontSize:
                  "13px",
              }}
            >
              No movement records yet.
            </div>
          ) : (
            <div>
              {recentMovements.map(
                (
                  movement,
                  index
                ) => {
                  const isEntry =
                    movement.action ===
                    "ENTRY";

                  return (
                    <div
                      key={
                        movement._id ||
                        index
                      }
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        gap: "11px",
                        padding:
                          "12px 0",
                        borderBottom:
                          index <
                          recentMovements.length -
                            1
                            ? "1px solid #f1f5f9"
                            : "none",
                      }}
                    >
                      <div
                        style={{
                          width:
                            "34px",
                          height:
                            "34px",
                          flexShrink:
                            0,
                          borderRadius:
                            "50%",
                          background:
                            isEntry
                              ? "#ecfdf5"
                              : "#fef2f2",
                          display:
                            "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                          fontSize:
                            "15px",
                        }}
                      >
                        {movement.personType ===
                        "Staff"
                          ? "👨‍⚕️"
                          : "👤"}
                      </div>

                      <div
                        style={{
                          minWidth:
                            0,
                          flex: 1,
                        }}
                      >
                        <div
                          style={{
                            fontWeight:
                              "700",
                            fontSize:
                              "12px",
                            color:
                              "#172033",
                          }}
                        >
                          {getPersonId(
                            movement
                          )}
                        </div>

                        <div
                          style={{
                            color:
                              "#718096",
                            fontSize:
                              "11px",
                            marginTop:
                              "3px",
                            whiteSpace:
                              "nowrap",
                            overflow:
                              "hidden",
                            textOverflow:
                              "ellipsis",
                          }}
                        >
                          {getPersonType(
                            movement
                          )}{" "}
                          •{" "}
                          {getLocation(
                            movement
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          textAlign:
                            "right",
                          flexShrink:
                            0,
                        }}
                      >
                        <span
                          style={{
                            display:
                              "inline-block",
                            padding:
                              "4px 8px",
                            borderRadius:
                              "20px",
                            background:
                              isEntry
                                ? "#dcfce7"
                                : "#fee2e2",
                            color:
                              isEntry
                                ? "#15803d"
                                : "#dc2626",
                            fontWeight:
                              "800",
                            fontSize:
                              "10px",
                          }}
                        >
                          {movement.action}
                        </span>

                        <div
                          style={{
                            color:
                              "#94a3b8",
                            fontSize:
                              "10px",
                            marginTop:
                              "4px",
                          }}
                        >
                          {formatTime(
                            movement.entryTime ||
                              movement.createdAt
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>

        {/* SYSTEM STATUS */}

        <section
          style={{
            background:
              "#ffffff",
            border:
              "1px solid #e5e7eb",
            borderRadius:
              "16px",
            padding: "22px",
            boxShadow:
              "0 5px 18px rgba(15,23,42,0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              marginBottom:
                "17px",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize:
                  "19px",
                color:
                  "#172033",
              }}
            >
              System Status
            </h2>

            <span
              style={{
                background:
                  "#dcfce7",
                color:
                  "#15803d",
                padding:
                  "6px 9px",
                borderRadius:
                  "20px",
                fontSize:
                  "10px",
                fontWeight:
                  "800",
              }}
            >
              Operational
            </span>
          </div>

          {[
            {
              name: "Backend API",
              status:
                systemStatus.backend,
            },
            {
              name: "Database (MongoDB)",
              status:
                systemStatus.database,
            },
            {
              name: "ML Service",
              status:
                systemStatus.ml,
            },
            {
              name: "Frontend",
              status:
                systemStatus.frontend,
            },
          ].map((item) => {
            const online =
              item.status ===
              "Online";

            return (
              <div
                key={item.name}
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "space-between",
                  padding:
                    "14px 0",
                  borderBottom:
                    "1px solid #f1f5f9",
                }}
              >
                <div
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    gap: "9px",
                    color:
                      "#334155",
                    fontSize:
                      "12px",
                    fontWeight:
                      "600",
                  }}
                >
                  <span
                    style={{
                      width:
                        "9px",
                      height:
                        "9px",
                      borderRadius:
                        "50%",
                      background:
                        online
                          ? "#10b981"
                          : "#ef4444",
                    }}
                  />

                  {item.name}
                </div>

                <span
                  style={{
                    color:
                      online
                        ? "#059669"
                        : "#dc2626",
                    fontSize:
                      "11px",
                    fontWeight:
                      "700",
                  }}
                >
                  {item.status}
                </span>
              </div>
            );
          })}

          <button
            type="button"
            onClick={() =>
              checkSystemStatus()
            }
            style={{
              marginTop:
                "17px",
              width: "100%",
              padding:
                "9px",
              border:
                "1px solid #dbe3ee",
              borderRadius:
                "8px",
              background:
                "#f8fafc",
              color:
                "#475569",
              cursor:
                "pointer",
              fontWeight:
                "600",
              fontSize:
                "12px",
            }}
          >
            Refresh Status
          </button>
        </section>
      </div>

      {/* ======================================
          FOOTER NOTE
      ====================================== */}

      <div
        style={{
          marginTop: "24px",
          padding:
            "15px 18px",
          background:
            "#f8fafc",
          border:
            "1px solid #e2e8f0",
          borderRadius:
            "12px",
          color:
            "#64748b",
          fontSize:
            "12px",
          lineHeight:
            "1.6",
        }}
      >
        <strong
          style={{
            color:
              "#334155",
          }}
        >
          ResistNova:
        </strong>{" "}
        Hospital movement surveillance using
        QR-based ENTRY / EXIT logging and
        time-overlap contact detection.
      </div>
    </div>
  );
}

export default Dashboard;