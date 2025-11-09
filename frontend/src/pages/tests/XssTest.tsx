import React, { useState } from "react";
import { api } from "../../services/api";
import DashboardLayout from "../../components/DashboardLayout";

const XssTest: React.FC = () => {
  const [payload, setPayload] = useState<string>('<script>alert("xss")</script>');
  const [resp, setResp] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResp(null);
    const result = await api("/tests/xss", {
      method: "POST",
      body: JSON.stringify({ payload })
    });
    setResp(result);
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Teste de XSS</h2>
      <p className="mb-4 text-sm text-gray-600">
        Envie entradas que contenham HTML/JS e veja como o backend responde e como o frontend exibe.
      </p>

      <form onSubmit={submit} className="mb-4">
        <input
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        />
        <button className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>
          {loading ? "Enviando..." : "Enviar"}
        </button>
      </form>

      <div className="mb-4">
        <h3 className="font-semibold">Resposta (raw)</h3>
        <pre className="bg-gray-100 p-3 rounded">{JSON.stringify(resp, null, 2)}</pre>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Renderização insegura (⚠️ só para testes)</h3>
        <div className="p-4 bg-white border rounded" dangerouslySetInnerHTML={{ __html: resp?.data?.rendered || "" }} />
        <p className="text-xs text-gray-500 mt-2">Se o backend retornar conteúdo não-sanitizado, ele será executado aqui.</p>
      </div>
    </div>
    </DashboardLayout>
  );
};

export default XssTest;
