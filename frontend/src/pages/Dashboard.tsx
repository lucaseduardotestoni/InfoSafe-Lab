import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../services/api"; // suposição: você tem a função api num arquivo services/api.ts
import Sidebar from "../components/Sidebar";
import RequireAuth from "../components/RequireAuth";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  isLocked?: boolean;
};

type AuditLog = {
  id: number;
  action: string;
  ip?: string;
  createdAt: string;
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [recentActions, setRecentActions] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Removido estado showErrorsOnly pois agora sempre mostramos erros

  async function load() {
    setLoading(true);
    try {
      const me = await api("/auth/me");
      if (!me.ok) {
        // se não autenticado → redireciona para login
        navigate("/auth");
        return;
      }
      setUser(me.data);

      // Calcula a data/hora de uma hora atrás
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      const dataInicial = oneHourAgo.toISOString();
      
      // Busca ações com filtros de tempo e erro
      const logs = await api(`/audit?limit=10&errorsOnly=true&dataInicial=${encodeURIComponent(dataInicial)}`);
      if (logs.ok) setRecentActions(logs.data || []);
    } catch (err) {
      setError("Erro ao carregar dados do dashboard");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // Atualiza a cada minuto para manter os erros da última hora atualizados
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalActions = recentActions.length;
  const lastAction = recentActions[0]?.action ?? "Nenhuma ação encontrada";
  const hasActions = recentActions.length > 0;
  const accountStatus = user?.isLocked ? "Bloqueada" : "Ativa";

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              Bem-vindo{user ? `, ${user.name}` : ""}
            </h1>
            <p className="text-sm text-gray-600">Função: {user?.role ?? "—"}</p>
          </div>

          <div>
            <button
              onClick={() => {
                localStorage.removeItem("token");
                navigate("/auth");
              }}
              className="px-3 py-2 rounded bg-red-500 text-white"
            >
              Sair
            </button>
          </div>
        </header>

        {loading ? (
          <p>Carregando...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <>
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-white rounded shadow">
                <h3 className="text-sm text-gray-500">Erros na última hora</h3>
                <p className={`text-2xl font-bold ${totalActions == 0 ? 'text-green-600' : 'text-red-600'}`}>  {totalActions}</p>
                <p className="text-xs text-gray-500 mt-1">Total de falhas registradas</p>
              </div>

              <div className="p-4 bg-white rounded shadow">
                <h3 className="text-sm text-gray-500">Último erro registrado</h3>
                <p className={`text-lg ${hasActions ? 'text-red-600' : 'text-gray-900 italic'}`}>{lastAction}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {recentActions[0]?.createdAt
                    ? new Date(recentActions[0].createdAt).toLocaleString()
                    : ""}
                </p>
              </div>

              <div className="p-4 bg-white rounded shadow">
                <h3 className="text-sm text-gray-500">Status da conta</h3>
                <p className={`text-lg font-semibold ${user?.isLocked ? "text-red-600" : "text-green-600"}`}>
                  {accountStatus}
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Ferramentas de teste</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link to="/tests/sql-injection" className="p-4 bg-white rounded shadow hover:shadow-lg">
                  <h3 className="font-semibold">Teste de SQL Injection</h3>
                  <p className="text-sm text-gray-500">Página para enviar payloads e ver o comportamento do backend</p>
                </Link>

                <Link to="/tests/xss" className="p-4 bg-white rounded shadow hover:shadow-lg">
                  <h3 className="font-semibold">Teste de XSS</h3>
                  <p className="text-sm text-gray-500">Testes de injeção de scripts em inputs/outputs</p>
                </Link>

                <Link to="/tests/csrf" className="p-4 bg-white rounded shadow hover:shadow-lg">
                  <h3 className="font-semibold">Teste de CSRF</h3>
                  <p className="text-sm text-gray-500">Simular envio de requisições sem token/CSRF</p>
                </Link>

                <Link to="/tests/log-sanitization" className="p-4 bg-white rounded shadow hover:shadow-lg">
                  <h3 className="font-semibold">Neutralização de logs</h3>
                  <p className="text-sm text-gray-500">Verificar saída para logs e possíveis injeções</p>
                </Link>
              </div>
            </section>

            <section className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Registro de Erros (Última Hora)</h2>
              </div>
              <div className="space-y-2">
                {recentActions.length === 0 ? (
                  <p className="text-sm text-red-500">Nenhuma ação recente.</p>
                ) : (
                  recentActions.map((a) => (
                    <div key={a.id} className="p-3 bg-white rounded shadow-sm flex justify-between">
                      <div>
                        <div className="font-medium">{a.action}</div>
                        <div className="text-xs text-gray-500">{a.ip ?? "-"}</div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(a.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
