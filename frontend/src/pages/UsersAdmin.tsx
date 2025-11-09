// src/pages/admin/UsersAdmin.jsx
import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { api } from "../services/api";

const UsersAdmin = () => {
  const [users, setUsers] = useState([]);

  useEffect(()=> { load(); }, []);

  async function load() {
    const res = await api("/users");
    if (res.ok) setUsers(res.data || []);
  }

  async function toggleLock(user) {
    const res = await api(`/users/${user.id}`, {
      method: "PATCH",
      body: JSON.stringify({ isLocked: !user.isLocked })
    });
    if (res.ok) load();
  }

  async function removeUser(userId) {
    if (!confirm("Remover usuário?")) return;
    const res = await api(`/users/${userId}`, { method: "DELETE" });
    if (res.ok) load();
  }

  async function changeRole(userId, role) {
    const res = await api(`/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ role })
    });
    if (res.ok) load();
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-semibold mb-4">Gerenciar Usuários</h1>
        <div className="bg-white rounded shadow">
          {users.map(u => (
            <div key={u.id} className="p-4 flex justify-between items-center border-b">
              <div>
                <div className="font-medium">{u.name} <span className="text-sm text-gray-500">({u.email})</span></div>
                <div className="text-xs text-gray-400">Role: {u.role} — Status: {u.isLocked ? "Bloqueado" : "Ativo"}</div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => toggleLock(u)} className="px-3 py-1 border rounded">
                  {u.isLocked ? "Desbloquear" : "Bloquear"}
                </button>
                <select value={u.role} onChange={(e)=>changeRole(u.id, e.target.value)} className="p-1 border rounded">
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
                <button onClick={()=>removeUser(u.id)} className="px-3 py-1 bg-red-600 text-white rounded">Remover</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default UsersAdmin;
