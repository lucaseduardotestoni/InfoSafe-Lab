import { api } from "../services/api";

export async function loginService(email: string, password: string) {
  return api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function registerService(name: string, email: string, password: string) {
  return api("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}
