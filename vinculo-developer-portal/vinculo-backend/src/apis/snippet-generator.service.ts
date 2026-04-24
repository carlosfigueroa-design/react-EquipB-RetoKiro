import { Injectable } from '@nestjs/common';

/**
 * Supported languages for code snippet generation.
 */
export type SnippetLanguage = 'javascript' | 'python' | 'java' | 'curl';

/**
 * Result object containing generated snippets for all supported languages.
 */
export interface SnippetResult {
  javascript: string;
  python: string;
  java: string;
  curl: string;
}

/**
 * SnippetGeneratorService generates functional code snippets in JavaScript,
 * Python, Java and cURL for API endpoints.
 *
 * Each snippet includes the correct endpoint URL, HTTP method, required headers,
 * and request body when applicable.
 *
 * @see Requirement 3.5 — Generate functional code snippets in JS, Python, Java, cURL
 */
@Injectable()
export class SnippetGeneratorService {
  /**
   * Generate code snippets in all four supported languages for a given endpoint.
   *
   * @param baseUrl  - Base URL of the API (e.g. "https://api.vinculo.segurosbolivar.com/v1")
   * @param endpoint - Path of the endpoint (e.g. "/cotizacion")
   * @param method   - HTTP method (GET, POST, PUT, PATCH, DELETE, etc.)
   * @param headers  - Optional map of HTTP headers to include
   * @param body     - Optional request body object (serialized as JSON)
   * @returns SnippetResult with snippets for javascript, python, java, and curl
   */
  generateSnippets(
    baseUrl: string,
    endpoint: string,
    method: string,
    headers?: Record<string, string>,
    body?: unknown,
  ): SnippetResult {
    const upperMethod = method.toUpperCase();
    const fullUrl = this.buildUrl(baseUrl, endpoint);
    const mergedHeaders = this.mergeHeaders(headers, body);

    return {
      javascript: this.generateJavaScript(fullUrl, upperMethod, mergedHeaders, body),
      python: this.generatePython(fullUrl, upperMethod, mergedHeaders, body),
      java: this.generateJava(fullUrl, upperMethod, mergedHeaders, body),
      curl: this.generateCurl(fullUrl, upperMethod, mergedHeaders, body),
    };
  }

  /**
   * Build the full URL by joining baseUrl and endpoint, avoiding double slashes.
   */
  private buildUrl(baseUrl: string, endpoint: string): string {
    const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${base}${path}`;
  }

  /**
   * Merge user-provided headers with Content-Type when a body is present.
   */
  private mergeHeaders(
    headers?: Record<string, string>,
    body?: unknown,
  ): Record<string, string> {
    const merged: Record<string, string> = {};

    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        merged[key] = value;
      });
    }

    if (body !== undefined && body !== null) {
      const hasContentType = Object.keys(merged).some(
        (k) => k.toLowerCase() === 'content-type',
      );
      if (!hasContentType) {
        merged['Content-Type'] = 'application/json';
      }
    }

    return merged;
  }

  // ─── JavaScript (fetch API) ───────────────────────────

  private generateJavaScript(
    url: string,
    method: string,
    headers: Record<string, string>,
    body?: unknown,
  ): string {
    const lines: string[] = [];

    lines.push(`const response = await fetch('${url}', {`);
    lines.push(`  method: '${method}',`);

    if (Object.keys(headers).length > 0) {
      lines.push(`  headers: {`);
      Object.entries(headers).forEach(([key, value]) => {
        lines.push(`    '${key}': '${value}',`);
      });
      lines.push(`  },`);
    }

    if (body !== undefined && body !== null) {
      const bodyStr = JSON.stringify(body, null, 2)
        .split('\n')
        .map((line, i) => (i === 0 ? line : `  ${line}`))
        .join('\n');
      lines.push(`  body: JSON.stringify(${bodyStr}),`);
    }

    lines.push(`});`);
    lines.push(``);
    lines.push(`const data = await response.json();`);
    lines.push(`console.log(data);`);

    return lines.join('\n');
  }

  // ─── Python (requests library) ────────────────────────

  private generatePython(
    url: string,
    method: string,
    headers: Record<string, string>,
    body?: unknown,
  ): string {
    const lines: string[] = [];

    lines.push(`import requests`);
    lines.push(``);

    if (Object.keys(headers).length > 0) {
      lines.push(`headers = {`);
      Object.entries(headers).forEach(([key, value]) => {
        lines.push(`    "${key}": "${value}",`);
      });
      lines.push(`}`);
      lines.push(``);
    }

    if (body !== undefined && body !== null) {
      const bodyStr = JSON.stringify(body, null, 4)
        .replace(/null/g, 'None')
        .replace(/true/g, 'True')
        .replace(/false/g, 'False');
      lines.push(`payload = ${bodyStr}`);
      lines.push(``);
    }

    const methodLower = method.toLowerCase();
    const args: string[] = [`"${url}"`];

    if (Object.keys(headers).length > 0) {
      args.push(`headers=headers`);
    }

    if (body !== undefined && body !== null) {
      args.push(`json=payload`);
    }

    lines.push(`response = requests.${methodLower}(${args.join(', ')})`);
    lines.push(`print(response.json())`);

    return lines.join('\n');
  }

  // ─── Java (HttpClient) ────────────────────────────────

  private generateJava(
    url: string,
    method: string,
    headers: Record<string, string>,
    body?: unknown,
  ): string {
    const lines: string[] = [];

    lines.push(`import java.net.URI;`);
    lines.push(`import java.net.http.HttpClient;`);
    lines.push(`import java.net.http.HttpRequest;`);
    lines.push(`import java.net.http.HttpResponse;`);
    lines.push(``);
    lines.push(`HttpClient client = HttpClient.newHttpClient();`);
    lines.push(``);

    if (body !== undefined && body !== null) {
      const bodyJson = JSON.stringify(body);
      lines.push(`String requestBody = "${this.escapeJavaString(bodyJson)}";`);
      lines.push(``);
    }

    lines.push(`HttpRequest request = HttpRequest.newBuilder()`);
    lines.push(`    .uri(URI.create("${url}"))`);

    if (body !== undefined && body !== null) {
      lines.push(`    .method("${method}", HttpRequest.BodyPublishers.ofString(requestBody))`);
    } else {
      if (method === 'GET') {
        lines.push(`    .GET()`);
      } else if (method === 'DELETE') {
        lines.push(`    .DELETE()`);
      } else {
        lines.push(`    .method("${method}", HttpRequest.BodyPublishers.noBody())`);
      }
    }

    Object.entries(headers).forEach(([key, value]) => {
      lines.push(`    .header("${key}", "${value}")`);
    });

    lines.push(`    .build();`);
    lines.push(``);
    lines.push(
      `HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());`,
    );
    lines.push(`System.out.println(response.body());`);

    return lines.join('\n');
  }

  // ─── cURL ─────────────────────────────────────────────

  private generateCurl(
    url: string,
    method: string,
    headers: Record<string, string>,
    body?: unknown,
  ): string {
    const parts: string[] = [];

    parts.push(`curl -X ${method}`);

    Object.entries(headers).forEach(([key, value]) => {
      parts.push(`  -H '${key}: ${value}'`);
    });

    if (body !== undefined && body !== null) {
      const bodyStr = JSON.stringify(body, null, 2);
      parts.push(`  -d '${bodyStr}'`);
    }

    parts.push(`  '${url}'`);

    return parts.join(' \\\n');
  }

  // ─── Helpers ──────────────────────────────────────────

  private escapeJavaString(str: string): string {
    return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }
}
