import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardBody } from "@heroui/card";

import DashboardSidebar, { SidebarItem } from "@/components/dashboard-sidebar";
import DishesManagement from "@/components/restaurant/dishes-management";
import DailyMenuManagement from "@/components/restaurant/daily-menu-management";
import CategoryManagement from "@/components/restaurant/category-management";
import TablesManagement from "@/components/restaurant/tables-management";
import HotelManagement from "@/components/hotel/hotel-management";
import PaymentMethodsManagement from "@/components/system/payment-methods-management";
import CashDepartmentsManagement from "@/components/system/cash-departments-management";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("restaurant");

  const menuItems: SidebarItem[] = [
    {
      id: "hotel",
      label: "Hotel",
      submenu: [
        { id: "hotel-list", label: "Lista camere" },
        { id: "hotel-create", label: "Inserimento camere" },
        { id: "hotel-edit", label: "Modifica camere" },
        { id: "hotel-delete", label: "Cancellazione camere" },
      ],
    },
    {
      id: "restaurant",
      label: "Ristorante",
      submenu: [
        { id: "dishes", label: "Gestione Piatti" },
        { id: "categories", label: "Gestione Categorie" },
        { id: "daily-menu", label: "Gestione Menu Giornaliero" },
        { id: "tables", label: "Dashboard Maitre" },
      ],
    },
    {
      id: "bar",
      label: "Bar",
    },
    {
      id: "system",
      label: "Sistema",
      submenu: [
        { id: "payment-methods", label: "Metodi di pagamento" },
        { id: "cash-departments", label: "Reparti cassa" },
      ],
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("role");
    navigate("/auth");
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
      case "hotel-list":
        return <HotelManagement view="list" />;
      case "hotel-create":
        return <HotelManagement view="create" />;
      case "hotel-edit":
        return <HotelManagement view="edit" />;
      case "hotel-delete":
        return <HotelManagement view="delete" />;
      case "bar":
        return (
          <Card>
            <CardBody>
              <h2 className="text-2xl font-bold">Gestione Bar</h2>
              <p className="mt-4 text-default-500">In sviluppo...</p>
            </CardBody>
          </Card>
        );
      case "payment-methods":
        return <PaymentMethodsManagement />;
      case "cash-departments":
        return <CashDepartmentsManagement />;
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
