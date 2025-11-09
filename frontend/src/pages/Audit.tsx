import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { api } from "../services/api";

interface User {
  id: number;
  name: string;
}

interface Log {
  id: number;
  action: string;
  ip?: string;
  executedCommand?: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
    role: string;
  };
}

const Audit = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [tipo, setTipo] = useState("");
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  async function load() {
    const query = new URLSearchParams({
      userId: selectedUser,
      tipo,
      dataInicial,
      dataFinal,
      page: String(page),
      limit: "20"
    });

    const resLogs = await api(`/admin/audit/logs?${query.toString()}`);
    if (resLogs.ok) {
      setLogs(resLogs.data.logs);
      setPagination(resLogs.data.pagination);
    }

    const resUsers = await api("/users");
    if (resUsers.ok) setUsers(resUsers.data);
  }

  useEffect(() => {
    load();
  }, [selectedUser, tipo, dataInicial, dataFinal, page]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-8">

        <h1 className="text-3xl font-bold mb-6">Auditoria de Atividades</h1>

        {/* FILTROS */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-white p-4 rounded shadow mb-6">

          <select
            className="border p-2 rounded"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            <option value="">Todos Usuários</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>

          <select
            className="border p-2 rounded"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            <option value="">Todos Tipos</option>
            <option value="SUCCESS">Sucesso</option>
            <option value="FAILED">Erro</option>
          </select>

          <input
            type="date"
            className="border p-2 rounded"
            value={dataInicial}
            onChange={(e) => setDataInicial(e.target.value)}
          />

          <input
            type="date"
            className="border p-2 rounded"
            value={dataFinal}
            onChange={(e) => setDataFinal(e.target.value)}
          />

          <button
            onClick={() => { setSelectedUser(""); setTipo(""); setDataInicial(""); setDataFinal(""); }}
            className="bg-gray-300 px-3 rounded"
          >
            Limpar
          </button>

        </div>

        {/* TABELA */}
        <div className="bg-white p-4 rounded shadow overflow-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500">Nenhum resultado encontrado.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-200 text-left">
                <tr>
                  <th className="p-2">Usuário</th>
                  <th className="p-2">Ação</th>
                  <th className="p-2">IP</th>
                  <th className="p-2">Comando Executado</th>
                  <th className="p-2">Data</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t hover:bg-gray-50">
                    <td className="p-2">{log.user?.name ?? "-"}</td>
                    <td className="p-2">{log.action}</td>
                    <td className="p-2">{log.ip ?? "-"}</td>
                    <td className="p-2">
                      {log.executedCommand ? (
                        <div className="max-w-md overflow-auto">
                          <pre className="text-xs bg-gray-100 p-2 rounded">
                            {(() => {
                              try {
                                // Tenta fazer o parse do JSON
                                return JSON.stringify(JSON.parse(log.executedCommand), null, 2);
                              } catch {
                                // Se não for JSON válido, mostra a string como está
                                return log.executedCommand;
                              }
                            })()}
                          </pre>
                        </div>
                      ) : "-"}
                    </td>
                    <td className="p-2">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINAÇÃO */}
        <div className="flex justify-between mt-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
          >
            Anterior
          </button>
          <span>Página {page} de {pagination.pages}</span>
          <button
            disabled={page >= pagination.pages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
          >
            Próxima
          </button>
        </div>

      </main>
    </div>
  );
};

export default Audit;
