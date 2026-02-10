import React, { useMemo, useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";

const STATUS_OPTIONS = [
  { key: "FREE", label: "Libero" },
  { key: "OCCUPIED", label: "Occupato" },
  { key: "RESERVED", label: "Prenotato" },
] as const;

type TableStatus = (typeof STATUS_OPTIONS)[number]["key"];

type Row = {
  id: string;
  name: string;
};

type TableItem = {
  id: string;
  label: string;
  seats: number;
  status: TableStatus;
  rowId: string;
  mergedInto?: string;
  mergedIds?: string[];
};

const createId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

export default function TablesManagement() {
  const [rows, setRows] = useState<Row[]>([
    { id: "row-a", name: "Fila A" },
    { id: "row-b", name: "Fila B" },
  ]);
  const [tables, setTables] = useState<TableItem[]>([
    { id: "t-1", label: "T1", seats: 2, status: "FREE", rowId: "row-a" },
    { id: "t-2", label: "T2", seats: 4, status: "RESERVED", rowId: "row-a" },
    { id: "t-3", label: "T3", seats: 6, status: "OCCUPIED", rowId: "row-b" },
  ]);
  const [rowName, setRowName] = useState("");
  const [tableLabel, setTableLabel] = useState("");
  const [tableSeats, setTableSeats] = useState("2");
  const [tableRowId, setTableRowId] = useState(rows[0]?.id ?? "");
  const [tableStatus, setTableStatus] = useState<TableStatus>("FREE");
  const [selectedTables, setSelectedTables] = useState<string[]>([]);

  const visibleTables = useMemo(
    () => tables.filter((table) => !table.mergedInto),
    [tables]
  );

  const rowsWithTables = useMemo(() => {
    const grouped: Record<string, TableItem[]> = {};
    rows.forEach((row) => {
      grouped[row.id] = [];
    });
    visibleTables.forEach((table) => {
      if (!grouped[table.rowId]) grouped[table.rowId] = [];
      grouped[table.rowId].push(table);
    });
    return grouped;
  }, [rows, visibleTables]);

  const handleAddRow = () => {
    if (!rowName.trim()) return;
    const newRow: Row = { id: createId("row"), name: rowName.trim() };
    setRows((prev) => [...prev, newRow]);
    setRowName("");
    setTableRowId(newRow.id);
  };

  const handleAddTable = () => {
    if (!tableLabel.trim() || !tableRowId) return;
    const seats = Math.max(1, Number(tableSeats || 2));
    setTables((prev) => [
      ...prev,
      {
        id: createId("table"),
        label: tableLabel.trim(),
        seats,
        status: tableStatus,
        rowId: tableRowId,
      },
    ]);
    setTableLabel("");
    setTableSeats("2");
    setTableStatus("FREE");
  };

  const toggleSelected = (tableId: string) => {
    setSelectedTables((prev) =>
      prev.includes(tableId) ? prev.filter((id) => id !== tableId) : [...prev, tableId]
    );
  };

  const handleMerge = () => {
    if (selectedTables.length < 2) return;
    const tablesToMerge = tables.filter((table) => selectedTables.includes(table.id));
    if (tablesToMerge.length < 2) return;

    const targetRowId = tablesToMerge[0].rowId;
    const mergedSeats = tablesToMerge.reduce((acc, table) => acc + table.seats, 0);
    const mergedLabel = `Unione ${tablesToMerge.map((table) => table.label).join("+")}`;
    const mergedId = createId("merge");

    const updatedTables = tables.map((table) => {
      if (selectedTables.includes(table.id)) {
        return { ...table, mergedInto: mergedId };
      }
      return table;
    });

    updatedTables.push({
      id: mergedId,
      label: mergedLabel,
      seats: mergedSeats,
      status: "FREE",
      rowId: targetRowId,
      mergedIds: selectedTables,
    });

    setTables(updatedTables);
    setSelectedTables([]);
  };

  const handleUnmerge = (table: TableItem) => {
    if (!table.mergedIds?.length) return;
    setTables((prev) => {
      const withoutMerged = prev.filter((item) => item.id !== table.id);
      return withoutMerged.map((item) =>
        table.mergedIds?.includes(item.id)
          ? { ...item, mergedInto: undefined, status: "FREE" }
          : item
      );
    });
  };

  const handleStatusChange = (tableId: string, status: TableStatus) => {
    setTables((prev) => prev.map((table) => (table.id === tableId ? { ...table, status } : table)));
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard Maitre</h2>
        <p className="text-default-500">Gestisci tavoli, unioni e file della sala.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-col items-start">
            <h3 className="text-lg font-semibold">Configura sala</h3>
            <p className="text-sm text-default-500">Aggiungi file e tavoli.</p>
          </CardHeader>
          <CardBody className="gap-4">
            <div className="flex flex-col gap-2">
              <Input
                label="Nuova fila"
                placeholder="Es. Fila C"
                value={rowName}
                onChange={(e) => setRowName(e.target.value)}
              />
              <Button color="primary" variant="flat" onClick={handleAddRow}>
                Aggiungi fila
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              <Input
                label="Nome tavolo"
                placeholder="Es. T7"
                value={tableLabel}
                onChange={(e) => setTableLabel(e.target.value)}
              />
              <Input
                label="Coperti"
                type="number"
                value={tableSeats}
                onChange={(e) => setTableSeats(e.target.value)}
              />
              <Select
                label="Fila"
                selectedKeys={tableRowId ? [tableRowId] : []}
                onChange={(e) => setTableRowId(e.target.value)}
              >
                {rows.map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {row.name}
                  </SelectItem>
                ))}
              </Select>
              <Select
                label="Stato"
                selectedKeys={[tableStatus]}
                onChange={(e) => setTableStatus(e.target.value as TableStatus)}
              >
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.key} value={option.key}>
                    {option.label}
                  </SelectItem>
                ))}
              </Select>
              <Button color="primary" onClick={handleAddTable}>
                Aggiungi tavolo
              </Button>
            </div>

            <div className="rounded-md border border-default-200 p-3">
              <div className="text-sm font-semibold">Unione tavoli</div>
              <div className="text-xs text-default-500">Selezionati: {selectedTables.length}</div>
              <Button
                className="mt-2"
                color="secondary"
                isDisabled={selectedTables.length < 2}
                onClick={handleMerge}
              >
                Unisci selezionati
              </Button>
            </div>
          </CardBody>
        </Card>

        <div className="lg:col-span-2 flex flex-col gap-4">
          {rows.map((row) => (
            <Card key={row.id}>
              <CardHeader className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{row.name}</h3>
                <span className="text-xs text-default-400">
                  {rowsWithTables[row.id]?.length ?? 0} tavoli
                </span>
              </CardHeader>
              <CardBody>
                <div className="flex flex-wrap gap-3">
                  {(rowsWithTables[row.id] ?? []).map((table) => {
                    const isSelected = selectedTables.includes(table.id);
                    const isMerged = Boolean(table.mergedIds?.length);
                    const sizeStyle = {
                      width: `${Math.min(220, 70 + table.seats * 12)}px`,
                      height: `${Math.min(140, 50 + table.seats * 6)}px`,
                    };

                    return (
                      <div
                        key={table.id}
                        className={`rounded-lg border p-3 shadow-sm transition ${
                          isSelected ? "border-primary-400 bg-primary-50" : "border-default-200"
                        } ${
                          table.status === "OCCUPIED"
                            ? "bg-red-50"
                            : table.status === "RESERVED"
                              ? "bg-amber-50"
                              : "bg-emerald-50"
                        }`}
                        style={sizeStyle}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-semibold">{table.label}</div>
                            <div className="text-xs text-default-500">Tavolo da {table.seats}</div>
                          </div>
                          <Button
                            size="sm"
                            variant={isSelected ? "solid" : "flat"}
                            color={isSelected ? "primary" : "default"}
                            onClick={() => toggleSelected(table.id)}
                          >
                            {isSelected ? "Selezionato" : "Seleziona"}
                          </Button>
                        </div>

                        <div className="mt-3">
                          <Select
                            label="Stato"
                            selectedKeys={[table.status]}
                            onChange={(e) =>
                              handleStatusChange(table.id, e.target.value as TableStatus)
                            }
                          >
                            {STATUS_OPTIONS.map((option) => (
                              <SelectItem key={option.key} value={option.key}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </Select>
                        </div>

                        {isMerged && (
                          <Button
                            className="mt-2"
                            size="sm"
                            color="warning"
                            variant="flat"
                            onClick={() => handleUnmerge(table)}
                          >
                            Separa
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
