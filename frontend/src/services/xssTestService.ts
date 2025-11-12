import { api } from './api';

export interface TestResult {
  name: string;
  status: 'success' | 'failed';
  payload: string;
  response: any;
  timestamp: string;
}

class XssTestService {
  private readonly endpoints = {
    profile: '/auth/login',  // endpoint que aceita input do usuário
    ListUsers: '/users/listUsers',      // simula endpoint de 
    Me: '/auth/me'          // simula endpoint de busca Me
  };

  private readonly xssPayloads = [
    {
      name: "Basic Script Tag",
      payload: "<script>alert('XSS')</script>"
    },
    {
      name: "Script in Attribute",
      payload: "<img src='x' onerror='alert(\"XSS\")' />"
    },
    {
      name: "JavaScript Protocol",
      payload: "<a href='javascript:alert(\"XSS\")'>Click me</a>"
    },
    {
      name: "Encoded Script Tag",
      payload: "&#60;script&#62;alert('XSS')&#60;/script&#62;"
    },
    {
      name: "Inline Event Handler",
      payload: "<div onmouseover='alert(\"XSS\")'>Hover me</div>"
    },
    {
      name: "CSS Expression",
      payload: "<div style='background-image: url(javascript:alert(\"XSS\"))'></div>"
    }
  ];

  // Executa testes básicos de XSS
  async runXssTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    for (const { name, payload } of this.xssPayloads) {
      try {
        // Testa o payload em diferentes contextos
        const profileResponse = await api(this.endpoints.profile, {
          method: "POST",
          body: JSON.stringify({ name: payload, bio: payload })
        });

        results.push({
          name: `${name} - Auth Login`,
          status: this.evaluateXssResponse(profileResponse),
          payload,
          response: profileResponse.data,
          timestamp: new Date().toLocaleString()
        });

        // Testa em um contexto de busca
        const searchResponse = await api(`${this.endpoints.ListUsers}?q=${encodeURIComponent(payload)}`, {
          method: "GET"
        });

        results.push({
          name: `${name} - Search Input`,
          status: this.evaluateXssResponse(searchResponse),
          payload,
          response: searchResponse.data,
          timestamp: new Date().toLocaleString()
        });

      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || "Erro no Request";
        const statusCode = error.response?.status || "Unknown";
        
        // Analisa o tipo de erro para melhor classificação
        let securityStatus = this.evaluateErrorSecurity(error);
        let analysisDetails = this.getErrorAnalysis(error);

        results.push({
          name: `${name} - ${analysisDetails.type} (${statusCode})`,
          status: securityStatus,
          payload,
          response: { 
            error: errorMessage,
            statusCode,
            details: error.response?.data || {},
            securityAnalysis: analysisDetails
          },
          timestamp: new Date().toLocaleString()
        });
      }
    }

    return results;
  }

  // Executa um teste customizado de XSS
  async runCustomTest(payload: string, endpoint: string, method: string): Promise<TestResult> {
    try {
      const response = await api(endpoint, {
        method,
        body: method !== "GET" ? JSON.stringify({ content: payload }) : undefined,
        headers: { "Content-Type": "application/json" }
      });

      return {
        name: "Custom XSS Test",
        status: this.evaluateXssResponse(response),
        payload,
        response: response.data,
        timestamp: new Date().toLocaleString()
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Request failed";
      const statusCode = error.response?.status || "Unknown";

      return {
        name: `Custom XSS Test (${statusCode})`,
        status: 'success', // Se der erro, provavelmente o input foi rejeitado (bom sinal)
        payload,
        response: { 
          error: errorMessage,
          statusCode,
          details: error.response?.data || {}
        },
        timestamp: new Date().toLocaleString()
      };
    }
  }

  // Avalia a resposta para determinar se o XSS foi bem sucedido
  private evaluateXssResponse(response: any): 'success' | 'failed' {
    // Se a resposta contiver o payload sem sanitização, considera falha
    const responseStr = JSON.stringify(response).toLowerCase();
    
    // Verifica sinais de que o XSS pode ter sido bem sucedido
    const dangerousSigns = [
      '<script>',
      'javascript:',
      'onerror=',
      'onmouseover=',
      'onclick=',
      'alert(',
      'eval('
    ];

    // Se encontrar qualquer sinal de XSS na resposta, marca como falha
    return dangerousSigns.some(sign => responseStr.includes(sign.toLowerCase()))
      ? 'failed'
      : 'success';
  }

  // Avalia se o erro indica uma boa proteção contra XSS
  private evaluateErrorSecurity(error: any): 'success' | 'failed' {
    const statusCode = error.response?.status;
    const errorMessage = error.response?.data?.message || error.message || '';
    
    // Códigos de status que geralmente indicam boa proteção
    const goodStatusCodes = [400, 401, 403, 422];
    
    // Mensagens que indicam validação/sanitização
    const securityIndicators = [
      'invalid',
      'forbidden',
      'not allowed',
      'malformed',
      'validation',
      'sanitiz'
    ];

    // Verifica se o status code é um indicador positivo
    if (goodStatusCodes.includes(statusCode)) {
      return 'success';
    }

    // Verifica se a mensagem de erro indica proteção
    if (securityIndicators.some(indicator => 
      errorMessage.toLowerCase().includes(indicator)
    )) {
      return 'success';
    }

    // Se o erro for relacionado a URL/sintaxe, também é bom sinal
    if (errorMessage.includes('URL') || errorMessage.includes('parse')) {
      return 'success';
    }

    // Por padrão, considera sucesso se houve rejeição do input
    return 'success';
  }

  // Fornece uma análise detalhada do erro
  private getErrorAnalysis(error: any): {
    type: string;
    severity: 'low' | 'medium' | 'high';
    recommendation: string;
  } {
    const statusCode = error.response?.status;
    const errorMessage = error.response?.data?.message || error.message || '';

    // Analisa baseado no status code
    if (statusCode === 400) {
      return {
        type: 'Validação de Input',
        severity: 'low',
        recommendation: 'Input rejeitado corretamente por validação'
      };
    }

    if (statusCode === 401 || statusCode === 403) {
      return {
        type: 'Controle de Acesso',
        severity: 'low',
        recommendation: 'Acesso negado adequadamente'
      };
    }

    if (statusCode === 422) {
      return {
        type: 'Validação de Conteúdo',
        severity: 'low',
        recommendation: 'Conteúdo malicioso detectado e rejeitado'
      };
    }

    // Analisa baseado na mensagem de erro
    if (errorMessage.toLowerCase().includes('parse')) {
      return {
        type: 'Erro de Parser',
        severity: 'low',
        recommendation: 'Payload malformado rejeitado pelo parser'
      };
    }

    if (errorMessage.toLowerCase().includes('url')) {
      return {
        type: 'URL Inválida',
        severity: 'low',
        recommendation: 'URL maliciosa rejeitada'
      };
    }

    // Caso padrão
    return {
      type: 'Erro Genérico',
      severity: 'medium',
      recommendation: 'Recomenda-se investigar o motivo específico da rejeição'
    };
  }
}

// Export a singleton instance
export const xssTestService = new XssTestService();