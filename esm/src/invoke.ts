/**
 * Funções para invocar comandos no agente
 * @module lenz:invoke 
 */

/**
 * Cria uma requisição Invoke para o servidor
 * @param command
 * @param args
 * @returns
 */
function createRequest(command: string, args: Record<string, unknown> = {}) {
  const form = new FormData();

  for (const key in args) {
    const value_as_array = Array.isArray(args[key]) ? args[key] : [args[key]];

    for (const value of value_as_array) {
      form.append(key, value);
    }
  }

  return {
    url: `http://localhost:5369/${command}`,
    method: "POST",
    headers: new Headers(),
    body: form,
  };
}

/**
 * Verifica se o tipo de conteúdo é texto plano
 */
function isContentTypePlainText(contentType: any): contentType is "text/plain" {
  return typeof contentType === 'string' && contentType.includes("text/plain");
}

/**
 * Verifica se o tipo de conteúdo é JSON
 */
function isContentTypeJson(contentType: any): contentType is "application/json" {
  return typeof contentType === 'string' && contentType.includes("application/json");
}

/**
 * Verifica se o tipo de conteúdo é binário
 */
function isContentTypeBinary(contentType: any): contentType is "application/octet-stream" {
  return typeof contentType === 'string' && contentType.includes("application/octet-stream");
}

/**
 * Erro de execução de comando
 */
export class InvokeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvokeError";
  }
}

interface ParseOptions {
  /** Tipo de resultado */
  resultType?: string;

  /** Tipo de conteúdo da resposta */
  contentType?: string;

  /** Função que retorna o texto da resposta */
  text?: () => Promise<string> | string;

  /** Função que retorna o JSON da resposta */
  json?: () => Promise<Record<string, unknown> | null> | Record<string, unknown> | null;

  /** Função que retorna o binário da resposta */
  binary?: () => Promise<ArrayBuffer> | ArrayBuffer;
}

/**
 * Faz o parse da resposta do servidor e retorna o resultado
 * @param options
 * @returns
 */
function parseResponse({
  resultType = "void",
  contentType,
  text = () => "",
  json = () => null,
  binary = () => new ArrayBuffer(0),
}: ParseOptions = {}) {
  if (resultType === "void") {
    return;
  }

  if (resultType === "text" && isContentTypePlainText(contentType)) {
    return text();
  }

  if (resultType === "error" && isContentTypePlainText(contentType)) {
    const result = text();

    if (result instanceof Promise) {
      return result.then((text) => Promise.reject(new InvokeError(text)));
    }

    throw new InvokeError(result);
  }

  if (resultType === "binary" && isContentTypeBinary(contentType)) {
    return binary();
  }

  if (resultType === "json" && isContentTypeJson(contentType)) {
    return json();
  }

  console.error("Invalid response", {
    resultType,
    contentType,
  });
}

/**
 * Invoca um comando no servidor de forma assíncrona
 * @param command Comando a ser invocado
 * @param args Argumentos do comando
 * @returns Promise com o resultado da execução
 */
export async function invoke<T>(command: string, args: Record<string, unknown> = {}): Promise<T> {
  const { body, headers, method, url } = createRequest(command, args);

  return fetch(url, {
    method,
    headers,
    body,
    keepalive: true,
  }).then((response) =>
    parseResponse({
      contentType: response.headers.get("Content-Type") ?? '',
      resultType: response.headers.get("X-Invoke-Result") ?? '',
      text: () => response.text(),
      json: () => response.json(),
      binary: () => response.arrayBuffer(),
    }) as T
  );
}

/**
 * Invoca um comando no servidor de forma síncrona
 * @param command Comando a ser invocado
 * @param args Argumentos do comando
 * @returns Resultado da execução
 */
export function invokeSync(command: string, args: Record<string, unknown> = {}) {
  const { body, headers, method, url } = createRequest(command, args);

  const xhr = new XMLHttpRequest();

  xhr.open(method, url, false);

  for (const [key, value] of headers.entries()) {
    xhr.setRequestHeader(key, value);
  }

  xhr.send(body);

  return parseResponse({
    contentType: xhr.getResponseHeader("Content-Type") ?? '',
    resultType: xhr.getResponseHeader("X-Invoke-Result") ?? '',
    text: () => xhr.responseText,
    json: () => JSON.parse(xhr.responseText),
    binary: () =>
      xhr.response instanceof ArrayBuffer
        ? xhr.response
        : new TextEncoder().encode(xhr.responseText),
  });
}