import React from "react";
import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";

export type SidebarItem = {
  label: string;
  id: string;
  icon?: React.ReactNode;
  submenu?: SidebarItem[];
};

type DashboardSidebarProps = {
  items: SidebarItem[];
  activeId: string;
  onSelect: (id: string) => void;
  onLogout: () => void;
};

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  items,
  activeId,
  onSelect,
  onLogout,
}) => {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  return (
    <aside className="w-64 bg-default-100 border-r border-default-200 min-h-screen flex flex-col p-4">
      <h2 className="text-xl font-bold mb-6">Gestionale</h2>

      <nav className="flex-1 flex flex-col gap-2">
        {items.map((item) => (
          <div key={item.id}>
            <Button
              className={`w-full justify-start ${activeId === item.id ? "bg-primary text-primary-foreground" : "bg-default-200"}`}
              variant={activeId === item.id ? "solid" : "flat"}
              onClick={() => {
                onSelect(item.id);
                if (item.submenu)
                  setExpandedId(expandedId === item.id ? null : item.id);
              }}
            >
              {item.icon && <span className="mr-2">{item.icon}</span>}
              {item.label}
            </Button>

            {item.submenu && expandedId === item.id && (
              <div className="ml-4 mt-1 flex flex-col gap-1">
                {item.submenu.map((sub) => (
                  <Button
                    key={sub.id}
                    className={`w-full justify-start text-sm ${activeId === sub.id ? "bg-primary text-primary-foreground" : "bg-default-100"}`}
                    variant={activeId === sub.id ? "solid" : "flat"}
                    onClick={() => onSelect(sub.id)}
                  >
                    {sub.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <Divider className="my-4" />

      <Button
        className="w-full bg-danger text-danger-foreground"
        variant="flat"
        onClick={onLogout}
      >
        Logout
      </Button>
    </aside>
  );
};

export default DashboardSidebar;
