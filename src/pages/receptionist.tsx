
const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:8080";
import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { fetchWithAuth } from "@/lib/auth";
import { Button } from "@heroui/button";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, DropdownSection } from "@heroui/dropdown";
import { Card, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Chip } from "@heroui/react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";
import { CurrencyEuroIcon, BellIcon, CalendarDaysIcon, BookOpenIcon, CakeIcon, PlusCircleIcon, ArrowPathIcon, ArrowRightOnRectangleIcon} from "@heroicons/react/24/outline";

import {
  createBooking,
  createGuest,
  deleteBooking,
  checkInBooking,
  deleteCheckInBooking,
  fetchAgencies,
  fetchDeposits,
  fetchDepositByBookingId,
  fetchPaymentMethods,
  fetchCashDepartments,
  fetchNotifications,
  fetchBookings,
  fetchRooms,
  markNotificationRead,
  searchUserByEmail,
  updateBooking,
  createDeposit,
  fetchBookingsByDate,
  fetchBooking,
  sendPsRegistration,
  fetchPsGuestsByBooking,
  fetchBarCards,
  fetchBarCard,
  fetchCardTransactions,
  rechargeCard,
  deleteCard,
  
  type BookingApi,
  type DepositApi,
  type CashDepartmentApi,
  type GuestApi,
  type AgencyApi,
  type NotificationApi,
  type PaymentMethodApi,
  type RoomApi,
} from "@/lib/hotel-api";
import { fetchPSFile } from "@/lib/system-api";
import { addToast } from "@heroui/toast";
import BookingCalendar from "@/components/hotel/booking-calendar";
import { useNotificationsWebSocket } from "@/lib/use-notifications-ws";
import ExtraModal from "@/components/receptionist/ExtraModal";
import MenuModal from "@/components/receptionist/MenuModal";
import CardModal from "@/components/receptionist/CardModal";


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

