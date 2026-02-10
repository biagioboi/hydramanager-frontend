import React, { useEffect, useRef, useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";

import {
  createDailyMenu,
  fetchDailyMenu,
  fetchDishes,
  updateDailyMenuItems,
  type Dish,
} from "@/lib/restaurant-api";

type MenuItem = {
  itemId?: number;
  position?: number;
  dishId: number;
  dishName?: string;
  categoryName?: string;
  note?: string | null;
};

export default function DailyMenuManagement() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [serviceType, setServiceType] = useState("LUNCH");
  const [dailyId, setDailyId] = useState<number | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [selectedDishId, setSelectedDishId] = useState<string>("");
  const [dishQuery, setDishQuery] = useState<string>("");
  const [showDishResults, setShowDishResults] = useState(false);
  const [note, setNote] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceMissing, setServiceMissing] = useState(false);
  const dragIndex = useRef<number | null>(null);

  const loadMenu = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDailyMenu(date, serviceType);
      setDailyId(data.id ?? null);
      setMenuItems(data.items ?? []);
      setServiceMissing(!data.id);
    } catch (err) {
      setMenuItems([]);
      setDailyId(null);
      setServiceMissing(true);
      setError((err as Error).message || "Errore caricamento menu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, serviceType]);

  useEffect(() => {
    const loadDishes = async () => {
      try {
        const list = await fetchDishes();
        setDishes(list);
      } catch (err) {
        setError((err as Error).message || "Errore caricamento piatti");
      }
    };

    loadDishes();
  }, []);

  return (

    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">Gestione Menu Giornaliero</h2>

    <Card>
        
    <CardHeader className="flex flex-col items-start px-4 py-2">
        <h3 className="text-lg font-semibold">Cerca o Aggiungi Menu</h3>
    </CardHeader>
      <CardBody>
        <div className="flex gap-3">
          <Input
            className="flex-1"
            label="Data"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Select
            className="flex-1"
            label="Servizio"
            selectedKeys={[serviceType]}
            onChange={(e) => setServiceType(e.target.value)}
          >
            <SelectItem key="LUNCH" value="LUNCH">
              Pranzo
            </SelectItem>
            <SelectItem key="DINNER" value="DINNER">
              Cena
            </SelectItem>
          </Select>
        </div>

        {error && !serviceMissing && <div className="mt-2 text-sm text-red-600">{error}</div>}

        {serviceMissing && !loading && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
            <div className="text-sm font-medium">Servizio non presente</div>
            <Button
              color="warning"
              onClick={async () => {
                setLoading(true);
                setError(null);
                try {
                  const created = await createDailyMenu({
                    date,
                    service: serviceType,
                  });
                  setDailyId(created.id ?? null);
                  setMenuItems(created.items ?? []);
                  setServiceMissing(false);
                } catch (err) {
                  setError((err as Error).message || "Errore creazione menu");
                } finally {
                  setLoading(false);
                }
              }}
            >
              Crea menu
            </Button>
          </div>
        )}

        {dailyId && (
          <div className="mt-6 flex flex-col gap-3">
            <div className="text-sm font-semibold">Aggiungi elemento al menu</div>
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  label="Cerca piatto"
                  value={dishQuery}
                  onFocus={() => setShowDishResults(true)}
                  onChange={(e) => {
                    setDishQuery(e.target.value);
                    setShowDishResults(true);
                  }}
                />
                {showDishResults && dishQuery.trim().length > 0 && (
                  <div className="mt-2 max-h-52 overflow-auto rounded-md border border-default-200 bg-white shadow-sm">
                    {dishes
                      .filter((dish) =>
                        dish.name
                          .toLowerCase()
                          .includes(dishQuery.trim().toLowerCase())
                      )
                      .slice(0, 20)
                      .map((dish) => (
                        <button
                          key={dish.id}
                          type="button"
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-default-100"
                          onClick={() => {
                            setSelectedDishId(String(dish.id));
                            setDishQuery(dish.name);
                            setShowDishResults(false);
                          }}
                        >
                          <span>{dish.name}</span>
                          <span className="text-xs text-default-500">
                            {dish.categoryName}
                          </span>
                        </button>
                      ))}
                    {dishes.filter((dish) =>
                      dish.name
                        .toLowerCase()
                        .includes(dishQuery.trim().toLowerCase())
                    ).length === 0 && (
                      <div className="px-3 py-2 text-sm text-default-500">
                        Nessun piatto trovato
                      </div>
                    )}
                  </div>
                )}
              </div>
              <Input
                className="flex-1"
                label="Note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <Button
                color="primary"
                isDisabled={!selectedDishId}
                isLoading={loading}
                onClick={async () => {
                  const dish = dishes.find((d) => String(d.id) === selectedDishId);
                  if (!dish) return;

                  const nextPosition = menuItems.length + 1;
                  const updated = [
                    ...menuItems,
                    {
                      dishId: dish.id,
                      dishName: dish.name,
                      categoryName: dish.categoryName,
                      note: note.trim() ? note.trim() : null,
                      position: nextPosition,
                    },
                  ];

                  setMenuItems(updated);
                  setNote("");
                  setSelectedDishId("");
                  setDishQuery("");
                  setShowDishResults(false);

                  try {
                    await updateDailyMenuItems(
                      dailyId,
                      updated.map((it) => ({
                        dishId: it.dishId,
                        position: it.position,
                        note: it.note ?? null,
                      }))
                    );
                  } catch (err) {
                    setError(
                      (err as Error).message || "Errore aggiunta elemento"
                    );
                  }
                }}
              >
                Aggiungi
              </Button>
            </div>
          </div>
        )}
        </CardBody>
      </Card>
        
        {!serviceMissing && (
      <Card>
        <CardHeader>Menù del giorno</CardHeader>
        <CardBody>
        <Table>
          <TableHeader>
            <TableColumn>Posizione</TableColumn>
            <TableColumn>Nome</TableColumn>
            <TableColumn>Categoria</TableColumn>
            <TableColumn>Note</TableColumn>
            <TableColumn>Azioni</TableColumn>
          </TableHeader>
          <TableBody>
            {menuItems.map((m, idx) => (
              <TableRow
                key={`${m.itemId ?? m.dishId}-${idx}`}
                draggable
                onDragOver={(e) => e.preventDefault()}
                onDragStart={(e) => {
                  dragIndex.current = idx;
                  e.dataTransfer?.setData("text/plain", String(idx));
                }}
                onDrop={async (e) => {
                  e.preventDefault();
                  const from = dragIndex.current;
                  const to = idx;

                  if (from == null || from === to) return;

                  const updated = [...menuItems];
                  const [moved] = updated.splice(from, 1);

                  updated.splice(to, 0, moved);
                  const rePos = updated.map((it, i) => ({
                    ...it,
                    position: i + 1,
                  }));

                  setMenuItems(rePos);

                  if (dailyId) {
                    try {
                      await updateDailyMenuItems(
                        dailyId,
                        rePos.map((it) => ({
                          dishId: it.dishId,
                          position: it.position,
                          note: it.note ?? null,
                        })),
                      );
                    } catch (err) {
                      setError(
                        (err as Error).message || "Errore salvataggio ordine",
                      );
                    }
                  }
                }}
              >
                <TableCell>{m.position ?? idx + 1}</TableCell>
                <TableCell>{m.dishName}</TableCell>
                <TableCell>{m.categoryName}</TableCell>
                <TableCell>{m.note}</TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    color="danger"
                    variant="flat"
                    onClick={async () => {
                      const updated = menuItems
                        .filter((_, index) => index !== idx)
                        .map((item, i) => ({ ...item, position: i + 1 }));

                      setMenuItems(updated);

                      if (dailyId) {
                        try {
                          await updateDailyMenuItems(
                            dailyId,
                            updated.map((it) => ({
                              dishId: it.dishId,
                              position: it.position,
                              note: it.note ?? null,
                            }))
                          );
                        } catch (err) {
                          setError(
                            (err as Error).message ||
                              "Errore rimozione elemento"
                          );
                        }
                      }
                    }}
                  >
                    Rimuovi
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardBody>
    </Card>)}
    </div>
  );
}
