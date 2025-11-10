import { api } from './api';

export interface TestResult {
  name: string;
  status: 'success' | 'failed';
  payload: string;
  response: any;
  timestamp: string;
}

class SqlTestService {
  private readonly endpoints = {
    login: '/auth/login',
    userRole: (userId: number) => `/users/${userId}/role`,
    deleteUser: (userId: number) => `/users/${userId}`,
    listUsers: '/users'
  };

  // SQL Injection Tests
  async runSqlInjectionTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const payloads = [
      "' OR '1'='1",
      "admin'--",
      "' UNION SELECT * FROM users--",
      "'; DROP TABLE users;--"
    ];

    for (const payload of payloads) {
      try {
        const loginResponse = await api(this.endpoints.login, {
          method: "POST",
          body: JSON.stringify({
            email: payload,
            password: payload
          })
        });

        // Se o login foi bem-sucedido com SQL injection, isso é uma falha de segurança
        results.push({
          name: "SQL Injection - Login",
          status: loginResponse.ok ? "failed" : "success",
          payload,
          response: loginResponse.data,
          timestamp: new Date().toLocaleString()
        });
      } catch (error) {
        results.push({
          name: "SQL Injection - Login",
          status: "success", // Erro na requisição é bom neste caso
          payload,
          response: { error: "Requisição falhou - comportamento esperado" },
          timestamp: new Date().toLocaleString()
        });
      }
    }

    return results;
  }

  // Role Manipulation Tests
  async runRoleManipulationTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const tests = [
      {
        name: "Elevação para Admin sem Autenticação",
        endpoint: this.endpoints.userRole(1),
        method: "PATCH",
        payload: { role: "admin" }
      },
      {
        name: "Alteração de Role com Token Inválido",
        endpoint: this.endpoints.userRole(1),
        method: "PATCH",
        payload: { role: "admin" },
        headers: { Authorization: "Bearer invalid_token_here" }
      }
    ];

    for (const test of tests) {
      try {
        const response = await api(test.endpoint, {
          method: test.method,
          body: JSON.stringify(test.payload),
          headers: test.headers
        });

        // Se conseguiu alterar a role sem autenticação apropriada, é uma falha
        results.push({
          name: test.name,
          status: response.ok ? "failed" : "success",
          payload: JSON.stringify(test.payload),
          response: response.data,
          timestamp: new Date().toLocaleString()
        });
      } catch (error) {
        results.push({
          name: test.name,
          status: "success", // Erro na requisição é bom neste caso
          payload: JSON.stringify(test.payload),
          response: { error: "Requisição falhou - comportamento esperado" },
          timestamp: new Date().toLocaleString()
        });
      }
    }

    return results;
  }

  // Custom Test
  async runCustomTest(endpoint: string, method: string, payload: string): Promise<TestResult> {
    try {
      const response = await api(endpoint, {
        method,
        body: method !== "GET" ? payload : undefined
      });

      return {
        name: "Teste Personalizado",
        status: response.ok ? "failed" : "success", // Assumindo que sucesso em injeção é falha
        payload,
        response: response.data,
        timestamp: new Date().toLocaleString()
      };
    } catch (error) {
      return {
        name: "Teste Personalizado",
        status: "success", // Erro na requisição é bom neste caso
        payload,
        response: { error: "Requisição falhou - comportamento esperado" },
        timestamp: new Date().toLocaleString()
      };
    }
  }
}

// Export a singleton instance
export const sqlTestService = new SqlTestService();