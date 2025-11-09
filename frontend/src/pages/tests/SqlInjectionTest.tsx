import React, { useState } from "react";
import { api } from "../../services/api";
import DashboardLayout from "../../components/DashboardLayout";

const SqlInjectionTest: React.FC = () => {
  const [input, setInput] = useState<string>("1 OR 1=1");
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponse(null);
    const res = await api("/tests/sql-injection", {
      method: "POST",
      body: JSON.stringify({ payload: input })
    });
    setResponse(res);
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Teste de SQL Injection</h2>
      <p className="mb-4 text-sm text-gray-600">
        Envie payloads para verificar comportamento do backend. Exemplo: <code>1 OR 1=1</code>
      </p>

      <form onSubmit={handleSubmit} className="mb-4 space-y-3">
        <textarea
          rows={4}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <div className="flex gap-2">
          <button disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">
            {loading ? "Enviando..." : "Enviar Payload"}
          </button>
        </div>
      </form>

      <div>
        <h3 className="font-semibold mb-2">Resposta do servidor</h3>
        <pre className="bg-gray-100 p-3 rounded max-h-72 overflow-auto">
          {JSON.stringify(response, null, 2)}
        </pre>
      </div>
    </div>
    </DashboardLayout>
  );
};

export default SqlInjectionTest;
