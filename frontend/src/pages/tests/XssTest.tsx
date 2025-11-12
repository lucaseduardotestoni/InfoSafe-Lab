import React, { useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { useToast } from "../../hooks/use-toast";
import { xssTestService, TestResult } from "../../services/xssTestService";

export const XssTest: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState("/users/profile");
  const [customPayload, setCustomPayload] = useState("");
  const { toast } = useToast();

  const availableEndpoints = [
    { value: "/auth/login", label: "Profile  (POST)", method: "POST" },
    { value: "/users/listUsers", label: "List Users (POST)", method: "POST" },
    { value: "/auth/me", label: "Me (GET)", method: "GET" }
  ];

  // Executa todos os testes de XSS predefinidos
  const runXssTests = async () => {
    setLoading(true);
    try {
      const newResults = await xssTestService.runXssTests();
      setResults(prev => [...prev, ...newResults]);
      toast({
        title: "Testes de XSS concluídos",
        description: `${newResults.length} testes executados`
      });
    } catch (error) {
      toast({
        title: "Erro ao executar testes",
        description: "Ocorreu um erro ao executar os testes de XSS",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Executa um teste personalizado
  const runCustomTest = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!customPayload) {
      toast({
        title: "Payload necessário",
        description: "Informe um payload para o teste",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const selectedTest = availableEndpoints.find(e => e.value === selectedEndpoint);
      if (!selectedTest) return;

      const result = await xssTestService.runCustomTest(
        customPayload,
        selectedEndpoint,
        selectedTest.method
      );
      
      setResults(prev => [...prev, result]);
      toast({
        title: "Teste Customizado concluído",
        description: `Resultado: ${result.status === 'success' ? 'Proteção funcionando' : 'Possível vulnerabilidade'}`
      });
    } catch (error) {
      toast({
        title: "Erro ao executar teste",
        description: "Ocorreu um erro ao executar o teste customizado",
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
            <h2 className="text-2xl font-bold">Testes de XSS (Cross-Site Scripting)</h2>
            <p className="text-sm text-gray-600 mt-1">
              Executa testes para identificar vulnerabilidades XSS nos endpoints da aplicação
            </p>
          </div>
          <div className="space-x-4">
            <button
              onClick={runXssTests}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Executando..." : "Executar Testes Padrão"}
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
          <h3 className="text-lg font-medium mb-4">Teste Personalizado de XSS</h3>
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
                Payload XSS
              </label>
              <textarea
                value={customPayload}
                onChange={(e) => setCustomPayload(e.target.value)}
                placeholder="Insira seu payload XSS aqui..."
                className="w-full p-2 border border-gray-300 rounded-md font-mono text-sm"
                rows={3}
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Exemplo: {"<script>alert('XSS')</script>"}
              </p>
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
                  <p className="text-xs font-mono bg-gray-100 p-1 rounded mt-1">
                    {result.payload}
                  </p>
                </div>
                <span className="text-xs text-gray-500">{result.timestamp}</span>
              </div>
              <div className={`text-sm mt-2 ${
                result.status === 'success' ? 'text-green-700' : 'text-red-700'
              }`}>
                Status: {result.status === 'success' ? 'PROTEGIDO' : 'VULNERÁVEL'}
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
              Nenhum teste executado ainda. Clique em "Executar Testes Padrão" para começar.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default XssTest;
