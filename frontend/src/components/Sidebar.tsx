import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";
import { api } from "../services/api";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

const Sidebar: React.FC = () => {
  const [isTestsOpen, setIsTestsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Carrega informações do usuário
    async function loadUser() {
      try {
        const response = await api("/auth/me");
        if (response.ok) {
          setUser(response.data);
        }
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
      }
    }
    loadUser();
  }, []);

  const baseNavClass = "px-2 py-1.5 rounded-md transition-colors duration-200";
  const activeNavClass = "font-semibold text-indigo-600 bg-indigo-50";
  const normalNavClass = "hover:bg-gray-100";

  return (
    <aside className="w-64 bg-white border-r p-4">
      <div className="mb-6">
        <h2 className="text-xl font-bold">InfoSafe Lab</h2>
      </div>

      <nav className="flex flex-col gap-2">
        <NavLink 
          to="/dashboard" 
          className={({isActive}) => `${baseNavClass} ${isActive ? activeNavClass : normalNavClass}`}
        >
          Dashboard
        </NavLink>

        {/* Seção de Testes */}
        <div>
          <button 
            onClick={() => setIsTestsOpen(!isTestsOpen)}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-gray-100"
          >
            <span>Testes de Segurança</span>
            {isTestsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          
          {isTestsOpen && (
            <div className="ml-4 mt-1 flex flex-col gap-1 border-l pl-2">
              <NavLink 
                to="/tests/sql-injection" 
                className={({isActive}) => `${baseNavClass} ${isActive ? activeNavClass : normalNavClass}`}
              >
                SQL Injection
              </NavLink>
              <NavLink 
                to="/tests/xss" 
                className={({isActive}) => `${baseNavClass} ${isActive ? activeNavClass : normalNavClass}`}
              >
                XSS
              </NavLink>
              <NavLink 
                to="/tests/csrf" 
                className={({isActive}) => `${baseNavClass} ${isActive ? activeNavClass : normalNavClass}`}
              >
                CSRF
              </NavLink>
              <NavLink 
                to="/tests/path-traversal" 
                className={({isActive}) => `${baseNavClass} ${isActive ? activeNavClass : normalNavClass}`}
              >
                Cross Path
              </NavLink>
            </div>
          )}
        </div>

        {/* Auditoria */}
        {user?.role === 'admin' && (
          <div className="mt-4 pt-4 border-t">
            <NavLink 
              to="/admin/audit" 
              className={({isActive}) => `${baseNavClass} ${isActive ? activeNavClass : normalNavClass}`}
            >
              Auditoria
            </NavLink>
          </div>
        )}
        {/* Gerenciamento de Usuários*/}
        {user?.role === 'admin' && (
          <div className="mt-4 pt-4 border-t">
            <NavLink 
              to="/admin/painel" 
              className={({isActive}) => `${baseNavClass} ${isActive ? activeNavClass : normalNavClass}`}
            >
              Painel Administrativo
            </NavLink>
          </div>
        )}

      </nav>
    </aside>
  );
};

export default Sidebar;
