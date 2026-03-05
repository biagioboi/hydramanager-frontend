

export async function fetchBookingsByDate(date: string, baseUrl = defaultBaseUrl) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${baseUrl}/api/bookings/by-date?date=${encodeURIComponent(date)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore caricamento prenotazioni per data");
  }
  return (await res.json()) as BookingApi[];
}
import { fetchWithAuth } from "./auth";
export type RoomApi = {
  id: number;
  roomNumber: string;
  capacity: number;
  roomType: string;
  description?: string | null;
  features?: RoomFeatureApi[];
};

export type RoomFeatureApi = {
  id: number;
  name: string;
};

export type BookingApi = {
  id: number;
  roomNumber: string;
  userId: number;
  guestEmail?: string;
  guestPhoneNumber?: string;
  guestFullName?: string;
  guestFirstName?: string;
  guestLastName?: string;
  cardId?: number | null;
  checkInMeal?: "BREAKFAST" | "LUNCH" | "DINNER" | null;
  adults: number;
  children: number;
  infants: number;
  checkInDate: string;
  agencyReference?: string | null;
  agencyBookingDate?: string | null;
  agencyId?: number | null;
  checkOutDate: string;
  price?: number | null;
  treatment: "ROOM_BREAKFAST" | "HALF_BOARD" | "FULL_BOARD";
  notes?: string | null;
  status: "INSERTED" | "CONFIRMED" | "ARRIVED" | "CANCELLED" | "DEPARTED";
  tableNumber?: string | null;
};

export type PaymentMethodApi = {
  id: number;
  name: string;
  cashRegisterCode?: string | null;
};

export type CashDepartmentApi = {
  id: number;
  name: string;
  code: string;
};

export type NotificationApi = {
  id: number;
  message: string;
  bookingId?: number | null;
  // Supporta sia lowercase che uppercase inviati dal server
  type?: "warning" | "error" | "success" | "WARNING" | "ERROR" | "SUCCESS" | null;
  targetRole?: string | null;
  status?: "SENT" | "READ" | "DELETED";
  createdAt?: string | null;
  readAt?: string | null;
};

export type DepositApi = {
  id: number;
  amount: number;
  paymentMethodId: number;
  paymentMethodName?: string | null;
  paymentMethodCashRegisterCode?: string | null;
  notes?: string | null;
  bookingId: number;
};

export type GuestApi = {
  id: number;
  firstName: string;
  lastName: string;
  email?: string | null;
};

export type AgencyApi = {
  id: number;
  agencyName: string;
};

export type AgencyTokenApi = {
  id: number;
  agencyId: number;
  token: string;
  revoked?: boolean;
  createdAt?: string;
  expiresAt?: string | null;
};

export type UserResponse = {
  id: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  phoneNumber?: string;
};

export type RegisterResponse = {
  id: number;
  username?: string;
  email?: string;
};

export type BarCardApi = {
  id: number;
  bookingId: number;
  userId?: number,
  username?: string;
  balance: number;
  createdAt?: string | null;
};

export async function fetchBarCards(bookingId?: number, baseUrl = defaultBaseUrl) {
  const token = localStorage.getItem("authToken");
  const query = bookingId ? `/by-booking/${encodeURIComponent(String(bookingId))}` : "";
  const res = await fetch(`${baseUrl}/api/bar/cards${query}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore caricamento card");
  }
  return (await res.json()) as BarCardApi[];
}

export async function fetchBarCard(id: number | string, baseUrl = defaultBaseUrl) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${baseUrl}/api/bar/cards/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore caricamento card");
  }
  return (await res.json()) as BarCardApi;
}


// Placeholder: cerca una card tramite hash (se l'API non è presente restituisce null)
export async function fetchCardByHash(hash: string, baseUrl = defaultBaseUrl) {
  try {
    const token = localStorage.getItem("authToken");
    const res = await fetch(`${baseUrl}/api/bar/cards/search?hash=${encodeURIComponent(hash)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return null as any;
    return (await res.json()) as BarCardApi | null;
  } catch {
    return null as any;
  }
}

// Placeholder: transazioni associate a una card (restituisce array vuoto se l'endpoint non esiste)
export async function fetchCardTransactions(cardId: number | string, baseUrl = defaultBaseUrl) {
  try {
    const token = localStorage.getItem("authToken");
    const res = await fetch(`${baseUrl}/api/bar/cards/${cardId}/transactions`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return [] as any[];
    return (await res.json()) as any[];
  } catch {
    return [] as any[];
  }
}

export async function updatePsGuest(psId: string | number, data: any) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${defaultBaseUrl}/api/ps/${psId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function deletePsGuest(psId: string | number) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${defaultBaseUrl}/api/ps/${psId}`, { 
    method: "DELETE", 
    headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) throw new Error(await res.text());
  return true;
}

export async function fetchPsGuestsByBooking(bookingId: number) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${defaultBaseUrl}/api/ps/by-booking/${bookingId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function sendPsRegistration(bookingId: number, body: any) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${defaultBaseUrl}/api/ps/by-booking/${bookingId}`, {
    headers: token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" },
    method: "POST",
    body: JSON.stringify(body),
  });
  return res;
}

// Placeholder: ricarica la card (se l'endpoint non esiste lancia un errore)
export async function rechargeCard(
  cardId: number | string,
  payload: { amount: number },
  baseUrl = defaultBaseUrl,
) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${baseUrl}/api/bar/cards/${cardId}/topup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore ricarica card");
  }
  return (await res.json()) as any;
}

