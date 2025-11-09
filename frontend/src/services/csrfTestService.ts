import { api } from './api';

class CsrfTestService {
  private readonly endpoints = {
    me: '/auth/me',
    blockUser: (userId: number) => `/users/${userId}/block`
  };
  // Get user information endpoint test
  async getMeInfo(includeToken = true) {
    if (includeToken) {
      return await api(this.endpoints.me, { method: "GET" })
    } 
    
    // Direct fetch simulation without token
    const raw = await fetch(`${api}${this.endpoints.me}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });
    
    
    let data;
    try { 
      data = await raw.json(); 
    } catch { 
      data = null; 
    }
    return { ok: raw.ok, status: raw.status, data };
    
  }

  // Block user endpoint test
  async blockUser(userId: number, useDirectFetch = false) {
    if (!userId) {
      return { ok: false, message: "Informe um userId" };
    }

    if (useDirectFetch) {
      const url = `${api}${this.endpoints.blockUser(userId)}`;
      const raw = await fetch(url, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" } 
      });
      
      let data;
      try { 
        data = await raw.json(); 
      } catch { 
        data = null; 
      }
      
      return { ok: raw.ok, status: raw.status, data };
    } 
    
    return await api(this.endpoints.blockUser(userId), { method: "POST" });
  }
}

export const csrfTestService = new CsrfTestService();;