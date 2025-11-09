// src/pages/admin/UsersAdmin.jsx
import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { api } from "../services/api";
import { useToast } from "../hooks/use-toast";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  isLocked: boolean;
}

const UsersAdmin = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: number } | null>(null);
  const { toast } = useToast();

  useEffect(() => { 
    load();
    loadCurrentUser();
  }, []);

  async function loadCurrentUser() {
    const res = await api("/auth/me");
    if (res.ok) {
      setCurrentUser(res.data);
    }
  }

  async function load() {
    const res = await api("/users");
    if (res.ok) setUsers(res.data || []);
  }

  async function toggleLock(user: User) {
    // Impede bloqueio do próprio usuário
    if (user.id === currentUser?.id) {
      toast({
        title: "Ação não permitida",
        description: "Você não pode bloquear seu próprio usuário",
        variant: "destructive"
      });
      return;
    }

    const res = await api(`/users/${user.id}/block`, {
      method: "POST"
    });

    if (res.ok) {
      toast({
        title: "Sucesso",
        description: `Usuário ${user.isLocked ? "desbloqueado" : "bloqueado"} com sucesso`
      });
      load();
    } else {
      toast({
        title: "Erro",
        description: res.data?.message || "Erro ao alterar status do usuário",
        variant: "destructive"
      });
    }
  }

  async function removeUser(user: User) {
    // Impede remoção do próprio usuário
    if (user.id === currentUser?.id) {
      toast({
        title: "Ação não permitida",
        description: "Você não pode excluir seu próprio usuário",
        variant: "destructive"
      });
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir o usuário ${user.name}?`)) return;
    
    const res = await api(`/users/${user.id}`, { method: "DELETE" });
    
    if (res.ok) {
      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso"
      });
      load();
    } else {
      toast({
        title: "Erro",
        description: res.data?.message || "Erro ao excluir usuário",
        variant: "destructive"
      });
    }
  }

  async function changeRole(user: User, newRole: 'admin' | 'user') {
    // Impede alteração da própria role
    if (user.id === currentUser?.id) {
      toast({
        title: "Ação não permitida",
        description: "Você não pode alterar sua própria função",
        variant: "destructive"
      });
      return;
    }

    const res = await api(`/users/${user.id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role: newRole })
    });

    if (res.ok) {
      toast({
        title: "Sucesso",
        description: `Função do usuário alterada para ${newRole}`
      });
      load();
    } else {
      toast({
        title: "Erro",
        description: res.data?.message || "Erro ao alterar função do usuário",
        variant: "destructive"
      });
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-semibold mb-4">Gerenciar Usuários</h1>
        <div className="bg-white rounded shadow">
          {users.map(user => (
            <div key={user.id} className="p-4 flex justify-between items-center border-b">
              <div>
                <div className="font-medium">
                  {user.name} 
                  <span className="text-sm text-gray-500 ml-2">({user.email})</span>
                  {user.id === currentUser?.id && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Você</span>
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Função: {user.role}
                  <span className="mx-2">•</span>
                  Status: <span className={user.isLocked ? "text-red-500" : "text-green-500"}>
                    {user.isLocked ? "Bloqueado" : "Ativo"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => toggleLock(user)} 
                  disabled={user.id === currentUser?.id}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    user.id === currentUser?.id 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : user.isLocked 
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  {user.isLocked ? "Desbloquear" : "Bloquear"}
                </button>

                <select
                  value={user.role}
                  onChange={(e) => changeRole(user, e.target.value as 'admin' | 'user')}
                  disabled={user.id === currentUser?.id}
                  className={`px-3 py-1 rounded text-sm font-medium border ${
                    user.id === currentUser?.id 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>

                <button 
                  onClick={() => removeUser(user)}
                  disabled={user.id === currentUser?.id}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    user.id === currentUser?.id 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              Nenhum usuário encontrado
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default UsersAdmin;
