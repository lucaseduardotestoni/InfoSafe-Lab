import { api } from './api';

export interface TestResult {
    name: string;
    status: 'success' | 'failed';
    payload: string;
    response: any;
    timestamp: string;
}

class PathTraversalTestService {
    // Isso evita 404s quando o backend não implementa /files/read, /downloads, etc.
    private readonly endpoints = [
        { value: '/tests/path-traversal/test?file=', label: '/tests/path-traversal/test?file=' }
    ];

    private readonly payloads = [
        { name: 'Basic traversal (unix)', payload: '../../etc/passwd', encoded: false },
        { name: 'Basic traversal (windows)', payload: '..\\..\\Windows\\system.ini', encoded: false },
        { name: 'Multiple traversal', payload: '../../../..////../../etc/passwd', encoded: false },
        // Se quiser testar encoded, marque encoded: true e passe o valor já codificado
        { name: 'Encoded traversal', payload: '%2e%2e%2f%2e%2e%2fetc%2fpasswd', encoded: true }
    ];

    async runTraversalTests(): Promise<TestResult[]> {
        const results: TestResult[] = [];

        for (const endpoint of this.endpoints) {
            for (const p of this.payloads) {
                // Se payload já está encoded (encoded: true), não aplicar encodeURIComponent
                const suffix = p.encoded ? p.payload : encodeURIComponent(p.payload);
                const fullPath = `${endpoint.value}${suffix}`;

                try {
                    // Supondo que `api` já aplica baseURL e headers (incluindo Authorization se configurado)
                    const res = await api(fullPath, { method: 'GET' });

                    const status: 'success' | 'failed' = this.evaluateResponse(res);

                    results.push({
                        name: `${p.name} @ ${endpoint.label}`,
                        status,
                        payload: p.payload,
                        response: {
                            httpStatus: res.status,
                            data: res.data
                        },
                        timestamp: new Date().toLocaleString()
                    });
                    console.log(`[PathTraversal] ${p.name} @ ${endpoint.label}`, {
                        payload: p.payload,
                        httpStatus: res.status,
                        backendData: res.data
                    });
                } catch (error: any) {
                    // Se a requisição falhou por rede ou outro motivo, marca como 'failed' (problema com o recurso)
                    results.push({
                        name: `${p.name} @ ${endpoint.label}`,
                        status: 'failed',
                        payload: p.payload,
                        response: { error: error?.message ?? 'Request failed' },
                        timestamp: new Date().toLocaleString()
                    });
                }
            }
        }

        return results;
    }

    async runCustomTest(endpointBase: string, payload: string, encoded = false): Promise<TestResult> {
        const suffix = encoded ? payload : encodeURIComponent(payload);
        const fullPath = `${endpointBase}${suffix}`;
        try {
            const res = await api(fullPath, { method: 'GET' });

            return {
                name: 'Teste Customizado de Path Traversal',
                status: this.evaluateResponse(res),
                payload,
                response: { httpStatus: res.status, data: res.data },
                timestamp: new Date().toLocaleString()
            };
        } catch (error: any) {
            return {
                name: 'Teste Customizado de Path Traversal',
                status: 'failed',
                payload,
                response: { error: error?.message ?? 'Request failed' },
                timestamp: new Date().toLocaleString()
            };
        }
    }

    /**
     * Envia um arquivo ao backend para ser salvo como arquivo de teste.
     * O backend espera um JSON com { userId, filename, content }
     */
    async uploadTestFile(file: File): Promise<any> {
        if (!file) return { ok: false, status: 400, data: { message: 'Nenhum arquivo selecionado' } };

        const content = await file.text();
        const filename = file.name;

        // tenta recuperar o userId do localStorage (o Auth salva o usuário em 'user')
        let userId = null as any;
        try {
            const userRaw = localStorage.getItem('user');
            if (userRaw) {
                const user = JSON.parse(userRaw);
                userId = user?.id ?? null;
            }
        } catch {
            userId = null;
        }

        const payload = { userId, filename, content };

        try {
            const res = await api('/tests/path-traversal/save-file', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            return res;
        } catch (err: any) {
            return { ok: false, status: 0, data: { message: err?.message ?? 'Erro desconhecido' } };
        }
    }

    // Classifica como falha se o servidor retornou 200 OK ou conteúdo que parece ser de arquivos sensíveis
    private evaluateResponse(response: any): 'success' | 'failed' {
        if (!response) return 'success';

            // Preferir o status retornado pelo backend dentro do corpo (ex: { status: 400, message: '...' })
            const backendStatus = (response?.data && response.data.status) ?? response?.httpStatus ?? response?.status ?? null;

            // 200 -> arquivo lido com sucesso (vulnerável)
            if (backendStatus === 200) {
                const data = response.data ?? response?.data ?? response?.data;
                const text = JSON.stringify(data ?? '').toLowerCase();
                const indicators = ['root:', '/etc/passwd', 'passwd', '[drivers]', 'system32', 'system.ini'];
                if (indicators.some(i => text.includes(i))) return 'failed';
                return 'failed';
            }

            // 400,403,404,413 => backend bloqueou/negou ou não encontrou o arquivo => seguro
            if ([400, 403, 404, 413].includes(backendStatus)) return 'success';

            // 500 ou outros erros de servidor/cliente -> marca como failed (problema ou possível falha)
            if (backendStatus >= 500 || backendStatus === 0) return 'failed';

            // padrão: considera seguro
            return 'success';
    }
}

export const pathTraversalTestService = new PathTraversalTestService();
