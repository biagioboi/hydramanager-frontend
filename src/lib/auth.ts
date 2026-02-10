export type LoginResponse = {
  token: string;
  role?: string;
  [k: string]: any;
};

export async function login(
  username: string,
  password: string,
  baseUrl = (import.meta.env.VITE_API_BASE_URL as string) ||
    "http://localhost:8080",
): Promise<LoginResponse> {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const text = await res.text();

  try {
    const json = text ? JSON.parse(text) : {};

    if (!res.ok)
      throw new Error(json.message || res.statusText || text || "Login failed");

    return json as LoginResponse;
  } catch (err) {
    if (!res.ok) throw err;

    // if response isn't json but OK, return empty object
    return {} as LoginResponse;
  }
}
