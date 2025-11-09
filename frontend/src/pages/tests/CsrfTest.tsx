import React, { useState } from "react";
import { api } from "../../services/api";
import DashboardLayout from "../../components/DashboardLayout";

const CsrfTest: React.FC = () => {
  const [payload, setPayload] = useState<string>("action=transfer&amount=1000");
  const [includeToken, setIncludeToken] = useState<boolean>(false);
  const [resp, setResp] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResp(null);

    // se incluir token => fazemos a chamada normal (api já manda Authorization se tiver token)
    // se não incluir => chamamos fetch direto sem token (para simular CSRF/forged request)
    if (includeToken) {
      const result = await api("/tests/csrf", {
        method: "POST",
        body: JSON.stringify({ payload })
      });
      setResp(result);
    } else {
      // fetch sem header Authorization — simula site externo sem cookie/session/token
      const raw = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:3001"}/tests/csrf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload })
      });
      let data;
      try { data = await raw.json(); } catch { data = null; }
      setResp({ ok: raw.ok, status: raw.status, data });
    }

    setLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Teste de CSRF</h2>

      <form onSubmit={submit} className="mb-4">
        <textarea value={payload} onChange={(e) => setPayload(e.target.value)} className="w-full p-2 border rounded mb-2" />
        <label className="flex items-center gap-2 mb-2">
          <input type="checkbox" checked={includeToken} onChange={(e) => setIncludeToken(e.target.checked)} />
          <span className="text-sm">Incluir Authorization token (simular usuário autenticado)</span>
        </label>
        <button disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? "Enviando..." : "Enviar"}</button>
      </form>

      <div>
        <h3 className="font-semibold mb-2">Resposta</h3>
        <pre className="bg-gray-100 p-3 rounded">{JSON.stringify(resp, null, 2)}</pre>
      </div>
    </div>
    </DashboardLayout>
  );
};

export default CsrfTest;
