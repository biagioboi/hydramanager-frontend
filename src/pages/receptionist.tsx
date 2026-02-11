import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";

import {
  createBooking,
  createGuest,
  deleteBooking,
  checkInBooking,
  deleteCheckInBooking,
  fetchAgencies,
  fetchDeposits,
  fetchPaymentMethods,
  fetchCashDepartments,
  fetchBookings,
  fetchRooms,
  searchUserByEmail,
  updateBooking,
  createDeposit,
  type BookingApi,
  type DepositApi,
  type CashDepartmentApi,
  type GuestApi,
  type AgencyApi,
  type PaymentMethodApi,
  type RoomApi,
} from "@/lib/hotel-api";
import {
  addExtraCartItem,
  chargeExtraCart,
  createExtraCart,
  fetchExtraCartItems,
  fetchStoreProducts as fetchExtraStoreProducts,
  fetchStores as fetchExtraStores,
  fetchCategories as fetchExtraCategories,
  fetchProducts as fetchExtraProducts,
  type ExtraCartItemApi,
  type StoreApi,
  type StoreProductApi,
  type ExtraCategoryApi,
  type ExtraProductApi,
} from "@/lib/extra-api";
import BookingCalendar from "@/components/hotel/booking-calendar";

const TREATMENTS = [
  { key: "ROOM_BREAKFAST", label: "B&B" },
  { key: "HALF_BOARD", label: "Mezza pensione" },
  { key: "FULL_BOARD", label: "Pensione completa" },
] as const;

const STATUSES = [
  { key: "INSERTED", label: "Inserita" },
  { key: "CONFIRMED", label: "Confermata" },
  { key: "ARRIVED", label: "Arrivato" },
  { key: "CANCELLED", label: "Cancellata" },
  { key: "DEPARTED", label: "Partito" },
] as const;

const pad2 = (value: number) => String(value).padStart(2, "0");
const formatYmd = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
const getTodayYmd = () => formatYmd(new Date());

