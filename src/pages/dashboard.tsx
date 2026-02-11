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
import ShopsManagement from "@/components/extra/shops-management";
import ProductsManagement from "@/components/extra/products-management";
import CategoriesManagement from "@/components/extra/categories-management";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("restaurant");

  const menuItems: SidebarItem[] = [
    {
      id: "hotel",
      label: "Hotel",
      submenu: [
        { id: "hotel-management", label: "Gestione camere" },
        { id: "hotel-agencies", label: "Gestione agenzie" },
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
      case "hotel-management":
        return <HotelManagement view="list" />;
      case "hotel-agencies":
        return <HotelManagement view="agencies" />;
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
