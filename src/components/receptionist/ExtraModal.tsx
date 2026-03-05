import React, { useEffect, useMemo, useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Button } from "@heroui/button";
import {
  addExtraCartItem,
  chargeExtraCart,
  createExtraCart,
  fetchExtraCartItems,
  fetchStoreProducts as fetchExtraStoreProducts,
  fetchStores as fetchExtraStores,
  fetchCategories as fetchExtraCategories,
  fetchProducts as fetchExtraProducts,
  createProduct,
  createStoreProduct,
  type ExtraCartItemApi,
  type StoreApi,
  type StoreProductApi,
  type ExtraCategoryApi,
  type ExtraProductApi,
} from "@/lib/extra-api";
import { fetchDeposits, fetchBarCards, type BookingApi, type DepositApi } from "@/lib/hotel-api";
import { addToast } from "@heroui/toast";

import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";

type Props = {
  isOpen: boolean;
  onOpenChange: (value: boolean) => void;
  bookings: BookingApi[];
  initialBookingId?: number | null;
};

function getGuestLabel(booking?: BookingApi) {
  if (!booking) return "";
  if (booking.guestLastName || booking.guestFirstName) {
    return [booking.guestLastName, booking.guestFirstName].filter(Boolean).join(" ");
  }
  return booking.guestFullName || "";
}

