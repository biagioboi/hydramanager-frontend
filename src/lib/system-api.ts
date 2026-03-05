// API per la gestione dei file PS
import { fetchWithAuth } from "./auth";

const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:8080";

export async function fetchPSFile(type) {
  let endpoint = "";
  switch (type) {
    case "states":
      endpoint = "/api/common/stati";
      break;
    case "municipalities":
      endpoint = "/api/common/comuni";
      break;
    case "documents":
      endpoint = "/api/common/documenti";
      break;
    case "family-types":
      endpoint = "/api/common/tipo-alloggiato";
      break;
    default:
      throw new Error("Tipo non valido");
  }
  const res = await fetchWithAuth(BASE_URL + endpoint);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore caricamento file PS");
  }
  return await res.json();
}

export async function uploadPSFile(type, file) {
  let endpoint = "";
  switch (type) {
    case "states":
      endpoint = "/api/common/import/stati";
      break;
    case "municipalities":
      endpoint = "/api/common/import/comuni";
      break;
    case "documents":
      endpoint = "/api/common/import/documenti";
      break;
    case "family-types":
      endpoint = "/api/common/import/tipo-alloggiato";
      break;
    default:
      throw new Error("Tipo non valido");
  }
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(BASE_URL + endpoint, {
    method: "POST",
    body: formData,
    headers: {
      // Authorization header se necessario
      ...(localStorage.getItem("authToken")
        ? { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
        : {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore upload file PS");
  }
  return await res.json();
}