// Placeholder: elimina la card (se l'endpoint non esiste lancia un errore)
export async function deleteCard(id: number | string, baseUrl = defaultBaseUrl) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${baseUrl}/api/bar/cards/${id}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore cancellazione card");
  }
  return {};
}


const defaultBaseUrl =
  (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:8080";

export async function fetchRooms(baseUrl = defaultBaseUrl) {
  const res = await fetchWithAuth(`${baseUrl}/api/rooms`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore caricamento camere");
  }
  return (await res.json()) as RoomApi[];
}

export async function createRoom(
  payload: {
    roomNumber: string;
    capacity: number;
    roomType: string;
    description?: string | null;
    featureIds?: number[];
  },
  baseUrl = defaultBaseUrl,
) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${baseUrl}/api/rooms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore creazione camera");
  }

  return (await res.json()) as RoomApi;
}

export async function updateRoom(
  id: number | string,
  payload: {
    roomNumber?: string;
    capacity: number;
    roomType: string;
    description?: string | null;
    featureIds?: number[];
  },
  baseUrl = defaultBaseUrl,
) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${baseUrl}/api/rooms/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore aggiornamento camera");
  }

  return (await res.json()) as RoomApi;
}

export async function deleteRoom(
  id: number | string,
  baseUrl = defaultBaseUrl,
) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${baseUrl}/api/rooms/${id}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore cancellazione camera");
  }

  return {};
}

export async function fetchRoomFeatures(baseUrl = defaultBaseUrl) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${baseUrl}/api/room-features`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore caricamento servizi camera");
  }

  return (await res.json()) as RoomFeatureApi[];
}

export async function createRoomFeature(
  payload: { name: string },
  baseUrl = defaultBaseUrl,
) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${baseUrl}/api/room-features`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore creazione servizio camera");
  }

  return (await res.json()) as RoomFeatureApi;
}

export async function updateRoomFeature(
  id: number | string,
  payload: { name: string },
  baseUrl = defaultBaseUrl,
) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${baseUrl}/api/room-features/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore aggiornamento servizio camera");
  }

  return (await res.json()) as RoomFeatureApi;
}

export async function deleteRoomFeature(
  id: number | string,
  baseUrl = defaultBaseUrl,
) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${baseUrl}/api/room-features/${id}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore cancellazione servizio camera");
  }

  return {} as RoomFeatureApi;
}

export async function fetchBookings(baseUrl = defaultBaseUrl) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${baseUrl}/api/bookings`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore caricamento prenotazioni");
  }

  return (await res.json()) as BookingApi[];
}

export async function fetchBooking(id: number | string, baseUrl = defaultBaseUrl) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${baseUrl}/api/bookings/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore caricamento prenotazione");
  }
  return (await res.json()) as BookingApi;
}

export async function fetchAgencyTokens(
  agencyId?: number | string,
  baseUrl = defaultBaseUrl,
) {
  const token = localStorage.getItem("authToken");
  const query = agencyId ? `?agencyId=${encodeURIComponent(String(agencyId))}` : "";
  const res = await fetch(`${baseUrl}/api/agencies/tokens${query}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore caricamento token agenzie");
  }

  return (await res.json()) as AgencyTokenApi[];
}