const CheckIcon = ({ size, height, width, ...props }: any) => {
  return (
    <svg
      fill="none"
      height={size || height || 24}
      viewBox="0 0 24 24"
      width={size || width || 24}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12 2C6.49 2 2 6.49 2 12C2 17.51 6.49 22 12 22C17.51 22 22 17.51 22 12C22 6.49 17.51 2 12 2ZM16.78 9.7L11.11 15.37C10.97 15.51 10.78 15.59 10.58 15.59C10.38 15.59 10.19 15.51 10.05 15.37L7.22 12.54C6.93 12.25 6.93 11.77 7.22 11.48C7.51 11.19 7.99 11.19 8.28 11.48L10.58 13.78L15.72 8.64C16.01 8.35 16.49 8.35 16.78 8.64C17.07 8.93 17.07 9.4 16.78 9.7Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default function ReceptionistPage() {
            // Stato per modifica ospite PS
            const [editingPsGuest, setEditingPsGuest] = useState<any | null>(null);
          // Stato per conferma cancellazione ospite PS
          const [pendingDeletePsGuest, setPendingDeletePsGuest] = useState<any | null>(null);
        
      // Stato per modale check-in
      const [checkinModalOpen, setCheckinModalOpen] = useState(false);
      const [checkinModalBooking, setCheckinModalBooking] = useState<BookingApi | null>(null);
      const [checkinModalMeal, setCheckinModalMeal] = useState<"BREAKFAST" | "LUNCH" | "DINNER" | null>(null);
      // Stato per ospiti PS associati alla prenotazione selezionata
      const [psGuests, setPsGuests] = useState<any[]>([]);
      const [psGuestsLoading, setPsGuestsLoading] = useState(false);
      const [psGuestsError, setPsGuestsError] = useState<string>("");

      const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
          // Comune di residenza (autocomplete come luogo di nascita)
          const [psResidenceMunicipality, setPsResidenceMunicipality] = useState("");
          const [psResidenceMunicipalityOptions, setPsResidenceMunicipalityOptions] = useState<{ key: string; label: string; codice?: string }[]>([]);
          const [psResidenceMunicipalityLoading, setPsResidenceMunicipalityLoading] = useState(false);
          const [psResidenceMunicipalityCode, setPsResidenceMunicipalityCode] = useState<string>("");
          useEffect(() => {
            let active = true;
            async function searchMunicipalities(q: string) {
              setPsResidenceMunicipalityLoading(true);
              try {
                const res = await fetchWithAuth(`${BASE_URL}/api/common/comuni/search?q=${encodeURIComponent(q)}`);
                if (!active) return;
                if (!res.ok) throw new Error("Errore ricerca comuni");
                const data = await res.json();
                const muniOpts = (data || []).map((m: any) => ({
                  key: `C:${m.codice || m.code || m.nome || m.name}`,
                  label: m.nome && m.provincia ? `${m.nome} (${m.provincia})` : m.nome || m.name,
                  codice: m.codice || m.code
                }));
                setPsResidenceMunicipalityOptions(muniOpts);
              } catch {
                setPsResidenceMunicipalityOptions([]);
              } finally {
                setPsResidenceMunicipalityLoading(false);
              }
            }
            if (psResidenceMunicipality.length >= 3) {
              searchMunicipalities(psResidenceMunicipality);
            } else if (psResidenceMunicipality.length > 0) {
              setPsResidenceMunicipalityOptions([]);
            } else {
              setPsResidenceMunicipalityOptions([]);
            }
            return () => { active = false; };
          }, [psResidenceMunicipality]);
        // Carica notifiche all'avvio per badge
        useEffect(() => {
          loadNotifications();
        }, []);
      // Stati per select dinamiche
      const [psStates, setPsStates] = useState<{ key: string; label: string }[]>([]);
      const [psDocuments, setPsDocuments] = useState<{ key: string; label: string }[]>([]);
      const [psSelectedState, setPsSelectedState] = useState<string>("");
      const [psSelectedResidenceState, setPsSelectedResidenceState] = useState<string>("");
      const [psSelectedDocument, setPsSelectedDocument] = useState<string>("");
      const [psSelectedDocumentCode, setPsSelectedDocumentCode] = useState<string>("");
      const [psDocumentNumber, setPsDocumentNumber] = useState<string>("");
      const [psDocumentIssueDate, setPsDocumentIssueDate] = useState<string>("");
      // Carica dati per select dinamiche PS
      useEffect(() => {
        let active = true;
        async function loadCommonData() {
          try {
            const [states, documents] = await Promise.all([
              fetchPSFile("states"),
              fetchPSFile("documents"),
            ]);
            if (!active) return;
            setPsStates((states || []).map((s: any) => ({ key: String(s.codice || s.code || s.nome || s.name), label: s.nome || s.name })));
            setPsDocuments((documents || []).map((d: any) => ({ key: String(d.codice), label: d.descrizione})));
          } catch {
            setPsStates([]);
            setPsDocuments([]);
          }
        }
        loadCommonData();
        return () => { active = false; };
      }, []);
    // Stato per autocomplete luogo di nascita
    const [psFirstName, setPsFirstName] = useState("");
    const [psLastName, setPsLastName] = useState("");
    const [psBirthDate, setPsBirthDate] = useState("");
    const [psBirthPlace, setPsBirthPlace] = useState(""); // label visuale
    const [psBirthPlaceOptions, setPsBirthPlaceOptions] = useState<{ key: string; label: string; codice?: string }[]>([]);
    const [psBirthPlaceLoading, setPsBirthPlaceLoading] = useState(false);
    const [psStatesForBirth, setPsStatesForBirth] = useState<{ key: string; label: string }[]>([]);
    const [psBirthPlaceCode, setPsBirthPlaceCode] = useState<string>(""); // codice da salvare
    const [psBirthStateCode, setPsBirthStateCode] = useState<string>(""); // codice stato da salvare (se luogo di nascita è stato)
    const [psResidenceStateCode, setPsResidenceStateCode] = useState<string>(""); // codice stato di residenza da salvare (se stato di residenza è stato)
    // Carica stati e comuni per autocomplete luogo di nascita
    // Carica solo gli stati una volta
    useEffect(() => {
      let active = true;
      async function loadStates() {
        try {
          const states = await fetchPSFile("states");
          if (!active) return;
          setPsStatesForBirth((states || []).map((s: any) => ({ key: `S:${s.codice || s.code || s.nome || s.name}`, label: s.nome || s.name })));
        } catch {
          setPsStatesForBirth([]);
        }
      }
      loadStates();
      return () => { active = false; };
    }, []);

    // Effettua la ricerca dei comuni solo dopo 3 caratteri
    useEffect(() => {
      let active = true;
      async function searchMunicipalities(q: string) {
        setPsBirthPlaceLoading(true);
        try {
          const res = await fetchWithAuth(`${BASE_URL}/api/common/comuni/search?q=${encodeURIComponent(q)}`);
          if (!active) return;
          if (!res.ok) throw new Error("Errore ricerca comuni");
          const data = await res.json();
          const muniOpts = (data || []).map((m: any) => ({
            key: `C:${m.codice || m.code || m.nome || m.name}`,
            label: m.nome && m.provincia ? `${m.nome} (${m.provincia})` : m.nome || m.name,
            codice: m.codice || m.code
          }));
          setPsBirthPlaceOptions([
            ...psStatesForBirth.filter(opt => opt.label.toLowerCase().includes(q.toLowerCase())),
            ...muniOpts,
          ]);
        } catch {
          setPsBirthPlaceOptions(psStatesForBirth.filter(opt => opt.label.toLowerCase().includes(q.toLowerCase())));
        } finally {
          setPsBirthPlaceLoading(false);
        }
      }
      if (psBirthPlace.length >= 3) {
        searchMunicipalities(psBirthPlace);
      } else if (psBirthPlace.length > 0) {
        setPsBirthPlaceOptions(psStatesForBirth.filter(opt => opt.label.toLowerCase().includes(psBirthPlace.toLowerCase())));
      } else {
        setPsBirthPlaceOptions(psStatesForBirth);
      }
      return () => { active = false; };
    }, [psBirthPlace, psStatesForBirth]);
  const [rooms, setRooms] = useState<RoomApi[]>([]);
  const [availableRooms, setAvailableRooms] = useState<RoomApi[]>([]);
  const [bookings, setBookings] = useState<BookingApi[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "calendar">("grid");
  // Stato per il form nuovo registrato PS

  // Recupera il token di autenticazione
  const token = localStorage.getItem("authToken") || "";

  // Hook WebSocket notifiche: DEVE essere chiamato qui, non dentro useEffect
  useNotificationsWebSocket({
    token,
    onMessage: (notification) => {
      setNotifications((prev) => {
        if (prev.some((n) => n.id === notification.id)) return prev;
        return [notification, ...prev];
      });
    },
  });
  const [roomNumber, setRoomNumber] = useState("");
  const [guestFirstName, setGuestFirstName] = useState("");
  const [guestLastName, setGuestLastName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [adults, setAdults] = useState("2");
  const [children, setChildren] = useState("0");
  const [infants, setInfants] = useState("0");
  const [newBookingPrice, setNewBookingPrice] = useState("");
  const [roomQuery, setRoomQuery] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [checkInDate, setCheckInDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [checkOutDate, setCheckOutDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [treatment, setTreatment] = useState("ROOM_BREAKFAST");
  const [status, setStatus] = useState("INSERTED");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodApi[]>([]);
  const [cashDepartments, setCashDepartments] = useState<CashDepartmentApi[]>([]);
  const [deposits, setDeposits] = useState<DepositApi[]>([]);
  const [agencies, setAgencies] = useState<AgencyApi[]>([]);
  const [selectedAgencyId, setSelectedAgencyId] = useState("");
  const [agencyReference, setAgencyReference] = useState("");
  const [agencyBookingDate, setAgencyBookingDate] = useState("");
  
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    room: RoomApi;
    booking?: BookingApi;
  } | null>(null);
  
  const [selectedBooking, setSelectedBooking] = useState<BookingApi | null>(null);
  const [pendingDeleteBooking, setPendingDeleteBooking] = useState<BookingApi | null>(null);
  const [detailsTab, setDetailsTab] = useState<"details" | "guests" | "notes" | "prices" | "cards">("details");
  const [editPrice, setEditPrice] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositPaymentMethodId, setDepositPaymentMethodId] = useState("");
  const [depositNotes, setDepositNotes] = useState("");
  const [printPrompt, setPrintPrompt] = useState<{
    title: string;
    description?: string;
    price: number;
    paymentMethodId?: number | string;
    cashDepartmentId?: number | string;
    bookingId?: number | string;
    depositId?: number | string;
  } | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptAmount, setReceiptAmount] = useState("");
  const [receiptPaymentMethodId, setReceiptPaymentMethodId] = useState("");
  const [receiptCashDepartmentId, setReceiptCashDepartmentId] = useState("");
  const [receiptDescription, setReceiptDescription] = useState("");

  // Card tab state
  const [barCards, setBarCards] = useState<any[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [cardTransactions, setCardTransactions] = useState<any[]>([]);
  const [cardLoading, setCardLoading] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [cardTxLoading, setCardTxLoading] = useState(false);
  // Stato per conferma chiusura cassa
  const [cashClosurePending, setCashClosurePending] = useState(false);
  const [cashClosureLoading, setCashClosureLoading] = useState(false);
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [billPaymentMethodId, setBillPaymentMethodId] = useState("");
  const [checkinMenuOpen, setCheckinMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationApi[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [editRoomNumber, setEditRoomNumber] = useState("");
  const [editCheckInDate, setEditCheckInDate] = useState("");
  const [editCheckOutDate, setEditCheckOutDate] = useState("");
  const [editGuestFirstName, setEditGuestFirstName] = useState("");
  const [editGuestLastName, setEditGuestLastName] = useState("");
  const [editGuestEmail, setEditGuestEmail] = useState("");
  const [editGuestPhone, setEditGuestPhone] = useState("");
  const [editAgencyId, setEditAgencyId] = useState<number | string>("");
  const [editAgencyReference, setEditAgencyReference] = useState("");
  const [editAgencyBookingDate, setEditAgencyBookingDate] = useState("");
  const [editAdults, setEditAdults] = useState("0");
  const [editChildren, setEditChildren] = useState("0");
  const [editInfants, setEditInfants] = useState("0");
  const [editTreatment, setEditTreatment] = useState<BookingApi["treatment"]>("ROOM_BREAKFAST");
  const [editStatus, setEditStatus] = useState<BookingApi["status"]>("INSERTED");
  const [editNotes, setEditNotes] = useState("");
  const [referenceDate, setReferenceDate] = useState(() => getTodayYmd());
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  useEffect(() => {
    const fetchAvailableRooms = async () => {
      try {
        const res = await fetchWithAuth(`${BASE_URL}/api/rooms/available?from=${checkInDate}&to=${checkOutDate}`);
        const data = await res.json();
        setAvailableRooms(Array.isArray(data) ? data : []);
      } catch (err) {
        setAvailableRooms([]);
      }
    };
    if (isOpen) {
      setGuestFirstName("");
      setGuestLastName("");
      setGuestEmail("");
      setGuestPhone("");
      setNewBookingPrice("");
      setAdults("2");
      setChildren("0");
      setInfants("0");
      setRoomQuery("");
      setSelectedFeatures([]);
      setTreatment("ROOM_BREAKFAST");
      setStatus("INSERTED");
      setNotes("");
      setSelectedAgencyId("");
      setAgencyReference("");
      setAgencyBookingDate("");
      // Camera, check-in e check-out NON vengono azzerati se già valorizzati (es. da inserimento rapido)
      // Se sono vuoti, allora li inizializzo
      if (!roomNumber) setRoomNumber("");
      if (!checkInDate) {
        const today = new Date().toISOString().slice(0, 10);
        setCheckInDate(today);
        try {
          const minCheckout = addDays(today, 1);
          setCheckOutDate(minCheckout);
        } catch (err) {
          // fallback: do nothing
        }
      }
      if (!checkOutDate) {
        try {
          const minCheckout = addDays(checkInDate || new Date().toISOString().slice(0, 10), 1);
          setCheckOutDate(minCheckout);
        } catch (err) {
          // fallback: do nothing
        }
      }
      fetchAvailableRooms();
    }
  }, [isOpen, checkInDate, checkOutDate]);

  const allFeatures = useMemo(() => {
    const s = new Set<string>();
    rooms.forEach((r) => (r.features || []).forEach((f) => s.add(f.name)));
    return Array.from(s).sort();
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    const requiredCapacity = Number(adults || 0) + Number(children || 0);
    const list = availableRooms.filter((r) => {
      if (selectedFeatures.length > 0) {
        const names = (r.features || []).map((f) => f.name);
        for (const feat of selectedFeatures) {
          if (!names.includes(feat)) return false;
        }
      }
      if (requiredCapacity > 0) {
        if ((r.capacity || 0) < requiredCapacity) return false;
      }
      // basic text filter on roomQuery
      if (roomQuery && roomQuery.trim()) {
        const q = roomQuery.toLowerCase();
        const hay = `${r.roomNumber} ${r.roomType} ${(r.features || []).map(f => f.name).join(' ')} ${r.capacity}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const comparator = (a: RoomApi, b: RoomApi) => {
      const aNum = Number(a.roomNumber);
      const bNum = Number(b.roomNumber);
      const aIsNum = Number.isFinite(aNum);
      const bIsNum = Number.isFinite(bNum);
      if (aIsNum && bIsNum) return aNum - bNum;
      if (aIsNum) return -1;
      if (bIsNum) return 1;
      return a.roomNumber.localeCompare(b.roomNumber, "it");
    };

    return list.sort(comparator);
  }, [availableRooms, selectedFeatures, adults, children, roomQuery]);

  const toggleFeature = (feat: string) => {
    setSelectedFeatures((prev) => (prev.includes(feat) ? prev.filter((p) => p !== feat) : [...prev, feat]));
  };
  const {
    isOpen: isDetailsOpen,
    onOpen: onOpenDetails,
    onOpenChange: onDetailsOpenChange,
  } = useDisclosure();
  const {
    isOpen: isNotificationsOpen,
    onOpen: onOpenNotifications,
    onOpenChange: onNotificationsOpenChange,
  } = useDisclosure();
  const {
    isOpen: isExtraOpen,
    onOpen: onOpenExtra,
    onOpenChange: onExtraOpenChange,
  } = useDisclosure();

  const [isCardModalOpen, setCardModalOpen] = useState(false);

  const {
    isOpen: isMenuOpen,
    onOpen: onOpenMenu,
    onOpenChange: onMenuOpenChange,
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

  const getNotificationClasses = (type?: NotificationApi["type"]) => {
    const t = String(type ?? "").toUpperCase();
    switch (t) {
      case "WARNING":
        return "border-l-amber-500 bg-amber-50";
      case "ERROR":
        return "border-l-danger-500 bg-danger-50";
      case "SUCCESS":
        return "border-l-emerald-500 bg-emerald-50";
      default:
        return "border-l-default-300 bg-white";
    }
  };


    // Effettua fetch ospiti PS quando si apre la sezione dettagli
    useEffect(() => {
      if (isDetailsOpen && selectedBooking?.id) {
        setPsGuestsLoading(true);
        setPsGuestsError("");
        (async () => {
          try {
            setPsGuests(await fetchPsGuestsByBooking(selectedBooking.id));
          } catch (err) {
            setPsGuestsError(String(err));
          } finally {
            setPsGuestsLoading(false);
          }
        })();
      } else {
        setPsGuests([]);
        setPsGuestsError("");
      }
    }, [isDetailsOpen, selectedBooking?.id]);
    
  const loadNotifications = async () => {
    setNotificationsLoading(true);
    setNotificationsError(null);
    try {
      const list = await fetchNotifications({ targetRole: "RECEPTIONIST", status: "SENT" });
      setNotifications(list);
    } catch (err) {
      setNotificationsError((err as Error).message || "Errore caricamento notifiche");
    } finally {
      setNotificationsLoading(false);
    }
  };

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
const getTouristTax = (booking: BookingApi) => {
          // Esempio: 2€ a notte per adulto
          const nights = Math.max(1, (new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) / (1000 * 60 * 60 * 24));
          return Number(booking.adults || 0) * nights * 2;
        };
        const getClubCard = (booking: BookingApi) => {
          // Esempio: 5€ a notte per adulto
          const nights = Math.max(1, (new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) / (1000 * 60 * 60 * 24));
          return Number(booking.adults || 0) * nights * 6;
        };
        
  const roomOptions = useMemo(
    () => rooms.map((room) => ({ key: room.roomNumber, label: room.roomNumber })),
    [rooms]
  );

  const selectedRoom = useMemo(
    () => rooms.find((r) => String(r.roomNumber) === String(roomNumber)) || null,
    [rooms, roomNumber]
  );

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      let bookingsList: BookingApi[] = [];
      const roomsList = await fetchRooms();
      if (viewMode === "calendar") {
        bookingsList = await fetchBookings();
      } else {
        bookingsList = await fetchBookingsByDate(referenceDate);
      }
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
  }, [referenceDate, viewMode]);


  useEffect(() => {
    if (isNotificationsOpen) {
      loadNotifications();
    }
  }, [isNotificationsOpen]);

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
    { key: "exit", icon: <ArrowRightOnRectangleIcon className="h-4" />, label: "Esci" },
    { key: "new", icon: <PlusCircleIcon className="h-4" />, label: "Nuova", onClick: onOpen },
    { key: "refresh", icon: <ArrowPathIcon className="h-4" />, label: "Aggiorna", onClick: loadData },
    { key: "calendar", icon: <CalendarDaysIcon className="h-4" />, label: "Calendario", onClick: () => setViewMode("calendar") },
    { key: "menu", icon: <BookOpenIcon className="h-4" />, label: "Menu", onClick: onOpenMenu },
    { key: "extra", icon: <CakeIcon className="h-4" />, label: "Extra", onClick: onOpenExtra },
    { key: "notifications", icon: <BellIcon className="h-4" />, label: "Notifiche", onClick: onOpenNotifications },
    { key: "receipt", icon:<CurrencyEuroIcon className="h-4" />, label: "Cassa", onClick: () => setReceiptModalOpen(true) },
    { key: "clients", icon: "👤", label: "Clienti" },
    { key: "agencies", icon: "🏢", label: "Agenzie" },
    { key: "notes", icon: "📝", label: "Note" },
    { key: "theme", icon: "🎨", label: "Stile" },
    { key: "print", icon: "🖨️", label: "Stampa" },
    { key: "options", icon: "⚙️", label: "Opzioni" },
    { key: "help", icon: "ℹ️", label: "Legenda" },
  ];

  const printReceipt = async (payload: {
    title: string;
    description?: string;
    price: number;
    paymentMethod?: string;
    cashDepartment?: string;
    booking?: BookingApi | null;
    paymentMethodId?: number | string;
    cashDepartmentId?: number | string;
    depositId?: number | string;
  }) => {
    // Chiamata API per scontrino fiscale o acconto
    try {
      if (payload.title && payload.title.toLowerCase().includes("acconto")) {
        // Scontrino acconto: chiama endpoint /deposit
        await fetchWithAuth(`${BASE_URL}/api/system/fiscal-tickets/deposit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            price: payload.price,
            description: payload.description || payload.title,
            paymentMethodId: payload.paymentMethodId ? Number(payload.paymentMethodId) : undefined,
            cashDepartmentId: payload.cashDepartmentId ? Number(payload.cashDepartmentId) : undefined,
            bookingDepositId: payload.depositId ? Number(payload.depositId) : undefined,
          }),
        });
      } else {
        // Scontrino generico
        await fetchWithAuth(`${BASE_URL}/api/system/fiscal-tickets`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            price: payload.price,
            description: payload.description || payload.title,
            paymentMethodId: payload.paymentMethodId ? Number(payload.paymentMethodId) : undefined,
            cashDepartmentId: payload.cashDepartmentId ? Number(payload.cashDepartmentId) : undefined,
          }),
        });
      }
    } catch (err) {
      showToast("Errore invio scontrino fiscale", "error", 3500);
    }
  };

  const handleCashClosureConfirm = async () => {
    setCashClosureLoading(true);
    try {
      const res = await fetchWithAuth(`${BASE_URL}/api/system/fiscal-tickets/fiscal-closure`, {
        method: "POST",
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Errore chiusura cassa");
      }
      showToast("Chiusura cassa effettuata", "success", 3500);
    } catch (err) {
      showToast((err as Error).message || "Errore chiusura cassa", "error", 4000);
    } finally {
      setCashClosureLoading(false);
      setCashClosurePending(false);
    }
  };

  useEffect(() => {
    const handleClick = () => {
      setContextMenu(null);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setContextMenu(null);
      }
      // Cambia data quadro con + e -
      if (event.key === "+" || event.key === "=") {
        setReferenceDate((prev) => addDays(prev, 1));
      }
      if (event.key === "-") {
        setReferenceDate((prev) => addDays(prev, -1));
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
    if (!contextMenu) {
      setCheckinMenuOpen(false);
    }
  }, [contextMenu]);


  const handleCreateBooking = async () => {
    if (!roomNumber || !guestLastName.trim() || !newBookingPrice.trim()) {
      addToast({
          title: "Errore!",
          description: "Compila tutti i campi obbligatori: Camera, Cognome, Prezzo",
          severity: "danger",
          color: "danger",
          timeout: 3000});
        return;
    }
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
        price: newBookingPrice.trim() ? Number(newBookingPrice) : undefined,
        notes: notes.trim() || null,
      });
      setBookings((prev) => [created, ...prev]);
      setGuestFirstName("");
      setGuestLastName("");
      setGuestEmail("");
      setNewBookingPrice("");
      setSelectedAgencyId("");
      setAgencyReference("");
      setAgencyBookingDate("");
      setNotes("");
      onOpenChange();
    } catch (err) {
      const message = (err as Error).message || "Errore creazione prenotazione";
      showToast(message, "error", 3000);
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

  const handleSavePS = async () => {
    if (!selectedBooking?.id) return;
    const payload = {
      firstName: psFirstName,
      lastName: psLastName,
      birthDate: psBirthDate,
      birthPlaceCode: psBirthPlaceCode ? psBirthPlaceCode : psBirthStateCode,
      countryBirthCode: psBirthStateCode,
      citizenshipCode: psResidenceStateCode,
      residencePlaceCode: psResidenceMunicipalityCode ? psResidenceMunicipalityCode : psResidenceStateCode,
      documentTypeCode: psSelectedDocumentCode,
      documentNumber: psDocumentNumber,
      documentIssuePlaceCountryCode: psResidenceStateCode,
      documentIssuePlaceMunicipalityCode: psResidenceMunicipalityCode ? psResidenceMunicipalityCode : psResidenceStateCode,
      tipoAlloggiatoCode: "17"
    };
    try {
      const res = await sendPsRegistration(selectedBooking.id, payload);

      if (!res.ok) {
        addToast({ title: "Errore salvataggio PS", description: await res.text(), status: "error" });
      } else {
        addToast({ title: "Registrato PS salvato", status: "success" });
        setPsFirstName("");
        setPsLastName("");
        setPsBirthDate("");
        setPsBirthPlaceCode("");
        setPsBirthPlace("");
        setPsBirthStateCode("");
        setPsSelectedState("")
        setPsResidenceStateCode("");
        setPsSelectedResidenceState("");
        setPsResidenceMunicipalityCode(""); 
        setPsResidenceMunicipality("");
        setPsSelectedDocumentCode("");
        setPsSelectedDocument("");
        setPsDocumentNumber("");
        setPsDocumentIssueDate("");
        setPsGuests([...psGuests, await res.json()]);
      }
    } catch (err) {
      addToast({ title: "Errore di rete", description: String(err), status: "error" });
    }
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
    setRoomQuery("");
    setContextMenu(null);
  };

  const handleDeleteBooking = async () => {
    const booking = contextMenu?.booking;
    if (!booking) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await updateBooking(booking.id, { status: "CANCELLED" });
      setBookings((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setContextMenu(null);
    } catch (err) {
      setError((err as Error).message || "Errore cancellazione prenotazione");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBookingDirect = async (booking: BookingApi) => {
    if (!booking) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await updateBooking(booking.id, { status: "CANCELLED" });
      setBookings((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setError((err as Error).message || "Errore cancellazione prenotazione");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (meal: "BREAKFAST" | "LUNCH" | "DINNER") => {
    const booking = contextMenu?.booking;
    if (!booking) return;
    setCheckinModalBooking(booking);
    setCheckinModalMeal(meal);
    setCheckinModalOpen(true);
    setContextMenu(null);
  };

  const handleDeleteCheckIn = async () => {
    const booking = contextMenu?.booking;
    if (!booking) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await deleteCheckInBooking(booking.id);
      setBookings((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      showToast("Check-in cancellato", "success", 2500);
      setContextMenu(null);
      
    } catch (err) {
      const message = (err as Error).message || "Errore cancellazione check-in";
      setError(message);
      showToast(message, "error", 3000);
    } finally {
      setLoading(false);
      setCheckinMenuOpen(false);
    }
  };

  

  const handleBookingSelect = (booking: BookingApi) => {
    (async () => {
      //setLoading(true);
      setError(null);
      try {
        const fresh = await fetchBooking(booking.id);
        setSelectedBooking(fresh);
        setDetailsTab("details");
        setEditRoomNumber(fresh.roomNumber);
        // Carica camere disponibili per il periodo della prenotazione
        (async () => {
          try {
            const res = await fetchWithAuth(`${BASE_URL}/api/rooms/available?from=${fresh.checkInDate}&to=${fresh.checkOutDate}`);
            const data = await res.json();
            setAvailableRooms(Array.isArray(data) ? data : []);
            // Imposta le features selezionate in base alla camera della prenotazione
            const roomObj = data.find((r: any) => String(r.roomNumber) === String(fresh.roomNumber));
            setSelectedFeatures(roomObj && roomObj.features ? roomObj.features.map((f: any) => f.name) : []);
          } catch {
            setAvailableRooms([]);
            setSelectedFeatures([]);
          }
        })();
        setEditCheckInDate(fresh.checkInDate);
        setEditCheckOutDate(fresh.checkOutDate);
        setEditGuestFirstName(fresh.guestFirstName || "");
        setEditGuestLastName(fresh.guestLastName || "");
        setEditGuestEmail(fresh.guestEmail || "");
        setEditGuestPhone(fresh.guestPhoneNumber || "");
        setEditAgencyReference(fresh.agencyReference || "");
        setEditAgencyBookingDate(fresh.agencyBookingDate || "");
        setEditAgencyId(fresh.agencyId || "");
        setEditAdults(String(fresh.adults ?? 0));
        setEditChildren(String(fresh.children ?? 0));
        setEditInfants(String(fresh.infants ?? 0));
        setEditTreatment(fresh.treatment);

        setEditStatus(fresh.status);
        setEditNotes(fresh.notes ?? "");
        setEditPrice(fresh.price !== undefined && fresh.price !== null ? String(fresh.price) : "");
        setDepositAmount("");
        setDepositPaymentMethodId("");
        setDepositNotes("");
        onOpenDetails();
        // refresh list in background
        //loadData();
      } catch (err) {
        const message = (err as Error).message || "Errore caricamento prenotazione";
        showToast(message, "error", 3000);
      } finally {
        //setLoading(false);
      }
    })();
  };

  const handleNotificationRead = async (notificationId: number) => {
    setNotificationsLoading(true);
    setNotificationsError(null);
    try {
      await markNotificationRead(notificationId);
      setNotifications((prev) => prev.filter((item) => item.id !== notificationId));
    } catch (err) {
      setNotificationsError((err as Error).message || "Errore aggiornamento notifica");
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleOpenNotificationBooking = async (bookingId?: number | null) => {
    if (!bookingId) return;
    try {
      const booking = await fetchBooking(bookingId);
      handleBookingSelect(booking);
    } catch {
      showToast("Prenotazione non trovata", "error", 2500);
    }
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
        const list = await fetchDepositByBookingId(selectedBooking.id);
        setDeposits(list);
      } catch {
        setDeposits([]);
      }
    };
    loadDeposits();
    // load bar cards for this booking as well
    const loadCards = async () => {
      try {
        setCardLoading(true);
        const cards = await fetchBarCards(selectedBooking.id);
        setBarCards(cards || []);
        if (cards && cards.length > 0) setSelectedCardId(cards[0].id);
      } catch {
        setBarCards([]);
        setSelectedCardId(null);
      } finally {
        setCardLoading(false);
      }
    };
    loadCards();
  }, [selectedBooking]);

  useEffect(() => {
    const loadTx = async () => {
      if (!selectedCardId) {
        setCardTransactions([]);
        return;
      }
      setCardTxLoading(true);
      try {
        const tx = await fetchCardTransactions(selectedCardId);
        setCardTransactions(tx || []);
      } catch {
        setCardTransactions([]);
      } finally {
        setCardTxLoading(false);
      }
    };
    loadTx();
  }, [selectedCardId]);

  const handleUpdateBooking = async () => {
    if (!selectedBooking) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await updateBooking(selectedBooking.id, {
        roomNumber: editRoomNumber,
        checkInDate: editCheckInDate,
        checkOutDate: editCheckOutDate,
        firstName: editGuestFirstName,
        lastName: editGuestLastName,
        userId: selectedBooking.userId,
        email: editGuestEmail,
        phoneNumber: editGuestPhone,
        agencyId: editAgencyId ? Number(editAgencyId) : undefined,
        agencyReference: editAgencyId ? editAgencyReference.trim() || null : null,
        agencyBookingDate: editAgencyId ? editAgencyBookingDate || null : null,
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
      setPrintPrompt({
        title: "Acconto prenotazione",
        description: created.notes?.trim() || undefined,
        price: Number(created.amount),
        paymentMethodId: created.paymentMethodId,
        depositId: created.id,  
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
    <div className="flex flex-col gap-6 h-screen max-h-screen overflow-hidden">
      <div
        className={`sticky top-0 z-20 rounded-md border px-2 py-2 shadow-sm ${
          isReferenceToday
            ? "border-default-200 bg-default-50"
            : "border-amber-300 bg-amber-100"
        }`}
        style={{ minHeight: 56, maxHeight: 80 }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 min-h-[40px]">
          {/* Hamburger solo su mobile */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              className="p-2 rounded-md border border-default-200 bg-default-50 hover:bg-default-100"
              aria-label="Apri menu"
              onClick={() => setMobileMenuOpen(true)}
            >
              {/* Hamburger icon */}
              <span className="block w-6 h-0.5 bg-default-700 mb-1"></span>
              <span className="block w-6 h-0.5 bg-default-700 mb-1"></span>
              <span className="block w-6 h-0.5 bg-default-700"></span>
            </button>
          </div>
          {/* Toolbar normale solo su desktop */}
          <div className="flex flex-wrap items-center gap-1 hidden lg:flex">
            {toolbarItems.map((item) => {
              if (item.key === "extra") {
                return (
                  <Dropdown key={item.key} placement="bottom-start">
                    <DropdownTrigger>
                      <Button
                        variant="light"
                        className="flex w-16 flex-col items-center justify-center gap-1 px-2 py-1 text-[10px] text-default-600"
                        title={item.label}
                      >
                        <span className="relative text-base leading-none">{item.icon}</span>
                        <span className="leading-none">{item.label}</span>
                      </Button>
                    </DropdownTrigger>

                    <DropdownMenu
                      aria-label="Azioni extra"
                      onAction={(key) => {
                        if (key === "addebita") onOpenExtra();
                        if (key === "verifica") setCardModalOpen(true);
                      }}
                    >
                      <DropdownItem key="addebita">Addebita extra</DropdownItem>
                      <DropdownItem key="verifica">Verifica extra</DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                );
              }

              if (item.key === "receipt") {
                return (
                  <Dropdown key="receipt-dropdown" placement="bottom-start">
                    <DropdownTrigger>
                      <Button
                        variant="light"
                        className="flex w-16 flex-col items-center justify-center gap-1 px-2 py-1 text-[10px] text-default-600"
                        title={item.label}
                      >
                        <span className="relative text-base leading-none">{item.icon}</span>
                        <span className="leading-none">{item.label}</span>
                      </Button>
                    </DropdownTrigger>

                    <DropdownMenu
                      aria-label="Cassa"
                      onAction={(key) => {
                        if (key === "free") setReceiptModalOpen(true);
                        if (key === "closure") setCashClosurePending(true);
                      }}
                    >
                      <DropdownItem key="free">Scontrino libero</DropdownItem>
                      <DropdownItem key="closure" className="text-danger">Chiusura cassa</DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                );
              }

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={item.onClick}
                  className="flex w-16 flex-col items-center justify-center gap-1 rounded-md border border-transparent px-2 py-1 text-[10px] text-default-600 transition hover:border-default-200 hover:bg-default-100"
                  title={item.label}
                >
                  <span className="relative text-base leading-none">
                    {item.icon}
                    {item.key === "notifications" && notifications.length > 0 && (
                      <span className="absolute -right-2 -top-1 rounded-full bg-danger-500 px-1.5 text-[9px] font-semibold text-white">
                        {notifications.length}
                      </span>
                    )}
                  </span>
                  <span className="leading-none">{item.label}</span>
                </button>
              );
            })}
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


      
        {/* Drawer laterale mobile, separato dalla toolbar desktop */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div className="bg-white w-64 h-full shadow-lg p-4 flex flex-col gap-2">
              <button
                className="self-end mb-2 p-1 rounded hover:bg-default-100"
                aria-label="Chiudi menu"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="block w-6 h-0.5 bg-default-700 mb-1 rotate-45 translate-y-1"></span>
                <span className="block w-6 h-0.5 bg-default-700 -rotate-45 -translate-y-1"></span>
              </button>
              {toolbarItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (item.onClick) item.onClick();
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded hover:bg-default-100 text-base text-default-700"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
            <div className="flex-1 bg-black/30" onClick={() => setMobileMenuOpen(false)}></div>
          </div>
        )}

      {viewMode === "grid" ? (
        <div className="flex-1 min-h-0 relative">
          <Card className="h-full">
            <CardBody className="h-full overflow-auto">
              <div className="grid min-h-0 h-full max-h-full lg:grid-cols-10 md:grid-cols-8 grid-cols-6 gap-1 overflow-y-auto">
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
                      className={`flex flex-col gap-0.5 rounded-md border px-1.5 py-0.5 text-[10px] leading-tight min-h-[80px] max-h-[120px] ${statusClass}`}
                      style={{ minHeight: 50, maxHeight: 120, overflow: 'hidden' }}
                      onClick={() => {
                        if (booking) handleBookingSelect(booking);
                        else {
                          setRoomNumber(room.roomNumber);
                          setCheckInDate(getFirstAvailableDate(room.roomNumber, referenceDate));
                          onOpen();
                        }
                      }}
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
                        <span className="opacity-80">{(room.roomType || "").slice(0, 6)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] opacity-80">
                        <span>Arr {booking ? formatDateShort(booking.checkInDate) : "--"}</span>
                        <span>Par {booking ? formatDateShort(booking.checkOutDate) : "--"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {loading && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/70">
                  <span className="animate-spin rounded-full border-4 border-gray-300 border-t-blue-500 h-16 w-16"></span>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      ) : (
        <div className="h-[calc(100vh-200px)]">
          <BookingCalendar
            rooms={orderedRooms}
            bookings={bookings}
            days={30}
            rowHeight={24}
            onRangeSelect={handleCalendarRange}
            onBack={() => setViewMode("grid")}
            onBookingSelect={handleBookingSelect}
            onBookingMove={handleBookingMove}
          />
        </div>
      )}

        {/* Modale check-in */}
        <Modal isOpen={checkinModalOpen} onOpenChange={setCheckinModalOpen} size="md">
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">Conferma check-in</ModalHeader>
                <ModalBody className="gap-3">
                  {checkinModalBooking && (
                    <>
                      <div className="text-sm text-default-600 mb-2 grid grid-cols-2 gap-2 items-center">
                        <div>
                          <strong>Camera:</strong> {checkinModalBooking.roomNumber}<br />
                          <strong>Ospite:</strong> {getGuestLabel(checkinModalBooking)}<br />
                          <strong>Periodo:</strong> {formatDateShort(checkinModalBooking.checkInDate)} - {formatDateShort(checkinModalBooking.checkOutDate)}
                          </div>
                          <div className="flex gap-2 items-center">
                          <Input
                            label="Adulti"
                            type="number"
                            size="sm"
                            min={0}
                            value={checkinModalBooking.adults ?? 0}
                            onChange={e => {
                              const val = Math.max(0, Number(e.target.value));
                              setCheckinModalBooking(b => b ? { ...b, adults: val } : b);
                            }}
                            className="w-20"
                          />
                          <Input
                            label="Bambini"
                            type="number"
                            size="sm"
                            min={0}
                            value={checkinModalBooking.children ?? 0}
                            onChange={e => {
                              const val = Math.max(0, Number(e.target.value));
                              setCheckinModalBooking(b => b ? { ...b, children: val } : b);
                            }}
                            className="w-20"
                          />
                          <Input
                            label="Infanti"
                            type="number"
                            size="sm"
                            min={0}
                            value={checkinModalBooking.infants ?? 0}
                            onChange={e => {
                              const val = Math.max(0, Number(e.target.value));
                              setCheckinModalBooking(b => b ? { ...b, infants: val } : b);
                            }}
                            className="w-20"
                          />
                        </div>
                          <div className="mt-2 grid grid-cols-2 gap-2 col-span-2">
                            <Input
                              label="Email"
                              type="email"
                              size="sm"
                              value={checkinModalBooking.guestEmail || ""}
                              onChange={e => setCheckinModalBooking(b => b ? { ...b, guestEmail: e.target.value } : b)}
                              className="w-full"
                            />
                            <Input
                              label="Telefono"
                              type="tel"
                              size="sm"
                              value={checkinModalBooking.guestPhoneNumber || ""}
                              onChange={e => setCheckinModalBooking(b => b ? { ...b, guestPhoneNumber: e.target.value } : b)}
                              className="w-full"
                            />
                          </div>
                        
                      </div>
                      <div className="rounded-md border border-default-200 bg-default-50 px-3 py-2 mb-2">
                        <div className="text-xs text-default-500">Costo totale prenotazione</div>
                        <div className="text-lg font-semibold">€ {checkinModalBooking.price ? Number(checkinModalBooking.price).toFixed(2) : "-"}</div>
                      </div>
                      <div className="rounded-md border border-default-200 bg-default-50 px-3 py-2 mb-2">
                        <div className="text-xs text-default-500">Tassa di soggiorno</div>
                        <div className="text-lg font-semibold">€ {getTouristTax(checkinModalBooking).toFixed(2)}</div>
                      </div>
                      <div className="rounded-md border border-default-200 bg-default-50 px-3 py-2 mb-2">
                        <div className="text-xs text-default-500">Tessera club</div>
                        <div className="text-lg font-semibold">€ {getClubCard(checkinModalBooking).toFixed(2)}</div>
                      </div>
                    </>
                  )}
                </ModalBody>
                <ModalFooter>
                  <Button size="sm" variant="flat" onClick={() => { setCheckinModalOpen(false); setCheckinModalBooking(null); setCheckinModalMeal(null); }}>
                    Annulla
                  </Button>
                  <Button
                    size="sm"
                    color="primary"
                    onClick={async () => {
                      if (!checkinModalBooking || !checkinModalMeal) return;
                      setLoading(true);
                      setError(null);
                      try {
                        const updated = await checkInBooking(checkinModalBooking.id, { meal: checkinModalMeal });
                        setBookings((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
                        showToast("Check-in registrato", "success", 2500);
                        setCheckinModalOpen(false);
                        setCheckinModalBooking(null);
                        setCheckinModalMeal(null);
                      } catch (err) {
                        const message = (err as Error).message || "Errore check-in prenotazione";
                        setError(message);
                        showToast(message, "error", 3000);
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    Conferma check-in
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

      <Modal
        isOpen={isNotificationsOpen}
        onOpenChange={onNotificationsOpenChange}
        placement="center"
        size="lg"
      >
        <ModalContent className="w-[95vw] max-w-[1400px]">
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Notifiche
                <span className="text-xs text-default-500">Messaggi per receptionist</span>
              </ModalHeader>
              <ModalBody className="gap-3">
                {notificationsError && (
                  <div className="text-sm text-danger-600">{notificationsError}</div>
                )}
                <div className="max-h-[360px] overflow-auto rounded-md border border-default-200 bg-default-50">
                  {notifications.length === 0 && !notificationsLoading && (
                    <div className="px-3 py-2 text-xs text-default-500">Nessuna notifica</div>
                  )}
                  {[...notifications].sort((a, b) => (b.bookingId ?? 0) - (a.bookingId ?? 0)).map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start justify-between gap-3 border-b border-default-200 px-3 py-2 last:border-b-0 border-l-4 ${getNotificationClasses(
                        notification.type,
                      )}`}
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{notification.message}</div>
                        <div className="text-xs text-default-500">
                          {notification.createdAt
                            ? new Date(notification.createdAt).toLocaleString("it-IT")
                            : "-"}
                        </div>
                      </div>
                      <div className="flex flex-row items-center gap-2 mt-1">
                        {notification.bookingId && (
                          <Button
                            size="sm"
                            variant="flat"
                            className="px-2 py-1 text-xs"
                            onClick={() => handleOpenNotificationBooking(notification.bookingId)}
                            aria-label="Apri prenotazione"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" width="18" height="18"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13.75 6.25V3.75A1.25 1.25 0 0 0 12.5 2.5h-7.5A1.25 1.25 0 0 0 3.75 3.75v12.5A1.25 1.25 0 0 0 5 17.5h7.5a1.25 1.25 0 0 0 1.25-1.25v-2.5M8.75 11.25l7.5-7.5m0 0h-3.75m3.75 0v3.75"/></svg>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="flat"
                          className="px-2 py-1 text-xs"
                          onClick={() => handleNotificationRead(notification.id)}
                          isLoading={notificationsLoading}
                          aria-label="Segna come letta"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" width="18" height="18"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 10.5l3 3 7-7M9 13.5l-2-2"/></svg>
                        </Button>
                      </div>
                    </div>
                  ))}
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

      <Modal isOpen={cashClosurePending} onOpenChange={(open) => { if (!open) setCashClosurePending(false); }} size="sm">
        <ModalContent className="w-[95vw] max-w-[420px]">
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Conferma chiusura cassa</ModalHeader>
              <ModalBody>
                <div className="text-sm text-default-600">
                  Confermi di voler effettuare la chiusura fiscale della cassa?
                </div>
              </ModalBody>
              <ModalFooter>
                <Button size="sm" variant="flat" onClick={() => { setCashClosurePending(false); onClose(); }}>
                  Annulla
                </Button>
                <Button size="sm" color="primary" isLoading={cashClosureLoading} onClick={async () => { onClose(); await handleCashClosureConfirm(); }}>
                  Conferma chiusura
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

        <MenuModal isOpen={isMenuOpen} onOpenChange={onMenuOpenChange} />

      <ExtraModal isOpen={isExtraOpen} onOpenChange={onExtraOpenChange} bookings={bookings} initialBookingId={selectedBooking ? selectedBooking.id : null} />
      <CardModal isOpen={isCardModalOpen} onOpenChange={(v) => setCardModalOpen(v)} />

      <Modal
        isOpen={isDetailsOpen}
        onOpenChange={() => {
          onDetailsOpenChange();
          if (isDetailsOpen) {
            setSelectedBooking(null);
            setSelectedCardId(null);
          }
        }}
        placement="center"
        size="xl"
      >
        <ModalContent className="w-[95vw] max-w-[1400px]">
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
                        Registrati PS
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
                      <Button
                        size="sm"
                        variant={detailsTab === "cards" ? "solid" : "flat"}
                        onClick={() => setDetailsTab("cards")}
                      >
                        Card
                      </Button>
                    </div>

                    {detailsTab === "details" && (
                     <div className="grid md:grid-cols-12 gap-3 text-sm">
                      
                        <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-8 gap-2">
                        
                        <Input
                          label="Nome"
                          type="text"
                          className="md:col-span-3"
                          value={editGuestFirstName}
                          onChange={(event) => setEditGuestFirstName(event.target.value)}
                        />
                        
                       <Input
                          label="Cognome"
                          type="text"
                          className="md:col-span-3"
                          value={editGuestLastName}
                          onChange={(event) => setEditGuestLastName(event.target.value)}
                        />

                          <Input
                          label="Prezzo"
                          type="number"

                          placeholder="0.00"
                          startContent={
                              <div className="pointer-events-none flex items-center">
                                <span className="text-default-400 text-small">€</span>
                            </div>
                          }
                          className="md:col-span-2"
                          value={editPrice}
                          onChange={(event) => setEditPrice(event.target.value)}
                        />

                        <Input
                          label="Check-in"
                          type="date"
                          className="md:col-span-2"
                          value={editCheckInDate}
                          onChange={(event) => setEditCheckInDate(event.target.value)}
                        />
                        <Input
                          label="Check-out"
                          type="date"
                          className="md:col-span-2"
                          value={editCheckOutDate}
                          onChange={(event) => setEditCheckOutDate(event.target.value)}
                        />


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
                          label="Infanti"
                          type="number"
                          value={editInfants}
                          onChange={(event) => setEditInfants(event.target.value)}
                        />


                        <Select
                          label="Trattamento"
                          selectedKeys={[editTreatment]}
                          className="md:col-span-2"
                          onChange={(event) => setEditTreatment(event.target.value as BookingApi["treatment"])}
                        >
                          {TREATMENTS.map((option) => (
                            <SelectItem key={option.key}>{option.label}</SelectItem>
                          ))}
                        </Select>


                        <Input
                          label="Email ospite"
                          type="email"
                          className="md:col-span-3"
                          value={editGuestEmail}
                          onChange={(event) => setEditGuestEmail(event.target.value)}
                        />
                        <Input
                          label="Telefono ospite"
                          type="tel"
                          className="md:col-span-3"
                          value={editGuestPhone}
                          onChange={(event) => setEditGuestPhone(event.target.value)}
                        />
                        <Select
                          label="Stato"
                          className="md:col-span-2"
                          selectedKeys={[editStatus]}
                          onChange={(event) => setEditStatus(event.target.value as BookingApi["status"])}
                        >
                          {STATUSES.map((option) => (
                            <SelectItem key={option.key}>{option.label}</SelectItem>
                          ))}
                        </Select>
<Select
  label="Agenzia"
  className="md:col-span-2"
  selectedKeys={editAgencyId ? [String(editAgencyId)] : []}
  onChange={(event) => setEditAgencyId(event.target.value)}
>
  {agencies.map((agency) => (
    <SelectItem key={String(agency.id)}>
      {agency.agencyName}
    </SelectItem>
  ))}
</Select>

                        <Input
                          label="Referenza agenzia"
                          className="md:col-span-2"
                          value={editAgencyReference}
                          onChange={(event) => setEditAgencyReference(event.target.value)}
                        />

                        <Input
                          label="Data agenzia"
                          className="md:col-span-2"
                          type="date"
                          value={editAgencyBookingDate}
                          onChange={(event) => setEditAgencyBookingDate(event.target.value)}
                        />


                      </div>
                      <div className="md:col-span-4 flex flex-col">
                          {editRoomNumber ? (
                            <div className="mb-3 p-2 rounded bg-default-50 text-sm">
                              <div className="flex items-start justify-between gap-2">
                                {(() => {
                                  const roomObj = rooms.find(r => String(r.roomNumber) === String(editRoomNumber));
                                  return (
                                    <div className="font-semibold">
                                      Camera selezionata: <span className="font-bold">{editRoomNumber}</span>
                                      <span className="text-[11px] text-default-500 ml-2">{roomObj?.roomType}</span>
                                    </div>
                                  );
                                })()}
                                <Button
                                  color="default"
                                  variant="flat"
                                  onClick={() => {
                                    setEditRoomNumber("");
                                    setRoomQuery("");
                                  }}
                                  className="text-xs px-2"
                                >
                                  Modifica
                                </Button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {(selectedFeatures || []).map((f) => (
                                  <Chip
                                    key={f}
                                    size="sm"
                                    className="px-2 py-1 text-xs rounded-full bg-default-100 text-default-700"
                                  >
                                    {f}
                                  </Chip>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-md border border-default-200 bg-default-50 p-3 flex-1 flex flex-col">
                              <div className="mt-3 flex-1 overflow-y-auto max-h-70">
                                <div className="text-sm font-semibold mb-2">Selezione camera</div>
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {allFeatures.map((feat) => (
                                    <Chip
                                      key={feat}
                                      size="sm"
                                      startContent={selectedFeatures.includes(feat) ? (
                                        <span className="text-primary-500">
                                          <CheckIcon size={14} />
                                        </span>
                                      ) : undefined}
                                      onClick={() => toggleFeature(feat)}
                                      tabIndex={0}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                          e.preventDefault();
                                          toggleFeature(feat);
                                        }
                                      }}
                                      className={`cursor-pointer px-2 py-1 text-sm rounded-full transition ${selectedFeatures.includes(feat)
                                        ? "bg-primary-100 text-primary-800 border-transparent"
                                        : "bg-default-100 text-default-700 hover:bg-default-200"}`}
                                    >
                                      {feat}
                                    </Chip>
                                  ))}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {editRoomNumber !== "" ? (
                                    (() => {
                                      const roomObj = rooms.find(r => String(r.roomNumber) === String(editRoomNumber));
                                      return (
                                        <div className="mb-3 p-2 rounded bg-default-50 text-sm">
                                          <div className="flex items-start justify-between gap-2">
                                            <div className="font-semibold">Camera selezionata: <span className="font-bold">{roomObj?.roomNumber}</span><span className="text-[11px] text-default-500 ml-2">{roomObj?.roomType}</span></div>
                                            <Button
                                              color="default"
                                              variant="flat"
                                              onClick={() => {
                                                setEditRoomNumber("");
                                                setSelectedFeatures([]);
                                                setRoomQuery("");
                                              }}
                                              className="text-xs px-2"
                                            >
                                              Modifica
                                            </Button>
                                          </div>
                                          <div className="flex flex-wrap gap-2">
                                            {(roomObj?.features || []).map((f) => (
                                              <Chip
                                                key={f.name}
                                                size="sm"
                                                className="px-2 py-1 text-xs rounded-full bg-default-100 text-default-700"
                                              >
                                                {f.name}
                                              </Chip>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    })()
                                  ) : (
                                    [...availableRooms].sort((a, b) => {
                                      const aNum = Number(a.roomNumber);
                                      const bNum = Number(b.roomNumber);
                                      const aIsNum = Number.isFinite(aNum);
                                      const bIsNum = Number.isFinite(bNum);
                                      if (aIsNum && bIsNum) return aNum - bNum;
                                      if (aIsNum) return -1;
                                      if (bIsNum) return 1;
                                      return a.roomNumber.localeCompare(b.roomNumber, "it");
                                    })
                                      .filter(room => {
                                        const q = roomQuery.toLowerCase();
                                        const hay = `${room.roomNumber} ${room.roomType} ${(room.features || []).map(f => f.name).join(' ')}`.toLowerCase();
                                        if (q && !hay.includes(q)) return false;
                                        if (selectedFeatures.length > 0) {
                                          const names = (room.features || []).map(f => f.name);
                                          for (const feat of selectedFeatures) {
                                            if (!names.includes(feat)) return false;
                                          }
                                        }
                                        return true;
                                      })
                                      .map(r => (
                                        <Chip
                                          key={r.roomNumber}
                                          size="sm"
                                          startContent={editRoomNumber === r.roomNumber ? (
                                            <span className="text-emerald-500">
                                              <CheckIcon size={16} />
                                            </span>
                                          ) : undefined}
                                          onClick={() => {
                                            setEditRoomNumber(String(r.roomNumber));
                                            setRoomQuery("");
                                          }}
                                          className={`inline-flex cursor-pointer items-center gap-2 px-2 py-1 text-sm rounded-full transition whitespace-nowrap ${
                                            editRoomNumber === r.roomNumber
                                              ? "bg-emerald-100 text-emerald-800 border-transparent"
                                              : "bg-default-100 text-default-700 hover:bg-default-200"
                                          }`}
                                        >
                                          <span className="font-semibold">{r.roomNumber}</span>
                                          <span>  </span>
                                          <span className="text-[11px] text-default-500">{r.roomType}</span>
                                        </Chip>
                                      ))
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {detailsTab === "guests" && (
                      <div className="grid gap-6 md:grid-cols-2">
                        {/* Lista ospiti già registrati (placeholder, da collegare a fetch PS by booking) */}
                        <div className="col-span-2">
                          <div className="font-semibold mb-2">Ospiti registrati</div>
                          {psGuestsLoading ? (
                            <div className="text-xs text-default-500 mb-2">Caricamento...</div>
                          ) : psGuestsError ? (
                            <div className="text-xs text-danger-600 mb-2">{psGuestsError}</div>
                          ) : psGuests.length === 0 ? (
                            <div className="text-xs text-default-500 mb-2">(Nessun ospite registrato)</div>
                          ) : (
                            <div className="flex flex-wrap gap-3 mb-2">
                              {psGuests.map((guest, idx) => {
  const isIncomplete =
    !guest.firstName ||
    !guest.lastName ||
    !guest.birthDate ||
    !guest.birthPlace;

  return (
    <div
  key={guest.id || idx}
  className={`bg-white border rounded-xl p-4 shadow-sm 
    hover:shadow-md transition-all duration-200
    ${isIncomplete ? "border-default-200" : "border-amber-200"}
  `}
>
  <div className="flex justify-between items-start">
    
    {/* BLOCCO DATI */}
    <div className="flex flex-col gap-1">

      {/* NOME */}
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm text-default-900">
          {guest.firstName || "—"} {guest.lastName || ""}
        </span>

        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-medium
            ${
              isIncomplete
                ? "bg-default-100 text-default-500"
                : "bg-amber-100 text-amber-800"
            }
          `}
        >
          {isIncomplete ? "Incompleto" : "OK"}
        </span>
      </div>

      {/* INFO SECONDARIE */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-default-500 mt-1">
        <span>
          {guest.birthDate
            ? `Nato il ${guest.birthDate}`
            : "Data nascita mancante"}
        </span>

        {guest.birthPlace && (
          <span>
            {guest.birthPlace?.nome || guest.birthPlace}
          </span>
        )}
      </div>

      {/* DOCUMENTO */}
      {guest.documentType && guest.documentNumber && (
        <div className="text-xs text-default-600 mt-2">
          <span className="font-medium">
            {guest.documentType.descrizione || guest.documentType}
          </span>
          {" • "}
          {guest.documentNumber}
        </div>
      )}
    </div>

    {/* AZIONI */}
    <div className="flex gap-3 text-default-400 text-sm">
      <button
        onClick={() => setEditingPsGuest(guest)}
        className="hover:text-primary-600 transition-colors"
      >
        ✏️
      </button>
      <button
        onClick={() => setPendingDeletePsGuest(guest)}
        className="hover:text-danger-600 transition-colors"
      >
        🗑
      </button>
    </div>

  </div>
</div>
  );
})}
                                {/* Modale modifica ospite PS */}
                                <Modal
                                  isOpen={!!editingPsGuest}
                                  onOpenChange={(open) => { if (!open) setEditingPsGuest(null); }}
                                  size="md"
                                >
                                  <ModalContent>
                                    {(onClose) => (
                                      <>
                                        <ModalHeader className="flex flex-col gap-1">Modifica registrato</ModalHeader>
                                        <ModalBody>
                                          {editingPsGuest && (
                                            <div className="grid gap-3 md:grid-cols-2">
                                              <Input label="Nome" value={editingPsGuest.firstName || ""} onChange={e => setEditingPsGuest({ ...editingPsGuest, firstName: e.target.value })} />
                                              <Input label="Cognome" value={editingPsGuest.lastName || ""} onChange={e => setEditingPsGuest({ ...editingPsGuest, lastName: e.target.value })} />
                                              <Input label="Data di nascita" type="date" value={editingPsGuest.birthDate || ""} onChange={e => setEditingPsGuest({ ...editingPsGuest, birthDate: e.target.value })} />
                                              <Input label="Luogo di nascita" value={editingPsGuest.birthPlace?.nome || editingPsGuest.birthPlace || ""} onChange={e => setEditingPsGuest({ ...editingPsGuest, birthPlace: { ...editingPsGuest.birthPlace, nome: e.target.value } })} />
                                              {/* Altri campi se necessario */}
                                            </div>
                                          )}
                                        </ModalBody>
                                        <ModalFooter>
                                          <Button size="sm" variant="flat" onClick={() => { setEditingPsGuest(null); onClose(); }}>
                                            Annulla
                                          </Button>
                                          <Button
                                            size="sm"
                                            color="primary"
                                            onClick={async () => {
                                              if (!editingPsGuest?.id) return;
                                              try {
                                                // Chiamata API per aggiornare ospite PS
                                                await import("@/lib/hotel-api").then(api => api.updatePsGuest(editingPsGuest.id, editingPsGuest));
                                                setPsGuests(prev => prev.map(g => g.id === editingPsGuest.id ? { ...g, ...editingPsGuest } : g));
                                                addToast({ title: "Ospite PS aggiornato", status: "success" });
                                              } catch (err) {
                                                addToast({ title: "Errore aggiornamento PS", description: String(err), status: "error" });
                                              }
                                              setEditingPsGuest(null);
                                              onClose();
                                            }}
                                          >
                                            Salva modifiche
                                          </Button>
                                        </ModalFooter>
                                      </>
                                    )}
                                  </ModalContent>
                                </Modal>
                              {/* Modale conferma cancellazione ospite PS */}
                              <Modal
                                isOpen={!!pendingDeletePsGuest}
                                onOpenChange={(open) => { if (!open) setPendingDeletePsGuest(null); }}
                                size="sm"
                              >
                                <ModalContent>
                                  {(onClose) => (
                                    <>
                                      <ModalHeader className="flex flex-col gap-1">Conferma eliminazione registrato</ModalHeader>
                                      <ModalBody>
                                        <div className="text-sm text-default-600">
                                          Sei sicuro di voler eliminare il registrato <strong>{pendingDeletePsGuest?.firstName} {pendingDeletePsGuest?.lastName}</strong>?
                                        </div>
                                      </ModalBody>
                                      <ModalFooter>
                                        <Button size="sm" variant="flat" onClick={() => { setPendingDeletePsGuest(null); onClose(); }}>
                                          Annulla
                                        </Button>
                                        <Button
                                          size="sm"
                                          className="bg-danger-600 text-white"
                                          onClick={async () => {
                                            if (!pendingDeletePsGuest?.id) return;
                                            try {
                                              await import("@/lib/hotel-api").then(api => api.deletePsGuest(pendingDeletePsGuest.id));
                                              setPsGuests(prev => prev.filter(g => g.id !== pendingDeletePsGuest.id));
                                              addToast({ title: "Ospite PS eliminato", status: "success" });
                                            } catch (err) {
                                              addToast({ title: "Errore eliminazione PS", description: String(err), status: "error" });
                                            }
                                            setPendingDeletePsGuest(null);
                                            onClose();
                                          }}
                                        >
                                          Conferma eliminazione
                                        </Button>
                                      </ModalFooter>
                                    </>
                                  )}
                                </ModalContent>
                              </Modal>
                            </div>
                          )}
                        </div>
                        {/* Form nuovo registrato */}
                        <div className="col-span-2 border-t pt-4 mt-2">
                          <div className="font-semibold mb-2">Aggiungi nuovo registrato</div>
                          <div className="grid gap-3 md:grid-cols-12">
                            <Input label="Nome" value={psFirstName} className="col-span-2" onChange={e => setPsFirstName(e.target.value)} />
                            <Input label="Cognome" value={psLastName} className="col-span-2" onChange={e => setPsLastName(e.target.value)} />
                            <Input label="Data di nascita" type="date" value={psBirthDate} className="col-span-2" onChange={e => setPsBirthDate(e.target.value)} />
                            <Autocomplete
                              label="Stato di nascita"
                              className="col-span-3"
                              inputValue={psSelectedState}
                              onInputChange={val => {
                                const found = psStates.find(opt => opt.label === val);
                                setPsSelectedState(found ? found.label : val);
                                setPsBirthStateCode(found ? found.key : "");
                              }}
                              onSelectionChange={key => {
                                const selected = psStates.find(opt => opt.key === key);
                                if (selected) {
                                  setPsSelectedState(selected.label);
                                  setPsBirthStateCode(selected.key);
                                }
                              }}
                              >
                              {psStates.map(opt => (
                                <AutocompleteItem key={opt.key}>{opt.label}</AutocompleteItem>
                              ))}
                            </Autocomplete>
                            <Autocomplete
                              label="Luogo di nascita"
                              allowsCustomValue={true}
                              className="col-span-3"
                              inputValue={psBirthPlace}
                              onInputChange={val => {
                                setPsBirthPlace(val);
                                setPsBirthPlaceCode("");
                              }}
                              onSelectionChange={key => {
                                const selected = psBirthPlaceOptions.find(opt => opt.key === key);
                                if (selected) {
                                  setPsBirthPlace(selected.label);
                                  setPsBirthPlaceCode(selected.codice || "");
                                }
                              }}
                              isLoading={psBirthPlaceLoading}
                            >
                              {psBirthPlaceOptions.map(opt => (
                                <AutocompleteItem key={opt.key}>{opt.label}</AutocompleteItem>
                              ))}
                            </Autocomplete>
                            {/* Stato di residenza (cittadinanza) */}
                            <Autocomplete
                              label="Stato di residenza"
                              className="col-span-3"
                              inputValue={psSelectedResidenceState}
                              onInputChange={val => {
                                const found = psStates.find(opt => opt.label === val);
                                setPsSelectedResidenceState(found ? found.label : val);
                                setPsResidenceStateCode(found ? found.key : "");
                              }}
                              onSelectionChange={key => {
                                const selected = psStates.find(opt => opt.key === key);
                                if (selected) {
                                  setPsSelectedResidenceState(selected.label);
                                  setPsResidenceStateCode(selected.key);
                                }
                              }}
                              allowsCustomValue={true}
                            >
                              {psStates.map(opt => (
                                <AutocompleteItem key={opt.key}>{opt.label}</AutocompleteItem>
                              ))}
                            </Autocomplete>
                            {/* Comune di residenza (autocomplete dinamico) */}
                            <Autocomplete
                              label="Comune di residenza"
                              className="col-span-3"
                              allowsCustomValue={true}
                              inputValue={psResidenceMunicipality}
                              onInputChange={val => {
                                setPsResidenceMunicipality(val);
                                setPsResidenceMunicipalityCode("");
                              }}
                              onSelectionChange={key => {
                                const selected = psResidenceMunicipalityOptions.find(opt => opt.key === key);
                                if (selected) {
                                  setPsResidenceMunicipality(selected.label);
                                  setPsResidenceMunicipalityCode(selected.codice || "");
                                }
                              }}
                              isLoading={psResidenceMunicipalityLoading}
                            >
                              {psResidenceMunicipalityOptions.map(opt => (
                                <AutocompleteItem key={opt.key}>{opt.label}</AutocompleteItem>
                              ))}
                            </Autocomplete>
                            {/* Tipo documento (select dinamica) */}
                            <Autocomplete
                              label="Tipo documento"
                              className="col-span-2"
                              inputValue={psSelectedDocument}

                              allowsCustomValue={true}
                              onInputChange={val => {
                                setPsSelectedDocument(val);
                                setPsSelectedDocumentCode("");
                              }}
                              onSelectionChange={key => {
                                const selected = psDocuments.find(opt => opt.key === key);
                                if (selected) {
                                  setPsSelectedDocument(selected.label);
                                  setPsSelectedDocumentCode(selected.key || "");
                                }
                              }}
                            >
                              {psDocuments.map(opt => (
                                <AutocompleteItem key={opt.key}>{opt.label}</AutocompleteItem>
                              ))}
                            </Autocomplete>
                            <Input label="Numero documento" className="col-span-2" value={psDocumentNumber} onChange={(event) => setPsDocumentNumber(event.target.value)} />
                            <Input label="Data rilascio documento" className="col-span-2" type="date" value={psDocumentIssueDate} onChange={(event) => setPsDocumentIssueDate(event.target.value)} />
                          </div>
                          <div className="flex justify-end mt-4">
                            <Button
                              color="primary"
                              size="sm"
                              onClick={handleSavePS}
                            >
                              Salva registrato
                            </Button>
                          </div>
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
                    {detailsTab === "cards" && (
                      <div className="grid md:grid-cols-12 gap-3 text-sm">
                        <div className="md:col-span-8">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="text-sm font-semibold">Card associate</div>
                          </div>
                          <div className="flex gap-2 mb-3">
                            {cardLoading ? (
                              <div className="text-sm text-default-500">Caricamento card...</div>
                            ) : barCards.length === 0 ? (
                              <div className="text-sm text-default-500">Nessuna card associata</div>
                            ) : (
                              barCards.map((c) => (
                                <Button key={c.id} size="sm" variant={selectedCardId === c.id ? "solid" : "flat"} onClick={() => setSelectedCardId(c.id)}>
                                  {`Card #${c.id} · € ${Number(c.balance ?? 0).toFixed(2)}`}
                                </Button>
                              ))
                            )}
                          </div>

                          <div className="rounded-md border border-default-200 bg-default-50 p-3 mb-3">
                            <div className="text-sm font-semibold">Saldo selezionato</div>
                            <div className="mt-2 text-lg font-semibold">€ {(() => {
                              const sel = barCards.find((b) => b.id === selectedCardId);
                              return sel ? Number(sel.balance ?? 0).toFixed(2) : "0.00";
                            })()}</div>
                          </div>

                          <div className="rounded-md border border-default-200 bg-default-50 p-3 mb-3">
                            <div className="text-sm font-semibold">Movimenti</div>
                            <div className="mt-2 max-h-[260px] overflow-auto">
                              {cardTxLoading ? (
                                <div className="text-sm text-default-500">Caricamento movimenti...</div>
                              ) : cardTransactions.length === 0 ? (
                                <div className="text-sm text-default-500">Nessun movimento</div>
                              ) : (
                                <div className="flex flex-col gap-2">
                                  {cardTransactions.map((tx: any) => (
                                    <div key={tx.id} className="flex items-center justify-between gap-3 px-2 py-2 bg-white border rounded">
                                      <div className="text-sm">
                                        <div className="font-medium">{tx.description || tx.type || `Tx ${tx.id}`}</div>
                                        <div className="text-xs text-default-500">{tx.createdAt ? new Date(tx.createdAt).toLocaleString() : ""}</div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="text-sm">€ {Number(tx.amount ?? 0).toFixed(2)}</div>
                                        <Button size="sm" variant="flat" color="danger" onClick={async () => {
                                          if (!selectedCardId) return;
                                          try {
                                            setCardTxLoading(true);
                                            await fetchWithAuth(`${BASE_URL}/api/bar/cards/${selectedCardId}/transactions/${tx.id}/cancel`, { method: "POST" });
                                            // refresh
                                            const txs = await fetchCardTransactions(selectedCardId);
                                            setCardTransactions(txs || []);
                                            const cards = await fetchBarCards(selectedBooking!.id);
                                            setBarCards(cards || []);
                                            showToast("Movimento cancellato", "success", 2000);
                                          } catch (err) {
                                            showToast((err as Error).message || "Errore cancellazione movimento", "error", 3000);
                                          } finally {
                                            setCardTxLoading(false);
                                          }
                                        }}>Cancella</Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="md:col-span-4">
                          <div className="rounded-md border border-default-200 bg-default-50 p-3 mb-3">
                            <div className="text-sm font-semibold">Ricarica card</div>
                            <div className="mt-3 flex gap-2">
                              <Input label="Importo" type="number" value={rechargeAmount} onChange={(e) => setRechargeAmount((e.target as HTMLInputElement).value)} />
                              <div className="flex flex-col justify-end">
                                <Button color="primary" onClick={async () => {
                                  if (!selectedCardId) return;
                                  const amount = Number(rechargeAmount);
                                  if (!amount || Number.isNaN(amount)) return showToast("Importo non valido", "error", 2000);
                                  try {
                                    setCardLoading(true);
                                    await rechargeCard(selectedCardId, { amount });
                                    const cards = await fetchBarCards(selectedBooking!.id);
                                    setBarCards(cards || []);
                                    const txs = await fetchCardTransactions(selectedCardId);
                                    setCardTransactions(txs || []);
                                    setRechargeAmount("");
                                    showToast("Card ricaricata", "success", 2000);
                                  } catch (err) {
                                    showToast((err as Error).message || "Errore ricarica", "error", 3000);
                                  } finally {
                                    setCardLoading(false);
                                  }
                                }} isDisabled={!selectedCardId || cardLoading}>Ricarica</Button>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-md border border-default-200 bg-default-50 p-3">
                            <div className="text-sm font-semibold">Azioni</div>
                            <div className="mt-3 flex flex-col gap-2">
                              <Button size="sm" variant="flat" color="danger" onClick={async () => {
                                if (!selectedCardId) return;
                                if (!confirm("Confermi la terminazione della card?")) return;
                                try {
                                  setCardLoading(true);
                                  await deleteCard(selectedCardId);
                                  const cards = await fetchBarCards(selectedBooking!.id);
                                  setBarCards(cards || []);
                                  setSelectedCardId(cards && cards.length > 0 ? cards[0].id : null);
                                  showToast("Card terminata", "success", 2000);
                                } catch (err) {
                                  showToast((err as Error).message || "Errore terminazione card", "error", 3000);
                                } finally {
                                  setCardLoading(false);
                                }
                              }} isDisabled={!selectedCardId || cardLoading}>Termina card</Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {detailsTab === "prices" && (
                      <div className="grid gap-4 text-sm">
                        <Input
                          label="Costo prenotazione"
                          type="text"
                          value={editPrice ? `${Number(editPrice).toFixed(2).replace('.', ',')} €` : ''}
                          onChange={(event) => {
                            // Rimuovi simbolo euro e formatta input
                            const val = event.target.value.replace(/[^0-9,]/g, '').replace(',', '.');
                            setEditPrice(val);
                          }}
                        />
                        <div className="rounded-md border border-default-200 p-3">
                          <div className="text-sm font-semibold">Acconti</div>
                          <div className="mt-2 grid gap-3 md:grid-cols-3">
                            <Input
                              label="Importo"
                              type="number"
                              value={depositAmount ? `${Number(depositAmount).toFixed(2).replace('.', ',')} €` : ''}
                              onChange={(event) => {
                                const val = event.target.value.replace(/[^0-9,]/g, '').replace(',', '.');
                                setDepositAmount(val);
                              }}
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
                                    {deposit.paymentMethodName || "Metodo"} · {deposit.amount !== undefined ? `${Number(deposit.amount).toFixed(2).replace('.', ',')} €` : ''}
                                    {deposit.createdAt ? ` · ${new Date(deposit.createdAt).toLocaleDateString('it-IT')}` : ''}
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
          className="fixed z-50 p-0 w-auto"
          style={{ left: contextMenu.x, top: contextMenu.y -20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Dropdown
            className="min-w-[150px] p-2"
            isOpen={true}
            onOpenChange={(open) => {
              if (!open) setContextMenu(null);
            }}
            placement="bottom-start"
          >
            <DropdownTrigger>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                className="h-0 w-0 min-w-0 p-0 opacity-0"
                aria-hidden="true"
              />
            </DropdownTrigger>

            <DropdownMenu
              aria-label={`Menu camera ${contextMenu.room.roomNumber}`}
              className="w-[100%] text-[11px]"
              classNames={{
                base: "p-0",
                list: "p-0",
              }}
              itemClasses={{
                base: "px-1 py-1 min-h-0",
                title: "text-[11px] leading-tight",
              }}
              onAction={(key) => {
                if (key === "insert") handleInsertBookingFromMenu();
                if (key === "chargeExtra") {
                  if (contextMenu?.booking && contextMenu.booking.checkInMeal) {
                    setSelectedBooking(contextMenu.booking);
                    onOpenExtra();
                  }
                }
                if (key === "deleteBooking") setPendingDeleteBooking(contextMenu?.booking ?? null);

                if (key === "deleteCheckin") handleDeleteCheckIn();
                if (key === "checkinBreakfast") handleCheckIn("BREAKFAST");
                if (key === "checkinLunch") handleCheckIn("LUNCH");
                if (key === "checkinDinner") handleCheckIn("DINNER");

                setContextMenu(null);
              }}
            >
              <DropdownSection
                title={`Camera ${contextMenu.room.roomNumber}`}
                classNames={{ heading: "text-[11px] text-default-500"}}
                showDivider
              >
                <DropdownItem key="insert">Inserisci prenotazione</DropdownItem>
                {(contextMenu.booking && contextMenu.booking.checkInMeal) ?  (
                  <DropdownItem key="chargeExtra">Addebita extra</DropdownItem>
                ) : null}
              </DropdownSection>

            {(() => {
              const booking = contextMenu?.booking;
              if (!booking) return null;

              const hasCheckin = booking.checkInMeal;

              return (
                <DropdownSection
                  title="Check-in"
                  showDivider
                  classNames={{ heading: "text-[11px] px-1", base: "px-1" }}
                >
                  {hasCheckin ? (
                    <DropdownItem key="deleteCheckin">
                      Cancella check-in
                    </DropdownItem>
                  ) : (
                    <>
                      <DropdownItem key="checkinBreakfast">Colazione</DropdownItem>
                      <DropdownItem key="checkinLunch">Pranzo</DropdownItem>
                      <DropdownItem key="checkinDinner">Cena</DropdownItem>
                    </>
                  )}
                </DropdownSection>
              );
            })()}

              <DropdownItem key="deleteBooking" className="text-danger">Cancella prenotazione</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      )}

      <Modal
        isOpen={!!pendingDeleteBooking}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteBooking(null);
        }}
        size="sm"
      >
        <ModalContent className="w-[95vw] max-w-[420px]">
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Conferma cancellazione</ModalHeader>
              <ModalBody>
                <div className="text-sm text-default-600">
                  Sei sicuro di voler cancellare la prenotazione per la camera {pendingDeleteBooking?.roomNumber}?
                </div>
              </ModalBody>
              <ModalFooter>
                <Button size="sm" variant="flat" onClick={() => { setPendingDeleteBooking(null); onClose(); }}>
                  Annulla
                </Button>
                <Button
                  size="sm"
                  className="bg-danger-600 text-white"
                  onClick={async () => {
                    if (!pendingDeleteBooking) return;
                    onClose();
                    await handleDeleteBookingDirect(pendingDeleteBooking);
                    setPendingDeleteBooking(null);
                  }}
                >
                  Conferma cancellazione
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      

      <Modal isOpen={receiptModalOpen} onOpenChange={() => setReceiptModalOpen(false)} size="lg">
        <ModalContent className="w-[95vw] max-w-[1400px]">
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Scontrino generico</ModalHeader>
              <ModalBody className="gap-3">
                <Input
                  label="Importo"
                  type="text"
                  value={receiptAmount ? `${Number(receiptAmount).toFixed(2).replace('.', ',')} €` : ''}
                  onChange={(event) => {
                    const val = event.target.value.replace(/[^0-9,]/g, '').replace(',', '.');
                    setReceiptAmount(val);
                  }}
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
                    setPrintPrompt({
                      title: "Scontrino",
                      description: receiptDescription.trim() || undefined,
                      price: Number(receiptAmount),
                      paymentMethodId: receiptPaymentMethodId,
                      cashDepartmentId: receiptCashDepartmentId,
                      booking: null,
                      depositId: null,
                    });
                    setReceiptAmount("");
                    setReceiptPaymentMethodId("");
                    setReceiptCashDepartmentId("");
                    setReceiptDescription("");
                    handlePrintPromptConfirm();
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
        <ModalContent className="w-[95vw] max-w-[1400px]">
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
        <ModalContent className="w-[95vw] max-w-[1400px]">
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Stampare lo scontrino?</ModalHeader>
              <ModalBody>
                <div className="text-sm text-default-600">
                  Vuoi stampare uno scontrino per l'acconto appena inserito?
                </div>
                {printPrompt && (
                  <div className="mt-2 text-base font-semibold text-default-800">
                    Importo: <span className="text-primary-600">€ {Number(printPrompt.amount).toFixed(2)}</span>
                  </div>
                )}
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

      {/* toasts are handled by Hero UI ToastProvider */}

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="3xl">
        <ModalContent className="w-[95vw] max-w-[1400px] max-h-[90vh]">
          <ModalHeader className="flex flex-col gap-1">
            Nuova prenotazione
          </ModalHeader>
          <ModalBody className="gap-4 overflow-auto max-h-[70vh] md:max-h-[75vh] lg:max-h-[80vh]">
            {error && <div className="text-sm text-red-600">{error}</div>}
            <div className="grid gap-4 md:grid-cols-12">
              <div className="md:col-span-8">
                <div className="grid gap-3 md:grid-cols-12">
                  <div className="md:col-span-4">
                    <Input
                      label="Nome"
                      placeholder="Es. Marco"
                      value={guestFirstName}
                      onChange={(e) => setGuestFirstName(e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-4">
                    <Input
                      label="Cognome"
                      placeholder="Es. Bianchi"
                      value={guestLastName}
                      onChange={(e) => setGuestLastName(e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-4">
                    <Input
                      label="Prezzo"
                      type="number"
                      placeholder="0.00"
                      startContent={
                        <div className="pointer-events-none flex items-center">
                            <span className="text-default-400 text-small">€</span>
                        </div>
                      }
                      value={newBookingPrice}
                      onChange={(e) => setNewBookingPrice(e.target.value)}
                    />

                    
                  </div>

                  <div className="md:col-span-3">
                    <Input
                      label="Adulti"
                      type="number"
                      value={adults}
                      onChange={(e) => setAdults(e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <Input
                      label="Bambini"
                      type="number"
                      value={children}
                      onChange={(e) => setChildren(e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <Input
                      label="Infanti"
                      type="number"
                      value={infants}
                      onChange={(e) => setInfants(e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <Select
                      label="Trattamento"
                      selectedKeys={[treatment]}
                      onChange={(e) => setTreatment(e.target.value)}
                    >
                      {TREATMENTS.map((item) => (
                        <SelectItem key={item.key}>{item.label}</SelectItem>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid gap-3 mt-3 md:grid-cols-12">
                  <Input
                    label="Check-in"
                    className="md:col-span-6"
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                  />
                  <Input
                    label="Check-out"
                    className="md:col-span-6"
                    type="date"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                  />
                </div>

                <div className="grid gap-3 mt-3 md:grid-cols-4">
                  <Select
                    label="Agenzia"
                    items={[
                      { key: "none", label: "Nessuna" },
                      ...agencies.map((agency) => ({ key: String(agency.id), label: agency.agencyName })),
                    ]}
                    selectedKeys={selectedAgencyId ? [selectedAgencyId] : ["none"]}
                    onChange={(e) => {
                      const value = e.target.value;
                      const nextValue = value === "none" ? "" : value;
                      setSelectedAgencyId(nextValue);
                      if (!nextValue) {
                        setAgencyReference("");
                        setAgencyBookingDate("");
                      } else {
                        setAgencyBookingDate((prev) => prev || getTodayYmd());
                      }
                    }}
                  >
                    {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
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
                </div>

                <div className="grid gap-3 mt-3 md:grid-cols-12">
                  <Input
                    label="Email"
                    className="md:col-span-3"
                    placeholder="cliente@email.it"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                  />
                  <Input
                    label="Telefono"
                    className="md:col-span-2"
                    placeholder="333 1234567"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                  />
                  <Select
                    label="Stato"
                    className="md:col-span-2"
                    selectedKeys={[status]}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    {STATUSES.map((item) => (
                      <SelectItem key={item.key}>{item.label}</SelectItem>
                    ))}
                  </Select>
                  <Input
                    className="md:col-span-5"
                    label="Note"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="md:col-span-4 flex flex-col">
              

                  {/* Capacity is derived from adults + children (infants excluded) */}

                  {selectedRoom ? (
                    <div className="mb-3 p-2 rounded bg-default-50 text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold">Camera selezionata: <span className="font-bold">{selectedRoom.roomNumber}</span><span className="text-[11px] text-default-500 ml-2">{selectedRoom.roomType}</span></div>
                        <Button
                          color="default"
                          variant="flat"
                          onClick={() => {
                            setRoomNumber("");
                            setRoomQuery("");
                          }}
                          className="text-xs px-2"
                        >
                          Modifica
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(selectedRoom.features || []).map((f) => (
                          <Chip
                            key={f.name}
                            size="sm"
                            className="px-2 py-1 text-xs rounded-full bg-default-100 text-default-700"
                          >
                            {f.name}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  ) : (
                      <div className="rounded-md border border-default-200 bg-default-50 p-3 flex-1 flex flex-col">
                    <div className="mt-3 flex-1 overflow-y-auto max-h-70">
                      <div className="text-sm font-semibold mb-2">Selezione camera</div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {allFeatures.map((feat) => (
                      <Chip
                        key={feat}
                        size="sm"
                        startContent={selectedFeatures.includes(feat) ? (
                          <span className="text-primary-500">
                            <CheckIcon size={14} />
                          </span>
                        ) : undefined}
                        onClick={() => toggleFeature(feat)}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleFeature(feat);
                          }
                        }}
                        className={`cursor-pointer px-2 py-1 text-sm rounded-full transition ${selectedFeatures.includes(feat)
                          ? "bg-primary-100 text-primary-800 border-transparent"
                          : "bg-default-100 text-default-700 hover:bg-default-200"}`}
                      >
                        {feat}
                      </Chip>
                    ))}
                  </div>
                      <div className="flex flex-wrap gap-2">
                        {filteredRooms.length === 0 && (
                          <div className="text-xs text-default-500">Nessuna camera trovata</div>
                        )}
                        {filteredRooms.map((r) => (
                          <Chip
                            key={r.roomNumber}
                            size="sm"
                            startContent={
                              String(roomNumber) === String(r.roomNumber) ? (
                                <span className="text-emerald-500">
                                  <CheckIcon size={16} />
                                </span>
                              ) : undefined
                            }
                            onClick={() => {
                              setRoomNumber(String(r.roomNumber));
                              setRoomQuery("");
                            }}
                            className={`inline-flex cursor-pointer items-center gap-2 px-2 py-1 text-sm rounded-full transition whitespace-nowrap ${
                              String(roomNumber) === String(r.roomNumber)
                                ? "bg-emerald-100 text-emerald-800 border-transparent"
                                : "bg-default-100 text-default-700 hover:bg-default-200"
                            }`}
                          >
                            <span className="font-semibold">{r.roomNumber}</span>
                            <span>  </span>
                            <span className="text-[11px] text-default-500">{r.roomType}</span>
                          </Chip>
                        ))}
                      </div>
                    </div></div>
                  )}
              </div>
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
