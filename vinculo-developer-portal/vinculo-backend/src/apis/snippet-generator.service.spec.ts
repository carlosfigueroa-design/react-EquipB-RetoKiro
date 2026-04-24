import { SnippetGeneratorService, SnippetResult } from './snippet-generator.service';

describe('SnippetGeneratorService', () => {
  let service: SnippetGeneratorService;

  beforeEach(() => {
    service = new SnippetGeneratorService();
  });

  const baseUrl = 'https://api.vinculo.segurosbolivar.com/v1';
  const endpoint = '/cotizacion';

  // ─── generateSnippets() — basic structure ─────────────

  describe('generateSnippets() — basic structure', () => {
    it('should return snippets for all four languages', () => {
      const result = service.generateSnippets(baseUrl, endpoint, 'GET');

      expect(result).toHaveProperty('javascript');
      expect(result).toHaveProperty('python');
      expect(result).toHaveProperty('java');
      expect(result).toHaveProperty('curl');
    });

    it('should return non-empty strings for all languages', () => {
      const result = service.generateSnippets(baseUrl, endpoint, 'POST', undefined, {
        cedula: '123456789',
      });

      expect(result.javascript.length).toBeGreaterThan(0);
      expect(result.python.length).toBeGreaterThan(0);
      expect(result.java.length).toBeGreaterThan(0);
      expect(result.curl.length).toBeGreaterThan(0);
    });
  });

  // ─── URL construction ─────────────────────────────────

  describe('URL construction', () => {
    it('should build the correct full URL in all snippets', () => {
      const result = service.generateSnippets(baseUrl, endpoint, 'GET');
      const expectedUrl = `${baseUrl}${endpoint}`;

      expect(result.javascript).toContain(expectedUrl);
      expect(result.python).toContain(expectedUrl);
      expect(result.java).toContain(expectedUrl);
      expect(result.curl).toContain(expectedUrl);
    });

    it('should handle baseUrl with trailing slash', () => {
      const result = service.generateSnippets(
        'https://api.example.com/',
        '/users',
        'GET',
      );
      const expectedUrl = 'https://api.example.com/users';

      expect(result.curl).toContain(expectedUrl);
      expect(result.javascript).toContain(expectedUrl);
    });

    it('should handle endpoint without leading slash', () => {
      const result = service.generateSnippets(baseUrl, 'cotizacion', 'GET');
      const expectedUrl = `${baseUrl}/cotizacion`;

      expect(result.curl).toContain(expectedUrl);
      expect(result.python).toContain(expectedUrl);
    });

    it('should handle both baseUrl trailing slash and endpoint without leading slash', () => {
      const result = service.generateSnippets(
        'https://api.example.com/',
        'users',
        'GET',
      );
      const expectedUrl = 'https://api.example.com/users';

      expect(result.java).toContain(expectedUrl);
    });
  });

  // ─── HTTP method ──────────────────────────────────────

  describe('HTTP method', () => {
    it.each(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])(
      'should include %s method in all snippets',
      (method) => {
        const result = service.generateSnippets(baseUrl, endpoint, method);

        expect(result.javascript).toContain(method);
        expect(result.curl).toContain(method);
        expect(result.java).toContain(method);
        // Python uses lowercase method names
        expect(result.python).toContain(method.toLowerCase());
      },
    );

    it('should normalize method to uppercase', () => {
      const result = service.generateSnippets(baseUrl, endpoint, 'post');

      expect(result.javascript).toContain('POST');
      expect(result.curl).toContain('POST');
    });
  });

  // ─── Headers ──────────────────────────────────────────

  describe('headers', () => {
    it('should include custom headers in all snippets', () => {
      const headers = { Authorization: 'Bearer token123' };
      const result = service.generateSnippets(baseUrl, endpoint, 'GET', headers);

      expect(result.javascript).toContain('Authorization');
      expect(result.javascript).toContain('Bearer token123');
      expect(result.python).toContain('Authorization');
      expect(result.python).toContain('Bearer token123');
      expect(result.java).toContain('Authorization');
      expect(result.java).toContain('Bearer token123');
      expect(result.curl).toContain('Authorization: Bearer token123');
    });

    it('should include multiple headers', () => {
      const headers = {
        Authorization: 'Bearer abc',
        'X-Request-Id': 'req-001',
      };
      const result = service.generateSnippets(baseUrl, endpoint, 'GET', headers);

      expect(result.curl).toContain('Authorization: Bearer abc');
      expect(result.curl).toContain('X-Request-Id: req-001');
    });

    it('should auto-add Content-Type header when body is present', () => {
      const result = service.generateSnippets(
        baseUrl,
        endpoint,
        'POST',
        undefined,
        { key: 'value' },
      );

      expect(result.javascript).toContain('Content-Type');
      expect(result.javascript).toContain('application/json');
      expect(result.python).toContain('Content-Type');
      expect(result.curl).toContain('Content-Type: application/json');
    });

    it('should not duplicate Content-Type if already provided', () => {
      const headers = { 'Content-Type': 'application/xml' };
      const result = service.generateSnippets(
        baseUrl,
        endpoint,
        'POST',
        headers,
        { key: 'value' },
      );

      // Should use the user-provided Content-Type, not add application/json
      expect(result.curl).toContain('Content-Type: application/xml');
      expect(result.curl).not.toContain('application/json');
    });

    it('should not add Content-Type when there is no body', () => {
      const result = service.generateSnippets(baseUrl, endpoint, 'GET');

      expect(result.curl).not.toContain('Content-Type');
    });
  });

  // ─── Request body ─────────────────────────────────────

  describe('request body', () => {
    const body = { cedula: '1234567890', placa: 'ABC123' };

    it('should include body data in JavaScript snippet', () => {
      const result = service.generateSnippets(
        baseUrl,
        endpoint,
        'POST',
        undefined,
        body,
      );

      expect(result.javascript).toContain('JSON.stringify');
      expect(result.javascript).toContain('cedula');
      expect(result.javascript).toContain('1234567890');
    });

    it('should include body data in Python snippet', () => {
      const result = service.generateSnippets(
        baseUrl,
        endpoint,
        'POST',
        undefined,
        body,
      );

      expect(result.python).toContain('json=payload');
      expect(result.python).toContain('cedula');
      expect(result.python).toContain('1234567890');
    });

    it('should include body data in Java snippet', () => {
      const result = service.generateSnippets(
        baseUrl,
        endpoint,
        'POST',
        undefined,
        body,
      );

      expect(result.java).toContain('requestBody');
      expect(result.java).toContain('cedula');
      expect(result.java).toContain('BodyPublishers.ofString');
    });

    it('should include body data in cURL snippet', () => {
      const result = service.generateSnippets(
        baseUrl,
        endpoint,
        'POST',
        undefined,
        body,
      );

      expect(result.curl).toContain("-d '");
      expect(result.curl).toContain('cedula');
      expect(result.curl).toContain('1234567890');
    });

    it('should not include body section when body is undefined', () => {
      const result = service.generateSnippets(baseUrl, endpoint, 'GET');

      expect(result.javascript).not.toContain('body:');
      expect(result.python).not.toContain('payload');
      expect(result.java).not.toContain('requestBody');
      expect(result.curl).not.toContain('-d');
    });

    it('should not include body section when body is null', () => {
      const result = service.generateSnippets(
        baseUrl,
        endpoint,
        'GET',
        undefined,
        null,
      );

      expect(result.javascript).not.toContain('body:');
      expect(result.python).not.toContain('payload');
      expect(result.curl).not.toContain('-d');
    });
  });

  // ─── JavaScript snippet specifics ─────────────────────

  describe('JavaScript snippet', () => {
    it('should use the fetch API', () => {
      const result = service.generateSnippets(baseUrl, endpoint, 'GET');

      expect(result.javascript).toContain('fetch(');
      expect(result.javascript).toContain('await');
    });

    it('should parse response as JSON', () => {
      const result = service.generateSnippets(baseUrl, endpoint, 'GET');

      expect(result.javascript).toContain('response.json()');
    });
  });

  // ─── Python snippet specifics ─────────────────────────

  describe('Python snippet', () => {
    it('should import requests library', () => {
      const result = service.generateSnippets(baseUrl, endpoint, 'GET');

      expect(result.python).toContain('import requests');
    });

    it('should call requests.<method>()', () => {
      const result = service.generateSnippets(baseUrl, endpoint, 'POST');

      expect(result.python).toContain('requests.post(');
    });

    it('should print response JSON', () => {
      const result = service.generateSnippets(baseUrl, endpoint, 'GET');

      expect(result.python).toContain('response.json()');
    });
  });

  // ─── Java snippet specifics ───────────────────────────

  describe('Java snippet', () => {
    it('should import HttpClient classes', () => {
      const result = service.generateSnippets(baseUrl, endpoint, 'GET');

      expect(result.java).toContain('import java.net.http.HttpClient');
      expect(result.java).toContain('import java.net.http.HttpRequest');
      expect(result.java).toContain('import java.net.http.HttpResponse');
    });

    it('should use HttpClient.newHttpClient()', () => {
      const result = service.generateSnippets(baseUrl, endpoint, 'GET');

      expect(result.java).toContain('HttpClient.newHttpClient()');
    });

    it('should use .GET() for GET requests without body', () => {
      const result = service.generateSnippets(baseUrl, endpoint, 'GET');

      expect(result.java).toContain('.GET()');
    });

    it('should use .DELETE() for DELETE requests without body', () => {
      const result = service.generateSnippets(baseUrl, endpoint, 'DELETE');

      expect(result.java).toContain('.DELETE()');
    });

    it('should use BodyPublishers.ofString for requests with body', () => {
      const result = service.generateSnippets(
        baseUrl,
        endpoint,
        'POST',
        undefined,
        { data: 'test' },
      );

      expect(result.java).toContain('BodyPublishers.ofString');
    });
  });

  // ─── cURL snippet specifics ───────────────────────────

  describe('cURL snippet', () => {
    it('should start with curl -X <METHOD>', () => {
      const result = service.generateSnippets(baseUrl, endpoint, 'POST');

      expect(result.curl).toMatch(/^curl -X POST/);
    });

    it('should use -H flag for headers', () => {
      const headers = { Authorization: 'Bearer token' };
      const result = service.generateSnippets(
        baseUrl,
        endpoint,
        'GET',
        headers,
      );

      expect(result.curl).toContain("-H 'Authorization: Bearer token'");
    });

    it('should use -d flag for body', () => {
      const result = service.generateSnippets(
        baseUrl,
        endpoint,
        'POST',
        undefined,
        { test: true },
      );

      expect(result.curl).toContain("-d '");
    });

    it('should end with the URL', () => {
      const result = service.generateSnippets(baseUrl, endpoint, 'GET');
      const expectedUrl = `${baseUrl}${endpoint}`;

      expect(result.curl.trimEnd()).toMatch(new RegExp(`'${expectedUrl.replace(/\//g, '\\/')}'\s*$`));
    });
  });

  // ─── Edge cases ───────────────────────────────────────

  describe('edge cases', () => {
    it('should handle empty headers object', () => {
      const result = service.generateSnippets(baseUrl, endpoint, 'GET', {});

      expect(result.javascript).toBeDefined();
      expect(result.python).toBeDefined();
    });

    it('should handle complex nested body', () => {
      const complexBody = {
        asegurado: {
          nombre: 'Juan',
          cedula: '1234567890',
          direccion: {
            ciudad: 'Bogotá',
            departamento: 'Cundinamarca',
          },
        },
        vehiculo: {
          placa: 'ABC123',
          modelo: 2024,
        },
      };

      const result = service.generateSnippets(
        baseUrl,
        endpoint,
        'POST',
        undefined,
        complexBody,
      );

      expect(result.javascript).toContain('asegurado');
      expect(result.python).toContain('asegurado');
      expect(result.java).toContain('asegurado');
      expect(result.curl).toContain('asegurado');
    });

    it('should handle body with special characters in Java', () => {
      const body = { description: 'Test "with" quotes' };
      const result = service.generateSnippets(
        baseUrl,
        endpoint,
        'POST',
        undefined,
        body,
      );

      // Java string should have escaped quotes
      expect(result.java).toContain('requestBody');
    });
  });
});
