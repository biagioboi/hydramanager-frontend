export type StoreApi = {
  id: number;
  name: string;
};

export type ExtraCategoryApi = {
  id: number;
  name: string;
};

export type ExtraProductApi = {
  id: number;
  name: string;
  price: number;
  stockQuantity: number;
  categoryId?: number;
  categoryName?: string;
};

export type StoreProductApi = {
  id: number;
  storeId: number;
  storeName?: string;
  productId: number;
  productName?: string;
  quantity: number;
};

export type ExtraCartApi = {
  id: number;
  createdAt?: string;
};

export type ExtraCartItemApi = {
  id: number;
  cartId: number;
  storeId: number;
  storeName?: string;
  productId: number;
  productName?: string;
  quantity: number;
};

const defaultBaseUrl =
  (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:8080";

const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function fetchStores(baseUrl = defaultBaseUrl) {
  const res = await fetch(`${baseUrl}/api/extra/stores`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore caricamento shop");
  }
  return (await res.json()) as StoreApi[];
}

export async function createStore(
  payload: { name: string },
  baseUrl = defaultBaseUrl,
) {
  const res = await fetch(`${baseUrl}/api/extra/stores`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore creazione shop");
  }
  return (await res.json()) as StoreApi;
}

export async function updateStore(
  id: number | string,
  payload: { name: string },
  baseUrl = defaultBaseUrl,
) {
  const res = await fetch(`${baseUrl}/api/extra/stores/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore aggiornamento shop");
  }
  return (await res.json()) as StoreApi;
}

export async function deleteStore(
  id: number | string,
  baseUrl = defaultBaseUrl,
) {
  const res = await fetch(`${baseUrl}/api/extra/stores/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore cancellazione shop");
  }
  return {} as StoreApi;
}

export async function fetchCategories(baseUrl = defaultBaseUrl) {
  const res = await fetch(`${baseUrl}/api/extra/categories`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore caricamento categorie");
  }
  return (await res.json()) as ExtraCategoryApi[];
}

export async function createCategory(
  payload: { name: string },
  baseUrl = defaultBaseUrl,
) {
  const res = await fetch(`${baseUrl}/api/extra/categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore creazione categoria");
  }
  return (await res.json()) as ExtraCategoryApi;
}

export async function updateCategory(
  id: number | string,
  payload: { name: string },
  baseUrl = defaultBaseUrl,
) {
  const res = await fetch(`${baseUrl}/api/extra/categories/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore aggiornamento categoria");
  }
  return (await res.json()) as ExtraCategoryApi;
}

export async function deleteCategory(
  id: number | string,
  baseUrl = defaultBaseUrl,
) {
  const res = await fetch(`${baseUrl}/api/extra/categories/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore cancellazione categoria");
  }
  return {} as ExtraCategoryApi;
}

export async function fetchProducts(
  params?: { categoryId?: number; q?: string },
  baseUrl = defaultBaseUrl,
) {
  const query = new URLSearchParams();
  if (params?.categoryId) query.set("categoryId", String(params.categoryId));
  if (params?.q) query.set("q", params.q);
  const url = query.toString()
    ? `${baseUrl}/api/extra/products?${query.toString()}`
    : `${baseUrl}/api/extra/products`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore caricamento prodotti");
  }
  return (await res.json()) as ExtraProductApi[];
}

export async function createProduct(
  payload: { name: string; price: number; stockQuantity: number; categoryId?: number },
  baseUrl = defaultBaseUrl,
) {
  const res = await fetch(`${baseUrl}/api/extra/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore creazione prodotto");
  }
  return (await res.json()) as ExtraProductApi;
}

export async function updateProduct(
  id: number | string,
  payload: { name: string; price: number; stockQuantity: number; categoryId?: number },
  baseUrl = defaultBaseUrl,
) {
  const res = await fetch(`${baseUrl}/api/extra/products/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore aggiornamento prodotto");
  }
  return (await res.json()) as ExtraProductApi;
}

export async function deleteProduct(
  id: number | string,
  baseUrl = defaultBaseUrl,
) {
  const res = await fetch(`${baseUrl}/api/extra/products/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore cancellazione prodotto");
  }
  return {} as ExtraProductApi;
}

export async function fetchStoreProducts(
  storeId?: number | string,
  baseUrl = defaultBaseUrl,
) {
  const query = storeId ? `?storeId=${encodeURIComponent(String(storeId))}` : "";
  const res = await fetch(`${baseUrl}/api/extra/store-products${query}`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore caricamento prodotti shop");
  }
  return (await res.json()) as StoreProductApi[];
}

export async function createStoreProduct(
  payload: { storeId: number; productId: number; quantity: number },
  baseUrl = defaultBaseUrl,
) {
  const res = await fetch(`${baseUrl}/api/extra/store-products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore associazione prodotto");
  }
  return (await res.json()) as StoreProductApi;
}

export async function updateStoreProduct(
  id: number | string,
  payload: { quantity: number },
  baseUrl = defaultBaseUrl,
) {
  const res = await fetch(`${baseUrl}/api/extra/store-products/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore aggiornamento quantità");
  }
  return (await res.json()) as StoreProductApi;
}

export async function deleteStoreProduct(
  id: number | string,
  baseUrl = defaultBaseUrl,
) {
  const res = await fetch(`${baseUrl}/api/extra/store-products/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore rimozione prodotto shop");
  }
  return {} as StoreProductApi;
}

export async function createExtraCart(baseUrl = defaultBaseUrl) {
  const res = await fetch(`${baseUrl}/api/extra/carts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore creazione carrello");
  }
  return (await res.json()) as ExtraCartApi;
}

export async function fetchExtraCartItems(
  cartId: number | string,
  baseUrl = defaultBaseUrl,
) {
  const res = await fetch(`${baseUrl}/api/extra/carts/${cartId}/items`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore caricamento carrello");
  }
  return (await res.json()) as ExtraCartItemApi[];
}

export async function addExtraCartItem(
  cartId: number | string,
  payload: { storeProductId: number; quantity: number },
  baseUrl = defaultBaseUrl,
) {
  const res = await fetch(`${baseUrl}/api/extra/carts/${cartId}/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore aggiunta prodotto al carrello");
  }
  return (await res.json()) as ExtraCartItemApi;
}

export async function chargeExtraCart(
  cartId: number | string,
  payload: { cardId: number },
  baseUrl = defaultBaseUrl,
) {
  const res = await fetch(`${baseUrl}/api/extra/carts/${cartId}/charge`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore addebito carrello");
  }
  return (await res.json()) as ExtraCartApi;
}
