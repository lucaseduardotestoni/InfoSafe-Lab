import React, { useState } from "react";
import { api } from "../../services/api";
import DashboardLayout from "../../components/DashboardLayout";
import { useToast } from "../../hooks/use-toast";

interface TestResult {
  name: string;
  status: 'success' | 'failed';
  payload: string;
  response: any;
  timestamp: string;
}

const SqlInjectionTest: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState("/auth/login");
  const [customPayload, setCustomPayload] = useState("");
  const { toast } = useToast();

  const availableEndpoints = [
    { value: "/auth/login", label: "Login (POST)", method: "POST" },
    { value: "/users/1/role", label: "Alterar Role (PATCH)", method: "PATCH" },
    { value: "/users/1", label: "Deletar Usuário (DELETE)", method: "DELETE" },
    { value: "/users", label: "Listar Usuários (GET)", method: "GET" }
  ];

  const addResult = (
    name: string,
    status: 'success' | 'failed',
    payload: string,
    response: any
  ) => {
    setResults(prev => [...prev, {
      name,
      status,
      payload,
      response,
      timestamp: new Date().toLocaleString()
    }]);
  };

  // Testes de SQL Injection
  const sqlInjectionTests = async () => {
    const payloads = [
      "' OR '1'='1",
      "admin'--",
      "' UNION SELECT * FROM users--",
      "'; DROP TABLE users;--"
    ];

    for (const payload of payloads) {
      try {
        const loginResponse = await api("/auth/login", {
          method: "POST",
          body: JSON.stringify({
            email: payload,
            password: payload
          })
        });

        // Se o login foi bem-sucedido com SQL injection, isso é uma falha de segurança
        if (loginResponse.ok) {
          addResult(
            "SQL Injection - Login",
            "failed",
            payload,
            loginResponse.data
          );
        } else {
          addResult(
            "SQL Injection - Login",
            "success",
            payload,
            loginResponse.data
          );
        }
      } catch (error) {
        addResult(
          "SQL Injection - Login",
          "success", // Erro na requisição é bom neste caso
          payload,
          { error: "Requisição falhou - comportamento esperado" }
        );
      }
    }
  };

  // Testes de Manipulação de Role
  const roleManipulationTests = async () => {
    const tests = [
      {
        name: "Elevação para Admin sem Autenticação",
        endpoint: "/users/1/role",
        method: "PATCH",
        payload: { role: "admin" }
      },
      {
        name: "Alteração de Role com Token Inválido",
        endpoint: "/users/1/role",
        method: "PATCH",
        payload: { role: "admin" },
        headers: { Authorization: "Bearer invalid_token" }
      }
    ];

    for (const test of tests) {
      try {
        const response = await api(test.endpoint, {
          method: test.method,
          body: JSON.stringify(test.payload),
          headers: test.headers
        });

        // Se conseguiu alterar a role sem autenticação adequada, é uma falha
        if (response.ok) {
          addResult(test.name, "failed", JSON.stringify(test.payload), response.data);
        } else {
          addResult(test.name, "success", JSON.stringify(test.payload), response.data);
        }
      } catch (error) {
        addResult(
          test.name,
          "success",
          JSON.stringify(test.payload),
          { error: "Requisição falhou - comportamento esperado" }
        );
      }
    }
  };

  // Testes de Bruteforce
  const bruteforceTests = async () => {
    const email = "test@example.com";
    const attempts = [];

    for (let i = 1; i <= 6; i++) {
      try {
        const response = await api("/auth/login", {
          method: "POST",
          body: JSON.stringify({
            email,
            password: "senha_errada"
          })
        });

        attempts.push(response);

        if (response.status === 403 && response.data?.message?.includes("bloqueada")) {
          addResult(
            "Proteção contra Bruteforce",
            "success",
            `Tentativa ${i}`,
            response.data
          );
          break;
        }

        // Se chegou na 6ª tentativa sem bloqueio, é uma falha
        if (i === 6) {
          addResult(
            "Proteção contra Bruteforce",
            "failed",
            "6 tentativas",
            { error: "Conta não foi bloqueada após múltiplas tentativas" }
          );
        }
      } catch (error) {
        console.error("Erro no teste de bruteforce:", error);
      }
    }
  };

  // Testes de Deleção de Usuário
  const userDeletionTests = async () => {
    const tests = [
      {
        name: "Deleção sem Autenticação",
        endpoint: "/users/1",
        method: "DELETE"
      },
      {
        name: "Deleção com Token Inválido",
        endpoint: "/users/1",
        method: "DELETE",
        headers: { Authorization: "Bearer invalid_token" }
      }
    ];

    for (const test of tests) {
      try {
        const response = await api(test.endpoint, {
          method: test.method,
          headers: test.headers
        });

        // Se conseguiu deletar sem autenticação adequada, é uma falha
        if (response.ok) {
          addResult(test.name, "failed", test.endpoint, response.data);
        } else {
          addResult(test.name, "success", test.endpoint, response.data);
        }
      } catch (error) {
        addResult(
          test.name,
          "success",
          test.endpoint,
          { error: "Requisição falhou - comportamento esperado" }
        );
      }
    }
  };

  const runCustomTest = async () => {
    if (!customPayload.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um payload para testar",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const selectedEndpointInfo = availableEndpoints.find(e => e.value === selectedEndpoint);

    try {
      const response = await api(selectedEndpoint, {
        method: selectedEndpointInfo?.method || "POST",
        body: selectedEndpointInfo?.method !== "GET" ? JSON.stringify({
          ...(selectedEndpoint === "/auth/login" ? {
            email: customPayload,
            password: customPayload
          } : { payload: customPayload })
        }) : undefined,
      });

      addResult(
        `Teste Personalizado - ${selectedEndpointInfo?.label}`,
        response.ok ? "failed" : "success",
        customPayload,
        response.data
      );

      toast({
        title: "Teste Executado",
        description: "O teste personalizado foi executado com sucesso"
      });
    } catch (error) {
      addResult(
        `Teste Personalizado - ${selectedEndpointInfo?.label}`,
        "success",
        customPayload,
        { error: "Requisição falhou - comportamento esperado" }
      );
    } finally {
      setLoading(false);
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    setResults([]);

    try {
      await sqlInjectionTests();
      await roleManipulationTests();
      await bruteforceTests();
      await userDeletionTests();

      toast({
        title: "Testes Concluídos",
        description: "Todos os testes de segurança foram executados"
      });
    } catch (error) {
      console.error("Erro ao executar testes:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao executar os testes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">Testes de Segurança</h2>
            <p className="text-sm text-gray-600 mt-1">
              Executa diversos testes de segurança nos endpoints da aplicação
            </p>
          </div>
          <div className="space-x-4">
            <button
              onClick={runAllTests}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Executando..." : "Executar Todos os Testes"}
            </button>
            <button
              onClick={() => setResults([])}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Limpar Resultados
            </button>
          </div>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium mb-4">Teste Personalizado</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Endpoint
              </label>
              <select
                value={selectedEndpoint}
                onChange={(e) => setSelectedEndpoint(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                disabled={loading}
              >
                {availableEndpoints.map((endpoint) => (
                  <option key={endpoint.value} value={endpoint.value}>
                    {endpoint.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payload Personalizado
              </label>
              <textarea
                value={customPayload}
                onChange={(e) => setCustomPayload(e.target.value)}
                placeholder="Insira seu payload de teste aqui..."
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={3}
                disabled={loading}
              />
            </div>
            <button
              onClick={runCustomTest}
              disabled={loading}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Executando..." : "Executar Teste Personalizado"}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                result.status === 'success' 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-medium">{result.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">Payload: {result.payload}</p>
                </div>
                <span className="text-xs text-gray-500">{result.timestamp}</span>
              </div>
              <div className={`text-sm ${
                result.status === 'success' ? 'text-green-700' : 'text-red-700'
              }`}>
                Status: {result.status.toUpperCase()}
              </div>
              <div className="mt-2">
                <p className="text-xs text-gray-600 mb-1">Resposta do servidor:</p>
                <pre className="text-xs bg-white/50 p-2 rounded overflow-auto max-h-32">
                  {JSON.stringify(result.response, null, 2)}
                </pre>
              </div>
            </div>
          ))}

          {results.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhum teste executado ainda. Clique em "Executar Todos os Testes" para começar.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default SqlInjectionTest;
