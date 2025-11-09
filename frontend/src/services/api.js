const API_URL = "http://localhost:3001";

export async function api(path, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  let data;
  try { data = await response.json(); } catch { data = null; }

  return {
    ok: response.ok,
    status: response.status,
    data
  };
}
