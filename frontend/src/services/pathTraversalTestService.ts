import { api } from './api';

export interface TestResult {
  name: string;
  status: 'success' | 'failed';
  payload: string;
  response: any;
  timestamp: string;
}

class PathTraversalTestService {
  // Endpoints onde podemos testar path traversal (a string será concatenada com o payload)
  // Endpoints onde podemos testar path traversal.
  // Agora temos rotas POST no backend que aceitam { path } no corpo:
  private readonly endpoints = [
    { value: '/path-traversal/vulnerable', label: '/path-traversal/vulnerable', method: 'POST' },
    { value: '/path-traversal/safe', label: '/path-traversal/safe', method: 'POST' }
  ];

  private readonly payloads = [
    { name: 'Basic traversal (unix)', payload: '../../etc/passwd' },
    { name: 'Basic traversal (windows)', payload: '..\\..\\Windows\\system.ini' },
    { name: 'Multiple traversal', payload: '../../../..////../../etc/passwd' },
    { name: 'Encoded traversal', payload: '%2e%2e%2f%2e%2e%2fetc%2fpasswd' }
  ];

  async runTraversalTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    for (const endpoint of this.endpoints) {
      for (const p of this.payloads) {
        try {
          // Para as novas rotas usamos POST e enviamos { path }
          const res = await api(endpoint.value, {
            method: endpoint.method ?? 'GET',
            body: JSON.stringify({ path: p.payload })
          });

          const status: 'success' | 'failed' = this.evaluateResponse(res);

          results.push({
            name: `${p.name} @ ${endpoint.label}`,
            status,
            payload: p.payload,
            response: res.data ?? { status: res.status },
            timestamp: new Date().toLocaleString()
          });
        } catch (error: any) {
          results.push({
            name: `${p.name} @ ${endpoint.label}`,
            status: 'success',
            payload: p.payload,
            response: { error: error?.message ?? 'Request failed' },
            timestamp: new Date().toLocaleString()
          });
        }
      }
    }

    return results;
  }

  async runCustomTest(endpointBase: string, payload: string): Promise<TestResult> {
    try {
      // assume endpointBase is a path (e.g. '/path-traversal/safe')
      const res = await api(endpointBase, {
        method: 'POST',
        body: JSON.stringify({ path: payload })
      });

      return {
        name: 'Teste Customizado de Path Traversal',
        status: this.evaluateResponse(res),
        payload,
        response: res.data ?? { status: res.status },
        timestamp: new Date().toLocaleString()
      };
    } catch (error: any) {
      return {
        name: 'Teste Customizado de Path Traversal',
        status: 'success',
        payload,
        response: { error: error?.message ?? 'Request failed' },
        timestamp: new Date().toLocaleString()
      };
    }
  }

  // Classifica como falha se o servidor retornou 200 OK ou conteúdo que parece ser de arquivos sensíveis
  private evaluateResponse(response: any): 'success' | 'failed' {
    if (!response) return 'success';

    if (response.status === 200 && response.data) {
      // Tenta detectar conteúdo de passwd (UNIX) ou arquivos windows comuns
      const text = JSON.stringify(response.data).toLowerCase();
      const indicators = ['root:', '/etc/passwd', 'passwd', '[drivers]', 'system32', 'system.ini'];
      if (indicators.some(i => text.includes(i))) return 'failed';

      // Se retornou 200 sem indicação sensível, marca como failed (acesso ao arquivo foi possível)
      return 'failed';
    }

    return 'success';
  }
}

export const pathTraversalTestService = new PathTraversalTestService();