export default function ExtraModal({ isOpen, onOpenChange, bookings, initialBookingId }: Props) {
  // If parent passes an initial booking id (e.g. from context menu), select it when modal opens
  useEffect(() => {
    if (!isOpen) return;
    if (initialBookingId) {
      setExtraSelectedBookingId(initialBookingId);
      const b = bookings.find((x) => x.id === initialBookingId);
      setExtraBookingQuery(getGuestLabel(b));
      // if there's an existing cart we can load its items
      const cartId = extraCartByBookingId[initialBookingId];
      if (cartId) {
        handleLoadCartItems(cartId).catch(() => {});
      } else {
        setExtraCartItems([]);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialBookingId]);
  const [extraProducts, setExtraProducts] = useState<ExtraProductApi[]>([]);
  const [extraCategories, setExtraCategories] = useState<ExtraCategoryApi[]>([]);
  const [extraStores, setExtraStores] = useState<StoreApi[]>([]);
  const [extraStoreProducts, setExtraStoreProducts] = useState<StoreProductApi[]>([]);
  const [extraAllStoreProducts, setExtraAllStoreProducts] = useState<StoreProductApi[]>([]);
  const [extraStoreId, setExtraStoreId] = useState("");
  const [extraCategoryId, setExtraCategoryId] = useState("");
  const [extraQuery, setExtraQuery] = useState("");
  const [extraBookingQuery, setExtraBookingQuery] = useState("");
  const [extraCardQuery, setExtraCardQuery] = useState("");
  const [extraCartItems, setExtraCartItems] = useState<ExtraCartItemApi[]>([]);
  const [extraRoomNumber, setExtraRoomNumber] = useState("");
  const [extraSelectedBookingId, setExtraSelectedBookingId] = useState<number | null>(null);
  const [extraCartByBookingId, setExtraCartByBookingId] = useState<Record<number, number>>({});
  const [extraCards, setExtraCards] = useState<any[]>([]);
  const [extraCardsLoading, setExtraCardsLoading] = useState(false);
  const [extraSelectedCardId, setExtraSelectedCardId] = useState<string>("");
  const [extraLoading, setExtraLoading] = useState(false);
  const [extraError, setExtraError] = useState<string | null>(null);
  const [extraDeposits, setExtraDeposits] = useState<DepositApi[]>([]);
  const [creatingProductName, setCreatingProductName] = useState<string | null>(null);
  const [creatingPrice, setCreatingPrice] = useState<string>("");
  const [creatingCategoryId, setCreatingCategoryId] = useState<string>("");

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

  const loadExtraData = async () => {
    setExtraLoading(true);
    setExtraError(null);
    try {
      const [products, categories, stores, depositsList] = await Promise.all([
        fetchExtraProducts(),
        fetchExtraCategories(),
        fetchExtraStores(),
        fetchDeposits(),
      ]);
      setExtraProducts(products);
      setExtraCategories(categories);
      setExtraStores(stores);
      setExtraDeposits(depositsList);
      try {
        const allStoreProducts = await fetchExtraStoreProducts();
        setExtraAllStoreProducts(allStoreProducts || []);
      } catch {
        setExtraAllStoreProducts([]);
      }
    } catch (err) {
      setExtraError((err as Error).message || "Errore caricamento extra");
    } finally {
      setExtraLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) loadExtraData();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !extraStoreId) {
      setExtraStoreProducts([]);
      return;
    }
    const loadStoreProducts = async () => {
      setExtraLoading(true);
      setExtraError(null);
      try {
        const list = await fetchExtraStoreProducts(extraStoreId);
        setExtraStoreProducts(list);
      } catch (err) {
        setExtraError((err as Error).message || "Errore caricamento prodotti shop");
      } finally {
        setExtraLoading(false);
      }
    };
    loadStoreProducts();
  }, [extraStoreId, isOpen]);

  const filteredExtraProducts = useMemo(() => {
    const query = extraQuery.trim().toLowerCase();
    const allowedProductIds = new Set(extraStoreProducts.map((item) => item.productId));
    return extraProducts.filter((product) => {
      if (extraStoreId && !allowedProductIds.has(product.id)) return false;
      // If there's a search query, ignore the currently selected category and search across all categories
      if (query) {
        const name = String(product.name || "").toLowerCase();
        const cat = String(product.categoryName || "").toLowerCase();
        return name.includes(query) || cat.includes(query);
      }
      if (extraCategoryId && String(product.categoryId ?? "") !== extraCategoryId) return false;
      return true;
    });
  }, [extraProducts, extraCategoryId, extraQuery, extraStoreId, extraStoreProducts]);

  const extraTotal = useMemo(
    () =>
      extraCartItems.reduce((sum, item) => {
        const product = extraProducts.find((p) => p.id === item.productId);
        return sum + (product?.price ?? 0) * item.quantity;
      }, 0),
    [extraCartItems, extraProducts],
  );

  const todayYmd = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();

  const extraActiveBookings = useMemo(() => {
    return bookings.filter(
      (booking) =>
        booking.status === "ARRIVED" && booking.checkInDate <= todayYmd && booking.checkOutDate >= todayYmd,
    );
  }, [bookings, todayYmd]);

  const extraBookingsByRoom = useMemo(() => {
    const map = new Map<string, BookingApi[]>();
    extraActiveBookings.forEach((booking) => {
      const list = map.get(booking.roomNumber) || [];
      list.push(booking);
      map.set(booking.roomNumber, list);
    });
    return map;
  }, [extraActiveBookings]);

  const extraSelectedBookings = useMemo(() => {
    if (!extraRoomNumber) return [];
    return extraBookingsByRoom.get(extraRoomNumber) || [];
  }, [extraBookingsByRoom, extraRoomNumber]);

  const extraSelectedBooking = useMemo(() => {
    if (!extraSelectedBookingId) return null;
    // Find selected booking among active bookings (not only room-filtered list)
    return (
      extraActiveBookings.find((booking) => booking.id === extraSelectedBookingId) || bookings.find((b) => b.id === extraSelectedBookingId) || null
    );
  }, [extraSelectedBookingId, extraSelectedBookings]);

  const filteredExtraBookings = useMemo(() => {
    const q = extraBookingQuery.trim().toLowerCase();
    if (!q) return extraActiveBookings;
    return extraActiveBookings.filter((b) => {
      const room = String(b.roomNumber || "");
      const last = String(b.guestLastName || "").toLowerCase();
      const full = String(b.guestFullName || "").toLowerCase();
      return room.includes(q) || last.includes(q) || full.includes(q);
    });
  }, [extraActiveBookings, extraBookingQuery]);

  useEffect(() => {
    const loadCards = async () => {
      if (!extraSelectedBooking) {
        setExtraCards([]);
        setExtraSelectedCardId("");
        return;
      }
      setExtraCardsLoading(true);
      try {
        const bookingId = (extraSelectedBooking as any).id;
        if (bookingId) {
          const list = await fetchBarCards(bookingId);
          setExtraCards(list || []);
          // Select the first card returned by the API (if any) and show its text
          if (list && list.length > 0) {
            const first = list[0];
            setExtraSelectedCardId(String(first.id));
            setExtraCardQuery(`Card #${first.id} · € ${Number(first.balance ?? 0).toFixed(2)}`);
          } else {
            setExtraSelectedCardId("");
            setExtraCardQuery("");
          }
        } else {
          setExtraCards([]);
          setExtraSelectedCardId(String(extraSelectedBooking.cardId ?? ""));
          setExtraCardQuery(extraSelectedBooking.cardId ? `Card #${extraSelectedBooking.cardId}` : "");
        }
      } catch {
        setExtraCards([]);
        setExtraSelectedCardId(String(extraSelectedBooking.cardId ?? ""));
        setExtraCardQuery(extraSelectedBooking.cardId ? `Card #${extraSelectedBooking.cardId}` : "");
      } finally {
        setExtraCardsLoading(false);
      }
    };
    loadCards();
  }, [extraSelectedBooking]);

  const handleLoadCartItems = async (cartId: number) => {
    setExtraLoading(true);
    setExtraError(null);
    try {
      const items = await fetchExtraCartItems(cartId);
      setExtraCartItems(items);
    } catch (err) {
      setExtraError((err as Error).message || "Errore caricamento carrello");
    } finally {
      setExtraLoading(false);
    }
  };

  const ensureCartForBooking = async (bookingId: number) => {
    const existing = extraCartByBookingId[bookingId];
    if (existing) return existing;
    const cart = await createExtraCart();
    setExtraCartByBookingId((prev) => ({ ...prev, [bookingId]: cart.id }));
    return cart.id;
  };

  const handleAddExtra = async (product: ExtraProductApi) => {
    if (!extraSelectedBooking) {
      showToast("Seleziona una prenotazione", "error", 3000);
      return;
    }
    const storeProduct = extraStoreProducts.find((item) => item.productId === product.id);
    if (!storeProduct) {
      setExtraError("Prodotto non disponibile nello shop selezionato");
      return;
    }
    setExtraLoading(true);
    setExtraError(null);
    try {
      const cartId = await ensureCartForBooking(extraSelectedBooking.id);
      await addExtraCartItem(cartId, { storeProductId: storeProduct.id, quantity: 1 });
      await handleLoadCartItems(cartId);
    } catch (err) {
      setExtraError((err as Error).message || "Errore aggiunta prodotto al carrello");
    } finally {
      setExtraLoading(false);
    }
  };

  const handleCreateProductAndAssociate = async () => {
    const name = extraQuery.trim();
    if (!name || !extraStoreId) return;
    setExtraLoading(true);
    setExtraError(null);
    try {
      const created = await createProduct({ name, price: 0, stockQuantity: 0, categoryId: extraCategoryId ? Number(extraCategoryId) : undefined });
      await createStoreProduct({ storeId: Number(extraStoreId), productId: created.id, quantity: 0 });
      showToast(`Prodotto "${created.name}" creato e aggiunto allo shop`, "success", 2500);
      // refresh data
      await loadExtraData();
      // refresh current store products
      const list = await fetchExtraStoreProducts(extraStoreId);
      setExtraStoreProducts(list);
      setExtraQuery("");
    } catch (err) {
      setExtraError((err as Error).message || "Errore creazione prodotto");
    } finally {
      setExtraLoading(false);
    }
  };

  const handleConfirmCreate = async () => {
    const name = creatingProductName?.trim();
    if (!name || !extraStoreId) return;
    setExtraLoading(true);
    setExtraError(null);
    try {
      const price = Number(creatingPrice || 0);
      const created = await createProduct({ name, price, stockQuantity: 0, categoryId: creatingCategoryId ? Number(creatingCategoryId) : undefined });
      await createStoreProduct({ storeId: Number(extraStoreId), productId: created.id, quantity: 0 });
      showToast(`Prodotto "${created.name}" creato e aggiunto allo shop`, "success", 2500);
      await loadExtraData();
      const list = await fetchExtraStoreProducts(extraStoreId);
      setExtraStoreProducts(list);
      setExtraQuery("");
      setCreatingProductName(null);
      setCreatingPrice("");
      setCreatingCategoryId("");
    } catch (err) {
      setExtraError((err as Error).message || "Errore creazione prodotto");
    } finally {
      setExtraLoading(false);
    }
  };

  const handleSwitchStore = async (storeId: number) => {
    setExtraStoreId(String(storeId));
    // load store products for the new store
    try {
      setExtraLoading(true);
      const list = await fetchExtraStoreProducts(String(storeId));
      setExtraStoreProducts(list);
      showToast("Shop cambiato", "success", 1200);
    } catch (err) {
      setExtraError((err as Error).message || "Errore cambio shop");
    } finally {
      setExtraLoading(false);
    }
  };

  const handleChargeExtra = async (onClose?: () => void) => {
    if (!extraSelectedBooking) return;
    const cartId = extraCartByBookingId[extraSelectedBooking.id];
    const cardIdToUse = extraSelectedCardId || String(extraSelectedBooking.cardId || "");
    if (!cardIdToUse) {
      setExtraError("La prenotazione non ha una card associata");
      return;
    }
    if (!cartId) return;
    setExtraLoading(true);
    setExtraError(null);
    try {
      await chargeExtraCart(cartId, { cardId: Number(cardIdToUse) });
      showToast("Addebito extra completato", "success", 2500);
      setExtraCartItems([]);
      setExtraSelectedBookingId(null);
      if (onClose) onClose();
    } catch (err) {
      setExtraError((err as Error).message || "Errore addebito extra");
    } finally {
      setExtraLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center" size="3xl">
      <ModalContent className="w-[95vw] max-w-[1400px]">
        <ModalHeader className="flex flex-col gap-1">
          Extra
          <span className="text-xs text-default-500">Seleziona prodotti e addebita in camera</span>
        </ModalHeader>
        <ModalBody className="gap-4">
          {extraError && <div className="text-sm text-danger-600">{extraError}</div>}

                <div className="mt-3 grid gap-3 md:grid-cols-3 items-start">
                  <div>
                    <Autocomplete
                      inputValue={extraBookingQuery}
                      onInputChange={(v) => setExtraBookingQuery(v)}
                      selectedKey={extraSelectedBookingId ? String(extraSelectedBookingId) : undefined}
                      onSelectionChange={async (key) => {
                        if (!key) {
                          setExtraSelectedBookingId(null);
                          setExtraCards([]);
                          setExtraSelectedCardId("");
                          setExtraCardQuery("");
                          setExtraCartItems([]);
                          return;
                        }
                        const id = Number(key);
                        setExtraSelectedBookingId(id);
                        const b = extraActiveBookings.find((x) => x.id === id) || bookings.find((x) => x.id === id);
                        setExtraBookingQuery(getGuestLabel(b));
                        const cartId = extraCartByBookingId[id];
                        if (cartId) {
                          await handleLoadCartItems(cartId);
                        } else {
                          setExtraCartItems([]);
                        }
                        // Fetch bar cards for the selected booking's user (call endpoint)
                        try {
                          setExtraCardsLoading(true);
                          if (b) {
                            const bookingId = (b as any).id;
                              if (bookingId) {
                              const cards = await fetchBarCards(bookingId);
                              setExtraCards(cards || []);
                              // Do not auto-select the first fetched card. Only set if booking already has a cardId.
                              setExtraSelectedCardId(b && b.cardId ? String(b.cardId) : "");
                            } else {
                              setExtraCards([]);
                              setExtraSelectedCardId(b && b.cardId ? String(b.cardId) : "");
                            }
                          }
                        } catch (err) {
                          setExtraCards([]);
                        } finally {
                          setExtraCardsLoading(false);
                        }
                      }}
                      defaultItems={extraActiveBookings}
                      menuTrigger="input"
                      shouldCloseOnBlur
                      placeholder="Cerca per cognome o numero camera"
                      label="Prenotazione"
                    >
                      {(b: BookingApi) => (
                        <AutocompleteItem key={String(b.id)} textValue={`${getGuestLabel(b)} ${b.roomNumber} ${b.checkInDate} ${b.checkOutDate}`}>
                          <div className="min-w-0">
                            <div className="truncate font-medium">{getGuestLabel(b)}</div>
                            <div className="truncate text-xs text-default-500">Cam {b.roomNumber} · {b.checkInDate}→{b.checkOutDate}</div>
                          </div>
                        </AutocompleteItem>
                      )}
                    </Autocomplete>
                  </div>

                  <div>
                    <Autocomplete
                      inputValue={extraCardQuery}
                      onInputChange={(v) => setExtraCardQuery(v)}
                      selectedKey={extraSelectedCardId || undefined}
                      onSelectionChange={(key) => {
                        if (!key) {
                          setExtraSelectedCardId("");
                          setExtraCardQuery("");
                          return;
                        }
                        const id = String(key);
                        setExtraSelectedCardId(id);
                        const sel = extraCards.find((x) => String(x.id) === id);
                        setExtraCardQuery(sel ? `Card #${sel.id} · € ${Number(sel.balance ?? 0).toFixed(2)}` : String(id));
                      }}
                      defaultItems={extraCards}
                      menuTrigger="input"
                      shouldCloseOnBlur
                      isDisabled={!extraSelectedBooking}
                      placeholder={extraSelectedBooking ? "Cerca card" : "Seleziona prima una prenotazione"}
                      label="Card"
                    >
                      {(c: any) => (
                        <AutocompleteItem key={String(c.id)} textValue={`Card ${c.id} ${c.balance}`}>
                          <div className="min-w-0">
                            <div className="truncate font-medium">{`Card #${c.id}`}</div>
                            <div className="truncate text-xs text-default-500">Saldo € {Number(c.balance ?? 0).toFixed(2)}</div>
                          </div>
                        </AutocompleteItem>
                      )}
                    </Autocomplete>
                  </div>


            <Select label="Shop" selectedKeys={extraStoreId ? [extraStoreId] : []} onChange={(event) => setExtraStoreId(event.target.value)} isDisabled={extraLoading}>
              {extraStores.map((store) => (
                <SelectItem key={String(store.id)}>{store.name}</SelectItem>
              ))}
            </Select>
                </div>

          {/* spazio riservato — la ricerca è stata spostata nel pannello Prodotti */}

          {/* Mostra le categorie, i prodotti e il carrello solo se è selezionata una prenotazione e uno shop */}
          {!(extraSelectedBooking && extraStoreId) ? (
            <div className="mt-4 rounded-md border border-default-200 bg-default-50 p-4 text-sm text-default-500">
              Seleziona prima una <strong>prenotazione</strong> e uno <strong>shop</strong> per visualizzare categorie e prodotti.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-12">
            {/* Categorie rimosse dalla colonna di sinistra: mostrate come chip sotto la ricerca nel pannello Prodotti */}

            <div className="col-span-10">
                    <Input
                      label="Cerca prodotto"
                      value={extraQuery}
                      onChange={(event) => setExtraQuery(event.target.value)}
                      placeholder="Cerca tra tutte le categorie"
                    />

                    {/* categorie come chip stretti sotto la ricerca */}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setExtraCategoryId("")}
                        className={`px-2 py-1 rounded-full text-xs border ${extraCategoryId === "" ? "bg-default-100 border-default-300 font-semibold" : "bg-transparent border-default-200 hover:bg-default-50"}`}
                      >
                        Tutte
                      </button>
                      {extraCategories.map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => setExtraCategoryId(String(category.id))}
                          className={`px-2 py-1 rounded-full text-xs border ${extraCategoryId === String(category.id) ? "bg-default-100 border-default-300 font-semibold" : "bg-transparent border-default-200 hover:bg-default-50"}`}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  
                  <div className="max-h-[360px] overflow-auto py-3">
                  {extraStoreId && filteredExtraProducts.length === 0 && (
                    (() => {
                      const q = extraQuery.trim();
                      if (!q) return <div className="px-3 py-2 text-xs text-default-500">Nessun prodotto</div>;
                      const match = extraProducts.find((p) => String(p.name || "").toLowerCase() === q.toLowerCase());
                      if (match) {
                        const other = extraAllStoreProducts.find((sp) => sp.productId === match.id && String(sp.storeId) !== extraStoreId);
                        if (other) {
                          const store = extraStores.find((s) => s.id === other.storeId);
                          return (
                            <div className="px-3 py-2 text-sm text-default-500 flex items-center gap-3">
                              <div>{`${match.name} esistente nello shop ${store?.name || other.storeName}. Cambiare shop?`}</div>
                              <Button size="sm" variant="flat" onClick={() => handleSwitchStore(other.storeId)}>Cambia shop</Button>
                            </div>
                          );
                        }
                        return (
                          <div className="px-3 py-2 text-sm text-default-500 flex items-center gap-3">
                            <div>{`${match.name} esiste ma non è presente nello shop selezionato.`}</div>
                            <Button size="sm" color="primary" onClick={async () => {
                              // associate existing product to current shop
                              try {
                                setExtraLoading(true);
                                await createStoreProduct({ storeId: Number(extraStoreId), productId: match.id, quantity: 0 });
                                showToast(`Prodotto "${match.name}" aggiunto allo shop`, "success", 2000);
                                const list = await fetchExtraStoreProducts(extraStoreId);
                                setExtraStoreProducts(list);
                              } catch (err) {
                                setExtraError((err as Error).message || "Errore associazione prodotto");
                              } finally {
                                setExtraLoading(false);
                              }
                            }}>Aggiungi allo shop</Button>
                          </div>
                        );
                      }
                      return (
                        <div className="px-3 py-2 text-sm text-default-500 flex items-center gap-3">
                          <div>{`"${q}" non trovato. Vuoi crearlo?`}</div>
                          {creatingProductName === q ? (
                            <div className="flex items-center gap-2">
                              <Input
                                label="Prezzo"
                                value={creatingPrice}
                                onChange={(e) => setCreatingPrice((e.target as HTMLInputElement).value)}
                                placeholder="0.00"
                              />
                              <Select label="Categoria" selectedKeys={creatingCategoryId ? [creatingCategoryId] : []} onChange={(ev) => setCreatingCategoryId(ev.target.value)}>
                                <SelectItem key="">Nessuna</SelectItem>
                                {extraCategories.map((c) => (
                                  <SelectItem key={String(c.id)}>{c.name}</SelectItem>
                                ))}
                              </Select>
                              <Button size="sm" color="primary" onClick={handleConfirmCreate} isDisabled={extraLoading}>Conferma</Button>
                              <Button size="sm" variant="flat" onClick={() => { setCreatingProductName(null); setCreatingPrice(""); setCreatingCategoryId(""); }}>Annulla</Button>
                            </div>
                          ) : (
                            <Button size="sm" color="primary" onClick={() => { setCreatingProductName(q); setCreatingPrice(""); setCreatingCategoryId(extraCategoryId || ""); }} isDisabled={extraLoading}>Crea</Button>
                          )}
                        </div>
                      );
                    })()
                  )}
                  <div className="flex flex-wrap items-start gap-2">
                    {filteredExtraProducts.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleAddExtra(product)}
                        disabled={extraLoading}
                        className="inline-flex items-center gap-3 px-3 py-1 rounded-full border border-default-200 bg-default-50 hover:bg-default-100 text-sm"
                      >
                        <div className="min-w-0 max-w-[14rem] text-left">
                          <div className="truncate font-medium">{product.name}</div>
                          <div className="text-xs text-default-500">€ {Number(product.price).toFixed(2)}{product.categoryName ? ` · ${product.categoryName}` : ""}</div>
                        </div>
                        <div className="ml-1 text-xs text-default-500">+</div>
                      </button>
                    ))}
                  </div>
                </div>
              
            </div>

            <div className="rounded-md border border-default-200 bg-default-50 p-3 col-span-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Carrello</div>
                <div className="text-xs text-default-500">Totale € {extraTotal.toFixed(2)}</div>
              </div>
              <div className="mt-3 overflow-hidden rounded-md border border-default-200 bg-white">
                <div className="max-h-[360px] overflow-auto divide-y divide-default-200">
                  {extraCartItems.length === 0 && (<div className="px-3 py-2 text-xs text-default-500">Nessun prodotto selezionato</div>)}
                  {extraCartItems.map((item) => {
                    const product = extraProducts.find((p) => p.id === item.productId);
                    return (
                      <div key={item.id} className="flex items-center justify-between gap-3 px-3 py-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{item.productName || product?.name || "Prodotto"}</div>
                          <div className="text-xs text-default-500">€ {product?.price ?? 0} · Qtà {item.quantity}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mt-3 px-3">
                <Button
                  color="primary"
                  onClick={() => handleChargeExtra(() => onOpenChange(false))}
                  isDisabled={extraCartItems.length === 0 || extraLoading}
                >
                  Addebita
                </Button>
              </div>
            </div>
          </div>)}
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onClick={() => onOpenChange(false)}>Chiudi</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
