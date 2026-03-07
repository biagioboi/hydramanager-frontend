import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Providers } from "../app/providers";
function ProtectedRoute({ children }: { children: JSX.Element }) {
  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
}

import IndexPage from "@/pages/index";
import DashboardPage from "@/pages/dashboard";
import ReceptionistPage from "@/pages/receptionist";
import WaiterPage from "@/pages/waiter";
import MaitrePage from "@/pages/maitre";
import BarmanPage from "@/pages/barman";
import RepairmanPage from "@/pages/repairman";
import WelcomePage from "@/pages/welcome/tokenTemporaneo";
import GuestPage from "@/pages/guest";


function getDashboardPathByRole(role?: string): string {
  switch (role) {
    case "receptionist":
      return "/receptionist";
    case "waiter":
      return "/waiter";
    case "maitre":
      return "/maitre";
    case "barman":
      return "/barman";
    case "repairman":
      return "/repairman";
    default:
      return "/dashboard";
  }
}

function App() {
  const location = useLocation();
  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  const role = typeof window !== "undefined" ? localStorage.getItem("role") : null;

  return (
    <Providers>
      <Routes>
      <Route
        path="/"
        element={
          token && role
            ? <Navigate to={getDashboardPathByRole(role)} replace state={{ from: location }} />
            : <IndexPage />
        }
      />

      <Route 
        path="/welcome/:tokenTemporaneo" 
        element={<WelcomePage/>} 
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/receptionist"
        element={
          <ProtectedRoute>
            <ReceptionistPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/waiter"
        element={
          <ProtectedRoute>
            <WaiterPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/maitre"
        element={
          <ProtectedRoute>
            <MaitrePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/barman"
        element={
          <ProtectedRoute>
            <BarmanPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/repairman"
        element={
          <ProtectedRoute>
            <RepairmanPage />
          </ProtectedRoute>
        }
      />
      <Route path="/guest" element={<ProtectedRoute><GuestPage /></ProtectedRoute>} />
      </Routes>
    </Providers>
  );
}

export default App;
