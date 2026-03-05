import { fetchWithAuth } from "./auth";
// API helpers per categorie piatti

export async function fetchCategories(
  baseUrl = (import.meta.env.VITE_API_BASE_URL as string) ||
    "http://localhost:8080",
) {
  const res = await fetchWithAuth(`${baseUrl}/api/menu/categories`);
  if (!res.ok) throw new Error("Errore caricamento categorie");
  return await res.json();
}

export async function createCategory(
  name: string,
  baseUrl = (import.meta.env.VITE_API_BASE_URL as string) ||
    "http://localhost:8080",
) {
  const res = await fetchWithAuth(`${baseUrl}/api/menu/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error("Errore creazione categoria");
  return await res.json();
}

export async function deleteCategory(
  id: number | string,
  baseUrl = (import.meta.env.VITE_API_BASE_URL as string) ||
    "http://localhost:8080",
) {
  const res = await fetchWithAuth(`${baseUrl}/api/menu/categories/${id}`, {
    method: "DELETE"
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore cancellazione categoria");
  }
  try {
    return await res.json();
  } catch {
    return {};
  }
}

// Dishes API
export type Dish = {
  id: number;
  name: string;
  nameEn?: string;
  categoryId?: number;
  categoryName?: string;
  ingredients?: string[];
};

export async function fetchDishes(
  baseUrl = (import.meta.env.VITE_API_BASE_URL as string) ||
    "http://localhost:8080",
) {
  const res = await fetchWithAuth(`${baseUrl}/api/menu/dishes`);
  if (!res.ok) throw new Error("Errore caricamento piatti");
  return (await res.json()) as Dish[];
}

export async function createDish(
  payload: {
    name: string;
    nameEn?: string;
    categoryId?: number;
    ingredients?: string[];
  },
  baseUrl = (import.meta.env.VITE_API_BASE_URL as string) ||
    "http://localhost:8080",
) {
  const res = await fetchWithAuth(`${baseUrl}/api/menu/dishes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore creazione piatto");
  }
  return (await res.json()) as Dish;
}

export async function deleteDish(
  id: number | string,
  baseUrl = (import.meta.env.VITE_API_BASE_URL as string) ||
    "http://localhost:8080",
) {
  const res = await fetchWithAuth(`${baseUrl}/api/menu/dishes/${id}`, {
    method: "DELETE"
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore cancellazione piatto");
  }
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export async function updateDish(
  id: number | string,
  payload: Partial<{
    name: string;
    nameEn?: string;
    categoryId?: number;
    ingredients?: string[];
  }>,
  baseUrl = (import.meta.env.VITE_API_BASE_URL as string) ||
    "http://localhost:8080",
) {
  const res = await fetchWithAuth(`${baseUrl}/api/menu/dishes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore aggiornamento piatto");
  }
  return (await res.json()) as Dish;
}

// Daily menu API
export type DailyMenu = {
  id: number;
  date: string;
  service: string;
  items?: Array<{
    itemId?: number;
    position?: number;
    dishId: number;
    dishName?: string;
    categoryName?: string;
    note?: string | null;
  }>;
};

export async function createDailyMenu(
  payload: { date: string; service: string },
  baseUrl = (import.meta.env.VITE_API_BASE_URL as string) ||
    "http://localhost:8080",
) {
  const res = await fetchWithAuth(`${baseUrl}/api/menu/daily`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore creazione menu giornaliero");
  }
  return (await res.json()) as DailyMenu;
}

export async function fetchDailyMenu(
  date: string,
  serviceType: string,
  baseUrl = (import.meta.env.VITE_API_BASE_URL as string) ||
    "http://localhost:8080",
) {
  const url = new URL(`${baseUrl}/api/menu/daily`);
  url.searchParams.set("date", date);
  url.searchParams.set("serviceType", serviceType);
  const res = await fetchWithAuth(url.toString());
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore caricamento menu giornaliero");
  }
  return (await res.json()) as DailyMenu;
}

export async function updateDailyMenuItems(
  dailyId: number | string,
  itemsPayload: Array<{
    dishId: number;
    position?: number;
    note?: string | null;
  }>,
  baseUrl = (import.meta.env.VITE_API_BASE_URL as string) ||
    "http://localhost:8080",
) {
  const res = await fetchWithAuth(`${baseUrl}/api/menu/daily/${dailyId}/items`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: itemsPayload }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore aggiornamento items menu");
  }
  return (await res.json()) as DailyMenu;
}

export async function updateDailyMenuVisibility(
  dailyId: number | string,
  isPublic: boolean,
  baseUrl = (import.meta.env.VITE_API_BASE_URL as string) ||
    "http://localhost:8080",
) {
  const res = await fetchWithAuth(`${baseUrl}/api/menu/daily/${dailyId}/public`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isPublic }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore aggiornamento visibilità menu");
  }
  try {
    return (await res.json()) as DailyMenu;
  } catch {
    return {} as DailyMenu;
  }
}