export default function ReceptionistPage() {
  const [rooms, setRooms] = useState<RoomApi[]>([]);
  const [bookings, setBookings] = useState<BookingApi[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "calendar">("grid");
  const [roomNumber, setRoomNumber] = useState("");
  const [guestFirstName, setGuestFirstName] = useState("");
  const [guestLastName, setGuestLastName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [adults, setAdults] = useState("2");
  const [children, setChildren] = useState("0");
  const [infants, setInfants] = useState("0");
  const [checkInDate, setCheckInDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [checkOutDate, setCheckOutDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [treatment, setTreatment] = useState("ROOM_BREAKFAST");
  const [status, setStatus] = useState("INSERTED");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("error");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodApi[]>([]);
  const [cashDepartments, setCashDepartments] = useState<CashDepartmentApi[]>([]);
  const [deposits, setDeposits] = useState<DepositApi[]>([]);
  const [agencies, setAgencies] = useState<AgencyApi[]>([]);
  const [selectedAgencyId, setSelectedAgencyId] = useState("");
  const [agencyReference, setAgencyReference] = useState("");
  const [agencyBookingDate, setAgencyBookingDate] = useState("");
  const [extraProducts, setExtraProducts] = useState<ExtraProductApi[]>([]);
  const [extraCategories, setExtraCategories] = useState<ExtraCategoryApi[]>([]);
  const [extraStores, setExtraStores] = useState<StoreApi[]>([]);
  const [extraStoreProducts, setExtraStoreProducts] = useState<StoreProductApi[]>([]);
  const [extraStoreId, setExtraStoreId] = useState("");
  const [extraCategoryId, setExtraCategoryId] = useState("");
  const [extraQuery, setExtraQuery] = useState("");
  const [extraCartItems, setExtraCartItems] = useState<ExtraCartItemApi[]>([]);
  const [extraRoomNumber, setExtraRoomNumber] = useState("");
  const [extraSelectedBookingId, setExtraSelectedBookingId] = useState<number | null>(null);
  const [extraCartByBookingId, setExtraCartByBookingId] = useState<Record<number, number>>({});
  const [extraLoading, setExtraLoading] = useState(false);
  const [extraError, setExtraError] = useState<string | null>(null);
  const [extraDeposits, setExtraDeposits] = useState<DepositApi[]>([]);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    room: RoomApi;
    booking?: BookingApi;
  } | null>(null);
  const [bookingContextMenu, setBookingContextMenu] = useState<{
    x: number;
    y: number;
    booking: BookingApi;
  } | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingApi | null>(null);
  const [detailsTab, setDetailsTab] = useState<"details" | "guests" | "notes" | "prices">("details");
  const [editPrice, setEditPrice] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositPaymentMethodId, setDepositPaymentMethodId] = useState("");
  const [depositNotes, setDepositNotes] = useState("");
  const [printPrompt, setPrintPrompt] = useState<{
    title: string;
    description?: string;
    amount: number;
    paymentMethod?: string;
    cashDepartment?: string;
    booking?: BookingApi | null;
  } | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptAmount, setReceiptAmount] = useState("");
  const [receiptPaymentMethodId, setReceiptPaymentMethodId] = useState("");
  const [receiptCashDepartmentId, setReceiptCashDepartmentId] = useState("");
  const [receiptDescription, setReceiptDescription] = useState("");
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [billPaymentMethodId, setBillPaymentMethodId] = useState("");
  const [checkinMenuOpen, setCheckinMenuOpen] = useState(false);
  const [editRoomNumber, setEditRoomNumber] = useState("");
  const [editCheckInDate, setEditCheckInDate] = useState("");
  const [editCheckOutDate, setEditCheckOutDate] = useState("");
  const [editAdults, setEditAdults] = useState("0");
  const [editChildren, setEditChildren] = useState("0");
  const [editInfants, setEditInfants] = useState("0");
  const [editTreatment, setEditTreatment] = useState<BookingApi["treatment"]>("ROOM_BREAKFAST");
  const [editStatus, setEditStatus] = useState<BookingApi["status"]>("INSERTED");
  const [editNotes, setEditNotes] = useState("");
  const [referenceDate, setReferenceDate] = useState(() => getTodayYmd());
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const {
    isOpen: isDetailsOpen,
    onOpen: onOpenDetails,
    onOpenChange: onDetailsOpenChange,
  } = useDisclosure();
  const {
    isOpen: isExtraOpen,
    onOpen: onOpenExtra,
    onOpenChange: onExtraOpenChange,
  } = useDisclosure();

  const maxRooms = 80;
  const isReferenceToday = referenceDate === getTodayYmd();

  const addDays = (value: string, delta: number) => {
    const [y, m, d] = value.split("-").map(Number);
    const base = new Date(y, (m ?? 1) - 1, d ?? 1);
    if (Number.isNaN(base.getTime())) return value;
    base.setDate(base.getDate() + delta);
    return formatYmd(base);
  };

  const showToast = (message: string, type: "success" | "error" = "error", duration = 3000) => {
    setToastType(type);
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), duration);
  };

  const getFirstAvailableDate = (roomNumberValue: string, startDate: string) => {
    const roomBookings = bookings
      .filter(
        (booking) =>
          booking.roomNumber === roomNumberValue &&
          booking.status !== "CANCELLED" &&
          booking.status !== "DEPARTED",
      )
      .sort((a, b) => a.checkInDate.localeCompare(b.checkInDate));

    let current = startDate;
    for (const booking of roomBookings) {
      if (booking.checkOutDate < current) continue;
      if (booking.checkInDate <= current && booking.checkOutDate >= current) {
        current = addDays(booking.checkOutDate, 1);
        continue;
      }
      if (booking.checkInDate > current) break;
    }
    return current;
  };

  const roomStatusMap = useMemo(() => {
    const map = new Map<string, "OCCUPIED" | "RESERVED">();
    bookings.forEach((booking) => {
      const active =
        booking.checkInDate <= referenceDate && booking.checkOutDate >= referenceDate;
      if (!active) return;

      if (booking.status === "ARRIVED" || booking.status === "CONFIRMED") {
        map.set(booking.roomNumber, "OCCUPIED");
      } else if (booking.status === "INSERTED") {
        if (!map.has(booking.roomNumber)) {
          map.set(booking.roomNumber, "RESERVED");
        }
      }
    });
    return map;
  }, [bookings, referenceDate]);

  const activeBookingMap = useMemo(() => {
    const map = new Map<string, BookingApi>();
    const priority: Record<BookingApi["status"], number> = {
      ARRIVED: 3,
      CONFIRMED: 2,
      INSERTED: 1,
      CANCELLED: 0,
      DEPARTED: 0,
    };

    bookings.forEach((booking) => {
      if (booking.status === "CANCELLED" || booking.status === "DEPARTED") {
        return;
      }
      const active =
        booking.checkInDate <= referenceDate && booking.checkOutDate >= referenceDate;
      if (!active) return;
      const current = map.get(booking.roomNumber);
      if (!current || priority[booking.status] > priority[current.status]) {
        map.set(booking.roomNumber, booking);
      }
    });

    return map;
  }, [bookings, referenceDate]);

  const formatDateShort = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
    });
  };


  const getSurname = (booking?: BookingApi) => {
    if (!booking) return "-";
    if (booking.guestLastName) return booking.guestLastName;
    if (booking.guestFullName) {
      const parts = booking.guestFullName.trim().split(/\s+/);
      return parts[parts.length - 1] || booking.guestFullName;
    }
    return "-";
  };

  const getGuestLabel = (booking?: BookingApi) => {
    if (!booking) return "";
    if (booking.guestLastName || booking.guestFirstName) {
      return [booking.guestLastName, booking.guestFirstName]
        .filter(Boolean)
        .join(" ");
    }
    return booking.guestFullName || "";
  };

  const formatSurname = (surname: string) => {
    if (!surname) return "";
    const normalized = surname
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
    if (!normalized) return "";
    const [first, ...rest] = normalized.split(" ");
    const camel = [
      first ? first[0].toUpperCase() + first.slice(1) : "",
      ...rest.map((part) => (part ? part[0].toUpperCase() + part.slice(1) : "")),
    ]
      .filter(Boolean)
      .join(" ");
    return camel.slice(0, 15);
  };

  const orderedRooms = useMemo(() => {
    return [...rooms]
      .sort((a, b) => {
        const aNum = Number(a.roomNumber);
        const bNum = Number(b.roomNumber);
        const aIsNum = Number.isFinite(aNum);
        const bIsNum = Number.isFinite(bNum);
        if (aIsNum && bIsNum) return aNum - bNum;
        if (aIsNum) return -1;
        if (bIsNum) return 1;
        return a.roomNumber.localeCompare(b.roomNumber, "it");
      })
      .slice(0, maxRooms);
  }, [rooms]);

  const roomOptions = useMemo(
    () => rooms.map((room) => ({ key: room.roomNumber, label: room.roomNumber })),
    [rooms]
  );

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [roomsList, bookingsList] = await Promise.all([
        fetchRooms(),
        fetchBookings(),
      ]);
      setRooms(roomsList);
      setBookings(bookingsList);
    } catch (err) {
      setError((err as Error).message || "Errore caricamento dati");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const loadPayments = async () => {
      try {
        const methods = await fetchPaymentMethods();
        setPaymentMethods(methods);
      } catch {
        // ignore
      }
    };
    const loadDepartments = async () => {
      try {
        const list = await fetchCashDepartments();
        setCashDepartments(list);
      } catch {
        // ignore
      }
    };
    const loadAgencies = async () => {
      try {
        const list = await fetchAgencies();
        setAgencies(list);
      } catch {
        // ignore
      }
    };
    loadPayments();
    loadDepartments();
    loadAgencies();
  }, []);

  const toolbarItems = [
    { key: "exit", icon: "⏻", label: "Esci" },
    { key: "new", icon: "🧾", label: "Nuova", onClick: onOpen },
    { key: "refresh", icon: "⟳", label: "Aggiorna", onClick: loadData },
    { key: "calendar", icon: "📅", label: "Calendario", onClick: () => setViewMode("calendar") },
    { key: "extra", icon: "🧺", label: "Extra", onClick: onOpenExtra },
    { key: "receipt", icon: "🧾", label: "Scontrino", onClick: () => setReceiptModalOpen(true) },
    { key: "clients", icon: "👤", label: "Clienti" },
    { key: "agencies", icon: "🏢", label: "Agenzie" },
    { key: "notes", icon: "📝", label: "Note" },
    { key: "theme", icon: "🎨", label: "Stile" },
    { key: "print", icon: "🖨️", label: "Stampa" },
    { key: "options", icon: "⚙️", label: "Opzioni" },
    { key: "help", icon: "ℹ️", label: "Legenda" },
  ];

  const printReceipt = (payload: {
    title: string;
    description?: string;
    amount: number;
    paymentMethod?: string;
    cashDepartment?: string;
    booking?: BookingApi | null;
  }) => {
    const win = window.open("", "_blank", "width=380,height=640");
    if (!win) return;
    const now = new Date().toLocaleString("it-IT");
    const bookingLine = payload.booking
      ? `Camera ${payload.booking.roomNumber} · ${payload.booking.checkInDate} → ${payload.booking.checkOutDate}`
      : "";
    const guestLine = payload.booking ? getGuestLabel(payload.booking) : "";
    win.document.write(`
      <html>
        <head>
          <title>Scontrino</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 16px; font-size: 12px; }
            h1 { font-size: 16px; margin: 0 0 8px; }
            .muted { color: #666; }
            .row { display: flex; justify-content: space-between; margin: 6px 0; }
            .divider { border-top: 1px dashed #999; margin: 10px 0; }
          </style>
        </head>
        <body>
          <h1>${payload.title}</h1>
          <div class="muted">${now}</div>
          ${guestLine ? `<div class="muted">${guestLine}</div>` : ""}
          ${bookingLine ? `<div class="muted">${bookingLine}</div>` : ""}
          ${payload.description ? `<div class="muted">${payload.description}</div>` : ""}
          <div class="divider"></div>
          <div class="row"><strong>Totale</strong><strong>€ ${payload.amount.toFixed(2)}</strong></div>
          ${payload.paymentMethod ? `<div class="row"><span>Metodo</span><span>${payload.paymentMethod}</span></div>` : ""}
          ${payload.cashDepartment ? `<div class="row"><span>Reparto</span><span>${payload.cashDepartment}</span></div>` : ""}
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  useEffect(() => {
    const handleClick = () => {
      setContextMenu(null);
      setBookingContextMenu(null);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setContextMenu(null);
        setBookingContextMenu(null);
      }
    };
    window.addEventListener("click", handleClick);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("click", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, []);

  useEffect(() => {
    if (!contextMenu && !bookingContextMenu) {
      setCheckinMenuOpen(false);
    }
  }, [contextMenu, bookingContextMenu]);

  useEffect(() => {
    const handleReferenceKeys = (event: KeyboardEvent) => {
      if (event.key === "+" || event.key === "=" || event.key === "NumpadAdd") {
        event.preventDefault();
        setReferenceDate((prev) => addDays(prev, 1));
      }
      if (event.key === "-" || event.key === "_" || event.key === "NumpadSubtract") {
        event.preventDefault();
        setReferenceDate((prev) => addDays(prev, -1));
      }
    };
    window.addEventListener("keydown", handleReferenceKeys);
    return () => window.removeEventListener("keydown", handleReferenceKeys);
  }, []);

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
    } catch (err) {
      setExtraError((err as Error).message || "Errore caricamento extra");
    } finally {
      setExtraLoading(false);
    }
  };

  useEffect(() => {
    if (isExtraOpen) {
      loadExtraData();
    }
  }, [isExtraOpen]);

  useEffect(() => {
    if (!isExtraOpen || !extraStoreId) {
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
  }, [extraStoreId, isExtraOpen]);

  const filteredExtraProducts = useMemo(() => {
    const query = extraQuery.trim().toLowerCase();
    const allowedProductIds = new Set(extraStoreProducts.map((item) => item.productId));
    return extraProducts.filter((product) => {
      if (extraStoreId && !allowedProductIds.has(product.id)) {
        return false;
      }
      if (extraCategoryId && String(product.categoryId ?? "") !== extraCategoryId) {
        return false;
      }
      if (!query) return true;
      return product.name.toLowerCase().includes(query);
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

  const todayYmd = getTodayYmd();
  const extraActiveBookings = useMemo(() => {
    return bookings.filter(
      (booking) =>
        booking.status === "ARRIVED" &&
        booking.checkInDate <= todayYmd &&
        booking.checkOutDate >= todayYmd,
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
    return extraSelectedBookings.find((booking) => booking.id === extraSelectedBookingId) || null;
  }, [extraSelectedBookingId, extraSelectedBookings]);

  const getBookingSaldo = (booking: BookingApi) => {
    const price = booking.price ?? 0;
    const paid = extraDeposits
      .filter((item) => item.bookingId === booking.id)
      .reduce((sum, item) => sum + (item.amount ?? 0), 0);
    return price - paid;
  };

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
      setExtraError("Seleziona una prenotazione");
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

  const handleChargeExtra = async (onClose?: () => void) => {
    if (!extraSelectedBooking) return;
    if (!extraSelectedBooking.cardId) {
      setExtraError("La prenotazione non ha una card associata");
      return;
    }
    const cartId = extraCartByBookingId[extraSelectedBooking.id];
    if (!cartId) return;
    setExtraLoading(true);
    setExtraError(null);
    try {
      await chargeExtraCart(cartId, { cardId: extraSelectedBooking.cardId });
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

  const handleCreateBooking = async () => {
    if (!roomNumber || !guestFirstName.trim() || !guestLastName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      let guestId: number | null = null;
      const email = guestEmail.trim();

      if (email) {
        const existing = await searchUserByEmail(email);
        if (existing?.id) {
          guestId = existing.id;
        }
      }

      if (!guestId) {
        const guest: GuestApi = await createGuest({
          firstName: guestFirstName.trim(),
          lastName: guestLastName.trim(),
          email: email || null,
        });
        guestId = guest.id;
      }

      const created = await createBooking({
        roomNumber,
        userId: guestId,
        agencyId: selectedAgencyId ? Number(selectedAgencyId) : undefined,
        agencyReference: selectedAgencyId ? agencyReference.trim() || null : null,
        agencyBookingDate: selectedAgencyId ? agencyBookingDate || null : null,
        adults: Number(adults || 0),
        children: Number(children || 0),
        infants: Number(infants || 0),
        checkInDate,
        checkOutDate,
        treatment: treatment as BookingApi["treatment"],
        status: status as BookingApi["status"],
        notes: notes.trim() || null,
      });
      setBookings((prev) => [created, ...prev]);
      setGuestFirstName("");
      setGuestLastName("");
      setGuestEmail("");
      setSelectedAgencyId("");
      setAgencyReference("");
      setAgencyBookingDate("");
      setNotes("");
      onOpenChange();
    } catch (err) {
      setError((err as Error).message || "Errore creazione prenotazione");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenContextMenu = (
    event: MouseEvent<HTMLDivElement>,
    room: RoomApi,
  ) => {
    event.preventDefault();
    const booking = activeBookingMap.get(room.roomNumber);
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      room,
      booking,
    });
  };

  const handleInsertBookingFromMenu = () => {
    if (!contextMenu?.room) return;
    const nextAvailable = getFirstAvailableDate(
      contextMenu.room.roomNumber,
      referenceDate,
    );
    setRoomNumber(contextMenu.room.roomNumber);
    setCheckInDate(nextAvailable);
    setCheckOutDate((prev) => (prev < nextAvailable ? nextAvailable : prev));
    setError(null);
    onOpen();
    setContextMenu(null);
    setBookingContextMenu(null);
  };

  const handleDeleteBooking = async () => {
    const booking = contextMenu?.booking ?? bookingContextMenu?.booking;
    if (!booking) return;
    setLoading(true);
    setError(null);
    try {
      await deleteBooking(booking.id);
      setBookings((prev) => prev.filter((item) => item.id !== booking.id));
      setContextMenu(null);
      setBookingContextMenu(null);
    } catch (err) {
      setError((err as Error).message || "Errore cancellazione prenotazione");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (meal: "BREAKFAST" | "LUNCH" | "DINNER") => {
    const booking = contextMenu?.booking ?? bookingContextMenu?.booking;
    if (!booking) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await checkInBooking(booking.id, { meal });
      setBookings((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      showToast("Check-in registrato", "success", 2500);
      setContextMenu(null);
      setBookingContextMenu(null);
    } catch (err) {
      const message = (err as Error).message || "Errore check-in prenotazione";
      setError(message);
      showToast(message, "error", 3000);
    } finally {
      setLoading(false);
      setCheckinMenuOpen(false);
    }
  };

  const handleDeleteCheckIn = async () => {
    const booking = contextMenu?.booking ?? bookingContextMenu?.booking;
    if (!booking) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await deleteCheckInBooking(booking.id);
      setBookings((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      showToast("Check-in cancellato", "success", 2500);
      setContextMenu(null);
      setBookingContextMenu(null);
    } catch (err) {
      const message = (err as Error).message || "Errore cancellazione check-in";
      setError(message);
      showToast(message, "error", 3000);
    } finally {
      setLoading(false);
      setCheckinMenuOpen(false);
    }
  };

  const handleBookingContextMenu = (booking: BookingApi, x: number, y: number) => {
    setBookingContextMenu({ booking, x, y });
  };

  const handleBookingSelect = (booking: BookingApi) => {
    setSelectedBooking(booking);
    setDetailsTab("details");
    setEditRoomNumber(booking.roomNumber);
    setEditCheckInDate(booking.checkInDate);
    setEditCheckOutDate(booking.checkOutDate);
    setEditAdults(String(booking.adults ?? 0));
    setEditChildren(String(booking.children ?? 0));
    setEditInfants(String(booking.infants ?? 0));
    setEditTreatment(booking.treatment);
    setEditStatus(booking.status);
    setEditNotes(booking.notes ?? "");
    setEditPrice(booking.price !== undefined && booking.price !== null ? String(booking.price) : "");
    setDepositAmount("");
    setDepositPaymentMethodId("");
    setDepositNotes("");
    onOpenDetails();
  };

  const handleOpenBill = () => {
    if (!selectedBooking) return;
    setBillPaymentMethodId("");
    setBillModalOpen(true);
  };

  useEffect(() => {
    if (!selectedBooking) {
      setDeposits([]);
      return;
    }
    const loadDeposits = async () => {
      try {
        const list = await fetchDeposits();
        setDeposits(list.filter((item) => item.bookingId === selectedBooking.id));
      } catch {
        setDeposits([]);
      }
    };
    loadDeposits();
  }, [selectedBooking]);

  const handleUpdateBooking = async () => {
    if (!selectedBooking) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await updateBooking(selectedBooking.id, {
        roomNumber: editRoomNumber,
        checkInDate: editCheckInDate,
        checkOutDate: editCheckOutDate,
        adults: Number(editAdults || 0),
        children: Number(editChildren || 0),
        infants: Number(editInfants || 0),
        price: editPrice.trim() ? Number(editPrice) : null,
        treatment: editTreatment,
        status: editStatus,
        notes: editNotes.trim() || null,
      });
      setBookings((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setSelectedBooking(updated);
      showToast("Prenotazione aggiornata", "success", 2500);
    } catch (err) {
      const message = (err as Error).message || "Errore aggiornamento prenotazione";
      setError(message);
      showToast(message, "error", 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDeposit = async () => {
    if (!selectedBooking) return;
    if (!depositAmount.trim() || !depositPaymentMethodId) return;
    setLoading(true);
    setError(null);
    try {
      const created = await createDeposit({
        amount: Number(depositAmount),
        paymentMethodId: Number(depositPaymentMethodId),
        notes: depositNotes.trim() || null,
        bookingId: selectedBooking.id,
      });
      setDeposits((prev) => [created, ...prev]);
      const method = paymentMethods.find((item) => String(item.id) === depositPaymentMethodId);
      setPrintPrompt({
        title: "Acconto prenotazione",
        description: depositNotes.trim() || undefined,
        amount: Number(depositAmount),
        paymentMethod: method?.name,
        booking: selectedBooking,
      });
      setDepositAmount("");
      setDepositPaymentMethodId("");
      setDepositNotes("");
      showToast("Acconto inserito", "success", 2500);
    } catch (err) {
      const message = (err as Error).message || "Errore inserimento acconto";
      setError(message);
      showToast(message, "error", 3000);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintPromptConfirm = () => {
    if (!printPrompt) return;
    printReceipt(printPrompt);
    setPrintPrompt(null);
  };

  const toDate = (value: string) => new Date(value).getTime();
  const overlaps = (a: BookingApi, b: BookingApi) =>
    toDate(a.checkInDate) < toDate(b.checkOutDate) && toDate(a.checkOutDate) > toDate(b.checkInDate);

  const hasConflict = (roomNumber: string, booking: BookingApi, excludeIds: number[]) => {
    return bookings.some(
      (item) =>
        item.roomNumber === roomNumber &&
        !excludeIds.includes(item.id) &&
        overlaps(item, booking)
    );
  };

  const handleBookingMove = async (booking: BookingApi, targetRoomNumber: string) => {
    if (booking.roomNumber === targetRoomNumber) return;
    setLoading(true);
    setError(null);
    try {
      const overlapping = bookings.filter(
        (item) => item.roomNumber === targetRoomNumber && overlaps(item, booking)
      );

      if (overlapping.length === 0) {
        const updated = await updateBooking(booking.id, { roomNumber: targetRoomNumber });
        setBookings((prev) => prev.map((item) => (item.id === booking.id ? updated : item)));
        return;
      }

      if (overlapping.length > 1) {
        throw new Error("La camera è occupata da più prenotazioni nello stesso periodo");
      }

      const swapBooking = overlapping[0];
      const canMoveIncoming = !hasConflict(targetRoomNumber, booking, [booking.id, swapBooking.id]);
      const canMoveSwap = !hasConflict(booking.roomNumber, swapBooking, [booking.id, swapBooking.id]);

      if (!canMoveIncoming || !canMoveSwap) {
        throw new Error("Impossibile scambiare le prenotazioni per conflitti di date");
      }

      const [updatedIncoming, updatedSwap] = await Promise.all([
        updateBooking(booking.id, { roomNumber: targetRoomNumber }),
        updateBooking(swapBooking.id, { roomNumber: booking.roomNumber }),
      ]);

      setBookings((prev) =>
        prev.map((item) => {
          if (item.id === updatedIncoming.id) return updatedIncoming;
          if (item.id === updatedSwap.id) return updatedSwap;
          return item;
        })
      );
    } catch (err) {
      const message = (err as Error).message || "Errore spostamento prenotazione";
      setError(message);
      showToast(message, "error", 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleCalendarRange = (room: string, startDate: string, endDate: string) => {
    if (startDate === endDate) return;
    setRoomNumber(room);
    setCheckInDate(startDate);
    setCheckOutDate(endDate);
    onOpen();
  };

  return (
    <div className="flex flex-col gap-6">
      <div
        className={`sticky top-0 z-20 rounded-md border px-2 py-2 shadow-sm ${
          isReferenceToday
            ? "border-default-200 bg-default-50"
            : "border-amber-300 bg-amber-100"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1">
            {toolbarItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={item.onClick}
                className="flex w-16 flex-col items-center justify-center gap-1 rounded-md border border-transparent px-2 py-1 text-[10px] text-default-600 transition hover:border-default-200 hover:bg-default-100"
                title={item.label}
              >
                <span className="text-base leading-none">{item.icon}</span>
                <span className="leading-none">{item.label}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-default-500">Data quadro</span>
            <Input
              aria-label="Data quadro"
              className="w-[140px]"
              labelPlacement="outside"
              type="date"
              value={referenceDate}
              onChange={(event) => setReferenceDate(event.target.value)}
            />
          </div>
        </div>
      </div>


      {viewMode === "grid" ? (
        <Card>
          <CardBody className="overflow-hidden">
            <div className="grid h-[calc(100vh-300px)] grid-cols-10 grid-rows-8 gap-1">
              {orderedRooms.map((room) => {
                const status = roomStatusMap.get(room.roomNumber) || "FREE";
                const statusClass =
                  status === "OCCUPIED"
                    ? "bg-green-400 border-green-500 text-green-950"
                    : status === "RESERVED"
                      ? "bg-amber-400 border-amber-500 text-amber-950"
                      : "bg-neutral-50 border-neutral-200 text-neutral-700";

                const booking = activeBookingMap.get(room.roomNumber);
                return (
                  <div
                    key={room.id}
                    className={`flex flex-col gap-0.5 rounded-md border px-1.5 py-0.5 text-[10px] leading-tight ${statusClass}`}
                    onClick={(event) => handleOpenContextMenu(event, room)}
                    onContextMenu={(event) => handleOpenContextMenu(event, room)}
                  >
                    <div className="flex items-start justify-between gap-1 text-sm font-semibold">
                      <span className="shrink-0">{room.roomNumber}</span>
                      <span className="flex-1 truncate text-right text-sm font-semibold opacity-80">
                        {formatSurname(getSurname(booking))}
                      </span>
                    </div>
                    <div className="flex items-center justify-start gap-2 text-[10px]">
                      <span>Ad. {booking?.adults ?? 0}</span>
                      <span>Ba. {booking?.children ?? 0}</span>
                      <span>In. {booking?.infants ?? 0}</span>
                      <span className="opacity-80">
                        {(room.roomType || "").slice(0, 6)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] opacity-80">
                      <span>Arr {booking ? formatDateShort(booking.checkInDate) : "--"}</span>
                      <span>Par {booking ? formatDateShort(booking.checkOutDate) : "--"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      ) : (
        <BookingCalendar
          rooms={orderedRooms}
          bookings={bookings}
          days={30}
          rowHeight={24}
          onRangeSelect={handleCalendarRange}
          onBack={() => setViewMode("grid")}
          onBookingSelect={handleBookingSelect}
          onBookingMove={handleBookingMove}
          onBookingContextMenu={handleBookingContextMenu}
        />
      )}

      <Modal
        isOpen={isExtraOpen}
        onOpenChange={onExtraOpenChange}
        placement="center"
        size="3xl"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Extra
                <span className="text-xs text-default-500">
                  Seleziona prodotti e addebita in camera
                </span>
              </ModalHeader>
              <ModalBody className="gap-4">
                {extraError && <div className="text-sm text-danger-600">{extraError}</div>}

                <div className="grid gap-3 md:grid-cols-4">
                  <Input
                    label="Cerca prodotto"
                    value={extraQuery}
                    onChange={(event) => setExtraQuery(event.target.value)}
                  />
                  <Select
                    label="Shop"
                    selectedKeys={extraStoreId ? [extraStoreId] : []}
                    onChange={(event) => setExtraStoreId(event.target.value)}
                  >
                    {extraStores.map((store) => (
                      <SelectItem key={String(store.id)}>{store.name}</SelectItem>
                    ))}
                  </Select>
                  <div className="flex items-end">
                    <Button size="sm" variant="flat" onClick={loadExtraData} isDisabled={extraLoading}>
                      Aggiorna
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[220px_1.1fr_1fr]">
                  <div className="rounded-md border border-default-200 bg-default-50 p-3">
                    <div className="text-sm font-semibold">Categorie</div>
                    <div className="mt-3 overflow-hidden rounded-md border border-default-200 bg-white">
                      <div className="max-h-[360px] overflow-auto divide-y divide-default-200">
                        <button
                          type="button"
                          onClick={() => setExtraCategoryId("")}
                          className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition ${
                            extraCategoryId === ""
                              ? "bg-default-100 font-semibold"
                              : "hover:bg-default-100"
                          }`}
                        >
                          <span>Tutte</span>
                        </button>
                        {extraCategories.map((category) => (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => setExtraCategoryId(String(category.id))}
                            className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition ${
                              extraCategoryId === String(category.id)
                                ? "bg-default-100 font-semibold"
                                : "hover:bg-default-100"
                            }`}
                          >
                            <span className="truncate">{category.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-md border border-default-200 bg-default-50 p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">Prodotti</div>
                      <div className="text-xs text-default-500">{filteredExtraProducts.length} voci</div>
                    </div>
                    <div className="mt-3 overflow-hidden rounded-md border border-default-200 bg-white">
                      <div className="max-h-[360px] overflow-auto divide-y divide-default-200">
                        {!extraStoreId && (
                          <div className="px-3 py-2 text-xs text-default-500">
                            Seleziona uno shop per vedere i prodotti.
                          </div>
                        )}
                        {extraStoreId && filteredExtraProducts.length === 0 && (
                          <div className="px-3 py-2 text-xs text-default-500">Nessun prodotto</div>
                        )}
                        {filteredExtraProducts.map((product) => (
                          <div
                            key={product.id}
                            className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                          >
                            <div className="min-w-0">
                              <div className="truncate font-medium">{product.name}</div>
                              <div className="text-xs text-default-500">
                                € {product.price}
                                {product.categoryName ? ` · ${product.categoryName}` : ""}
                              </div>
                            </div>
                            <Button size="sm" color="primary" onClick={() => handleAddExtra(product)}>
                              Aggiungi
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-md border border-default-200 bg-default-50 p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">Carrello</div>
                      <div className="text-xs text-default-500">Totale € {extraTotal.toFixed(2)}</div>
                    </div>
                    <div className="mt-3 overflow-hidden rounded-md border border-default-200 bg-white">
                      <div className="max-h-[360px] overflow-auto divide-y divide-default-200">
                        {extraCartItems.length === 0 && (
                          <div className="px-3 py-2 text-xs text-default-500">Nessun prodotto selezionato</div>
                        )}
                        {extraCartItems.map((item) => {
                          const product = extraProducts.find((p) => p.id === item.productId);
                          return (
                            <div key={item.id} className="flex items-center justify-between gap-3 px-3 py-2">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-medium">
                                  {item.productName || product?.name || "Prodotto"}
                                </div>
                                <div className="text-xs text-default-500">
                                  € {product?.price ?? 0} · Qtà {item.quantity}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-md border border-default-200 bg-default-50 p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">Prenotazioni attive</div>
                    <div className="text-xs text-default-500">Check-in odierno</div>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <Select
                      label="Prenotazione (camera)"
                      selectedKeys={extraRoomNumber ? [extraRoomNumber] : []}
                      onChange={(event) => setExtraRoomNumber(event.target.value)}
                    >
                      {Array.from(extraBookingsByRoom.entries()).map(([roomNumber, list]) => {
                        const main = list[0];
                        const label = main
                          ? `Camera ${roomNumber} · ${getGuestLabel(main)}`
                          : `Camera ${roomNumber}`;
                        return <SelectItem key={roomNumber}>{label}</SelectItem>;
                      })}
                    </Select>
                    <div className="flex items-end">
                      <Button
                        color="primary"
                        onClick={() => handleChargeExtra(onClose)}
                        isDisabled={extraLoading || !extraSelectedBooking || extraCartItems.length === 0}
                      >
                        Addebita in camera
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 overflow-hidden rounded-md border border-default-200 bg-white">
                    <div className="max-h-[220px] overflow-auto divide-y divide-default-200">
                      {!extraRoomNumber && (
                        <div className="px-3 py-2 text-xs text-default-500">
                          Seleziona una camera per vedere le prenotazioni.
                        </div>
                      )}
                      {extraRoomNumber && extraSelectedBookings.length === 0 && (
                        <div className="px-3 py-2 text-xs text-default-500">Nessuna prenotazione trovata</div>
                      )}
                      {extraSelectedBookings.map((booking) => (
                        <button
                          key={booking.id}
                          type="button"
                          onClick={async () => {
                            setExtraSelectedBookingId(booking.id);
                            const cartId = extraCartByBookingId[booking.id];
                            if (cartId) {
                              await handleLoadCartItems(cartId);
                            } else {
                              setExtraCartItems([]);
                            }
                          }}
                          className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-sm transition ${
                            extraSelectedBookingId === booking.id
                              ? "bg-default-100"
                              : "hover:bg-default-50"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="truncate font-medium">{getGuestLabel(booking) || "Ospite"}</div>
                            <div className="text-xs text-default-500">
                              {booking.checkInDate} → {booking.checkOutDate}
                            </div>
                          </div>
                          <div className="text-xs text-default-500">
                            Saldo € {getBookingSaldo(booking).toFixed(2)}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onClick={onClose}>
                  Chiudi
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isDetailsOpen}
        onOpenChange={() => {
          onDetailsOpenChange();
          if (isDetailsOpen) setSelectedBooking(null);
        }}
        placement="center"
        size="xl"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Prenotazione
                {selectedBooking && (
                  <span className="text-xs text-default-500">
                    Camera {selectedBooking.roomNumber}
                  </span>
                )}
              </ModalHeader>
              <ModalBody>
                {selectedBooking ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant={detailsTab === "details" ? "solid" : "flat"}
                        onClick={() => setDetailsTab("details")}
                      >
                        Dettagli
                      </Button>
                      <Button
                        size="sm"
                        variant={detailsTab === "guests" ? "solid" : "flat"}
                        onClick={() => setDetailsTab("guests")}
                      >
                        Ospiti
                      </Button>
                      <Button
                        size="sm"
                        variant={detailsTab === "prices" ? "solid" : "flat"}
                        onClick={() => setDetailsTab("prices")}
                      >
                        Prezzi
                      </Button>
                      <Button
                        size="sm"
                        variant={detailsTab === "notes" ? "solid" : "flat"}
                        onClick={() => setDetailsTab("notes")}
                      >
                        Note
                      </Button>
                    </div>

                    {detailsTab === "details" && (
                      <div className="grid gap-3 text-sm md:grid-cols-2">
                        <Select
                          label="Camera"
                          selectedKeys={editRoomNumber ? [editRoomNumber] : []}
                          onChange={(event) => setEditRoomNumber(event.target.value)}
                        >
                          {roomOptions.map((room) => (
                            <SelectItem key={room.key}>
                              {room.label}
                            </SelectItem>
                          ))}
                        </Select>
                        <Select
                          label="Stato"
                          selectedKeys={[editStatus]}
                          onChange={(event) => setEditStatus(event.target.value as BookingApi["status"])}
                        >
                          {STATUSES.map((option) => (
                            <SelectItem key={option.key}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </Select>
                        <Input
                          label="Check-in"
                          type="date"
                          value={editCheckInDate}
                          onChange={(event) => setEditCheckInDate(event.target.value)}
                        />
                        <Input
                          label="Check-out"
                          type="date"
                          value={editCheckOutDate}
                          onChange={(event) => setEditCheckOutDate(event.target.value)}
                        />
                        <Select
                          label="Trattamento"
                          selectedKeys={[editTreatment]}
                          onChange={(event) =>
                            setEditTreatment(event.target.value as BookingApi["treatment"])
                          }
                        >
                          {TREATMENTS.map((option) => (
                            <SelectItem key={option.key}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </Select>
                      </div>
                    )}

                    {detailsTab === "guests" && (
                      <div className="grid gap-3 text-sm md:grid-cols-3">
                        <Input
                          label="Adulti"
                          type="number"
                          value={editAdults}
                          onChange={(event) => setEditAdults(event.target.value)}
                        />
                        <Input
                          label="Bambini"
                          type="number"
                          value={editChildren}
                          onChange={(event) => setEditChildren(event.target.value)}
                        />
                        <Input
                          label="Infant"
                          type="number"
                          value={editInfants}
                          onChange={(event) => setEditInfants(event.target.value)}
                        />
                        <div className="md:col-span-3 text-xs text-default-500">
                          Cliente: {getGuestLabel(selectedBooking) || "-"}
                        </div>
                      </div>
                    )}

                    {detailsTab === "notes" && (
                      <div className="grid gap-3">
                        <Input
                          label="Note"
                          value={editNotes}
                          onChange={(event) => setEditNotes(event.target.value)}
                        />
                      </div>
                    )}

                    {detailsTab === "prices" && (
                      <div className="grid gap-4 text-sm">
                        <Input
                          label="Costo prenotazione"
                          type="number"
                          value={editPrice}
                          onChange={(event) => setEditPrice(event.target.value)}
                        />
                        <div className="rounded-md border border-default-200 p-3">
                          <div className="text-sm font-semibold">Acconti</div>
                          <div className="mt-2 grid gap-3 md:grid-cols-3">
                            <Input
                              label="Importo"
                              type="number"
                              value={depositAmount}
                              onChange={(event) => setDepositAmount(event.target.value)}
                            />
                            <Select
                              label="Metodo pagamento"
                              selectedKeys={depositPaymentMethodId ? [depositPaymentMethodId] : []}
                              onChange={(event) => setDepositPaymentMethodId(event.target.value)}
                            >
                              {paymentMethods.map((method) => (
                                <SelectItem key={String(method.id)}>{method.name}</SelectItem>
                              ))}
                            </Select>
                            <Input
                              label="Note"
                              value={depositNotes}
                              onChange={(event) => setDepositNotes(event.target.value)}
                            />
                          </div>
                          <div className="mt-3 flex justify-end">
                            <Button
                              size="sm"
                              color="primary"
                              isDisabled={loading || !depositAmount.trim() || !depositPaymentMethodId}
                              onClick={handleAddDeposit}
                            >
                              Aggiungi acconto
                            </Button>
                          </div>
                          {deposits.length > 0 && (
                            <div className="mt-3 grid gap-2 text-xs text-default-600">
                              {deposits.map((deposit) => (
                                <div key={deposit.id} className="flex items-center justify-between">
                                  <span>
                                    {deposit.paymentMethodName || "Metodo"} · €{deposit.amount}
                                  </span>
                                  <span className="text-default-400">#{deposit.id}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-default-500">Nessuna prenotazione selezionata.</div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button
                  size="sm"
                  variant="flat"
                  isDisabled={!selectedBooking}
                  onClick={handleOpenBill}
                >
                  Effettua conto
                </Button>
                <Button
                  size="sm"
                  color="primary"
                  isDisabled={!selectedBooking || loading}
                  onClick={handleUpdateBooking}
                >
                  Salva modifiche
                </Button>
                <Button
                  size="sm"
                  variant="flat"
                  onClick={() => {
                    onClose();
                    setSelectedBooking(null);
                  }}
                >
                  Chiudi
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {contextMenu && (
        <div
          className="fixed z-50 w-[160px] max-w-[160px] rounded-md border border-default-200 bg-white p-1 text-xs shadow-lg"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(event) => event.stopPropagation()}
          role="menu"
        >
          <div className="px-1 py-1 text-[11px] text-default-500">
            Camera {contextMenu.room.roomNumber}
          </div>
          <Button
            className="w-full justify-start mb-1 px-2"
            size="sm"
            variant="flat"
            onClick={handleInsertBookingFromMenu}
          >
            Inserisci prenotazione
          </Button>
          <Button
            className="w-full justify-start mb-1 px-2"
            size="sm"
            variant="flat"
            isDisabled={!contextMenu.booking || loading}
            onClick={() => setCheckinMenuOpen((prev) => !prev)}
          >
            Check-in
          </Button>
          {checkinMenuOpen && contextMenu.booking && (
            <div className="mb-1 flex flex-col gap-1 pl-2">
              {contextMenu.booking.checkInMeal ? (
                <Button
                  className="w-full justify-start px-2"
                  size="sm"
                  variant="flat"
                  isDisabled={loading}
                  onClick={handleDeleteCheckIn}
                >
                  Cancella check-in
                </Button>
              ) : (
                <>
                  <Button
                    className="w-full justify-start px-2"
                    size="sm"
                    variant="flat"
                    isDisabled={loading}
                    onClick={() => handleCheckIn("BREAKFAST")}
                  >
                    Colazione
                  </Button>
                  <Button
                    className="w-full justify-start px-2"
                    size="sm"
                    variant="flat"
                    isDisabled={loading}
                    onClick={() => handleCheckIn("LUNCH")}
                  >
                    Pranzo
                  </Button>
                  <Button
                    className="w-full justify-start px-2"
                    size="sm"
                    variant="flat"
                    isDisabled={loading}
                    onClick={() => handleCheckIn("DINNER")}
                  >
                    Cena
                  </Button>
                </>
              )}
            </div>
          )}
          <Button
            className="w-full justify-start px-2"
            size="sm"
            color="danger"
            variant="flat"
            isDisabled={!contextMenu.booking || loading}
            onClick={handleDeleteBooking}
          >
            Cancella prenotazione
          </Button>
        </div>
      )}

      {bookingContextMenu && (
        <div
          className="fixed z-50 w-[120px] max-w-[120px] rounded-md border border-default-200 bg-white p-1 text-xs shadow-lg"
          style={{ left: bookingContextMenu.x, top: bookingContextMenu.y }}
          onClick={(event) => event.stopPropagation()}
          role="menu"
        >
          <div className="px-1 py-1 text-[11px] text-default-500">
            Camera {bookingContextMenu.booking.roomNumber}
          </div>
          <Button
            className="w-full justify-start px-2"
            size="sm"
            color="danger"
            variant="flat"
            isDisabled={loading}
            onClick={handleDeleteBooking}
          >
            Cancella prenotazione
          </Button>
          <Button
            className="w-full justify-start mb-1 px-2"
            size="sm"
            variant="flat"
            isDisabled={loading}
            onClick={() => setCheckinMenuOpen((prev) => !prev)}
          >
            Check-in
          </Button>
          {checkinMenuOpen && (
            <div className="mb-1 flex flex-col gap-1 pl-2">
              {bookingContextMenu.booking.checkInMeal ? (
                <Button
                  className="w-full justify-start px-2"
                  size="sm"
                  variant="flat"
                  isDisabled={loading}
                  onClick={handleDeleteCheckIn}
                >
                  Cancella check-in
                </Button>
              ) : (
                <>
                  <Button
                    className="w-full justify-start px-2"
                    size="sm"
                    variant="flat"
                    isDisabled={loading}
                    onClick={() => handleCheckIn("BREAKFAST")}
                  >
                    Colazione
                  </Button>
                  <Button
                    className="w-full justify-start px-2"
                    size="sm"
                    variant="flat"
                    isDisabled={loading}
                    onClick={() => handleCheckIn("LUNCH")}
                  >
                    Pranzo
                  </Button>
                  <Button
                    className="w-full justify-start px-2"
                    size="sm"
                    variant="flat"
                    isDisabled={loading}
                    onClick={() => handleCheckIn("DINNER")}
                  >
                    Cena
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      <Modal isOpen={receiptModalOpen} onOpenChange={() => setReceiptModalOpen(false)} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Scontrino generico</ModalHeader>
              <ModalBody className="gap-3">
                <Input
                  label="Importo"
                  type="number"
                  value={receiptAmount}
                  onChange={(event) => setReceiptAmount(event.target.value)}
                />
                <Select
                  label="Metodo pagamento"
                  selectedKeys={receiptPaymentMethodId ? [receiptPaymentMethodId] : []}
                  onChange={(event) => setReceiptPaymentMethodId(event.target.value)}
                >
                  {paymentMethods.map((method) => (
                    <SelectItem key={String(method.id)}>{method.name}</SelectItem>
                  ))}
                </Select>
                <Select
                  label="Reparto cassa"
                  selectedKeys={receiptCashDepartmentId ? [receiptCashDepartmentId] : []}
                  onChange={(event) => setReceiptCashDepartmentId(event.target.value)}
                >
                  {cashDepartments.map((dept) => (
                    <SelectItem key={String(dept.id)}>{dept.name}</SelectItem>
                  ))}
                </Select>
                <Input
                  label="Descrizione"
                  value={receiptDescription}
                  onChange={(event) => setReceiptDescription(event.target.value)}
                />
              </ModalBody>
              <ModalFooter>
                <Button size="sm" variant="flat" onClick={onClose}>
                  Annulla
                </Button>
                <Button
                  size="sm"
                  color="primary"
                  isDisabled={!receiptAmount.trim()}
                  onClick={() => {
                    const method = paymentMethods.find((item) => String(item.id) === receiptPaymentMethodId);
                    const dept = cashDepartments.find((item) => String(item.id) === receiptCashDepartmentId);
                    printReceipt({
                      title: "Scontrino",
                      description: receiptDescription.trim() || undefined,
                      amount: Number(receiptAmount),
                      paymentMethod: method?.name,
                      cashDepartment: dept?.name,
                    });
                    setReceiptAmount("");
                    setReceiptPaymentMethodId("");
                    setReceiptCashDepartmentId("");
                    setReceiptDescription("");
                    onClose();
                  }}
                >
                  Stampa
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={billModalOpen} onOpenChange={() => setBillModalOpen(false)} size="md">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Effettua conto</ModalHeader>
              <ModalBody className="gap-3">
                <div className="text-sm text-default-600">
                  Camera {selectedBooking?.roomNumber}
                </div>
                <div className="rounded-md border border-default-200 bg-default-50 px-3 py-2">
                  <div className="text-xs text-default-500">Costo prenotazione</div>
                  <div className="text-lg font-semibold">
                    € {selectedBooking?.price ?? 0}
                  </div>
                </div>
                <Select
                  label="Metodo pagamento"
                  selectedKeys={billPaymentMethodId ? [billPaymentMethodId] : []}
                  onChange={(event) => setBillPaymentMethodId(event.target.value)}
                >
                  {paymentMethods.map((method) => (
                    <SelectItem key={String(method.id)}>{method.name}</SelectItem>
                  ))}
                </Select>
              </ModalBody>
              <ModalFooter>
                <Button size="sm" variant="flat" onClick={onClose}>
                  Chiudi
                </Button>
                <Button
                  size="sm"
                  color="primary"
                  isDisabled={!billPaymentMethodId}
                  onClick={onClose}
                >
                  Conferma pagamento
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={!!printPrompt} onOpenChange={() => setPrintPrompt(null)} size="sm">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Stampare lo scontrino?</ModalHeader>
              <ModalBody>
                <div className="text-sm text-default-600">
                  Vuoi stampare uno scontrino per l'acconto appena inserito?
                </div>
              </ModalBody>
              <ModalFooter>
                <Button size="sm" variant="flat" onClick={() => {
                  setPrintPrompt(null);
                  onClose();
                }}>
                  No
                </Button>
                <Button size="sm" color="primary" onClick={() => {
                  handlePrintPromptConfirm();
                  onClose();
                }}>
                  Sì, stampa
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {toastMessage && (
        <div
          className={`fixed bottom-4 left-1/2 z-[60] -translate-x-1/2 rounded-md border px-4 py-2 text-sm font-medium shadow-lg ${
            toastType === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-danger-300 bg-danger-100 text-danger-800"
          }`}
        >
          {toastMessage}
        </div>
      )}

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="3xl">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Nuova prenotazione
          </ModalHeader>
          <ModalBody className="gap-4">
            {error && <div className="text-sm text-red-600">{error}</div>}
            <div className="grid gap-3 md:grid-cols-4">
              <Select
                label="Numero camera"
                selectedKeys={roomNumber ? [roomNumber] : []}
                onChange={(e) => setRoomNumber(e.target.value)}
              >
                {roomOptions.map((room) => (
                  <SelectItem key={room.key}>{room.label}</SelectItem>
                ))}
              </Select>
              <Input
                label="Nome"
                placeholder="Es. Marco"
                value={guestFirstName}
                onChange={(e) => setGuestFirstName(e.target.value)}
              />
              <Input
                label="Cognome"
                placeholder="Es. Bianchi"
                value={guestLastName}
                onChange={(e) => setGuestLastName(e.target.value)}
              />
              <Input
                label="Email"
                placeholder="cliente@email.it"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Select
                label="Agenzia"
                selectedKeys={selectedAgencyId ? [selectedAgencyId] : []}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedAgencyId(value);
                  if (!value) {
                    setAgencyReference("");
                    setAgencyBookingDate("");
                  } else {
                    setAgencyBookingDate((prev) => prev || getTodayYmd());
                  }
                }}
              >
                <SelectItem key="" value="">
                  Nessuna
                </SelectItem>
                {agencies.map((agency) => (
                  <SelectItem key={String(agency.id)} value={String(agency.id)}>
                    {agency.agencyName}
                  </SelectItem>
                ))}
              </Select>
              <Input
                label="Riferimento agenzia"
                isDisabled={!selectedAgencyId}
                value={agencyReference}
                onChange={(e) => setAgencyReference(e.target.value)}
              />
              <Input
                label="Data agenzia"
                type="date"
                isDisabled={!selectedAgencyId}
                value={agencyBookingDate}
                onChange={(e) => setAgencyBookingDate(e.target.value)}
              />
              <Input
                label="Adulti"
                type="number"
                value={adults}
                onChange={(e) => setAdults(e.target.value)}
              />
              <Input
                label="Bambini"
                type="number"
                value={children}
                onChange={(e) => setChildren(e.target.value)}
              />
              <Input
                label="Infanti"
                type="number"
                value={infants}
                onChange={(e) => setInfants(e.target.value)}
              />
              <Input
                label="Check-in"
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
              />
              <Input
                label="Check-out"
                type="date"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
              />
              <Select
                label="Trattamento"
                selectedKeys={[treatment]}
                onChange={(e) => setTreatment(e.target.value)}
              >
                {TREATMENTS.map((item) => (
                  <SelectItem key={item.key}>{item.label}</SelectItem>
                ))}
              </Select>
              <Select
                label="Stato"
                selectedKeys={[status]}
                onChange={(e) => setStatus(e.target.value)}
              >
                {STATUSES.map((item) => (
                  <SelectItem key={item.key}>{item.label}</SelectItem>
                ))}
              </Select>
              <Input
                className="md:col-span-3"
                label="Note"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="flat" onClick={onOpenChange}>
              Annulla
            </Button>
            <Button color="primary" onClick={handleCreateBooking} isLoading={loading}>
              Crea prenotazione
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
