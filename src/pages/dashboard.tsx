import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardBody } from "@heroui/card";

import DashboardSidebar, { SidebarItem } from "@/components/dashboard-sidebar";
import DishesManagement from "@/components/restaurant/dishes-management";
import DailyMenuManagement from "@/components/restaurant/daily-menu-management";
import CategoryManagement from "@/components/restaurant/category-management";
import TablesManagement from "@/components/restaurant/tables-management";
import HotelManagement from "@/components/hotel/hotel-management";
import RoomFeaturesManagement from "@/components/hotel/room-features-management";
import PaymentMethodsManagement from "@/components/system/payment-methods-management";
import CashDepartmentsManagement from "@/components/system/cash-departments-management";
import StaffManagement from "@/components/system/staff-management";
import PSManagement from "@/components/system/ps-management";
import ShopsManagement from "@/components/extra/shops-management";
import ProductsManagement from "@/components/extra/products-management";
import CategoriesManagement from "@/components/extra/categories-management";

export default function DashboardPage() {
  const navigate = useNavigate();
  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "admin") {
      localStorage.removeItem("authToken");
      localStorage.removeItem("role");
      navigate("/");
    }
  }, [navigate]);
  const [activeSection, setActiveSection] = useState("restaurant");

  const menuItems: SidebarItem[] = [
    {
      id: "hotel",
      label: "Hotel",
      submenu: [
        { id: "hotel-management", label: "Gestione camere" },
        { id: "hotel-agencies", label: "Gestione agenzie" },
        { id: "hotel-features", label: "Servizi camere" },
      ],
    },
    {
      id: "restaurant",
      label: "Ristorante",
      submenu: [
        { id: "dishes", label: "Gestione Piatti" },
        { id: "categories", label: "Gestione Categorie" },
        { id: "daily-menu", label: "Gestione Menu Giornaliero" },
      ],
    },
    {
      id: "extra",
      label: "Extra",
      submenu: [
        { id: "extra-shops", label: "Gestione Shop" },
        { id: "extra-categories", label: "Gestione Categorie" },
        { id: "extra-products", label: "Gestione Prodotti" },
      ],
    },
    {
      id: "system",
      label: "Sistema",
      submenu: [
        { id: "payment-methods", label: "Metodi di pagamento" },
        { id: "cash-departments", label: "Reparti cassa" },
        { id: "system-staff", label: "Gestione staff" },
        { id: "ps-management", label: "Gestione PS" },
      ],
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("role");
    navigate("/");
  };

  const renderContent = () => {
    switch (activeSection) {
      case "dishes":
        return <DishesManagement />;
      case "categories":
        return <CategoryManagement />;
      case "daily-menu":
        return <DailyMenuManagement />;
      case "tables":
        return <TablesManagement />;
      case "hotel":
        return <HotelManagement view="list" />;
      case "hotel-management":
        return <HotelManagement view="list" />;
      case "hotel-agencies":
        return <HotelManagement view="agencies" />;
      case "hotel-features":
        return <RoomFeaturesManagement />;
      case "extra":
        return (
          <Card>
            <CardBody>
              <h2 className="text-2xl font-bold">Gestione Extra</h2>
              <p className="mt-4 text-default-500">
                Seleziona una sezione Extra dal menu
              </p>
            </CardBody>
          </Card>
        );
      case "extra-shops":
        return <ShopsManagement />;
      case "extra-categories":
        return <CategoriesManagement />;
      case "extra-products":
        return <ProductsManagement />;
      case "payment-methods":
        return <PaymentMethodsManagement />;
      case "cash-departments":
        return <CashDepartmentsManagement />;
      case "system-staff":
        return <StaffManagement />;
      case "ps-management":
        return <PSManagement />;
      default:
        return (
          <Card>
            <CardBody>
              <h2 className="text-2xl font-bold">Dashboard</h2>
              <p className="mt-4 text-default-500">
                Seleziona una sezione dal menu
              </p>
            </CardBody>
          </Card>
        );
    }
  };

  return (
    <div className="flex h-screen bg-default-0">
      <DashboardSidebar
        activeId={activeSection}
        items={menuItems}
        onLogout={handleLogout}
        onSelect={setActiveSection}
      />

      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">{renderContent()}</div>
      </main>
    </div>
  );
}
