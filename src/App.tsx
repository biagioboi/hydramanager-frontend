import { Route, Routes } from "react-router-dom";

import IndexPage from "@/pages/index";
import DocsPage from "@/pages/docs";
import PricingPage from "@/pages/pricing";
import BlogPage from "@/pages/blog";
import AboutPage from "@/pages/about";
import AuthPage from "@/pages/auth";
import DashboardPage from "@/pages/dashboard";
import ReceptionistPage from "@/pages/receptionist";
import WaiterPage from "@/pages/waiter";
import MaitrePage from "@/pages/maitre";

function App() {
  return (
    <Routes>
      <Route element={<IndexPage />} path="/" />
      <Route element={<DocsPage />} path="/docs" />
      <Route element={<PricingPage />} path="/pricing" />
      <Route element={<BlogPage />} path="/blog" />
      <Route element={<AboutPage />} path="/about" />
      <Route element={<AuthPage />} path="/auth" />
      <Route element={<DashboardPage />} path="/dashboard" />
      <Route element={<ReceptionistPage />} path="/receptionist" />
      <Route element={<WaiterPage />} path="/waiter" />
      <Route element={<MaitrePage />} path="/maitre" />
    </Routes>
  );
}

export default App;
