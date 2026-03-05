import React, { useEffect, useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import {
  fetchDailyMenu,
  fetchDishes,
  createDailyMenu,
  updateDailyMenuItems,
  updateDailyMenuVisibility,
  createDish,
  fetchCategories,
  type DailyMenu,
  type Dish,
} from "@/lib/restaurant-api";
import { addToast } from "@heroui/toast";
import { Chip } from "@heroui/react";

type Props = {
  isOpen: boolean;
  onOpenChange: (value: boolean) => void;
};

export default function MenuModal({ isOpen, onOpenChange }: Props) {
  const [menuDate, setMenuDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
  });
  const [menuService, setMenuService] = useState("LUNCH");
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [dailyMenu, setDailyMenu] = useState<DailyMenu | null>(null);
  const [selectedDishIds, setSelectedDishIds] = useState<number[]>([]);
  const [primi, setPrimi] = useState<(number | undefined)[]>([]); // up to 3 (third = bimbi)
  const [secondi, setSecondi] = useState<(number | undefined)[]>([]); // up to 3 (third = bimbi)
  const [contorni, setContorni] = useState<(number | undefined)[]>([]); // up to 3 (third = bimbi)
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);
  const [slotPending, setSlotPending] = useState<string | null>(null);
  const [dishQuery, setDishQuery] = useState("");
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [isAddDishOpen, setIsAddDishOpen] = useState(false);
  const [newDishName, setNewDishName] = useState("");
  const [newDishNameEn, setNewDishNameEn] = useState("");
  const [newDishCategoryId, setNewDishCategoryId] = useState<number | undefined>(undefined);
  const [newDishIngredients, setNewDishIngredients] = useState("");
  const [addingDish, setAddingDish] = useState(false);
  const [addDishError, setAddDishError] = useState<string | null>(null);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);

  const showToast = (message: string, type: "success" | "error" = "error", duration = 3000) => {
    if (type === "error") {
      addToast({
        title: "Errore!",
        description: message,
        severity: "danger",
        color: "danger",
        timeout: duration,
        classNames: { base: "max-w-[36rem]", content: "whitespace-normal text-sm" },
      });
      return;
    }
    addToast({
      title: "Successo",
      description: message,
      severity: "success",
      color: "success",
      timeout: duration,
      classNames: { base: "max-w-[36rem]", content: "whitespace-normal text-sm" },
    });
  };

  const loadMenuData = async () => {
    setMenuLoading(true);
    setMenuError(null);
    try {
      const [allDishes, menu, cats] = await Promise.all([
        fetchDishes(),
        fetchDailyMenu(menuDate, menuService).catch(() => null),
        fetchCategories().catch(() => []),
      ]);
      setDishes(allDishes);
      setCategories(cats || []);
      setDailyMenu(menu as DailyMenu | null);
      setIsPublic((menu as any)?.isPublic ? true : false);
      
      // inizializza 9 slot vuoti
const primiSlots: (number | undefined)[] = [undefined, undefined, undefined];
const secondiSlots: (number | undefined)[] = [undefined, undefined, undefined];
const contorniSlots: (number | undefined)[] = [undefined, undefined, undefined];

(menu?.items || []).forEach((item: any) => {
  const pos = item.position;

  if (pos >= 1 && pos <= 3) {
    primiSlots[pos - 1] = item.dishId;
  }

  if (pos >= 4 && pos <= 6) {
    secondiSlots[pos - 4] = item.dishId;
  }

  if (pos >= 7 && pos <= 9) {
    contorniSlots[pos - 7] = item.dishId;
  }
});

setPrimi(primiSlots);
setSecondi(secondiSlots);
setContorni(contorniSlots);

    } catch (err) {
      setMenuError((err as Error).message || "Errore caricamento menu");
    } finally {
      setMenuLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) loadMenuData();
    if (!isOpen) {
      setActiveSlot(null);
      setSlotPending(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, menuDate, menuService]);

  const handleToggleDish = (dishId: number) => {
    setSelectedDishIds((prev) => {
      if (prev.includes(dishId)) return prev.filter((id) => id !== dishId);
      return [...prev, dishId];
    });
  };

  const filteredDishes = dishes.filter((d) => d.name.toLowerCase().includes(dishQuery.trim().toLowerCase()));

  const handleOpenAddDish = () => {
    setNewDishName(dishQuery.trim());
    setNewDishNameEn("");
    setNewDishCategoryId(undefined);
    setNewDishIngredients("");
    setAddDishError(null);
    setIsAddDishOpen(true);
  };

  const handleCreateDish = async () => {
    if (!newDishName.trim()) {
      setAddDishError("Il nome è richiesto");
      return;
    }
    setAddingDish(true);
    setAddDishError(null);
    try {
      const payload: any = { name: newDishName.trim() };
      if (newDishNameEn.trim()) payload.nameEn = newDishNameEn.trim();
      if (newDishCategoryId) payload.categoryId = newDishCategoryId;
      const ing = newDishIngredients.split(",").map((s) => s.trim()).filter(Boolean);
      if (ing.length) payload.ingredients = ing;
      const created = await createDish(payload);
      // add to local list and assign to active slot if any
      setDishes((prev) => [created, ...prev]);
      setIsAddDishOpen(false);
      showToast("Piatto creato", "success", 2000);
      // auto assign to active slot (if present)
      if (activeSlot) assignDishToActiveSlot(created.id);
    } catch (err) {
      setAddDishError((err as Error).message || "Errore creazione piatto");
    } finally {
      setAddingDish(false);
    }
  };

  const handleTogglePublic = async () => {
    const next = !isPublic;
    // optimistic update
    setIsPublic(next);
    try {
      if (!dailyMenu) {
        // create menu first
        const created = await createDailyMenu({ date: menuDate, service: menuService });
        setDailyMenu(created);
        await updateDailyMenuVisibility(created.id, next);
      } else {
        await updateDailyMenuVisibility(dailyMenu.id, next);
      }
      showToast(next ? "Menu reso pubblico" : "Menu reso privato", "success", 2000);
    } catch (err) {
      // revert
      setIsPublic(!next);
      showToast((err as Error).message || "Errore aggiornamento visibilità", "error", 3000);
    }
  };

  const assignDishToSlot = (slot: string, dishId: number) => {
    if (slot.startsWith("primi")) {
      const idx = Number(slot.split("-")[1]);
      setPrimi((prev) => {
        const next = [...prev];
        next[idx] = dishId;
        return next;
      });
    } else if (slot.startsWith("secondi")) {
      const idx = Number(slot.split("-")[1]);
      setSecondi((prev) => {
        const next = [...prev];
        next[idx] = dishId;
        return next;
      });
    } else if (slot.startsWith("contorni")) {
      const idx = Number(slot.split("-")[1]);
      setContorni((prev) => {
        const next = [...prev];
        next[idx] = dishId;
        return next;
      });
    }
    setActiveSlot(null);
    setSlotPending(null);
  };

  const assignDishToActiveSlot = (dishId: number) => {
    if (!activeSlot) return;
    if (activeSlot.startsWith("primi")) {
      const idx = Number(activeSlot.split("-")[1]);
      setPrimi((prev) => {
        const next = [...prev];
        next[idx] = dishId;
        return next;
      });
    }
    if (activeSlot.startsWith("secondi")) {
      const idx = Number(activeSlot.split("-")[1]);
      setSecondi((prev) => {
        const next = [...prev];
        next[idx] = dishId;
        return next;
      });
    }
    if (activeSlot.startsWith("contorni")) {
      const idx = Number(activeSlot.split("-")[1]);
      setContorni((prev) => {
        const next = [...prev];
        next[idx] = dishId;
        return next;
      });
    }
    setActiveSlot(null);
    setSlotPending(null);
  };

  const removeFromSlot = (slot: string) => {
  if (slot.startsWith("primi")) {
    const idx = Number(slot.split("-")[1]);
    setPrimi((prev) => {
      const next = [...prev];
      next[idx] = undefined as any; // svuota SOLO lo slot
      return next;
    });
    return;
  }

  if (slot.startsWith("secondi")) {
    const idx = Number(slot.split("-")[1]);
    setSecondi((prev) => {
      const next = [...prev];
      next[idx] = undefined as any;
      return next;
    });
    return;
  }

  if (slot.startsWith("contorni")) {
    const idx = Number(slot.split("-")[1]);
    setContorni((prev) => {
      const next = [...prev];
      next[idx] = undefined as any;
      return next;
    });
    return;
  }
};

  const handleSaveMenu = async () => {
  setMenuLoading(true);
  setMenuError(null);

  try {
    let currentMenu = dailyMenu;

    if (!currentMenu) {
      currentMenu = await createDailyMenu({
        date: menuDate,
        service: menuService
      });
      setDailyMenu(currentMenu);
    }

    // Costruzione payload mantenendo POSIZIONI ASSOLUTE
    const itemsPayload: Array<{
      dishId: number;
      position: number;
      isForChild?: boolean;
    }> = [];

    // PRIMI (pos 1-3)
    primi.forEach((dishId, i) => {
      if (dishId) {
        itemsPayload.push({
          dishId,
          position: i + 1,
          isForChild: i === 2
        });
      }
    });

    // SECONDI (pos 4-6)
    secondi.forEach((dishId, i) => {
      if (dishId) {
        itemsPayload.push({
          dishId,
          position: i + 4,
          isForChild: i === 2
        });
      }
    });

    // CONTORNI (pos 7-9)
    contorni.forEach((dishId, i) => {
      if (dishId) {
        itemsPayload.push({
          dishId,
          position: i + 7,
          isForChild: i === 2
        });
      }
    });

    const updated = await updateDailyMenuItems(
      currentMenu.id,
      itemsPayload
    );

    setDailyMenu(updated);

    showToast("Menu aggiornato", "success", 2000);
    onOpenChange(false);

  } catch (err) {
    setMenuError(
      (err as Error).message || "Errore salvataggio menu"
    );
    showToast(
      (err as Error).message || "Errore salvataggio menu",
      "error",
      3000
    );
  } finally {
    setMenuLoading(false);
  }
};

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center" size="lg">
      <ModalContent className="w-[95vw] max-w-[1400px]">
        <ModalHeader className="flex items-center justify-between gap-1">
          <div className="flex flex-col">
            Menu giornaliero
            <span className="text-xs text-default-500">Gestisci il menu del giorno</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-default-500">Pubblico</div>
            <Button size="sm" variant={isPublic ? "solid" : "flat"} color={isPublic ? "primary" : undefined} onClick={handleTogglePublic}>
              {isPublic ? "On" : "Off"}
            </Button>
          </div>
        </ModalHeader>
        <ModalBody className="gap-3">
          {menuError && <div className="text-sm text-danger-600">{menuError}</div>}
          <div className="grid gap-3 md:grid-cols-3">
            <Input label="Data" type="date" value={menuDate} onChange={(e) => setMenuDate((e.target as HTMLInputElement).value)} />
            <Select label="Servizio" selectedKeys={[menuService]} onChange={(e) => setMenuService((e.target as HTMLSelectElement).value)}>
              <SelectItem key="BREAKFAST">Colazione</SelectItem>
              <SelectItem key="LUNCH">Pranzo</SelectItem>
              <SelectItem key="DINNER">Cena</SelectItem>
            </Select>
            <div className="flex items-end">
              <Button size="sm" variant="flat" onClick={loadMenuData} isDisabled={menuLoading}>
                Aggiorna
              </Button>
            </div>
          </div>

          <div className="mt-3 grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="text-sm font-semibold mb-2">Configurazione servizio</div>

              <div className="grid gap-3">
                <div>
                  <div className="text-xs text-default-500 mb-1">Primi (3)</div>
                    <div className="flex gap-2">
                      {[0, 1, 2].map((i) => {
                          const slot = `primi-${i}`;
                          const isDragOver = dragOverSlot === slot;
                          return (
                            <div key={i} onDragOver={(e) => { e.preventDefault(); setDragOverSlot(slot); }} onDragLeave={() => setDragOverSlot(null)} onDrop={(e) => { const id = Number(e.dataTransfer.getData('text')); if (id) assignDishToSlot(slot, id); setDragOverSlot(null); }} className={`flex items-center gap-2 ${isDragOver ? 'rounded-md bg-primary-100 p-1' : ''} ${!primi[i] ? 'border-2 border-dashed border-default-200 bg-default-50 px-2 py-2 rounded' : ''}`}>
                                <div className="text-sm font-medium">{primi[i] ? dishes.find(d => d.id === primi[i])?.name : i < 2 ? `Primo ${i + 1}` : `Primo 3 (bimbi)`}</div>
                                {!primi[i] ? (
                                  slotPending === slot ? (
                                    <div className="w-7 h-7 rounded-full bg-warning-100 text-warning-800 border border-warning-200 flex items-center justify-center">
                                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                      </svg>
                                    </div>
                                  ) : (
                                    <Button size="sm" variant="solid" aria-label={`Seleziona ${slot}`} className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-200 px-2 py-0.5 rounded-full" onClick={() => { setActiveSlot(slot); setSlotPending(slot); }}>+</Button>
                                  )
                                ) : (
                                  <Button size="sm" variant="light" color="danger" aria-label={`Rimuovi ${slot}`} className="px-2 py-0.5 rounded-full" onClick={() => { removeFromSlot(slot); setSlotPending(null); }}>✕</Button>
                                )}
                            </div>
                          );
                          })}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-default-500 mb-1">Secondi (3)</div>
                    <div className="flex gap-2">
                      {[0, 1, 2].map((i) => {
                          const slot = `secondi-${i}`;
                          const isDragOver = dragOverSlot === slot;
                          return (
                            <div key={i} onDragOver={(e) => { e.preventDefault(); setDragOverSlot(slot); }} onDragLeave={() => setDragOverSlot(null)} onDrop={(e) => { const id = Number(e.dataTransfer.getData('text')); if (id) assignDishToSlot(slot, id); setDragOverSlot(null); }} className={`flex items-center gap-2 ${isDragOver ? 'rounded-md bg-primary-100 p-1' : ''} ${!secondi[i] ? 'border-2 border-dashed border-default-200 bg-default-50 px-2 py-2 rounded' : ''}`}>
                                <div className="text-sm font-medium">{secondi[i] ? dishes.find(d => d.id === secondi[i])?.name : i < 2 ? `Secondo ${i + 1}` : `Secondo 3 (bimbi)`}</div>
                                {!secondi[i] ? (
                                  slotPending === slot ? (
                                    <div className="w-7 h-7 rounded-full bg-warning-100 text-warning-800 border border-warning-200 flex items-center justify-center">
                                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                      </svg>
                                    </div>
                                  ) : (
                                    <Button size="sm" variant="solid" aria-label={`Seleziona ${slot}`} className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-200 px-2 py-0.5 rounded-full" onClick={() => { setActiveSlot(slot); setSlotPending(slot); }}>+</Button>
                                  )
                                ) : (
                                  <Button size="sm" variant="light" color="danger" aria-label={`Rimuovi ${slot}`} className="px-2 py-0.5 rounded-full" onClick={() => { removeFromSlot(slot); setSlotPending(null); }}>✕</Button>
                                )}
                            </div>
                          );
                          })}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-default-500 mb-1">Contorni (3)</div>
                    <div className="flex gap-2">
                      {[0, 1, 2].map((i) => {
                          const slot = `contorni-${i}`;
                          const isDragOver = dragOverSlot === slot;
                          return (
                            <div key={i} onDragOver={(e) => { e.preventDefault(); setDragOverSlot(slot); }} onDragLeave={() => setDragOverSlot(null)} onDrop={(e) => { const id = Number(e.dataTransfer.getData('text')); if (id) assignDishToSlot(slot, id); setDragOverSlot(null); }} className={`flex items-center gap-2 ${isDragOver ? 'rounded-md bg-primary-100 p-1' : ''} ${!contorni[i] ? 'border-2 border-dashed border-default-200 bg-default-50 px-2 py-2 rounded' : ''}`}>
                                <div className="text-sm font-medium">{contorni[i] ? dishes.find(d => d.id === contorni[i])?.name : i < 2 ? `Contorno ${i + 1}` : `Contorno 3 (bimbi)`}</div>
                                {!contorni[i] ? (
                                  slotPending === slot ? (
                                    <div className="w-7 h-7 rounded-full bg-warning-100 text-warning-800 border border-warning-200 flex items-center justify-center">
                                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                      </svg>
                                    </div>
                                  ) : (
                                    <Button size="sm" variant="solid" aria-label={`Seleziona ${slot}`} className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-200 px-2 py-0.5 rounded-full" onClick={() => { setActiveSlot(slot); setSlotPending(slot); }}>+</Button>
                                  )
                                ) : (
                                  <Button size="sm" variant="light" color="danger" aria-label={`Rimuovi ${slot}`} className="px-2 py-0.5 rounded-full" onClick={() => { removeFromSlot(slot); setSlotPending(null); }}>✕</Button>
                                )}
                            </div>
                          );
                          })}
                  </div>
                </div>
                
              </div>
            </div>

            <div className="md:col-span-1">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Tutti i piatti</div>
                <div className="text-xs text-default-500">{activeSlot ? `Assegna a: ${activeSlot}` : "Seleziona uno slot"}</div>
              </div>
              <div className="mt-2">
                <Input placeholder="Cerca piatto" value={dishQuery} onChange={(e) => setDishQuery((e.target as HTMLInputElement).value)} />
              </div>
              <div className="mt-2 max-h-[360px] overflow-auto rounded-md bg-white p-2">
                {menuLoading && <div className="text-sm text-default-500">Caricamento...</div>}
                {!menuLoading && filteredDishes.length === 0 && (
                  <div className="text-xs text-default-500 flex items-center justify-between">
                    {dishQuery.trim() === "" ? (
                      <div>Nessun piatto</div>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <div>Piatto non trovato, vuoi aggiungere "{dishQuery.trim()}"?</div>
                        <div>
                          <Button size="sm" color="primary" onClick={handleOpenAddDish}>Aggiungi</Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {!menuLoading && (
                  <div className="flex flex-wrap gap-2">
                    {filteredDishes.map((dish) => (
                      <div key={dish.id} className="mb-1">
                        <Chip
                          size="sm"
                          draggable
                          onDragStart={(e) => { e.dataTransfer.setData('text', String(dish.id)); e.dataTransfer.effectAllowed = 'copy'; }}
                          onClick={() => {
                            if (activeSlot) {
                              assignDishToActiveSlot(dish.id);
                            } else {
                              showToast('Seleziona uno slot prima di assegnare', 'error', 2000);
                            }
                          }}
                          className="cursor-grab px-2 py-1 text-xs rounded-full transition bg-white border border-default-200"
                        >
                          {dish.name}
                        </Chip>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </ModalBody>
        {/* Add Dish Modal */}
        <Modal isOpen={isAddDishOpen} onOpenChange={(v) => setIsAddDishOpen(v)} placement="center" size="sm">
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1">Aggiungi piatto</ModalHeader>
            <ModalBody className="flex flex-col gap-2">
              {addDishError && <div className="text-sm text-danger-600">{addDishError}</div>}
              <Input label="Nome" value={newDishName} onChange={(e) => setNewDishName((e.target as HTMLInputElement).value)} />
              <Input label="Nome (EN)" value={newDishNameEn} onChange={(e) => setNewDishNameEn((e.target as HTMLInputElement).value)} />
              <div>
                <div className="text-xs text-default-500 mb-1">Categoria</div>
                <Select selectedKeys={newDishCategoryId ? [String(newDishCategoryId)] : []} onChange={(e) => setNewDishCategoryId(Number((e.target as HTMLSelectElement).value))}>
                  <SelectItem key="">Nessuna</SelectItem>
                  <>
                    {categories.map((c) => (
                      <SelectItem key={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </>
                </Select>
              </div>
              <Input label="Ingredienti (separati da virgola)" value={newDishIngredients} onChange={(e) => setNewDishIngredients((e.target as HTMLInputElement).value)} />
            </ModalBody>
            <ModalFooter>
              <Button size="sm" variant="flat" onClick={() => setIsAddDishOpen(false)}>Annulla</Button>
              <Button size="sm" color="primary" onClick={handleCreateDish} isDisabled={addingDish}>{addingDish ? "Creando..." : "Crea piatto"}</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <ModalFooter>
          <Button size="sm" variant="flat" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button size="sm" color="primary" onClick={handleSaveMenu} isDisabled={menuLoading}>
            Salva menu
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