export async function createAgencyToken(
  agencyId: number | string,
  baseUrl = defaultBaseUrl,
) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${baseUrl}/api/agencies/${agencyId}/token`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore creazione token agenzia");
  }

  return (await res.json()) as AgencyTokenApi;
}

export async function deleteAgencyToken(
  id: number | string,
  baseUrl = defaultBaseUrl,
) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${baseUrl}/api/agencies/token/${id}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore cancellazione token agenzia");
  }

  return {} as AgencyTokenApi;
}

export async function fetchPaymentMethods(baseUrl = defaultBaseUrl) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${baseUrl}/api/payment-methods`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore caricamento metodi di pagamento");
  }

  return (await res.json()) as PaymentMethodApi[];
}

export async function createPaymentMethod(
  payload: {
    name: string;
    cashRegisterCode?: string | null;
  },
  baseUrl = defaultBaseUrl,
) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${baseUrl}/api/payment-methods`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore creazione metodo pagamento");
  }

  return (await res.json()) as PaymentMethodApi;
}

export async function updatePaymentMethod(
  id: number | string,
  payload: {
    name: string;
    cashRegisterCode?: string | null;
  },
  baseUrl = defaultBaseUrl,
) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${baseUrl}/api/payment-methods/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore aggiornamento metodo pagamento");
  }

  return (await res.json()) as PaymentMethodApi;
}

export async function deletePaymentMethod(
  id: number | string,
  baseUrl = defaultBaseUrl,
) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${baseUrl}/api/payment-methods/${id}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore cancellazione metodo pagamento");
  }

  return {};
}

export async function fetchCashDepartments(baseUrl = defaultBaseUrl) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${baseUrl}/api/cash-departments`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore caricamento reparti cassa");
  }

  return (await res.json()) as CashDepartmentApi[];
}

export async function fetchNotifications(
  params?: { targetRole?: string; status?: string; includeDeleted?: boolean },
  baseUrl = defaultBaseUrl,
) {
  const token = localStorage.getItem("authToken");
  const query = new URLSearchParams();
  if (params?.targetRole) query.set("targetRole", params.targetRole);
  if (params?.status) query.set("status", params.status);
  if (params?.includeDeleted !== undefined) {
    query.set("includeDeleted", String(params.includeDeleted));
  }
  const url = query.toString()
    ? `${baseUrl}/api/notifications?${query.toString()}`
    : `${baseUrl}/api/notifications`;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore caricamento notifiche");
  }

  return (await res.json()) as NotificationApi[];
}

export async function markNotificationRead(
  id: number | string,
  baseUrl = defaultBaseUrl,
) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${baseUrl}/api/notifications/${id}/read`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore aggiornamento notifica");
  }

  return (await res.json()) as NotificationApi;
}

export async function createCashDepartment(
  payload: { name: string; code: string },
  baseUrl = defaultBaseUrl,
) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${baseUrl}/api/cash-departments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore creazione reparto cassa");
  }

  return (await res.json()) as CashDepartmentApi;
}

export async function updateCashDepartment(
  id: number | string,
  payload: { name: string; code: string },
  baseUrl = defaultBaseUrl,
) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${baseUrl}/api/cash-departments/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore aggiornamento reparto cassa");
  }

  return (await res.json()) as CashDepartmentApi;
}

export async function deleteCashDepartment(
  id: number | string,
  baseUrl = defaultBaseUrl,
) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${baseUrl}/api/cash-departments/${id}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore cancellazione reparto cassa");
  }

  return {};
}

export async function fetchDeposits(baseUrl = defaultBaseUrl) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${baseUrl}/api/deposits`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore caricamento acconti");
  }

  return (await res.json()) as DepositApi[];
}


export async function fetchDepositByBookingId(bookingId: number | string, baseUrl = defaultBaseUrl) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${baseUrl}/api/deposits/by-booking/${bookingId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore caricamento acconti");
  }

  return (await res.json()) as DepositApi[];
}

export async function createDeposit(
  payload: {
    amount: number;
    paymentMethodId: number;
    notes?: string | null;
    bookingId: number;
  },
  baseUrl = defaultBaseUrl,
) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${baseUrl}/api/deposits`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore inserimento acconto");
  }

  return (await res.json()) as DepositApi;
}

export async function createBooking(
  payload: {
    roomNumber: string;
    userId: number;
    agencyId?: number;
    agencyReference?: string | null;
    agencyBookingDate?: string | null;
    adults: number;
    children: number;
    infants: number;
    price?: number | null;
    checkInDate: string;
    checkOutDate: string;
    treatment: "ROOM_BREAKFAST" | "HALF_BOARD" | "FULL_BOARD";
    notes?: string | null;
    status: "INSERTED" | "CONFIRMED" | "ARRIVED" | "CANCELLED" | "DEPARTED";
  },
  baseUrl = defaultBaseUrl,
) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${baseUrl}/api/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore creazione prenotazione");
  }

  return (await res.json()) as BookingApi;
}

export async function fetchAgencies(baseUrl = defaultBaseUrl) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${baseUrl}/api/agencies`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore caricamento agenzie");
  }

  return (await res.json()) as AgencyApi[];
}

