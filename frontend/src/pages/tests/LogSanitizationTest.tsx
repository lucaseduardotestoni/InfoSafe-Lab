import React, { useState } from "react";
import { api } from "../../services/api";
import DashboardLayout from "../../components/DashboardLayout";

const LogSanitizationTest: React.FC = () => {
  const [payload, setPayload] = useState<string>('normal input');
  const [resp, setResp] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await api("/tests/log-sanitization", {
      method: "POST",
      body: JSON.stringify({ payload })
    });
    setResp(result);
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Teste de Neutralização de Logs</h2>

      <form onSubmit={submit} className="mb-4">
        <input value={payload} onChange={(e) => setPayload(e.target.value)} className="w-full p-2 border rounded mb-2" />
        <button className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>{loading ? "Enviando..." : "Enviar para log"}</button>
      </form>

      <div>
        <h3 className="font-semibold">Resposta do servidor</h3>
        <pre className="bg-gray-100 p-3 rounded">{JSON.stringify(resp, null, 2)}</pre>
        <p className="text-xs text-gray-500 mt-2">O servidor idealmente retorna confirmação e uma versão 'sanitize' do que foi gravado nos logs.</p>
      </div>
    </div>
    </DashboardLayout>
  );
};

export default LogSanitizationTest;
