const API = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
export function getToken() { return localStorage.getItem("dk_token"); }
export async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Permintaan gagal.");
  return data;
}
export function saveSession(data) {
  localStorage.setItem("dk_token", data.token);
  localStorage.setItem("dk_user", JSON.stringify(data.user));
}
export function clearSession() {
  localStorage.removeItem("dk_token");
  localStorage.removeItem("dk_user");
}
export function getUser() {
  try { return JSON.parse(localStorage.getItem("dk_user") || "null"); } catch { return null; }
}
