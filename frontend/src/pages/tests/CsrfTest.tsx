import React, { useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { loginService } from "../../services/authservice";
import { csrfTestService } from "../../services/csrfTestService";

const CsrfTest: React.FC = () => {
  // LOGIN
  const [loginEmail, setLoginEmail] = useState("lucas@test.com");
  const [loginPassword, setLoginPassword] = useState("123456");
  const [loginResp, setLoginResp] = useState<any>(null);
  const [loadingLogin, setLoadingLogin] = useState(false);

  // ME
  const [meResp, setMeResp] = useState<any>(null);
  const [loadingMe, setLoadingMe] = useState(false);
  const [includeTokenForMe, setIncludeTokenForMe] = useState(true);

  // BLOCK USER
  const [blockUserId, setBlockUserId] = useState<number | "">("");
  const [blockResp, setBlockResp] = useState<any>(null);
  const [loadingBlock, setLoadingBlock] = useState(false);
  const [useDirectFetchNoToken, setUseDirectFetchNoToken] = useState(false);

  // Login action
  const doLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoadingLogin(true);
    setLoginResp(null);
    try {
      const res = await loginService(loginEmail, loginPassword);
      if (res.ok && res.data?.token) {
        localStorage.setItem("token", res.data.token);
      }
      setLoginResp(res);
    } catch (err) {
      setLoginResp({ ok: false, error: String(err) });
    } finally {
      setLoadingLogin(false);
    }
  };

  // Me action
  const doMe = async () => {
    setLoadingMe(true);
    setMeResp(null);
    try {
      const res = await csrfTestService.getMeInfo(includeTokenForMe);
      setMeResp(res);
    } catch (err) {
      setMeResp({ ok: false, error: String(err) });
    } finally {
      setLoadingMe(false);
    }
  };

  // Block user
  const doBlock = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!blockUserId) {
      setBlockResp({ ok: false, message: "Informe um userId" });
      return;
    }
    setLoadingBlock(true);
    setBlockResp(null);
    try {
      const res = await csrfTestService.blockUser(Number(blockUserId), useDirectFetchNoToken);
      setBlockResp(res);
    } catch (err) {
      setBlockResp({ ok: false, error: String(err) });
    } finally {
      setLoadingBlock(false);
    }
  };

  const token = localStorage.getItem("token");

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <h2 className="text-2xl font-bold">Test Endpoints: login / me / blockUser</h2>

        <section className="p-4 bg-white rounded shadow">
          <h3 className="font-semibold mb-2">1) Login</h3>
          <form onSubmit={doLogin} className="space-y-2">
            <div>
              <label className="block text-sm">Email</label>
              <input className="w-full border p-2" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm">Password</label>
              <input type="password" className="w-full border p-2" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
            </div>
            <div className="flex gap-2 items-center">
              <button className="px-4 py-2 bg-green-600 text-white rounded" disabled={loadingLogin}>
                {loadingLogin ? "Logando..." : "Fazer login"}
              </button>
              <button type="button" onClick={() => { localStorage.removeItem("token"); setLoginResp(null); }} className="px-3 py-2 bg-gray-200 rounded">
                Remover token
              </button>
              <div className="text-sm text-gray-600">Token atual: {token ? "presente" : "ausente"}</div>
            </div>
            <pre className="bg-gray-50 p-3 rounded mt-2">{JSON.stringify(loginResp, null, 2)}</pre>
          </form>
        </section>

        <section className="p-4 bg-white rounded shadow">
          <h3 className="font-semibold mb-2">2) Me (GET /auth/me)</h3>
          <div className="flex items-center gap-2 mb-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={includeTokenForMe} onChange={e => setIncludeTokenForMe(e.target.checked)} />
              <span className="text-sm">Incluir token (Authorization)</span>
            </label>
            <button onClick={doMe} className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loadingMe}>
              {loadingMe ? "Consultando..." : "Consultar /auth/me"}
            </button>
          </div>
          <pre className="bg-gray-50 p-3 rounded">{JSON.stringify(meResp, null, 2)}</pre>
        </section>

        <section className="p-4 bg-white rounded shadow">
          <h3 className="font-semibold mb-2">3) Block User (POST /users/block/:id)</h3>
          <form onSubmit={doBlock} className="space-y-2">
            <div>
              <label className="block text-sm">User ID</label>
              <input type="number" className="w-40 border p-2" value={blockUserId} onChange={e => setBlockUserId(e.target.value ? Number(e.target.value) : "")} />
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={useDirectFetchNoToken} onChange={e => setUseDirectFetchNoToken(e.target.checked)} />
              <span className="text-sm">Enviar sem token (simular site externo)</span>
            </label>

            <div className="flex gap-2">
              <button className="px-4 py-2 bg-indigo-600 text-white rounded" disabled={loadingBlock}>
                {loadingBlock ? "Enviando..." : "Bloquear usuário"}
              </button>
              <button type="button" onClick={() => { setBlockResp(null); }} className="px-3 py-2 bg-gray-200 rounded">Limpar</button>
            </div>

            <pre className="bg-gray-50 p-3 rounded mt-2">{JSON.stringify(blockResp, null, 2)}</pre>
          </form>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default CsrfTest;
