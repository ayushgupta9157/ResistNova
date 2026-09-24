import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Receptionist from "./pages/Receptionist";
import Patients from "./pages/Patients";
import LocationQR from "./pages/LocationQR";
import Staff from "./pages/Staff";
import PatientScan from "./pages/PatientScan";
import RoomScan from "./pages/RoomScan";
import MovementLogs from "./pages/MovementLogs";
import Contacts from "./pages/Contacts";
import ContactGraph from "./pages/ContactGraph";
import Profile from "./pages/Profile";

import Sidebar from "./components/Sidebar";


const Layout = ({ children }) => {
  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        {children}
      </main>
    </div>
  );
};


const ProtectedRoute = ({ children }) => {
  const logged = localStorage.getItem("logged");

  if (!logged) {
    return <Navigate to="/login" replace />;
  }

  return children;
};


const App = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* ================================================= */}
        {/* PUBLIC QR ROUTES */}
        {/* ================================================= */}

        <Route
          path="/patient-scan/:qrValue"
          element={<PatientScan />}
        />

        <Route
          path="/room-scan/:qrValue"
          element={<RoomScan />}
        />


        {/* ================================================= */}
        {/* LOGIN */}
        {/* ================================================= */}

        <Route
          path="/login"
          element={<Login />}
        />


        {/* ================================================= */}
        {/* DASHBOARD */}
        {/* ================================================= */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />


        {/* ================================================= */}
        {/* RECEPTION */}
        {/* ================================================= */}

        <Route
          path="/reception"
          element={
            <ProtectedRoute>
              <Layout>
                <Receptionist />
              </Layout>
            </ProtectedRoute>
          }
        />


        {/* ================================================= */}
        {/* PATIENTS */}
        {/* ================================================= */}

        <Route
          path="/patients"
          element={
            <ProtectedRoute>
              <Layout>
                <Patients />
              </Layout>
            </ProtectedRoute>
          }
        />


        {/* ================================================= */}
        {/* ROOM QR CODES */}
        {/* ================================================= */}

        <Route
          path="/location-qr"
          element={
            <ProtectedRoute>
              <Layout>
                <LocationQR />
              </Layout>
            </ProtectedRoute>
          }
        />


        {/* ================================================= */}
        {/* STAFF */}
        {/* ================================================= */}

        <Route
          path="/staff"
          element={
            <ProtectedRoute>
              <Layout>
                <Staff />
              </Layout>
            </ProtectedRoute>
          }
        />


        
        


        {/* ================================================= */}
        {/* MOVEMENT LOGS */}
        {/* ================================================= */}

        <Route
          path="/movements"
          element={
            <ProtectedRoute>
              <Layout>
                <MovementLogs />
              </Layout>
            </ProtectedRoute>
          }
        />


        {/* ================================================= */}
        {/* CONTACTS */}
        {/* ================================================= */}

        <Route
          path="/contacts"
          element={
            <ProtectedRoute>
              <Layout>
                <Contacts />
              </Layout>
            </ProtectedRoute>
          }
        />


        {/* ================================================= */}
        {/* CONTACT GRAPH */}
        {/* ================================================= */}

        <Route
          path="/graph"
          element={
            <ProtectedRoute>
              <Layout>
                <ContactGraph />
              </Layout>
            </ProtectedRoute>
          }
        />


        {/* ================================================= */}
        {/* PROFILE */}
        {/* ================================================= */}

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          }
        />


        {/* ================================================= */}
        {/* ROOT */}
        {/* ================================================= */}

        <Route
          path="/"
          element={
            <Navigate
              to={
                localStorage.getItem("logged")
                  ? "/dashboard"
                  : "/login"
              }
              replace
            />
          }
        />


        {/* ================================================= */}
        {/* 404 */}
        {/* ================================================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
};


export default App;