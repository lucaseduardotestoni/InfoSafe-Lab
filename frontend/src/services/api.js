const API_URL = "http://localhost:3001";

export async function api(path, options = {}) {
  const token = localStorage.getItem("token");

  // Se o corpo da requisição for FormData, não definir Content-Type (o browser faz isso com boundary)
  const isFormData = options && options.body && typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  let data;
  try { data = await response.json(); } catch { data = null; }

  // Verifica se é resposta de conta bloqueada
  if (response.status === 403 && data?.code === "ACCOUNT_LOCKED") {
    // Limpa o token e força logout
    localStorage.removeItem("token");
    window.location.href = "/auth?message=" + encodeURIComponent(data.message);
  }

  return {
    ok: response.ok,
    status: response.status,
    data
  };
}
