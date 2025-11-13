import React, { useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { useToast } from "../../hooks/use-toast";
import { pathTraversalTestService, TestResult } from "../../services/pathTraversalTestService";

const PathTraversalTest: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState("/files/read?path=");
  const [customPayload, setCustomPayload] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const availableEndpoints = [
    { value: "/files/read?path=", label: "/files/read?path=" },
    { value: "/downloads?file=", label: "/downloads?file=" },
    { value: "/public/assets?name=", label: "/public/assets?name=" },
    { value: "/view?file=", label: "/view?file=" }
  ];

  const runAllTests = async () => {
    setLoading(true);
    try {
      const newResults = await pathTraversalTestService.runTraversalTests();
      setResults(prev => [...prev, ...newResults]);
      toast({ title: "Testes de Caminho Transversal concluídos", description: `${newResults.length} testes executados` });
    } catch (error) {
      toast({ title: "Erro ao executar testes", description: "Ocorreu um erro ao executar os testes", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const runCustomTest = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!customPayload) {
      toast({ title: "Caminho necessário", description: "Informe um caminho para o teste", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const result = await pathTraversalTestService.runCustomTest(selectedEndpoint, customPayload);
      setResults(prev => [result, ...prev]);
      toast({ title: "Teste Customizado concluído", description: `Status: ${result.status === 'failed' ? 'Vulnerável' : 'Protegido'}` });
    } catch (error) {
      toast({ title: "Erro ao executar teste", description: "Ocorreu um erro ao executar o teste customizado", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">Testes de Caminho Transversal</h2>
            <p className="text-sm text-gray-600 mt-1">Executa testes para identificar possíveis vulnerabilidades de path traversal</p>
          </div>

          <div className="space-x-4">
            <button onClick={runAllTests} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
              {loading ? "Executando..." : "Executar Testes Padrão"}
            </button>
            <button onClick={() => setResults([])} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Limpar Resultados</button>
          </div>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium mb-4">Teste Personalizado</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint (base)</label>
              <select value={selectedEndpoint} onChange={(e) => setSelectedEndpoint(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" disabled={loading}>
                {availableEndpoints.map(ep => (
                  <option key={ep.value} value={ep.value}>{ep.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Caminho / Payload</label>
              <input value={customPayload} onChange={(e) => setCustomPayload(e.target.value)} placeholder="Ex: ../../etc/passwd" className="w-full p-2 border border-gray-300 rounded-md font-mono" disabled={loading} />
              <p className="text-xs text-gray-500 mt-1">Você pode incluir sequências de traversal (../) ou versões codificadas.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enviar Arquivo de Teste</label>
              <input type="file" onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)} className="w-full" disabled={loading} />
              {selectedFile && <p className="text-xs text-gray-500 mt-1">Arquivo selecionado: <span className="font-mono">{selectedFile.name}</span></p>}
              <p className="text-xs text-gray-500 mt-1">O arquivo será enviado ao endpoint de testes e salvo no servidor para uso nas rotinas de teste.</p>
            </div>

            <button onClick={runCustomTest} disabled={loading} className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50">
              {loading ? "Executando..." : "Executar Teste Personalizado"}
            </button>

            <button onClick={async () => {
              if (!selectedFile) {
                toast({ title: 'Arquivo necessário', description: 'Selecione um arquivo para enviar', variant: 'destructive' });
                return;
              }

              setLoading(true);
              try {
                const res = await pathTraversalTestService.uploadTestFile(selectedFile);

                if (!res || !res.ok) {
                  const msg = res?.data?.message || res?.data?.detail || 'Erro ao enviar arquivo';
                  toast({ title: 'Erro ao enviar arquivo', description: msg, variant: 'destructive' });
                } else {
                  toast({ title: 'Arquivo enviado', description: `Arquivo salvo em: ${res.data?.path ?? 'desconhecido'}` });
                  // opcional: adicionar resultado / log nos resultados
                  setResults(prev => [{
                    name: `Upload: ${selectedFile.name}`,
                    status: 'success',
                    payload: selectedFile.name,
                    response: res.data,
                    timestamp: new Date().toLocaleString()
                  }, ...prev]);
                  setSelectedFile(null);
                }
              } catch (err: any) {
                toast({ title: 'Erro ao enviar arquivo', description: err?.message ?? 'Erro desconhecido', variant: 'destructive' });
              } finally {
                setLoading(false);
              }
            }} disabled={loading} className="w-full mt-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50">{loading ? 'Enviando...' : 'Enviar Arquivo'}</button>
          </div>
        </div>

        <div className="space-y-4">
          {results.map((result, index) => (
            <div key={index} className={`p-4 rounded-lg border ${result.status === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-medium">{result.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">Payload: <span className="font-mono">{result.payload}</span></p>
                </div>
                <span className="text-xs text-gray-500">{result.timestamp}</span>
              </div>

              <div className={`text-sm ${result.status === 'success' ? 'text-green-700' : 'text-red-700'}`}>Status: {result.status === 'success' ? 'PROTEGIDO' : 'VULNERÁVEL'}</div>

              <div className="mt-2">
                <p className="text-xs text-gray-600 mb-1">Resposta do servidor:</p>
                <pre className="text-xs bg-white/50 p-2 rounded overflow-auto max-h-40">{JSON.stringify(result.response, null, 2)}</pre>
              </div>
            </div>
          ))}

          {results.length === 0 && (
            <div className="text-center py-8 text-gray-500">Nenhum teste executado ainda. Clique em "Executar Testes Padrão" para começar.</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PathTraversalTest;
