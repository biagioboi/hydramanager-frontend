export type RoomApi = {
  id: number;
  roomNumber: string;
  capacity: number;
  roomType: string;
  description?: string | null;
};

export type BookingApi = {
  id: number;
  roomNumber: string;
  guestUsername?: string;
  guestFullName?: string;
  guestFirstName?: string;
  guestLastName?: string;
  checkInMeal?: "BREAKFAST" | "LUNCH" | "DINNER" | null;
  adults: number;
  children: number;
  infants: number;
  checkInDate: string;
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

export type UserResponse = {
  id: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  phoneNumber?: string;
};

const defaultBaseUrl =
  (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:8080";

export async function fetchRooms(baseUrl = defaultBaseUrl) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${baseUrl}/api/rooms`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

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
    children: number;
    infants: number;
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