export async function createAgency(
  payload: { agencyName: string },
  baseUrl = defaultBaseUrl,
) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${baseUrl}/api/agencies`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore creazione agenzia");
  }

  return (await res.json()) as AgencyApi;
}

export async function updateAgency(
  id: number | string,
  payload: { agencyName: string },
  baseUrl = defaultBaseUrl,
) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${baseUrl}/api/agencies/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore aggiornamento agenzia");
  }

  return (await res.json()) as AgencyApi;
}

export async function deleteAgency(
  id: number | string,
  baseUrl = defaultBaseUrl,
) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${baseUrl}/api/agencies/${id}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore cancellazione agenzia");
  }

  try {
    return (await res.json()) as AgencyApi;
  } catch {
    return {} as AgencyApi;
  }
}

export async function createGuest(
  payload: {
    firstName: string;
    lastName: string;
    email?: string | null;
  },
  baseUrl = defaultBaseUrl,
) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${baseUrl}/api/auth/register/guest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore creazione cliente");
  }

  return (await res.json()) as GuestApi;
}

export async function registerStaff(
  payload: {
    firstName: string;
    lastName: string;
    username?: string;
    email: string;
    password: string;
    role: string;
  },
  baseUrl = defaultBaseUrl,
) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${baseUrl}/api/auth/register/staff`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore creazione staff");
  }

  return (await res.json()) as RegisterResponse;
}

export async function searchUserByEmail(
  email: string,
  baseUrl = defaultBaseUrl,
) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${baseUrl}/api/users/search?email=${encodeURIComponent(email)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore ricerca utente");
  }

  return (await res.json()) as UserResponse;
}

export async function fetchStaff(baseUrl = defaultBaseUrl) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${baseUrl}/api/users/staff`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore caricamento staff");
  }

  return (await res.json()) as UserResponse[];
}

export async function deleteUser(id: number | string, baseUrl = defaultBaseUrl) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${baseUrl}/api/users/${id}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore cancellazione utente");
  }

  return {};
}

export async function deleteBooking(
  id: number | string,
  baseUrl = defaultBaseUrl,
) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${baseUrl}/api/bookings/${id}`,
    {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore cancellazione prenotazione");
  }

  return {};
}

export async function updateBooking(
  id: number | string,
  payload: Partial<{
    roomNumber: string;
    adults: number;
    firstName: string;
    lastName: string;
    email?: string | null;
    phoneNumber?: string | null;
    children: number;
    infants: number;
    userId: number;
    agencyId?: number;
    agencyReference?: string | null;
    agencyBookingDate?: string | null;
    checkInDate: string;
    checkOutDate: string;
    price?: number | null;
    treatment: "ROOM_BREAKFAST" | "HALF_BOARD" | "FULL_BOARD";
    notes?: string | null;
    status: "INSERTED" | "CONFIRMED" | "ARRIVED" | "CANCELLED" | "DEPARTED";
  }>,
  baseUrl = defaultBaseUrl,
) {
  const token = localStorage.getItem("authToken");

  const res2 = await fetch(`${baseUrl}/api/users/guest/${payload.userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const res = await fetch(`${baseUrl}/api/bookings/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });


  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore aggiornamento prenotazione");
  }

  return (await res.json()) as BookingApi;
}

export async function checkInBooking(
  id: number | string,
  payload: { meal: "BREAKFAST" | "LUNCH" | "DINNER" },
  baseUrl = defaultBaseUrl,
) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${baseUrl}/api/bookings/${id}/checkin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore check-in prenotazione");
  }

  return (await res.json()) as BookingApi;
}

export async function deleteCheckInBooking(
  id: number | string,
  baseUrl = defaultBaseUrl,
) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${baseUrl}/api/bookings/${id}/checkin`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore cancellazione check-in");
  }

  return (await res.json()) as BookingApi;
}
