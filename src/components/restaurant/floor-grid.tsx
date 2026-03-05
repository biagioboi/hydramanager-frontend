import React, { useMemo, useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";

type TableStatus = "FREE" | "OCCUPIED" | "RESERVED";

type TableItem = {
  id: string;
  label: string;
  seats: number;
  status: TableStatus;
  row?: string;
};

const SAMPLE_TABLES: TableItem[] = [
  { id: "t-1", label: "T1", seats: 2, status: "FREE", row: "A" },
  { id: "t-2", label: "T2", seats: 4, status: "RESERVED", row: "A" },
  { id: "t-3", label: "T3", seats: 6, status: "OCCUPIED", row: "B" },
  { id: "t-4", label: "T4", seats: 2, status: "FREE", row: "B" },
  { id: "t-5", label: "T5", seats: 8, status: "FREE", row: "C" },
  { id: "t-6", label: "T6", seats: 4, status: "OCCUPIED", row: "C" },
];

export default function FloorGrid({
  tables = SAMPLE_TABLES,
}: {
  tables?: TableItem[];
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const g: Record<string, TableItem[]> = {};
    tables.forEach((t) => {
      const key = t.row || "-";
      if (!g[key]) g[key] = [];
      g[key].push(t);
    });
    return g;
  }, [tables]);

  const statusClass = (s: TableItem["status"]) =>
    s === "OCCUPIED" ? "bg-red-50 border-red-300" : s === "RESERVED" ? "bg-amber-50 border-amber-300" : "bg-emerald-50 border-emerald-300";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold">Vista Cameriere</h2>
        <p className="text-default-500">Visuale operativa dei tavoli in sala.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {Object.keys(grouped).map((row) => (
          <Card key={row} className="min-h-[120px]">
            <CardHeader className="flex items-center justify-between px-4 py-2">
              <div className="text-lg font-semibold">Fila {row}</div>
              <div className="text-sm text-default-400">{grouped[row].length} tavoli</div>
            </CardHeader>
            <CardBody>
              <div className="flex flex-wrap gap-3">
                {grouped[row].map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelected((s) => (s === t.id ? null : t.id))}
                    className={`cursor-pointer rounded-lg border p-3 shadow-sm ${selected === t.id ? 'border-primary-400 bg-primary-50' : 'border-default-200'} ${statusClass(t.status)}`}
                    style={{ width: Math.min(220, 70 + t.seats * 12) }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold">{t.label}</div>
                        <div className="text-xs text-default-500">{t.seats} coperti</div>
                      </div>
                      <Button size="sm" variant={selected === t.id ? 'solid' : 'flat'} color={t.status === 'OCCUPIED' ? 'danger' : t.status === 'RESERVED' ? 'warning' : 'primary'}>
                        {t.status === 'OCCUPIED' ? 'Occupato' : t.status === 'RESERVED' ? 'Pren.' : 'Libero'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
